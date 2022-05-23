// exports all resolvers so that ApolloServer can use them

var { GraphQLDate, GraphQLTime, GraphQLDateTime } = require('graphql-iso-date');
var GraphQLJSON = require('graphql-type-json');

const userResolvers = require('./userResolvers');
const communityResolvers = require('./communityResolvers');
const postResolvers = require('./postResolvers');
const commentResolvers = require('./commentResolvers');

const customScalarResolver = {
  JSON: GraphQLJSON,
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
};

module.exports = [
  userResolvers,
  communityResolvers,
  postResolvers,
  commentResolvers
];
