const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class CommunitySchema extends Model {};
  CommunitySchema.init({
    name: {
      type: DataTypes.TEXT, 
      allowNull: false,
      validate: {notEmpty: true},
      unique: true,
      is: "([^\s/]+)"
    },
    eduDomain: {
      type: DataTypes.TEXT, 
      validate: {notEmpty: true},
      unique: true,
    },
  }, 
  {  
    sequelize, 
    underscored: true, 
    freezeTableName: true, 
    modelName: 'communities',
  });
  return CommunitySchema;
};
