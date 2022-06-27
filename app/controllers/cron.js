module.exports = function (model) {
	var module = {};
	const config = require('../../config/constants.js');
	module.dateCron = require('./cron/dateCron')(model,config);
	module.instaCron = require('./cron/instaCron')(model,config);
	module.subscriptionCron = require('./cron/subscriptionCron')(model,config);
	return module;
}