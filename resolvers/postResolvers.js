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
const pubsub = require('../subscription');
const { withFilter } = require('graphql-subscriptions');
const uuid = require('uuid');
const escapeSQLInput = require('sqlutils/pg/escape');

const getHotOrTopPosts = async(userId, communityId, offset, limit, tableName, postIdsListId, Model, sequelize) => {
  await helpers.ensureUserInCommunity(userId, communityId, Model);
  const communityIdInt = parseInt(communityId);
  const postIdsListIdInt = parseInt(postIdsListId);
  const end = offset + limit;
  var hotPosts;
  if (postIdsListId) {
    hotPosts = await sequelize.query(
      `SELECT id,post_ids[${offset}:${end}] FROM ${tableName} 
        WHERE id = ${postIdsListIdInt}`, 
      { type: QueryTypes.SELECT }
    );
  } else {
    hotPosts = await sequelize.query(
      `SELECT id,post_ids[${offset}:${end}] FROM ${tableName} 
        WHERE community_id = ${communityIdInt} ORDER BY id DESC limit 1`, 
      { type: QueryTypes.SELECT }
    );
  }
  try {
    const postIdsToFetch = hotPosts[0].post_ids;
    const postIdsListIdToReturn = hotPosts[0].id;
    const escapedUserId = escapeSQLInput(userId);
    const posts = await Model.Post.findAll({
      where: {
        id: postIdsToFetch
      },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT is_upvote
              FROM post_votes
              WHERE post_votes.post_id = posts.id AND post_votes.user_id = '${escapedUserId}'
            )`),
            'upvoted'
          ],
          [
            sequelize.literal(`(
                SELECT
                  CASE WHEN EXISTS 
                    (
                      SELECT id from post_flags 
                      WHERE post_flags.post_id = posts.id AND post_flags.user_id = '${escapedUserId}'

                    )
                  THEN TRUE
                  ELSE FALSE
                END
            )`),
            'flagged'
          ]
        ]
      }
    });

    const postsJSON = JSON.parse(JSON.stringify(posts, null, 2));
    return {
      posts: postsJSON,
      postIdsListId: postIdsListIdToReturn
    };

  } catch (e) {
    throw new Error(constants.defaultErrorMessage);
  }
};

const validateS3Path = async (s3Path) => {
  // TODO(ronak): validate S3 path exists
  return true;
}

module.exports = {
  Query: {
    getNewPostsForCommunity: combineResolvers(
      isAuthenticated,
      async (parent, { communityId, after }, { Model, user, sequelize }) => {
        await helpers.ensureUserInCommunity(user.id, communityId, Model);
        var where = { communityId };
        if (after) {
          where.id = {
            [Op.lt]: after
          };
        }
        const escapedUserId = escapeSQLInput(user.id);
        const posts = await Model.Post.findAll({
          where: where,
          order: [['id', 'DESC']],
          attributes: {
            include: [
              [
                sequelize.literal(`(
                  SELECT is_upvote
                  FROM post_votes
                  WHERE post_votes.post_id = posts.id AND post_votes.user_id = '${escapedUserId}'
                )`),
                'upvoted'
              ],
              [
                sequelize.literal(`(
                    SELECT
                      CASE WHEN EXISTS 
                        (
                          SELECT id from post_flags 
                          WHERE post_flags.post_id = posts.id AND post_flags.user_id = '${escapedUserId}'

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
        return JSON.parse(JSON.stringify(posts));
      }
    ),
    getHotPostsForCommunity: combineResolvers(
      isAuthenticated,
      async (parent, { communityId, limit, offset, postIdsListId }, { Model, user, sequelize }) => {
        return await getHotOrTopPosts(
          user.id, 
          communityId, 
          offset, 
          limit, 
          'hot_posts', 
          postIdsListId, 
          Model, 
          sequelize
        );
      }
    ),
    getTopPostsForCommunity: combineResolvers(
      isAuthenticated,
      async (parent, { communityId, limit, offset, postIdsListId }, { Model, user, sequelize }) => {
        return await getHotOrTopPosts(
          user.id, 
          communityId, 
          offset, 
          limit, 
          'top_posts', 
          postIdsListId, 
          Model, 
          sequelize
        );
      }
    ),
    getImgUploadUrl: combineResolvers(
      isAuthenticated,
      async (parent, { }, { Model, user, sequelize, s3 }) => {
        var imgUUID = uuid.v4();
        var i = 0;
        var foundUniqueImgUUID = false;
        while (i < 5 && !foundUniqueImgUUID) {
          // see if uuid already generated
          try {
            await Model.UUID.create({uuid: imgUUID});
            foundUniqueImgUUID = true;
          } catch (e) {
            // do nothing, try another uuid
          }
          i += 1;
        }
        if (!foundUniqueImgUUID) {
          // super unlikely event but don't keep holding the server up
          // if you haven't found a unique uuid in five attempts
          // throw an error
          throw new Error(constants.defaultErrorMessage);
        }
        const urlToUploadTo = await s3.getSignedUrlPromise('putObject', {
          Bucket: 'mulu',
          Key: `${process.env.NODE_ENV}/img/posts/${imgUUID}.jpg`,
          Expires: 100
        });
        return {
          urlToUploadTo, 
          imgUUID
        };
      }
    ),

  },
  Mutation: {
    createTextPost: combineResolvers(
      isAuthenticated,
      async (parent, { communityId, text }, { Model, user, sequelize }) => {
        await helpers.ensureUserInCommunity(user.id, communityId, Model);
        const post = await Model.Post.create({
          userId: user.id,
          communityId,
          text
        });

        // TODO(ronak): put in try / catch to decouple 
        // pub/sub from web server?
        constants.pubsub.publish(constants.POST_CREATED, {
          postCreated: post ,
        });

        return post;
      }
    ),
    createImgPost: combineResolvers(
      isAuthenticated,
      async (parent, { communityId, text, imgUUID, aspectRatioWidth, aspectRatioHeight }, { Model, user, sequelize }) => {
        await helpers.ensureUserInCommunity(user.id, communityId, Model);
        // check if path exists in S3
        const pathExists = 
          await validateS3Path(`${process.env.NODE_ENV}/img/posts/${imgUUID}.jpg`);
        if (!pathExists) {

        }
        
        const thumbnail = `https://sidechat.imgix.net/${process.env.NODE_ENV}/img/posts/${imgUUID}.jpg`;

        // TODO(ronak): prevent duplicate posts with the same imgUUID?
        const post = await Model.Post.create({
          userId: user.id,
          communityId,
          text,
          thumbnail,
          aspectRatioWidth,
          aspectRatioHeight
        });

        // TODO(ronak): put in try / catch to decouple 
        // pub/sub from web server?
        constants.pubsub.publish(constants.POST_CREATED, {
          postCreated: post ,
        });

        return post;
      }
    ),
    upvotePost: combineResolvers(
      isAuthenticated,
      async (parent, { postId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnPost(user.id, postId, Model);
        const ret = await sequelize.transaction(async (t) => {

          const existingPostVote = await Model.PostVote.findOne({
            where: {
              userId: user.id, 
              postId
            }, 
            transaction: t
          });

          await Model.PostVote.upsert(
            {userId: user.id, postId, isUpvote: true},
            {transaction: t}
          );

          var amountToIncrement = 1;
          if (existingPostVote) {
            if (!existingPostVote.isUpvote) {
              // if you've downvoted previously count needs to increase
              // by two
              amountToIncrement = 2;
            } else {
              // if you've already upvoted, return
              return;
            }
          }

          await Model.Post.increment('upvotes', {
            by: amountToIncrement,
            where: {
              id: postId
            },
            transaction: t
          });
        });
        return await Model.Post.findByPk(postId);
      }
    ),
    downvotePost: combineResolvers(
      isAuthenticated,
      async (parent, { postId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnPost(user.id, postId, Model);
        const ret = await sequelize.transaction(async (t) => {

          const existingPostVote = await Model.PostVote.findOne({
            where: {
              userId: user.id, 
              postId
            }, 
            transaction: t
          });

          await Model.PostVote.upsert(
            {userId: user.id, postId, isUpvote: false},
            {transaction: t}
          );

          var amountToDecrement = 1;
          if (existingPostVote) {
            if (existingPostVote.isUpvote) {
              // if you've upvoted previously count needs to decrease
              // by two
              amountToDecrement = 2;
            } else {
              // if you've already downvoted, return
              return;
            }
          }

          await Model.Post.decrement('upvotes', {
            by: amountToDecrement,
            where: {
              id: postId
            },
            transaction: t
          });
        });
        return await Model.Post.findByPk(postId);
      }
    ),
    unUpvotePost: combineResolvers(
      isAuthenticated,
      async (parent, { postId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnPost(user.id, postId, Model);
        const ret = await sequelize.transaction(async (t) => {

          const existingPostVote = await Model.PostVote.findOne({
            where: {
              userId: user.id, 
              postId
            }, 
            transaction: t
          });

          if (existingPostVote) {
            if (!existingPostVote.isUpvote) {
              throw new Error("You haven't upvoted this post");
            } else {
              await Model.PostVote.destroy({
                where: {id: existingPostVote.id}
              }, {transaction: t});
              await Model.Post.decrement('upvotes', {
                by: 1,
                where: {
                  id: postId
                },
                transaction: t
              });
            }
          } else {
            throw new Error("You haven't upvoted this post");
          }
        });
        return await Model.Post.findByPk(postId);
      }
    ),
    unDownvotePost: combineResolvers(
      isAuthenticated,
      async (parent, { postId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnPost(user.id, postId, Model);
        const ret = await sequelize.transaction(async (t) => {

          const existingPostVote = await Model.PostVote.findOne({
            where: {
              userId: user.id, 
              postId
            }, 
            transaction: t
          });

          if (existingPostVote) {
            if (existingPostVote.isUpvote) {
              throw new Error("You haven't downvoted this post");
            } else {
              await Model.PostVote.destroy({
                where: {id: existingPostVote.id}
              }, {transaction: t});
              await Model.Post.increment('upvotes', {
                by: 1,
                where: {
                  id: postId
                },
                transaction: t
              });
            }
          } else {
            throw new Error("You haven't downvoted this post");
          }
        });
        return await Model.Post.findByPk(postId);
      }
    ),
    flagPost: combineResolvers(
      isAuthenticated,
      async (parent, { postId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnPost(user.id, postId, Model);
        await Model.PostFlag.upsert(
          {userId: user.id, postId},
        );
        return await Model.Post.findByPk(postId);
      }
    ),
    unflagPost: combineResolvers(
      isAuthenticated,
      async (parent, { postId }, { Model, user, sequelize }) => {
        await helpers.ensureUserCanTakeActionOnPost(user.id, postId, Model);
        await Model.PostFlag.destroy({
          where: {userId: user.id, postId}
        });
        return await Model.Post.findByPk(postId);
      }
    ),
  },
  Subscription: {
    postCreated: {
      subscribe: withFilter(
        (_, __, { Model, user }) => constants.pubsub.asyncIterator(constants.POST_CREATED),
        async (payload, variables, { user, Model }) => {
          try {
            await helpers.ensureUserInCommunity(user.id, variables.communityId, Model);
          } catch (e) {
            return false;
          }
          return (payload.postCreated.communityId == variables.communityId);
        },
      ),
    }
  },
}
