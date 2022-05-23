var { gql } = require('apollo-server-express');

module.exports = gql`

  extend type Query {
    getCommentsForPost(postId: ID!, after: ID): [Comment!]!
  }

  extend type Mutation {
    postComment(
      text: String!, 
      postId: ID!
    ): Comment!
    upvoteComment(
      commentId: ID!
    ): Comment!
    downvoteComment(
      commentId: ID!
    ): Comment!
    unUpvoteComment(commentId: ID!): Comment!
    unDownvoteComment(commentId: ID!): Comment!
    flagComment(
      commentId: ID!
    ): Comment!
    unflagComment(
      commentId: ID!
    ): Comment!
  }

  extend type Subscription {
    commentCreated(postId: ID!): Comment!
  }
  
  type Comment {
    id: ID!
    userId: ID!
    postId: ID!
    upvotes: Int!
    text: String!
    upvoted: Boolean
    flagged: Boolean
  }

`;
