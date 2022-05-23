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
    postId: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: {notEmpty: true},
      unique: 'compositeIndex',
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    isUpvote: {
      type: DataTypes.BOOLEAN, 
      allowNull: false,
    },
  }, { 
    sequelize, underscored: true, 
    freezeTableName: true, 
    modelName: 'post_votes',
    indexes: [
      {
        fields: ['post_id']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  return PostVoteSchema;
};