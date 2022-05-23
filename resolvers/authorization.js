const { ForbiddenError } = require('apollo-server');
const { skip } = require('graphql-resolvers');

// passed as first argument to combineResolvers
// used in all graphQL mutation/queries where authentication is needed
// see resolvers for an example
// if user, then just skip this function and move on to next resolver 
// passed in to combineResolvers, otherwise throw error
exports.isAuthenticated = async function (parent, args, { Model, user }) {
  if (user) {
    return skip
  }
  throw new ForbiddenError('Must be logged in to perform this action');
};