const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class CommentFlagSchema extends Model {};
  // keeps track of comment flags
  CommentFlagSchema.init({
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
  }, { 
    sequelize, 
    underscored: true, 
    freezeTableName: true, 
    modelName: 'comment_flags',
    indexes: [
      {
        fields: ['comment_id']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  return CommentFlagSchema;
};