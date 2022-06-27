module.exports = function (model) {
	var module = {};
	module.admin = require('./admin.js')(model);
	module.api = require('./api.js')(model);
	module.web = require('./web.js')(model);
	module.cron = require('./cron.js')(model);
	return module;
}	