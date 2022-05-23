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
const { QueryTypes } = require('sequelize');
const { withFilter } = require('graphql-subscriptions');
const escapeSQLInput = require('sqlutils/pg/escape');

module.exports = {
  Query: {
    getCommentsForPost: combineResolvers(
      isAuthenticated,
      async (parent, { postId, after }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnPost(user.id, postId, Model);
        var where = { postId };
        if (after) {
          where.id = {
            [Op.lt]: after
          };
        }
        const escapedUserId = escapeSQLInput(user.id);
        const comments = await Model.Comment.findAll({
          where: where,
          order: [['id', 'DESC']],
          attributes: {
            include: [
              [
                sequelize.literal(`(
                  SELECT is_upvote
                  FROM comment_votes
                  WHERE comment_votes.comment_id = comments.id AND comment_votes.user_id = '${escapedUserId}'
                )`),
                'upvoted'
              ],
              [
                sequelize.literal(`(
                    SELECT
                      CASE WHEN EXISTS 
                        (
                          SELECT id from comment_flags 
                          WHERE comment_flags.comment_id = comments.id AND comment_flags.user_id = '${escapedUserId}'

                        )
                      THEN TRUE
                      ELSE FALSE
                    END
                )`),
                'flagged'
              ]
            ]
          },
          limit: constants.paginationLimit,
        });
        return JSON.parse(JSON.stringify(comments));
      }
    ),
  },
  Mutation: {
    postComment: combineResolvers(
      isAuthenticated,
      async (parent, { text, postId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnPost(user.id, postId, Model);
        const comment = await sequelize.transaction(async (t) => {

          const comment = await Model.Comment.create({
            userId: user.id,
            postId,
            text
          }, {transaction: t})

          await Model.Post.increment('numberOfComments', {
            by: 1,
            where: {
              id: postId
            },
            transaction: t
          });
          return comment;
        });
        // TODO(ronak): put in try / catch to decouple 
        // pub/sub from web server?
        constants.pubsub.publish(constants.COMMENT_CREATED, {
          commentCreated: comment,
        });
        return comment;
      }
    ),
    upvoteComment: combineResolvers(
      isAuthenticated,
      async (parent, { commentId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnComment(user.id, commentId, Model);
        const ret = await sequelize.transaction(async (t) => {

          const existingCommentVote = await Model.CommentVote.findOne({
            where: {
              userId: user.id, 
              commentId
            }, 
            transaction: t
          });

          await Model.CommentVote.upsert(
            {userId: user.id, commentId, isUpvote: true},
            {transaction: t}
          );

          var amountToIncrement = 1;
          if (existingCommentVote) {
            if (!existingCommentVote.isUpvote) {
              // if you've downvoted previously count needs to increase
              // by two
              amountToIncrement = 2;
            } else {
              // if you've already upvoted, return
              return;
            }
          }

          await Model.Comment.increment('upvotes', {
            by: amountToIncrement,
            where: {
              id: commentId
            },
            transaction: t
          });
        });
        return await Model.Comment.findByPk(commentId);
      }
    ),
    downvoteComment: combineResolvers(
      isAuthenticated,
      async (parent, { commentId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnComment(user.id, commentId, Model);
        const ret = await sequelize.transaction(async (t) => {

          const existingCommentVote = await Model.CommentVote.findOne({
            where: {
              userId: user.id, 
              commentId
            }, 
            transaction: t
          });

          await Model.CommentVote.upsert(
            {userId: user.id, commentId, isUpvote: false},
            {transaction: t}
          );

          var amountToDecrement = 1;
          if (existingCommentVote) {
            if (existingCommentVote.isUpvote) {
              // if you've upvoted previously count needs to decrease
              // by two
              amountToDecrement = 2;
            } else {
              // if you've already downvoted, return
              return;
            }
          }

          await Model.Comment.decrement('upvotes', {
            by: amountToDecrement,
            where: {
              id: commentId
            },
            transaction: t
          });
        });
        return await Model.Comment.findByPk(commentId);
      }
    ),
    unUpvoteComment: combineResolvers(
      isAuthenticated,
      async (parent, { commentId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnComment(user.id, commentId, Model);
        const ret = await sequelize.transaction(async (t) => {

          const existingCommentVote = await Model.CommentVote.findOne({
            where: {
              userId: user.id, 
              commentId
            }, 
            transaction: t
          });

          if (existingCommentVote) {
            if (!existingCommentVote.isUpvote) {
              throw new Error("You haven't upvoted this comment");
            } else {
              await Model.CommentVote.destroy({
                where: {id: existingCommentVote.id}
              }, {transaction: t});
              await Model.Comment.decrement('upvotes', {
                by: 1,
                where: {
                  id: commentId
                },
                transaction: t
              });
            }
          } else {
            throw new Error("You haven't upvoted this comment");
          }
        });
        return await Model.Comment.findByPk(commentId);
      }
    ),
    unDownvoteComment: combineResolvers(
      isAuthenticated,
      async (parent, { commentId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnComment(user.id, commentId, Model);
        const ret = await sequelize.transaction(async (t) => {

          const existingCommentVote = await Model.CommentVote.findOne({
            where: {
              userId: user.id, 
              commentId
            }, 
            transaction: t
          });

          if (existingCommentVote) {
            if (existingCommentVote.isUpvote) {
              throw new Error("You haven't downvoted this comment");
            } else {
              await Model.CommentVote.destroy({
                where: {id: existingCommentVote.id}
              }, {transaction: t});
              await Model.Comment.increment('upvotes', {
                by: 1,
                where: {
                  id: commentId
                },
                transaction: t
              });
            }
          } else {
            throw new Error("You haven't downvoted this comment");
          }
        });
        return await Model.Comment.findByPk(commentId);
      }
    ),
    flagComment: combineResolvers(
      isAuthenticated,
      async (parent, { commentId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnComment(user.id, commentId, Model);
        await Model.CommentFlag.upsert(
          {userId: user.id, commentId},
        );
        return await Model.Comment.findByPk(commentId);
      }
    ),
    unflagComment: combineResolvers(
      isAuthenticated,
      async (parent, { commentId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnComment(user.id, commentId, Model);
        await Model.CommentFlag.destroy({
          where: {userId: user.id, commentId}
        });
        return await Model.Comment.findByPk(commentId);
      }
    ),
  },
  Subscription: {
    commentCreated: {
      subscribe: withFilter(
        (_, __, { Model, user }) => constants.pubsub.asyncIterator(constants.COMMENT_CREATED),
        async (payload, variables, { user, Model }) => {
          try {
            await helpers.ensureUserCanTakeActionOnPost(user.id, variables.postId, Model);
          } catch (e) {
            return false;
          }
          return (payload.commentCreated.postId == variables.postId);
        },
      ),
    }
  },
}
