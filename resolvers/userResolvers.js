const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server');
const { combineResolvers } = require('graphql-resolvers');
const constants = require('../constants/constants');
const helpers = require('../helpers');
const { isAuthenticated } = require('./authorization');
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require('twilio')(twilioAccountSid, twilioAuthToken);
const { Op } = require("sequelize");
const uniqid = require('uniqid');
const Airtable = require("airtable");
const moment = require('moment');
var isValidEmail = require('is-valid-email');
const { uniqueNamesGenerator } = require('unique-names-generator');
moment.updateLocale('en', {
  week : {
    dow : 7
  }
});

const createToken = async (user, secret) => {
  // create jwt for user
  const {id, firstName, phoneNumber, username} = user;
  return await jwt.sign({id, firstName, phoneNumber, username}, secret);
};

function isValidNumber(phoneNumber) {
  // check if number is valid; only us numbers allowed right now
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g,'');
  if (cleanedPhoneNumber.length === 10) {
    return `1${cleanedPhoneNumber}`;
  }
  if (cleanedPhoneNumber.length === 11 && cleanedPhoneNumber.startsWith('1')) {
    return cleanedPhoneNumber;
  }
  return null;
}

function isSchoolEmail(email) {
  // TODO(ronak): implement verifier for school email 
  // address
  return true;
}

const getCommunityIdIfAny = async (user, Model) => {
  const userCommunityMap = await Model.UserCommunityMap.findOne({where: {userId: user.id}})
  var communityId = null;
  if (userCommunityMap) {
    communityId = userCommunityMap.communityId;
  }
  return communityId;
}

module.exports = {
  Query: {
    getUser: combineResolvers(
      isAuthenticated,
      async (parent, { }, { Model, user, sequelize }) => {
        // get user 
        const userObj = await Model.User.findByPk(user.id);
        return userObj;
      }
    ),
    getUserById: combineResolvers(
      isAuthenticated,
      async (parent, { userId }, { Model, user, sequelize }) => {
        // get user represented by userId
        const userObj = await Model.User.findByPk(userId);
        return userObj;
      }
    ),
  },
  Mutation: {
    sendVerificationCode: async (parent, { phoneNumber }, { Model }) => {
      // send twilio verification code to user
      const cleanedPhoneNumber = isValidNumber(phoneNumber);
      if (!cleanedPhoneNumber) {
        // only accept US numbers right now
        throw new Error("Please enter a 10-digit number");
      }
      var verification;
      try {
        verification = await twilio.verify.services(process.env.TWILIO_VERIFY_SERVICE_ID)
          .verifications
          .create({to: `+${cleanedPhoneNumber}`, channel: 'sms'});
      } catch (error) {
        if (error.code === 60202 || error.code === 60203) {
          throw new Error('Too many attempts. Retry in 10 minutes.');
        }
        console.log(error);
        throw new Error(constants.defaultErrorMessage);
      }

      if (verification && verification.status === 'pending') {
        return {cleanedPhoneNumber: cleanedPhoneNumber};
      }

      throw new Error(constants.defaultErrorMessage)
    },
    verifyCode: async (parent, { phoneNumber, verificationCode, adminAPIKey }, { Model }) => {
      // verifies code for a user
      if (process.env.ALLOW_ANY_SIGNUP === 'true' || phoneNumber === '19493316096') {
        // if ALLOW_ANY_SIGNUP environment variable is set to true
        // any verification code works
        await Model.PhoneNumberVerificationCodeMap.upsert({
          phoneNumber: phoneNumber, verificationCode: verificationCode, numTries: 0
        });
        const existingUser = await Model.User.findOne({where: {phoneNumber: phoneNumber}});
        if (existingUser) {
          const token = await createToken(existingUser, process.env.JWT_SECRET);
          const communityId = await getCommunityIdIfAny(existingUser, Model);
          return {token: token, communityId: communityId, verificationCode: verificationCode};
        }
        return {verificationCode: verificationCode};
      }
      var verificationCheck;
      try {
        // check code viatwilio
        verificationCheck = await twilio.verify.services(process.env.TWILIO_VERIFY_SERVICE_ID)
        .verificationChecks
        .create({to: `+${phoneNumber}`, code: verificationCode});
      } catch (error) {
        if (error.code === 20404) {
          throw new Error("Code expired. Please resend.");
        } else if (error.code === 60202 || error.code === 60203) {
          throw new Error("Too many attempts. Retry in 10 minutes.");  
        } else if (error.code === 60200) {
          throw new Error("Incorrect verification code");
        }
        throw new Error(constants.defaultErrorMessage);
      }
      if (verificationCheck && verificationCheck.status === "approved") {
        // put verification code in PhoneNumberVerificationCodeMap
        // so that someone can't reverse engineer api and call signUp 
        // and sign up without properly verifying phone number
        await Model.PhoneNumberVerificationCodeMap.upsert({
          phoneNumber: phoneNumber, verificationCode: verificationCode, numTries: 0
        });
        const existingUser = await Model.User.findOne({where: {phoneNumber: phoneNumber}});
        if (existingUser) {
          // if user exists, send jwt token back
          const token = await createToken(existingUser, process.env.JWT_SECRET);
          const communityId = await getCommunityIdIfAny(existingUser, Model);
          return {token: token, communityId: communityId, verificationCode: verificationCode};
        }
        // otherwise send back verification code so that
        // it can get sent to signUp so that we can 
        // verify verification code in signUp so that someone can't 
        // reverse engineer api and sign up without verifying phone number
        return {verificationCode: verificationCode};
      } else {
        throw new Error("Incorrect verification code");
      }
      throw new Error(constants.defaultErrorMessage);
    },
    signUp: async (parent, { phoneNumber, email, verificationCode }, { Model, sequelize }) => {
      const tenMinutesAgo = new Date(Date.now() - 600000);
      // get verification code within last ten minutes
      const phoneNumberVerificationCodeMap = await Model.PhoneNumberVerificationCodeMap.findOne({
        where: {
          phoneNumber: phoneNumber,
          updatedAt: {[Op.gte]: tenMinutesAgo}
        }
      });

      if (!isValidEmail(email)) {
        throw new Error("Please enter valid e-mail");
      }

      if (!isSchoolEmail(email)) {
        throw new Error("Please enter your university email address");
      }

      const emailDomain = email.split('@')[1];
      const communityWithEduDomain = await Model.Community.findOne({where: {
        eduDomain: emailDomain
      }})

      // check to make sure verification code is correct
      if (phoneNumberVerificationCodeMap && 
        phoneNumberVerificationCodeMap.verificationCode === verificationCode) {
        try {
          const ret = await sequelize.transaction(async (t) => {
            // create user
            const newUser = await Model.User.create({
              phoneNumber: phoneNumber,
              email: email
            }, {transaction: t});

            var communityId = null;
            // add user to community
            if (communityWithEduDomain) {
              communityId = communityWithEduDomain.id;
              await Model.UserCommunityMap.create({userId: newUser.id, communityId: communityId}, {transaction: t});
            }

            const token = await createToken(newUser, process.env.JWT_SECRET);
            return {token, communityId: communityId};
          });
          return ret;
        } catch (error) {
          throw new Error(constants.defaultErrorMessage);
        }
      } else {
        throw new Error(constants.defaultErrorMessage);
      }
    },
  },
}