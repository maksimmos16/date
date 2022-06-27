module.exports = function(model, io, client){
	var config = require('../../config/constants.js');
	var chat = require('./chat')(model);
	
	// [ Send Message ]
	client.on('sendmessage', function(data, callback){
		chat.sendMessage(data, function(response){
			return callback(response);
		});
	});
	
	// [ User List ]
	client.on('getuserlist', function(data, callback){
		chat.getUserList(data, function(response){
			return callback(response);
		});
	});

	// [ Get Perticular Conversation ]
	client.on('getparticularusermessage', function(data, callback){
		chat.getParticularUserMessage(data, function(response){
			return callback(response);
		});
	});	

	// [ Notification Count ]
	client.on('notiCount', function(data, callback){
		chat.notiCount(data, client, function(response){
			return callback(response);
		});
	});

	// [ Like ]
	client.on('like', function(data, callback, config){
		chat.like(data, client, function(response){
			return callback(response);
		});
	});
	
	// [ Dislike ]
	client.on('dislike', function(data, callback){
		chat.dislike(data, client, function(response){
			return callback(response);
		});
	});

	// [ Get Notifications ]
	client.on('getNotifications', function(data, callback){
		chat.getNotifications(data, client, function(response){
			return callback(response);
		});
	});

	// [ Block ]
	client.on('block', function(data, callback){
		chat.block(data, client, function(response){
			return callback(response);
		});
	});

	// [ Unblock ]
	client.on('unBlock', function(data, callback){
		chat.unBlock(data, client, function(response){
			return callback(response);
		});
	});

	// [ Unmatch ]
	client.on('unmatch', function(data, callback){
		chat.unmatch(data, client, function(response){
			return callback(response);
		});
	});

	// [ Report ]
	client.on('report', function(data, callback){
		chat.report(data, client, function(response){
			return callback(response);
		});
	});

	// [ Call ]
	client.on('callEnd', function(data, callback){
		chat.callEnd(data, client, function(response){
			return callback(response);
		});
	});

	// [ sendChatMessage ]
	client.on('sendChatMessage', function(data, callback){
		chat.sendChatMessage(data, client, function(response){
			return callback(response);
		});
	});
	
	// [ getMessages ]
	client.on('getMessages', function(data, callback){
		chat.getMessages(data, client, function(response){
			// console.log('~getMessages------>>>response: ',response);
			return callback(response);
		});
	});
	
}	