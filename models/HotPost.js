const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class HotPostSchema extends Model {};
  // keeps track of post likes
  HotPostSchema.init({
    communityId: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: {notEmpty: true},
      references: {
        model: 'communities',
        key: 'id'
      }
    },
    postIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER), 
      allowNull: false, 
      defaultValue: [],
    },
  }, { 
    sequelize, underscored: true, 
    freezeTableName: true, 
    modelName: 'hot_posts',
    indexes: [
      {
        fields: ['community_id']
      },
    ]
  });

  return HotPostSchema;
};