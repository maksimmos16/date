module.exports = function(model){
	var module = {};

	// [ Send Message ]
	module.sendMessage = async function(data, callback){
		try{
			console.log('sendMessage Data: ',data);
			var senderId = mongoose.Types.ObjectId(data.senderId);
			var receiverId = mongoose.Types.ObjectId(data.receiverId);
			var message = data.message;
			var chatValues = {
				senderId : senderId,
				receiverId : receiverId,
				message: message,
				isDeleted: false,
				isRead: false
			}
			var chatData = await model.Chat.create(chatValues);

			// [ Send Message To Receiver ]
			let tmp = await model.User.findOne({_id: receiverId});
			io.sockets.connected[tmp.socketId].emit('mymessage', {
				'message': message
			});

			// [ Chat Module ]
			io.sockets.connected[tmp.socketId].emit('emitMessage', {
				'message': message,
				'id': senderId,
				'chatData': chatData
			});

			// [ Push Notification ]


			if(tmp){
				return callback({'status':'success','message':'Successfully Message Sent.',data:tmp});
			} else {
				await model.Chat.delete({where:{'id':chatMasterId}});
				return callback({'status':'fail','message':'Something Want Wrong.',data:''});
			}
		}catch(error){
			console.log('error: ',error);
			return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
		}
	};

	// [ User List ]
	module.getUserList = async function(data, callback){
		try{
			console.log('getUserList: ',data);
			var senderId = mongoose.Types.ObjectId(data.userId);
			var getUserList = await model.Chat.distinct('receiverId',{'senderId':senderId,'isDeleted':false});
			let userData = await model.User.find({'_id' : { $in : [ getUserList ]}});
			console.log('userData: ',userData);
			return callback({'status':'success','message':'Login user send messages user list.',data: userData});
		}catch(error){
			return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
		}
	};

	// [ Chat Conversation Between Two Users ]
	module.getParticularUserMessage = async function(data, callback){
		try{
			console.log('getParticularUserMessage Data: ',data);
			var senderId = mongoose.Types.ObjectId(data.senderId);
			var receiverId = mongoose.Types.ObjectId(data.receiverId);
			var getUserMessage = await model.Chat.find({"senderId":senderId, "receiverId":receiverId, isDeleted: false });
			if(getUserMessage.length){
				return callback({'status':'success','message':'User Message List.',data:getUserMessage});	
			} else {
				return callback({'status':'fail','message':'User Message Not Found.',data:''});	
			}
		}catch(error){
			return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
		}
	};

	// [ Notification Count ]
	module.notiCount = async function(data, client, callback){
		console.log('notiCount------------>>>data: ',data);
		try{
			console.log('loginSocket Data: ',data);
			var userId = mongoose.Types.ObjectId(data.userId);
			let nCount = await model.UserNotification.countDocuments({receiverId: userId, isRead: false});
			console.log('nCount: ',nCount);
			if(nCount){
				if(typeof callback == 'function'){
					return callback({'status':'success','message':'Notification Count',data:nCount});
				}
			} else {
				if(typeof(callback) == 'function'){
					return callback({'status':'fail','message':'Something Want Wrong.',data: nCount});
				}
			}
		}
		catch(error){
			console.log('error: ',error);
			if(typeof(callback) == 'function'){
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	}

	// [ Like ]
	module.like = async function(data, callback){
		try{
			console.log('sendMessage Data: ',data);
			let senderId     = mongoose.Types.ObjectId(data.senderId);
			let senderData   = await model.User.findOne({_id: senderId}).select(['username']);
			let receiverId   = mongoose.Types.ObjectId(data.receiverId);
			let text = '';
			let broadCastUserBoth = false;
			
			// [ Already Liked ????? ]
			let alreadyLiked = await model.Like.findOne({
				senderId: receiverId,
				receiverId: senderId
			});

			// [ Matched Entry ]
			if(alreadyLiked != null){
				
				// [ Update Flava Matched in Like Table ]
				likeData = await model.Like.update({
					senderId: receiverId,
					receiverId: senderId
				},{
					type: data.type,
					matched: true
				});
				
				broadCastUserBoth = true;
				text = `Congratulations `+senderData.username+` `+data.type+` You Back, Now You Can Chat`;

				// [ Update notification table]
				await model.UserNotification.update({
					senderId: receiverId,
					receiverId: senderId
				},{
					type: data.type,
					matched: true,
					text: text,
				});

				// [ Same Create ]
				await model.UserNotification.create({
					senderId: senderId,
					receiverId: receiverId,
					type: data.type,
					text: text,
					matched: true,
					isDeleted: false
				});
			} else{

				// [ Entry in Like Table ]
				likeData = await model.Like.create({
					senderId: senderId,
					receiverId: receiverId,
					type: data.type,
					matched: false,
					isDeleted: false
				});
				text = senderData.username+` `+data.type+` You`;
				let tx = (data.type == 'like') ? 'likeCount' : 'superLikeCount';
				await model.User.update({_id: senderId},{ $inc : { tx : 1 }});
				await model.UserNotification.create({
					senderId: senderId,
					receiverId: receiverId,
					type: data.type,
					text: text,
					matched: false,
					isDeleted: false
				});
			}

			// [ Send Message To Receiver ]
			let sender = null, receiver = null, nCountS = 0, nCountR = 0;
			if(broadCastUserBoth){
				sender = await model.User.findOne({_id: senderId}).select(['socketId']);
				nCountS = await model.UserNotification.countDocuments({receiverId: senderId});

				receiver = await model.User.findOne({_id: receiverId}).select(['socketId']);
				nCountR = await model.UserNotification.countDocuments({receiverId: receiverId});

				io.sockets.connected[sender.socketId].emit('userNotification', {
					'message': text,
					'ncount': nCountS
				});
				io.sockets.connected[receiver.socketId].emit('userNotification', {
					'message': text,
					'ncount': nCountR
				});

			} else{

				receiver = await model.User.findOne({_id: receiverId}).select(['socketId']);
				nCountR = await model.UserNotification.countDocuments({receiverId: receiverId});
				console.log("receiver: ",receiver);
				
				io.sockets.connected[receiver.socketId].emit('userNotification', {
					'message': text,
					'ncount': nCountR
				});
			}			

			if(sender){
				if(typeof(callback) == 'function'){
					return callback({'status':'success','message':'Successfully Message Sent.',data:tmp});
				}
			} else {
				if(typeof(callback) == 'function'){
					return callback({'status':'fail','message':'Something Want Wrong.',data:''});
				}
			}
		}catch(error){
			console.log('error: ',error);
			return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
		}
	};
	
	// [ Dislike ]
	module.dislike = async function(data, callback){
		try{
			console.log('dislike Data: ',data);
			let senderId     = mongoose.Types.ObjectId(data.senderId);
			let receiverId   = mongoose.Types.ObjectId(data.receiverId);
			let likeData = await model.Dislike.create({
				senderId: senderId,
				receiverId: receiverId,
				type: data.type,
				matched: false,
				isDeleted: false
			});
			if(likeData){
				if(typeof(callback) == 'function'){
					return callback({'status':'success','message':'Unliked.',data:tmp});
				}
			} else {
				await model.Chat.delete({where:{'id':chatMasterId}});
				if(typeof(callback) == 'function'){
					return callback({'status':'fail','message':'Something Want Wrong.',data:''});
				}
			}
		}catch(error){
			console.log('error: ',error);
			return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
		}
	};

	// [ Get Notifications ]
	module.getNotifications = async function(data, callback){
		try{
			console.log('Notification Socket Data: ',data);
			var userId = mongoose.Types.ObjectId(data.userId);
			let notiData = await model.UserNotification.aggregate([
				{ $match : {receiverId: userId}},
				{ $limit : 5 },
				{ $sort : { _id : -1 } },
				{ $lookup:
					{
						from: 'users',
						localField: 'senderId',
						foreignField: '_id',
						as: 'userData'
					}
				},
				{ $project : 
					{ 	
						type : 1,
						senderId: 1,
						receiverId: 1,
						matched: 1,
						text: 1,
						username : '$userData.username',
						photo : '$userData.profilePic',
					} 
				},
			]);
			console.log('notiData: ',notiData);
			let tmp = await model.User.findOne({_id: userId});
			let nCount = await model.UserNotification.countDocuments({receiverId: userId});
			io.sockets.connected[tmp.socketId].emit('notification', {
				'notification': notiData,
				'ncount': nCount
			});
			if(notiData){
				if (typeof callback == 'function') {

					return callback({'status':'success','message':'Socket Successfully Stored.',data:notiData});
				}
			} else {
				await model.Chat.delete({where:{'id':chatMasterId}});
				if (typeof callback == 'function') {

					return callback({'status':'fail','message':'Something Want Wrong.',data:''});
				}
			}
		}
		catch(error){
			console.log('error: ',error);
			if (typeof callback == 'function') {

				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	}

	// [ Block ]
	module.block = async function(data, callback){
		try{
			console.log('blcok Data: ',data);
			console.log('data.senderId: ',data.senderId);
			console.log('data.receiverId: ',data.receiverId);
			let senderId     = mongoose.Types.ObjectId(data.senderId);
			let receiverId   = mongoose.Types.ObjectId(data.receiverId);
			console.log('senderId : ',senderId);
			console.log('receiverId : ',receiverId);
			let likeData = '';
			
			likeData = await model.Block.create({
				senderId: senderId,
				receiverId: receiverId,
				isBlocked: true,
				isDeleted: false
			});
			console.log('likeData: ',likeData);
			if(likeData){
				if(typeof(callback) == 'function'){
					return callback({'status':'success','message':'Successfully Blocked.',data:likeData});
				}
			} else {
				if(typeof(callback) == 'function'){
					return callback({'status':'fail','message':'Something Want Wrong.',data:''});
				}
			}
		}catch(error){
			console.log('error: ',error);
			return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
		}
	};

	return module;
};