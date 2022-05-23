const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class UserCommunityMapSchema extends Model {};
  // user team map keeping track of which user is on which team
  UserCommunityMapSchema.init({
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
    communityId: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: {notEmpty: true},
      unique: 'compositeIndex',
      references: {
        model: 'communities',
        key: 'id'
      }
    },
  }, { 
    sequelize, underscored: true, 
    freezeTableName: true, 
    modelName: 'user_community_map',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['community_id']
      },
    ]
  });
  return UserCommunityMapSchema;
};