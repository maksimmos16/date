module.exports = function(model){
	var module = {};
	module.admin = require('./admin')(model);
	module.api = require('./api')(model);
	module.web = require('./web')(model);
	return module;
}