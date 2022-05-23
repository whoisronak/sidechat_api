var { gql } = require('apollo-server-express');

module.exports = gql`

  extend type Query {
    getNewPostsForCommunity(communityId: ID!, after: ID): [Post!]!
    getHotPostsForCommunity(communityId: ID!, limit: Int!, offset: Int!, postIdsListId: ID): PaginatedPosts!
    getTopPostsForCommunity(communityId: ID!, limit: Int!, offset: Int!, postIdsListId: ID): PaginatedPosts!
    getImgUploadUrl: ImgUploadResponse!
  }

  extend type Mutation {
    createTextPost(
      communityId: ID!,
      text: String!, 
    ): Post!
    createImgPost(
      communityId: ID!,
      text: String,
      imgUUID: String! 
      aspectRatioWidth: Int!, 
      aspectRatioHeight: Int!,
    ): Post!
    upvotePost(postId: ID!): Post!
    downvotePost(postId: ID!): Post!
    unUpvotePost(postId: ID!): Post!
    unDownvotePost(postId: ID!): Post!
    flagPost(postId: ID!): Post!
    unflagPost(postId: ID!): Post!
  }

  extend type Subscription {
    postCreated(communityId: ID!): Post!
  }
  
  type Post {
    id: ID!
    userId: ID!
    communityId: ID!
    thumbnail: String
    aspectRatioWidth: Int
    aspectRatioHeight: Int
    upvotes: Int!
    numberOfComments: Int!
    text: String!
    flagged: Boolean
    upvoted: Boolean
  }

  type PaginatedPosts {
    postIdsListId: ID!
    posts: [Post!]!
  }

  type ImgUploadResponse {
    urlToUploadTo: String!
    imgUUID: String!
  }

`;
