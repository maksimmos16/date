module.exports = function(model, io, client){
	var config = require('../../config/constants.js');
	var auth = require('./auth')(model);
	
	client.on('loginSocket', function(data, callback){
		auth.loginSocket(data, client, function(response){
			return callback(response);
		});
	});
}	