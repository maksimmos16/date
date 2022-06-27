module.exports = function (model) {
	var module = {};
	const config = require('../../config/constants.js');
	module.auth = require('./web/auth')(model,config);	
	module.webPages = require('./web/webPages')(model,config);
	return module;
}
