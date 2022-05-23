// all constants live here 
const moment = require('moment');
const { PubSub } = require('apollo-server');

// make it so that sunday is day 1 and not 7
moment.updateLocale('en', {
  week : {
    dow : 7
  }
});

module.exports = {
	// default error message
	defaultErrorMessage: "Sorry, something went wrong. Please try again.",
	// moment helps manage dates
	moment: moment,
	paginationLimit: 15,
	pubsub: new PubSub(),
	POST_CREATED: 'POST_CREATED',
	COMMENT_CREATED: 'COMMENT_CREATED',
};