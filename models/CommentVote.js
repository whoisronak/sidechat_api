const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class PostVoteSchema extends Model {};
  // keeps track of post likes
  PostVoteSchema.init({
    userId: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: {notEmpty: true},
      unique: 'compositeIndex',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    commentId: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: {notEmpty: true},
      unique: 'compositeIndex',
      references: {
        model: 'comments',
        key: 'id'
      }
    },
    isUpvote: {
      type: DataTypes.BOOLEAN, 
      allowNull: false,
    },
  }, { 
    sequelize, 
    underscored: true, 
    freezeTableName: true, 
    modelName: 'comment_votes',
    indexes: [
      {
        fields: ['comment_id']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  return PostVoteSchema;
};