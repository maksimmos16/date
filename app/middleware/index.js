module.exports = function (model) {
	var module = {};
	const config = require('../../config/constants.js');
	module.admin = require('./admin')(model);
	module.api = require('./api')(model,config);	
	module.web = require('./web')(model,config);	
	return module;
}