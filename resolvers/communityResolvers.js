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
const { uniqueNamesGenerator } = require('unique-names-generator');
moment.updateLocale('en', {
  week : {
    dow : 7
  }
});

module.exports = {
  Query: {
  },
  Mutation: {
    createCommunity: async (parent, { adminAPIKey, name, eduDomain }, { Model, sequelize }) => {
      if (adminAPIKey !== process.env.ADMIN_API_KEY) {
        throw new Error("Incorrect API Key");
      }
      const upsertInfo = await Model.Community.upsert({
        name,
        eduDomain,
      });
      const upsertedRecordId = upsertInfo[0].dataValues.id;
      return await Model.Community.findByPk(upsertedRecordId);
    }
  },
}
