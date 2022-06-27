module.exports = function(model){
	var module = {};
	var config = require('../../config/constants.js');

	// [ Send Message ]
	module.sendMessage = async function(data, callback){
		try{
			console.log('sendMessage Data: this sockettt',data);
			var senderId = mongoose.Types.ObjectId(data.senderId);
			var receiverId = mongoose.Types.ObjectId(data.receiverId);
			var message = data.message;
			var msgType = data.type;

			var chatValues = {
				senderId : senderId,
				receiverId : receiverId,
				message: message,
				msgType: msgType,
				isDeleted: false,
				isRead: false,
				createdAt: new Date()
			}
			var chatData = await model.Chat.create(chatValues);

			// [ Read All Messages ]
			let queryDate = { senderId: receiverId, receiverId: senderId, isRead: false };
			await model.Chat.updateMany(queryDate,{$set:{isRead: true}});

			// [ Send Message To Receiver ]
			let tmp = await model.User.findOne({_id: receiverId});
			let tmpS = await model.User.findOne({_id: senderId});
			

			let text = tmpS.username + ' Sent You Message';
			await model.UserNotification.create({
				senderId: senderId,
				receiverId: receiverId,
				type: 'message',
				text: text,
				matched: false,
				isDeleted: false,
				createdAt: new Date()
			});
			let nCountR = await model.UserNotification.countDocuments({receiverId: receiverId, isRead: false});

			// [ Socket CheckPost ]
			let time = helper.onlyTime(chatData.createdAt);
			let date = helper.customDataFormat(chatData.createdAt);
			let onlyDate = helper.onlyDate(chatData.createdAt);
			// var client = io.sockets.connected[tmp.socketId];
			// if (client) { 
			// 	// [ My Message ]
			// 	client.emit('mymessage', {
			// 		'message': message
			// 	});
			// 	// [ Notification ]
			// 	client.emit('userNotification', {
			// 		'message': text,
			// 		'ncount': nCountR
			// 	});
			// 	// [ Chat Module ]
			// 	client.emit('emitMessage', {
			// 		'message': message,
			// 		'id': senderId,
			// 		'chatData': chatData,
			// 		'time' : time,
			// 		'date' : date
			// 	});
			// } else {
			// 	"do nothing"
			// }

				let receiver = await model.User.findOne({_id: receiverId}).select(['socketId', 'email', 'enabledNotifications', 'deviceType', 'deviceToken','onChatScreen']);
				let senderData = await model.User.findOne({_id: senderId}).select(['socketId', 'username', 'email', 'enabledNotifications', 'deviceType', 'deviceToken','onChatScreen']);
				// let nCountR = await model.UserNotification.countDocuments({receiverId: receiverId, isRead: false});
				
				// [ Web to Android - Receiver ]
					let NotificationPostData = {
						message : 'You Got Message From '+senderData.username,
						device_type : receiver.deviceType,
						device_token : receiver.deviceToken,
						notification_data : {
							'senderId':senderId,
							'receiverId':receiverId,
							'type': data.type,
							'message' : text,
						},
						notification_title : 'You Got Message From '+senderData.username,
					};

					if(receiver.enabledNotifications.includes('message-p') == true){

						// onChatScreen false means user is on another screen so we can send notification
						if(receiver.onChatScreen == false){
							helper.pushNotification(model, NotificationPostData);
						}
					}
					else if(receiver.enabledNotifications.includes('message-e') == true) {
						
						// [ Email ]
							// let obj = {
							// 	uname:receiver.username,
							// 	msg:senderData.username + ' Message You ',
							// 	baseUrl:config.baseUrl,
							// 	buttonName: 'Please Visit Once',
							// 	appStoreLink:config.appStoreLink,
							// 	playStoreLink:config.playStoreLink
							// }
							// let mailOptions = {
							// 	to_email: receiver.email,
							// 	subject: 'Easy Date | Message',
							// 	templateName: 'like',
							// 	dataToReplace: obj//<json containing data to be replaced in template>
							// };

							// let send1 = await helper.sendTemplateMail(mailOptions);

						// [ Socket Event ]
					}

					let receiverSocketObj = io.sockets.connected[receiver.socketId];
					if (receiverSocketObj) {

						receiverSocketObj.emit('mymessage', {
							'message': message
						});
						// [ Notification ]
						receiverSocketObj.emit('userNotification', {
							'message': text,
							'ncount': nCountR
						});
						// [ Chat Module ]
						receiverSocketObj.emit('emitMessage', {
							'message': message,
							'id': senderId,
							'chatData': chatData,
							'time' : time,
							'date' : date,
							'onlyDate': onlyDate
						});
					}

			if(tmp){
				return callback({'status':'success','message':'Successfully Message Sent.',data:time, date: date, onlyDate: onlyDate});
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
			var getUserMessage = await model.Chat.find({"senderId":senderId, "receiverId":receiverId, isDeleted: false }).sort({'createdAt': -1});
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
			console.log('notiCount----------->>>error: ',error);
			if(typeof(callback) == 'function'){
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	}

	// [ Like ]
	module.like = async function(data, callback){
		try{
			console.log('like--------->>> Data: ',data);
			let senderId     = mongoose.Types.ObjectId(data.senderId);
			let senderData   = await model.User.findOne({_id: senderId}).select(['username', 'deviceType', 'deviceToken', 'profilePic']);
			let receiverId   = mongoose.Types.ObjectId(data.receiverId);
			let receiverData   = await model.User.findOne({_id: receiverId}).select(['username', 'deviceType', 'deviceToken', 'profilePic']);
			let text = '';
			let broadCastUserBoth = false;
			
			// [ Muliple Request Checkpost ]
				let checkpost = await model.Like.findOne({
					senderId: senderId,
					receiverId: receiverId,
					type: data.type
				});
				if(checkpost != null){
					return callback({'status':'fail','message':'Already Liked...',data:''});
				}

			// [ Already Liked ????? ]
				let alreadyLiked = await model.Like.findOne({
					senderId: receiverId,
					receiverId: senderId
				});

			// [ Matched Entry ]
				if(alreadyLiked != null){
					
					// [ Update Flava Matched in Like Table ]
					likeData = await model.Like.updateOne({
						senderId: receiverId,
						receiverId: senderId
					},{
						type: data.type,
						matched: true,
						updatedAt: new Date()
					});
					
					broadCastUserBoth = true;
					text = `Congratulations `+senderData.username+` `+data.type+` You Back, Now You Can Chat`;

					// [ Update notification table]
					await model.UserNotification.updateMany({
						senderId: receiverId,
						receiverId: senderId
					},{
						type: data.type,
						matched: true,
						// text: text,
					});

					// [ Same Create ]
					await model.UserNotification.create({
						senderId: senderId,
						receiverId: receiverId,
						type: data.type,
						text: text,
						matched: true,
						isDeleted: false,
						contentId: alreadyLiked._id,
						createdAt: new Date(),
						updatedAt: new Date()
					});

					await model.UserNotification.create({
						senderId: receiverId,
						receiverId: senderId,
						type: data.type,
						text: 'Congratulations, Now You Can Chat',
						matched: true,
						isDeleted: false,
						contentId: alreadyLiked._id,
						createdAt: new Date(),
						updatedAt: new Date()
					});

				} else{

					// [ Entry in Like Table ]
					likeData = await model.Like.create({
						senderId: senderId,
						receiverId: receiverId,
						type: data.type,
						matched: false,
						isDeleted: false,
						createdAt: new Date(),
						updatedAt: new Date()
					});
					text = senderData.username+` `+data.type+` You`;
					let tx = (data.type == 'like') ? 'likeCount' : 'superLikeCount';
					await model.User.updateOne({_id: senderId},{ $inc : { tx : 1 }});
					await model.UserNotification.create({
						senderId: senderId,
						receiverId: receiverId,
						type: data.type,
						text: text,
						matched: false,
						isDeleted: false,
						isRequest: true,
						contentId: likeData._id,
						createdAt: new Date(),
						updatedAt: new Date()
					});
				}

			// [ Send Message To Receiver ]
			let sender = null, receiver = null, nCountS = 0, nCountR = 0;
			if(broadCastUserBoth){
				
				sender = await model.User.findOne({_id: senderId}).select(['socketId', 'email', 'enabledNotifications', 'deviceType', 'deviceToken']);
				nCountS = await model.UserNotification.countDocuments({receiverId: senderId, isRead: false});

				receiver = await model.User.findOne({_id: receiverId}).select(['socketId', 'email', 'enabledNotifications', 'deviceType', 'deviceToken']);
				nCountR = await model.UserNotification.countDocuments({receiverId: receiverId, isRead: false});

				// [ Web to Android - Receiver ]
					let NotificationPostData = {
						message : text,
						device_type : receiver.deviceType,
						device_token : receiver.deviceToken,
						notification_data : {
							'senderId':senderId,
							'receiverId':receiverId,
							'type': data.type,
							'message' : text,
						},
						notification_title : 'You Got Like'
					};

					if(receiver.enabledNotifications.includes('match-p') == true){
						helper.pushNotification(model, NotificationPostData);
					}
					else if(receiver.enabledNotifications.includes('match-e') == true) {
						
						// [ Email ]
							let obj = {
								uname:receiver.username,
								msg:senderData.username + ' Matched ',
								baseUrl:config.baseUrl,
								imgSrc: config.baseUrl + senderData.profilePic,
								buttonName: 'Please Visit Once',
								appStoreLink:config.appStoreLink,
								playStoreLink:config.playStoreLink
							}
							let mailOptions = {
								to_email: receiver.email,
								subject: 'Easy Date | Matched',
								templateName: 'like',
								dataToReplace: obj//<json containing data to be replaced in template>
							};

							let send1 = await helper.sendTemplateMail(mailOptions);

						// [ Socket Event ]
							let receiverSocketObj = io.sockets.connected[receiver.socketId];
							if (receiverSocketObj) {
								receiverSocketObj.emit('userNotification', {
									'message': text,
									'ncount': nCountR
								});
							}

					}

				// [ Web to Android - Sender ]
					let NotificationPostData32 = {
						message : text,
						device_type : sender.deviceType,
						device_token : sender.deviceToken,
						notification_data : {
							'senderId':senderId,
							'receiverId':receiverId,
							'type': data.type,
							'message' : text,
						},
						notification_title : 'Matched'
					};

					if(sender.enabledNotifications.includes('match-p') == true){
						helper.pushNotification(model, NotificationPostData32W);
					}
					else if(sender.enabledNotifications.includes('match-e') == true) {
						
						// [ Email ]
							let obj = {
								uname:sender.username,
								msg:receiverData.username + ' Matched ',
								baseUrl:config.baseUrl,
								imgSrc: config.baseUrl + receiverData.profilePic,
								buttonName: 'Please Visit Once',
								appStoreLink:config.appStoreLink,
								playStoreLink:config.playStoreLink
							}
							let mailOptions = {
								to_email: sender.email,
								subject: 'Easy Date | Matched',
								templateName: 'like',
								dataToReplace: obj//<json containing data to be replaced in template>
							};

							let send1 = await helper.sendTemplateMail(mailOptions);

						// [ Socket Event ]
							let senderSocketObj = io.sockets.connected[sender.socketId];
							if (senderSocketObj) {
								senderSocketObj.emit('userNotification', {
									'message': text,
									'ncount': nCountR
								});
							}
					}

			} else{

				receiver = await model.User.findOne({_id: receiverId}).select(['socketId', 'email', 'enabledNotifications', 'deviceType', 'deviceToken']);
				nCountR = await model.UserNotification.countDocuments({receiverId: receiverId, isRead: false});
				
				// [ Web to Android - Receiver ]
					let NotificationPostData = {
						message : text,
						device_type : receiver.deviceType,
						device_token : receiver.deviceToken,
						notification_data : {
							'senderId':senderId,
							'receiverId':receiverId,
							'type': data.type,
							'message' : text,
						},
						notification_title : 'You Got Like'
					};

					if(receiver.enabledNotifications.includes('like-p') == true){
						helper.pushNotification(model, NotificationPostData);
					}
					else if(receiver.enabledNotifications.includes('like-e') == true) {
						
						// [ Email ]
							let obj = {
								uname:receiver.username,
								msg:senderData.username + ' Like You ',
								baseUrl:config.baseUrl,
								imgSrc: config.baseUrl + senderData.profilePic,
								buttonName: 'Please Visit Once',
								appStoreLink:config.appStoreLink,
								playStoreLink:config.playStoreLink
							}
							let mailOptions = {
								to_email: receiver.email,
								subject: 'Easy Date | Like',
								templateName: 'like',
								dataToReplace: obj//<json containing data to be replaced in template>
							};

							let send1 = await helper.sendTemplateMail(mailOptions);

						// [ Socket Event ]
							let receiverSocketObj = io.sockets.connected[receiver.socketId];
							if (receiverSocketObj) {
								receiverSocketObj.emit('userNotification', {
									'message': text,
									'ncount': nCountR
								});
							}

					}

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
			console.log('like---------->>>>error: ',error);
			if (typeof callback == 'function') {
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
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
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			let check = await model.Like.findOneAndUpdate({$or: [{senderId: senderId, receiverId: receiverId},{senderId: receiverId, receiverId: senderId}]},{isDeleted: true, deleteReason: 'dislike', updatedAt: new Date()},{new: true});
			if (check) {
				await model.UserNotification.updateMany({contentId: check._id, isRequest: true},{$set: {isDeleted: true, updatedAt: new Date()}});
			}
			await model.User.updateOne({_id: senderId},{didRewind: false, updatedAt: new Date()});
			if(likeData){
				if(typeof(callback) == 'function'){
					return callback({'status':'success','message':'Unliked.',data:tmp});
				}
			} else {
				await model.Chat.delete({where:{'id':chatMasterId}});
				if(typeof(callback) == 'function'){
					return callback({'status':'fail','message':'Something Went Wrong.',data:''});
				}
			}
		}catch(error){
			console.log('dislike----------->>>>error: ',error);
			if (typeof callback == 'function') {
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	};

	// [ Get Notifications ]
	module.getNotifications = async function(data, callback){
		try{
			console.log('Notification Socket Data: ',data);
			var userId = mongoose.Types.ObjectId(data.userId);
			await model.UserNotification.updateMany({receiverId: userId, isRead: false},{$set:{isRead: true}});
			let notiData = await model.UserNotification.aggregate([
				{ $match : {receiverId: userId, isDeleted: false}},
				{ $sort : { createdAt : -1 } },
				// { $limit : 5 },
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
			let off = await model.Offer.findOne().sort({createdAt: -1});
			let tmpData = {
				daters: notiData,
				offer: off
			}
			let tmp = await model.User.findOne({_id: userId});
			let nCount = await model.UserNotification.countDocuments({receiverId: userId, isRead: false, isDeleted: false});
			var sockUs = io.sockets.connected[tmp.socketId];
			if(sockUs){
				sockUs.emit('notification', {
					'notification': tmpData,
					'ncount': nCount
				});
			}
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
			console.log('Block Data: ',data);
			let senderId     = mongoose.Types.ObjectId(data.senderId);
			let receiverId   = mongoose.Types.ObjectId(data.receiverId);
			let likeData = '';
			
			// let dateData = await model.Date.findOne({
			// 	initUserId: senderId,
			// 	initOppId: receiverId
			// }).sort({'createdAt': -1});

			// [ Date Cancel ]

			likeData = await model.Block.create({
				senderId: senderId,
				receiverId: receiverId,
				isBlocked: true,
				isDeleted: false
			});
			console.log('likeData: ',likeData);
			let tmpS = await model.User.findOne({_id: senderId});
			let tmpR = await model.User.findOne({_id: receiverId});
			var clientR = io.sockets.connected[tmpR.socketId];
			if (clientR) { 
				// [ My Message ]
				clientR.emit('blockUser', {
					'message': tmpS.username + ' Blocked You...',
					'status': 'success',
					'id': senderId
				});
			}
			var clientS = io.sockets.connected[tmpS.socketId];
			if (clientS) { 
				// [ My Message ]
				clientS.emit('blockCallback', {
					'message': ' Blocked Successfully...',
					'status': 'success',
					'id': receiverId
				});
			}
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
			if (typeof callback == 'function') {
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	};

	// [ Unmatch ]
	module.unmatch = async function(data, callback){
		try{
			console.log('Unmatch Data: ',data);
			let senderId     = mongoose.Types.ObjectId(data.senderId);
			let receiverId   = mongoose.Types.ObjectId(data.receiverId);
			let likeData = '';
			
			// 1] Match: False [ Like - Table ]
			// 2] Date Cancel [ Date - Table ]

			likeData = await model.Like.updateOne({
				$or : [ 
					{ senderId: senderId, receiverId: receiverId },
					{ senderId: receiverId, receiverId: senderId }
				],
				matched: true
			},{
				matched: false
			});
			console.log('likeData: ',likeData);
			sender = await model.User.findOne({_id: senderId}).select(['socketId']);
			nCountS = await model.UserNotification.countDocuments({receiverId: senderId, isRead: false});

			receiver = await model.User.findOne({_id: receiverId}).select(['socketId']);
			nCountR = await model.UserNotification.countDocuments({receiverId: receiverId, isRead: false});

			var clientS = io.sockets.connected[sender.socketId];
			if (clientS) {
				clientS.emit('userNotification', {
					'message': text,
					'ncount': nCountS
				});
			}
			else{

			}

			var clientR = io.sockets.connected[receiver.socketId];
			if (clientR) {
				clientR.emit('userNotification', {
					'message': text,
					'ncount': nCountR
				});
			}
			else{

			}
			
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
			if (typeof callback == 'function') {
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	};

	// [ Call ]
	module.callEnd = async function(data, callback){
		try{
			console.log('Call Data: ',data);
			let senderId     = mongoose.Types.ObjectId(data.userId);
			let tmpS = await model.User.findOne({_id: senderId});
			var clientR = io.sockets.connected[tmpS.socketId];
			if (clientR) { 
				// [ My Message ]
				clientR.emit('callEndRes', {
					'message': tmpS.username + ' Blocked You...',
					'status': 'success',
					'id': senderId
				});
			}
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
			if (typeof callback == 'function') {
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	};

	// [ call Err End ]
	module.callErrEnd = async function(data, callback){
		try{
			console.log('Call Err Data: ',data);
			let roomId = data.roomIdSC;


			let roomDetails = await model.VideoChatRoom.findOne({_id: mongoose.Types.ObjectId(roomId), status: 'in-progress'});
			if (roomDetails) {
				
				let userDetailsFrom = await model.User.findOne({_id: mongoose.Types.ObjectId(roomDetails.fromId), isDeleted: false, isVerified: true, status: 'accept', role: 'user'});

				let userDetailsTo = await model.User.findOne({_id: mongoose.Types.ObjectId(roomDetails.toId), isDeleted: false, isVerified: true, status: 'accept', role: 'user'});

				let roomData = await videoHelper.getRoom(roomId);
				if (roomData) {
					await videoHelper.removeParticipant(roomId, roomDetails.fromId.toString());
					await videoHelper.removeParticipant(roomId, roomDetails.toId.toString());
					await videoHelper.completeRoom(roomId);
				}

				await model.VideoChatRoom.updateOne({_id:roomId},{status:'completed', updatedAt: new Date()});

				let clientCF = io.sockets.connected[userDetailsFrom.socketId];
				if (clientCF) { 
					// [ My Message ]
					clientCF.emit('callErrEndRes', {
						'message': userDetailsFrom.username + ' call err...',
						'status': 'success',
						'id': userDetailsFrom._id
					});
				}

				let clientCT = io.sockets.connected[userDetailsTo.socketId];
				if (clientCT) { 
					// [ My Message ]
					clientCT.emit('callErrEndRes', {
						'message': userDetailsTo.username + ' call err...',
						'status': 'success',
						'id': userDetailsTo._id
					});
				}

				if(likeData){
					if(typeof(callback) == 'function'){
						return callback({'status':'success','message':'Successfully Blocked.',data:likeData});
					}
				}

			} else {
				if(typeof(callback) == 'function'){
					return callback({'status':'fail','message':'Something Want Wrong.',data:''});
				}
			}
		}catch(error){
			console.log('callErrEnd: ',error);
			if (typeof callback == 'function') {
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	};

	// [ report ]
	module.report = async function(data, callback){
		try{
			console.log('Report Data: ',data);
			let senderId     = mongoose.Types.ObjectId(data.senderId);
			let receiverId     = mongoose.Types.ObjectId(data.oppId);
			let text = data.text;
			await model.Report.create({
				senderId: senderId,
				receiverId: receiverId,
				reportText: text
			})
			if(text){
				if(typeof(callback) == 'function'){
					return callback({'status':'success','message':'Successfully Report.',data:text});
				}
			} else {
				if(typeof(callback) == 'function'){
					return callback({'status':'fail','message':'Something Want Wrong.',data:''});
				}
			}
		}catch(error){
			console.log('error: ',error);
			if (typeof callback == 'function') {
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	};

	module.getMessages = async function(data, client, callback) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		console.log('getMessages------------>>>>data: ',data);
		let userId = data.userId;
		let oppId = data.oppId;
		try {
			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user'});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					if (typeof callback == 'function') {
						callback(failedMessage);
					} else {
						helper.sendDirect(client, 'getMessages', failedMessage)
					}
				}

				let oppDetails = await model.User.findOne({_id: oppId, isDeleted: false, role: 'user'});
				if (oppDetails) {
					let conversations = await model.Chat.find({$or:[{senderId: userDetails._id, receiverId: oppDetails._id},{senderId: oppDetails._id, receiverId: userDetails._id}], isDeleted: false},{senderId: 1, receiverId:1,message: 1,createdAt:1, msgType: 1}).sort({'createdAt':1}).limit(50);
					let freeTime = await helper.getTimerForFree(model, userDetails._id);
					successMessage.message = "Message list";
					successMessage.data = {messageList: conversations,isExpired: freeTime.isExpired, purchasePlan: freeTime.purchasePlan, timer: freeTime.timer};
					console.log('getMessages----------->>>>"message successfully sent"');
					if (typeof callback == 'function') {
						callback(successMessage);
					} else {
						helper.sendDirect(client, 'getMessages', successMessage)
					}
				} else {
					console.log('getMessages----------->>>"opp details not found"');
					failedMessage.message = "Opp details not found";
					
					if (typeof callback == 'function') {
						callback(failedMessage);
					} else {
						helper.sendDirect(client, 'getMessages', failedMessage)
					}
				}
			} else {
				console.log('getMessages----------->>>>"user data not found"');
				failedMessage.message = "Something went wrong";

				if (typeof callback == 'function') {
					callback(failedMessage);
				} else {
					helper.sendDirect(client, 'getMessages', failedMessage)
				}
			}
		} catch (e) {
			console.log('getMessages::::::::::::::::>>>e: ',e);
			failedMessage.message = "Someting went wrong";
			if (typeof callback == 'function') {
				callback(failedMessage);
			} else {
				helper.sendDirect(client, 'getMessages', failedMessage)
			}
		}
	}

	module.sendChatMessage = async function(data, client, callback) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		console.log('sendChatMessage----------->>>>>data sokcet: ',data);
		try {

			let senderId = data.senderId;
			let receiverId = data.receiverId;
			let msg = data.msg;
			let type = data.type;

			if(!msg) {
				console.log('sendChatMessage----------->>>>"message should not empty"');
				failedMessage.message = "Message should not empty";
				if (typeof callback == 'function') {
					callback(failedMessage);
				} else {
					helper.sendDirect(client, 'sendChatMessage', failedMessage)
				}
			}

			let senderDetails = await model.User.findOne({_id: senderId, role: 'user', isDeleted: false});
			if (senderDetails) {
				if (!senderDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					if (typeof callback == 'function') {
						callback(failedMessage);
					} else {
						helper.sendDirect(client, 'sendChatMessage', failedMessage)
					}
				}
				let receiverDetails = await model.User.findOne({_id: receiverId, role: 'user', isDeleted: false, isActive: true});
				if (receiverDetails) {

					let obj = {
				        senderId         : senderDetails._id,
						receiverId       : receiverDetails._id,
						message          : msg,
						createdAt		 : new Date(),
						msgType          : type
					}
					let check = await model.Chat.create(obj);
					if (check) {
						let dataToSend = {
							_id: check._id,
							senderId: senderDetails._id,
							receiverId: receiverDetails._id,
							message: msg,
							msgType: type,
							createdAt: check.createdAt
						};


						successMessage.message = "Message sent Successfully";
						successMessage.data = dataToSend;

						if (receiverDetails.socketId) {
							helper.sendToOne(receiverDetails.socketId, 'receivedMessage', successMessage);
						}



						// [ Notification ]
						let tmUs = await model.User.findOne({_id: receiverDetails._id}).select(['username', 'enabledNotifications', 'deviceType', 'deviceToken', 'email','onChatScreen']);
						let NotificationPostData = {
							message : 'You Got Message From '+senderDetails.username,
							device_type : tmUs.deviceType,
							device_token : tmUs.deviceToken,
							notification_data : {
								'senderId':senderDetails._id,
								'receiverId':receiverDetails._id,
								'type': 'message',
								'message' : 'You Got Message From  '+senderDetails.username,
							},
							notification_title : 'Message'
						};

						
						if(tmUs.enabledNotifications.includes('message-p') == true){
							
							// onChatScreen false means user is on another screen so we can send notification
							if(tmUs.onChatScreen == false){
								helper.pushNotification(model, NotificationPostData);
							}
						}
						else if(tmUs.enabledNotifications.includes('message-e') == true) {
							
							// Email 
							let obj = {
								uname:tmUs.username,
								msg:'You Got Message From '+senderDetails.username,
								baseUrl:config.baseUrl+'chat',
								buttonName: 'Please Visit Once',
								appStoreLink:config.appStoreLink,
								playStoreLink:config.playStoreLink
							}
							let mailOptions = {
								to_email: tmUs.email,
								subject: 'Easy Date | Message',
								templateName: 'message',
								dataToReplace: obj//<json containing data to be replaced in template>
							};

							let send1 = await helper.sendTemplateMail(mailOptions);
						}




						if (typeof callback == 'function') {
							callback(successMessage);
						} else {
							helper.sendDirect(client, 'sendChatMessage', successMessage)
						}
					} else {
						console.log('sendChatMessage------------->>>>"message not send"');
						failedMessage.message = "Message not sent";
						if (typeof callback == 'function') {
							callback(failedMessage);
						} else {
							helper.sendDirect(client, 'sendChatMessage', failedMessage)
						}
					}
				} else {
					console.log('sendChatMessage------------->>>>"receiver details not found"');
					failedMessage.message = "Something went Wrong";
					if (typeof callback == 'function') {
						callback(failedMessage);
					} else {
						helper.sendDirect(client, 'sendChatMessage', failedMessage)
					}
				}
			} else {
				console.log('sendChatMessage------------->>>"sender details not found"');
				failedMessage.message = "Something went wrong";
				if (typeof callback == 'function') {
					callback(failedMessage);
				} else {
					helper.sendDirect(client, 'sendChatMessage', failedMessage)
				}
			}
		} catch (e) {
			console.log('sendChatMessage::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			if (typeof callback == 'function') {
				callback(failedMessage);
			} else {
				helper.sendDirect(client, 'sendChatMessage', failedMessage)
			}
		}
	}


	// commented code on 30 nov to copy new code of any flava ============================================================ backup 30 nov

	// // [ Send Message ]
	// module.sendMessage = async function(data, callback){
	// 	try{
	// 		console.log('sendMessage Data: ',data);
	// 		var senderId = mongoose.Types.ObjectId(data.senderId);
	// 		var receiverId = mongoose.Types.ObjectId(data.receiverId);
	// 		var message = data.message;
	// 		var msgType = data.type;
	// 		var chatValues = {
	// 			senderId : senderId,
	// 			receiverId : receiverId,
	// 			message: message,
	// 			msgType: msgType,
	// 			isDeleted: false,
	// 			isRead: false,
	// 			createdAt: new Date()
	// 		}
	// 		var chatData = await model.Chat.create(chatValues);

	// 		// [ Read All Messages ]
	// 		let queryDate = { senderId: receiverId, receiverId: senderId, isRead: false };
	// 		await model.Chat.updateMany(queryDate,{$set:{isRead: true}});

	// 		// [ Send Message To Receiver ]
	// 		let tmp = await model.User.findOne({_id: receiverId});
	// 		let tmpS = await model.User.findOne({_id: senderId});
			

	// 		let text = tmpS.username + ' Sent You Message';
	// 		await model.UserNotification.create({
	// 			senderId: senderId,
	// 			receiverId: receiverId,
	// 			type: 'message',
	// 			text: text,
	// 			matched: false,
	// 			isDeleted: false,
	// 			createdAt: new Date()
	// 		});
	// 		let nCountR = await model.UserNotification.countDocuments({receiverId: receiverId, isRead: false});

	// 		// [ Socket CheckPost ]
	// 		let time = helper.onlyTime(chatData.createdAt);
	// 		var client = io.sockets.connected[tmp.socketId];
	// 		if (client) { 
	// 			// [ My Message ]
	// 			client.emit('mymessage', {
	// 				'message': message
	// 			});
	// 			// [ Notification ]
	// 			client.emit('userNotification', {
	// 				'message': text,
	// 				'ncount': nCountR
	// 			});
	// 			// [ Chat Module ]
	// 			client.emit('emitMessage', {
	// 				'message': message,
	// 				'id': senderId,
	// 				'chatData': chatData,
	// 				'time' : time
	// 			});
	// 		} else {
	// 			"do nothing"
	// 		}

	// 		if(tmp){
	// 			return callback({'status':'success','message':'Successfully Message Sent.',data:time});
	// 		} else {
	// 			await model.Chat.delete({where:{'id':chatMasterId}});
	// 			return callback({'status':'fail','message':'Something Want Wrong.',data:''});
	// 		}
	// 	}catch(error){
	// 		console.log('error: ',error);
	// 		return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 	}
	// };

	// // [ User List ]
	// module.getUserList = async function(data, callback){
	// 	try{
	// 		console.log('getUserList: ',data);
	// 		var senderId = mongoose.Types.ObjectId(data.userId);
	// 		var getUserList = await model.Chat.distinct('receiverId',{'senderId':senderId,'isDeleted':false});
	// 		let userData = await model.User.find({'_id' : { $in : [ getUserList ]}});
	// 		console.log('userData: ',userData);
	// 		return callback({'status':'success','message':'Login user send messages user list.',data: userData});
	// 	}catch(error){
	// 		return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 	}
	// };

	// // [ Chat Conversation Between Two Users ]
	// module.getParticularUserMessage = async function(data, callback){
	// 	try{
	// 		console.log('getParticularUserMessage Data: ',data);
	// 		var senderId = mongoose.Types.ObjectId(data.senderId);
	// 		var receiverId = mongoose.Types.ObjectId(data.receiverId);
	// 		var getUserMessage = await model.Chat.find({"senderId":senderId, "receiverId":receiverId, isDeleted: false });
	// 		if(getUserMessage.length){
	// 			return callback({'status':'success','message':'User Message List.',data:getUserMessage});	
	// 		} else {
	// 			return callback({'status':'fail','message':'User Message Not Found.',data:''});	
	// 		}
	// 	}catch(error){
	// 		return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 	}
	// };

	// // [ Notification Count ]
	// module.notiCount = async function(data, client, callback){
	// 	console.log('notiCount------------>>>data: ',data);
	// 	try{
	// 		console.log('loginSocket Data: ',data);
	// 		var userId = mongoose.Types.ObjectId(data.userId);
	// 		let nCount = await model.UserNotification.countDocuments({receiverId: userId, isRead: false});
	// 		console.log('nCount: ',nCount);
	// 		if(nCount){
	// 			if(typeof callback == 'function'){
	// 				return callback({'status':'success','message':'Notification Count',data:nCount});
	// 			}
	// 		} else {
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'fail','message':'Something Want Wrong.',data: nCount});
	// 			}
	// 		}
	// 	}
	// 	catch(error){
	// 		console.log('error: ',error);
	// 		if(typeof(callback) == 'function'){
	// 			return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 		}
	// 	}
	// }

	// // [ Like ]
	// module.like = async function(data, callback){
	// 	try{
	// 		console.log('sendMessage Data: ',data);
	// 		let senderId     = mongoose.Types.ObjectId(data.senderId);
	// 		let senderData   = await model.User.findOne({_id: senderId}).select(['username']);
	// 		let receiverId   = mongoose.Types.ObjectId(data.receiverId);
	// 		let text = '';
	// 		let broadCastUserBoth = false;
			
	// 		// [ Muliple Request Checkpost ]
	// 			let checkpost = await model.Like.findOne({
	// 				senderId: senderId,
	// 				receiverId: receiverId,
	// 				type: data.type
	// 			});
	// 			if(checkpost != null){
	// 				return callback({'status':'fail','message':'Already Liked...',data:''});
	// 			}

	// 		// [ Already Liked ????? ]
	// 		let alreadyLiked = await model.Like.findOne({
	// 			senderId: receiverId,
	// 			receiverId: senderId
	// 		});

	// 		// [ Matched Entry ]
	// 		if(alreadyLiked != null){
				
	// 			// [ Update Flava Matched in Like Table ]
	// 			likeData = await model.Like.update({
	// 				senderId: receiverId,
	// 				receiverId: senderId
	// 			},{
	// 				type: data.type,
	// 				matched: true
	// 			});
				
	// 			broadCastUserBoth = true;
	// 			text = `Congratulations `+senderData.username+` `+data.type+` You Back, Now You Can Chat`;

	// 			// [ Update notification table]
	// 			await model.UserNotification.update({
	// 				senderId: receiverId,
	// 				receiverId: senderId
	// 			},{
	// 				type: data.type,
	// 				matched: true,
	// 				text: text,
	// 			});

	// 			// [ Same Create ]
	// 			await model.UserNotification.create({
	// 				senderId: senderId,
	// 				receiverId: receiverId,
	// 				type: data.type,
	// 				text: text,
	// 				matched: true,
	// 				isDeleted: false
	// 			});
	// 		} else{

	// 			// [ Entry in Like Table ]
	// 			likeData = await model.Like.create({
	// 				senderId: senderId,
	// 				receiverId: receiverId,
	// 				type: data.type,
	// 				matched: false,
	// 				isDeleted: false
	// 			});
	// 			text = senderData.username+` `+data.type+` You`;
	// 			let tx = (data.type == 'like') ? 'likeCount' : 'superLikeCount';
	// 			await model.User.update({_id: senderId},{ $inc : { tx : 1 }});
	// 			await model.UserNotification.create({
	// 				senderId: senderId,
	// 				receiverId: receiverId,
	// 				type: data.type,
	// 				text: text,
	// 				matched: false,
	// 				isDeleted: false
	// 			});
	// 		}

	// 		// [ Send Message To Receiver ]
	// 		let sender = null, receiver = null, nCountS = 0, nCountR = 0;
	// 		if(broadCastUserBoth){
	// 			sender = await model.User.findOne({_id: senderId}).select(['socketId']);
	// 			nCountS = await model.UserNotification.countDocuments({receiverId: senderId, isRead: false});

	// 			receiver = await model.User.findOne({_id: receiverId}).select(['socketId']);
	// 			nCountR = await model.UserNotification.countDocuments({receiverId: receiverId, isRead: false});

	// 			io.sockets.connected[sender.socketId].emit('userNotification', {
	// 				'message': text,
	// 				'ncount': nCountS
	// 			});
	// 			io.sockets.connected[receiver.socketId].emit('userNotification', {
	// 				'message': text,
	// 				'ncount': nCountR
	// 			});

	// 		} else{

	// 			receiver = await model.User.findOne({_id: receiverId}).select(['socketId']);
	// 			nCountR = await model.UserNotification.countDocuments({receiverId: receiverId, isRead: false});
	// 			console.log("receiver: ",receiver);
				
	// 			io.sockets.connected[receiver.socketId].emit('userNotification', {
	// 				'message': text,
	// 				'ncount': nCountR
	// 			});
	// 		}			

	// 		if(sender){
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'success','message':'Successfully Message Sent.',data:tmp});
	// 			}
	// 		} else {
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'fail','message':'Something Want Wrong.',data:''});
	// 			}
	// 		}
	// 	}catch(error){
	// 		console.log('error: ',error);
	// 		return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 	}
	// };
	
	// // [ Dislike ]
	// module.dislike = async function(data, callback){
	// 	try{
	// 		console.log('dislike Data: ',data);
	// 		let senderId     = mongoose.Types.ObjectId(data.senderId);
	// 		let receiverId   = mongoose.Types.ObjectId(data.receiverId);
	// 		let likeData = await model.Dislike.create({
	// 			senderId: senderId,
	// 			receiverId: receiverId,
	// 			type: data.type,
	// 			matched: false,
	// 			isDeleted: false
	// 		});
	// 		if(likeData){
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'success','message':'Unliked.',data:tmp});
	// 			}
	// 		} else {
	// 			await model.Chat.delete({where:{'id':chatMasterId}});
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'fail','message':'Something Want Wrong.',data:''});
	// 			}
	// 		}
	// 	}catch(error){
	// 		console.log('error: ',error);
	// 		return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 	}
	// };

	// // [ Get Notifications ]
	// module.getNotifications = async function(data, callback){
	// 	try{
	// 		console.log('Notification Socket Data: ',data);
	// 		var userId = mongoose.Types.ObjectId(data.userId);
	// 		await model.UserNotification.updateMany({receiverId: userId, isRead: false},{$set:{isRead: true}});
	// 		let notiData = await model.UserNotification.aggregate([
	// 			{ $match : {receiverId: userId}},
	// 			{ $sort : { createdAt : -1 } },
	// 			{ $limit : 5 },
	// 			{ $lookup:
	// 				{
	// 					from: 'users',
	// 					localField: 'senderId',
	// 					foreignField: '_id',
	// 					as: 'userData'
	// 				}
	// 			},
	// 			{ $project : 
	// 				{ 	
	// 					type : 1,
	// 					senderId: 1,
	// 					receiverId: 1,
	// 					matched: 1,
	// 					text: 1,
	// 					username : '$userData.username',
	// 					photo : '$userData.profilePic',
	// 				} 
	// 			},
	// 		]);
	// 		console.log('notiData: ',notiData);
	// 		let off = await model.Offer.findOne().sort({createdAt: -1});
	// 		let tmpData = {
	// 			daters: notiData,
	// 			offer: off
	// 		}
	// 		let tmp = await model.User.findOne({_id: userId});
	// 		let nCount = await model.UserNotification.countDocuments({receiverId: userId, isRead: false});
	// 		io.sockets.connected[tmp.socketId].emit('notification', {
	// 			'notification': tmpData,
	// 			'ncount': nCount
	// 		});
	// 		if(notiData){
	// 			if (typeof callback == 'function') {

	// 				return callback({'status':'success','message':'Socket Successfully Stored.',data:notiData});
	// 			}
	// 		} else {
	// 			await model.Chat.delete({where:{'id':chatMasterId}});
	// 			if (typeof callback == 'function') {

	// 				return callback({'status':'fail','message':'Something Want Wrong.',data:''});
	// 			}
	// 		}
	// 	}
	// 	catch(error){
	// 		console.log('error: ',error);
	// 		if (typeof callback == 'function') {

	// 			return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 		}
	// 	}
	// }

	// // [ Block ]
	// module.block = async function(data, callback){
	// 	try{
	// 		console.log('Block Data: ',data);
	// 		let senderId     = mongoose.Types.ObjectId(data.senderId);
	// 		let receiverId   = mongoose.Types.ObjectId(data.receiverId);
	// 		let likeData = '';
			
	// 		// let dateData = await model.Date.findOne({
	// 		// 	initUserId: senderId,
	// 		// 	initOppId: receiverId
	// 		// }).sort({'createdAt': -1});

	// 		// [ Date Cancel ]

	// 		likeData = await model.Block.create({
	// 			senderId: senderId,
	// 			receiverId: receiverId,
	// 			isBlocked: true,
	// 			isDeleted: false
	// 		});
	// 		console.log('likeData: ',likeData);
	// 		let tmpS = await model.User.findOne({_id: senderId});
	// 		let tmpR = await model.User.findOne({_id: receiverId});
	// 		var clientR = io.sockets.connected[tmpR.socketId];
	// 		if (clientR) { 
	// 			// [ My Message ]
	// 			clientR.emit('blockUser', {
	// 				'message': tmpS.username + ' Blocked You...',
	// 				'status': 'success',
	// 				'id': senderId
	// 			});
	// 		}
	// 		var clientS = io.sockets.connected[tmpS.socketId];
	// 		if (clientS) { 
	// 			// [ My Message ]
	// 			clientS.emit('blockCallback', {
	// 				'message': ' Blocked Successfully...',
	// 				'status': 'success',
	// 				'id': receiverId
	// 			});
	// 		}
	// 		if(likeData){
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'success','message':'Successfully Blocked.',data:likeData});
	// 			}
	// 		} else {
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'fail','message':'Something Want Wrong.',data:''});
	// 			}
	// 		}
	// 	}catch(error){
	// 		console.log('error: ',error);
	// 		return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 	}
	// };

	// // [ Unmatch ]
	// module.unmatch = async function(data, callback){
	// 	try{
	// 		console.log('Unmatch Data: ',data);
	// 		let senderId     = mongoose.Types.ObjectId(data.senderId);
	// 		let receiverId   = mongoose.Types.ObjectId(data.receiverId);
	// 		let likeData = '';
			
	// 		// 1] Match: False [ Like - Table ]
	// 		// 2] Date Cancel [ Date - Table ]

	// 		likeData = await model.Like.update({
	// 			$or : [ 
	// 				{ senderId: senderId, receiverId: receiverId },
	// 				{ senderId: receiverId, receiverId: senderId }
	// 			],
	// 			matched: true
	// 		},{
	// 			matched: false
	// 		});
	// 		console.log('likeData: ',likeData);
	// 		sender = await model.User.findOne({_id: senderId}).select(['socketId']);
	// 		nCountS = await model.UserNotification.countDocuments({receiverId: senderId, isRead: false});

	// 		receiver = await model.User.findOne({_id: receiverId}).select(['socketId']);
	// 		nCountR = await model.UserNotification.countDocuments({receiverId: receiverId, isRead: false});

	// 		var clientS = io.sockets.connected[sender.socketId];
	// 		if (clientS) {
	// 			clientS.emit('userNotification', {
	// 				'message': text,
	// 				'ncount': nCountS
	// 			});
	// 		}
	// 		else{

	// 		}

	// 		var clientR = io.sockets.connected[receiver.socketId];
	// 		if (clientR) {
	// 			clientR.emit('userNotification', {
	// 				'message': text,
	// 				'ncount': nCountR
	// 			});
	// 		}
	// 		else{

	// 		}
			
	// 		if(likeData){
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'success','message':'Successfully Blocked.',data:likeData});
	// 			}
	// 		} else {
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'fail','message':'Something Want Wrong.',data:''});
	// 			}
	// 		}
	// 	}catch(error){
	// 		console.log('error: ',error);
	// 		return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 	}
	// };

	// // [ Call ]
	// module.callEnd = async function(data, callback){
	// 	try{
	// 		console.log('Call Data: ',data);
	// 		let senderId     = mongoose.Types.ObjectId(data.userId);
	// 		let tmpS = await model.User.findOne({_id: senderId});
	// 		var clientR = io.sockets.connected[tmpS.socketId];
	// 		if (clientR) { 
	// 			// [ My Message ]
	// 			clientR.emit('callEndRes', {
	// 				'message': tmpS.username + ' Blocked You...',
	// 				'status': 'success',
	// 				'id': senderId
	// 			});
	// 		}
	// 		if(likeData){
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'success','message':'Successfully Blocked.',data:likeData});
	// 			}
	// 		} else {
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'fail','message':'Something Want Wrong.',data:''});
	// 			}
	// 		}
	// 	}catch(error){
	// 		console.log('error: ',error);
	// 		return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 	}
	// };

	// // [ Call ]
	// module.report = async function(data, callback){
	// 	try{
	// 		console.log('Report Data: ',data);
	// 		let senderId     = mongoose.Types.ObjectId(data.senderId);
	// 		let receiverId     = mongoose.Types.ObjectId(data.oppId);
	// 		let text = data.text;
	// 		await model.Report.create({
	// 			senderId: senderId,
	// 			receiverId: receiverId,
	// 			reportText: text
	// 		})
	// 		if(text){
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'success','message':'Successfully Report.',data:text});
	// 			}
	// 		} else {
	// 			if(typeof(callback) == 'function'){
	// 				return callback({'status':'fail','message':'Something Want Wrong.',data:''});
	// 			}
	// 		}
	// 	}catch(error){
	// 		console.log('error: ',error);
	// 		return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
	// 	}
	// };

	return module;
};