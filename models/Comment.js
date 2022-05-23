const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class CommentSchema extends Model {};
  // keeps track of news feed posts
  CommentSchema.init({
    userId: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: {notEmpty: true},
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // challenge id that post is associated with
    // may need to make this not required in future
    // if you allow posts that aren't challenge based
    postId: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: {notEmpty: true},
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    upvotes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    text: {
      type: DataTypes.STRING(10000), 
      validate: {notEmpty: true},
    },
  }, { 
    sequelize, 
    underscored: true, 
    freezeTableName: true, 
    modelName: 'comments',
    indexes: [
      {
        fields: ['post_id']
      },
      {
        fields: ['user_id']
      }
    ]
  });
  
  const User = require('./User')(sequelize);
  CommentSchema.belongsTo(User);

  const Post = require('./Post')(sequelize);
  CommentSchema.belongsTo(Post);

  return CommentSchema;
};