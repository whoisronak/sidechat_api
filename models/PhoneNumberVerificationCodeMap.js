const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class PhoneNumberVerificationCodeMapSchema extends Model {};
  // keps track of the verification code sent by twilio to a user
  // so that we can query it in the signUp call after the sendVerificationCode
  // is called
  PhoneNumberVerificationCodeMapSchema.init({
    phoneNumber: {
      type: DataTypes.STRING(50), 
      primaryKey: true, 
      allowNull: false, 
      unique: true,
      validate: {len: [1, 50], notEmpty: true}
    },
    verificationCode: {
      type: DataTypes.STRING(10), 
      allowNull: false,
      validate: {len: [4, 10], notEmpty: true},
    },
    numTries: {
      type: DataTypes.INTEGER, 
      allowNull: false,
    },
  }, { sequelize, underscored: true, freezeTableName: true, modelName: 'phone_number_verification_code_map' });
  return PhoneNumberVerificationCodeMapSchema;
};