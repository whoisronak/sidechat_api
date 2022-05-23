const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class PostFlagSchema extends Model {};
  // keeps track of post flags
  PostFlagSchema.init({
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
  }, { 
    sequelize, underscored: true, 
    freezeTableName: true, 
    modelName: 'post_flags',
    indexes: [
      {
        fields: ['post_id']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  return PostFlagSchema;
};