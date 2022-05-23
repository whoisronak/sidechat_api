const { gql } = require('apollo-server-express');
const GraphQLJSON = require('graphql-type-json');

const userSchema = require('./userSchema');
const communitySchema = require('./communitySchema');
const postSchema = require('./postSchema');
const commentSchema = require('./commentSchema');


const linkSchema = gql`
  scalar Long
  scalar JSON
  scalar Date
  scalar DateTime
  scalar Time

  input ListIds {
    id: ID!
  }

  type Query {
    _: Boolean
  }
  type Mutation {
    _: Boolean
  }
  type Subscription {
    _: Boolean
  }
`;

module.exports = [
  linkSchema, 
  userSchema, 
  communitySchema,
  postSchema,
  commentSchema
];
