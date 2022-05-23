// at a high level this just sets up the webserver
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const bunyan = require('bunyan');
const logger = bunyan.createLogger({name: "main"});
const cors = require('cors')
const jwt = require('jsonwebtoken');
const http = require('http');
const { PubSub } = require('apollo-server');
const pubsub = new PubSub();

const app = express();
app.use(bodyParser.urlencoded({extended: true, limit: '10mb'}));
app.use(bodyParser.json({limit: '5mb'}));
app.use(cors());

const { Sequelize } = require('sequelize');
var logging = false;
if (process.env.LOG === 'true') {
  logging = console.log;
}
// sets up and connects to db instance
const sequelize = new Sequelize(process.env.PSQL_CONNECTION_STRING, {dialect: 'postgres', logging: logging});
// initializes ORM models by passing in db instance in
const Model = require('./models/Model')(sequelize);
// defines the GraphQL schema
const schema = require('./schema/indexSchema');
// defines the GraphQL resolvers
const resolvers = require('./resolvers/indexResolvers');
// apollo server
const { ApolloServer, gql, AuthenticationError } = require('apollo-server-express');

// sets up S3
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-west-2'
});

// initializes up firebaseAdmin
const firebaseAdmin = require('firebase-admin');

// initialize and set up amplitude
const Amplitude = require('@amplitude/node');
const amplitude = Amplitude.init(process.env.AMPLITUDE_API_KEY);
// define webhooks that are REST and not graphQL endpoints
const webhooks = require('./webhooks/webhooks');
const webhookConfig = {
  Model: Model
};
app.set('webhookConfig', webhookConfig);

// main function
async function main() {
  
  // for more information on sequelize sync, please read: https://sequelize.org/master/manual/model-basics.html
  // and the migrations section at https://www.notion.so/getmulu/Node-js-API-pSQL-Database-e0da92f4252446ada2350442e388cb3f
  if (process.env.SEQUELIZE_SYNC === 'true' && process.env.NODE_ENV === 'development') {
    // for god's sake, DO NOT EXECUTE THIS LINE 
    // UNLESS YOU ARE RUNNING SOMETHING ON YOUR LOCAL MACHINE
    // OR DATABASE
    // await sequelize.sync({force: true});
    await sequelize.sync({});
  }

  // Request logging
  if (process.env.REQUEST_LOG) {
    morgan.token('req-body', function (req) {
      return JSON.stringify(req.body);
    });
    morgan.format('custom', ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :req-body')
    app.use(morgan('custom'));
  }

  // function that validates a user's cookie
  const getUser = async function(req) {
    const token = req.headers['authorization'];
    const errorString = 'Invalid user credentials. Sign in again'
    if (token) {
      try {
        const verifyResult = await jwt.verify(token, process.env.JWT_SECRET);
        return await jwt.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        throw new AuthenticationError(errorString);
      }
    }
  };

  // set up firebase admin which is used for notifications
  const firebaseConfigFile = await s3.getObject({ 
    Bucket: process.env.AWS_DEV_BUCKET_NAME, 
    Key: `${process.env.NODE_ENV}/mulu-ios-firebase-adminsdk-3gshv-ad5a1f5f9c.json` 
  }).promise();
  const firebaseConfigString = firebaseConfigFile.Body.toString('utf-8');
  const firebaseConfig = JSON.parse(firebaseConfigString);
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseConfig)
  });
  // whether or not you want a graphql playground so that you can hit endpoints using the browser GUI
  // see: https://www.apollographql.com/docs/apollo-server/testing/build-run-queries/
  var playground = false;
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV == 'staging_playground') {
    playground = true;
  }
  // sets up server with schema, resolvers, user making request, Model, sequelize, s3, firebaseAdmin, and sequelize
  const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    context: async ({ req, connection }) => {
      if (connection) {
        const jwtToken = connection.context.authorization;
        const user = await getUser({headers: {"authorization": jwtToken}});
        return {
          Model,
          sequelize,
          pubsub,
          user
        };
      }
      const user = await getUser(req);
      return {
        Model,
        user,
        sequelize,
        s3,
        firebaseAdmin,
        amplitude
      };
    },
    playground
  });

  // REST webhooks
  app.get('/webhooks/defaultWebHook', webhooks.defaultWebHook);

  // sets up graphQL endpoint
  server.applyMiddleware({ app, path: '/graphql' });

  // sets up GraphQL for subscriptions
  const httpServer = http.createServer(app);
  server.installSubscriptionHandlers(httpServer);

  // starts express webserver on port
  const port = process.env.PORT || 3000;
  
  // app.listen(port);
  httpServer.listen(port);

}

main();