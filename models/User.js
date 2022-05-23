const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class UserSchema extends Model {};
  UserSchema.init({
    email: {
      type: DataTypes.TEXT, 
      allowNull: false, 
      validate: {notEmpty: true},
    },
    phoneNumber: {
      type: DataTypes.STRING(50), 
      allowNull: false, 
      unique: true,
      validate: {len: [1, 50], notEmpty: true, isNumeric: true}
    },
  }, 
  {  
    sequelize, 
    underscored: true, 
    freezeTableName: true, 
    modelName: 'users',
  });
  return UserSchema;
};
