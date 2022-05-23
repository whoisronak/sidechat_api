var { gql } = require('apollo-server-express');

module.exports = gql`

  extend type Query {
    getUser: User
    getUserById(userId: ID!): User
  }

  extend type Mutation {
   sendVerificationCode(phoneNumber: String!): CleanedPhoneNumber!
   verifyCode(phoneNumber: String!, verificationCode: String!, adminAPIKey: String): VerifiedPhoneNumber!
   signUp(phoneNumber: String!, email: String!, verificationCode: String!): Token!
  }

  type Token {
    token: String!
    teamId: ID!
  }
  
  type User {
    id: ID!
    firstName: String!
    lastName: String
    username: String!
    phoneNumber: String!
    stripeCustomerId: String
    updatedAt: DateTime!
    createdAt: DateTime!
    profileImg: String
    profileImgUrl: String
    numberOfPoints: Int
    numInvites: Int!
    usedBolts: Int!
  }

  type VerifiedPhoneNumber {
    verificationCode: String!
    token: String
    communityId: ID
  }

  type Success {
    success: Boolean!
    errorMessage: String
    successMessage: String
    resultIndex: Int
  }

  type CleanedPhoneNumber {
    cleanedPhoneNumber: String!
  }

`;