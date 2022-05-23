const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class TopPostSchema extends Model {};
  // keeps track of post likes
  TopPostSchema.init({
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
    modelName: 'top_posts',
    indexes: [
      {
        fields: ['community_id']
      },
    ]
  });

  return TopPostSchema;
};