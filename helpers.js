const moment = require('moment');
const { Op } = require("sequelize");
const constants = require("./constants/constants");

const ensureUserInCommunity = async (userId, communityId, Model) => {
  const userCommunityMap = await Model.UserCommunityMap.findOne({
    where: {
      userId,
      communityId
    }
  });
  if (!userCommunityMap) {
    throw new Error("You're not in that community");
  }
  return true;
};

const ensureUserCanTakeActionOnPost = async (userId, postId, Model) => {
  const post = await Model.Post.findByPk(postId);
  return await ensureUserInCommunity(userId, post.communityId, Model);
};

const ensureUserCanTakeActionOnComment = async (userId, commentId, Model) => {
  const comment = await Model.Comment.findByPk(commentId);
  await ensureUserCanTakeActionOnPost(userId, comment.postId, Model);
};

module.exports = {
  ensureUserInCommunity,
  ensureUserCanTakeActionOnPost,
  ensureUserCanTakeActionOnComment
};