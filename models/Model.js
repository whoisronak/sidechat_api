// file that exports all the models to be used in the resolvers
module.exports = function(sequelize) {
  const User = require('./User')(sequelize);
  const Community = require('./Community')(sequelize);
  const Post = require('./Post')(sequelize);
  const Comment = require('./Comment')(sequelize);
  const PostVote = require('./PostVote')(sequelize);
  const CommentVote = require('./CommentVote')(sequelize);
  const PostFlag = require('./PostFlag')(sequelize);
  const CommentFlag = require('./CommentFlag')(sequelize);
  const HotPost = require('./HotPost')(sequelize);
  const TopPost = require('./TopPost')(sequelize);
  const UUID = require('./UUID')(sequelize);
  const PhoneNumberVerificationCodeMap = require('./PhoneNumberVerificationCodeMap')(sequelize);
  const UserCommunityMap = require('./UserCommunityMap')(sequelize);

  return {
    User,
    Community,
    Post,
    Comment,
    PostVote,
    CommentVote,
    PostFlag,
    CommentFlag,
    HotPost,
    TopPost,
    UUID,
    PhoneNumberVerificationCodeMap,
    UserCommunityMap
  };
};
