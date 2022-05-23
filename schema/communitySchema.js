var { gql } = require('apollo-server-express');

module.exports = gql`

  extend type Mutation {
    createCommunity(adminAPIKey: String!, name: String!, eduDomain: String): Community!
  }
  
  type Community {
    id: ID!
    name: String!
    eduDomain: String
  }

`;
