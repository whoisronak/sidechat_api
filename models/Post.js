const { Model, DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  class PostSchema extends Model {};
  // keeps track of news feed posts
  PostSchema.init({
    userId: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: {notEmpty: true},
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // challenge id that post is associated with
    // may need to make this not required in future
    // if you allow posts that aren't challenge based
    communityId: {
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: {notEmpty: true},
      references: {
        model: 'communities',
        key: 'id'
      }
    },
    // not used right now, but video url associated with post
    videoUrl: {
      type: DataTypes.TEXT, 
      validate: {notEmpty: true},
    },
    // thumbnail or image associated with post
    thumbnail: {
      type: DataTypes.TEXT, 
      validate: {notEmpty: true},
    },
    // width of media
    aspectRatioWidth: {
      type: DataTypes.INTEGER
    },
    // height of media
    aspectRatioHeight: {
      type: DataTypes.INTEGER
    },
    upvotes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    numberOfComments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // caption
    text: {
      type: DataTypes.STRING(10000), 
      validate: {notEmpty: true},
    },
    // if the post is ready; when video done processing set isReady to true
    // or once frontend upload image, set isReady to true
    isReady: {
      type: DataTypes.BOOLEAN, 
      allowNull: false,
      defaultValue: false,
    },
  }, { 
    sequelize, 
    underscored: true, 
    freezeTableName: true, 
    modelName: 'posts',
    indexes: [
      {
        fields: ['community_id']
      },
      {
        fields: ['user_id']
      },
    ]
  });
  
  const User = require('./User')(sequelize);
  PostSchema.belongsTo(User);

  const Community = require('./Community')(sequelize);
  PostSchema.belongsTo(Community);

  return PostSchema;
};