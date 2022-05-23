const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class UUIDSchema extends Model {};
  // keeps track of uuids we've generated in our system 
  // so that if there's ever a collision
  // we can generate a new one
  UUIDSchema.init({
    uuid: {
      primaryKey: true,
      type: DataTypes.TEXT, 
    },
  }, { 
    sequelize, 
    underscored: true, 
    freezeTableName: true, 
    updatedAt: false,
    createdAt: false,
    modelName: 'uuids',
  });

  return UUIDSchema;
};