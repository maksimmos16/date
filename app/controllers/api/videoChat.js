var videoHelper = require('../../helpers/videoHelper.js');

module.exports = function(model, config){
	var module = {};

	module.makeVideoCall = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			let oppId = req.body.oppId;
			let callTy = req.body.type;
			console.log('makeVideoCall---------->>>>token: ',token);
			if (userId && oppId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, status: 'accept', isVerified: true, role: 'user', loginToken: token});
				let oppDetails = await model.User.findOne({_id: oppId, isDeleted: false, status: 'accept', isVerified: true, role: 'user'});
				if (userDetails && oppDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}
					let isExists = await model.VideoChatRoom.countDocuments({$or:[{fromId: userDetails._id},{toId: userDetails._id}, {fromId: oppDetails._id}, {toId: oppDetails._id}], status:'in-progress'});
					if (isExists) {
						failedMessage.message = "Cannot connect with this person at moment";
						return res.send(failedMessage);
					}
					let newRoom = {
						fromId: userDetails._id.toString(),
						toId: oppDetails._id.toString(),
						status:'in-progress'
					}
					var roomDetails = await model.VideoChatRoom.create(newRoom);
					if (roomDetails) {

						let token = videoHelper.createToken('video',userDetails._id.toString(),roomDetails._id.toString());
						if(callTy == 'video'){
							let msg = "You have Video Call From "+userDetails.username;
							let notiData = {
								senderId: userDetails._id,
								receiverId: oppDetails._id,
								type: 'video',
								text: msg,
								contentId: roomDetails._id
							};
							await model.UserNotification.create(notiData);
							if (oppDetails.socketId && io.sockets.connected[oppDetails.socketId]) {
								let client = io.sockets.connected[oppDetails.socketId].emit('notification', {notification: {senderId: userDetails._id,receiverId: oppDetails._id,type: 'video',text: msg,contentId: roomDetails._id, username: userDetails.username, profilePic: userDetails.profilePic}});
							}
							
							// [ Push ] 

						}
						else {
							let msg = "You have Audio Call From "+userDetails.username;
							let notiData = {
								senderId: userDetails._id,
								receiverId: oppDetails._id,
								type: 'audio',
								text: msg,
								contentId: roomDetails._id
							};
							await model.UserNotification.create(notiData);
							if (oppDetails.socketId && io.sockets.connected[oppDetails.socketId]) {
								let client = io.sockets.connected[oppDetails.socketId].emit('notification', {notification: {senderId: userDetails._id,receiverId: oppDetails._id,type: 'audio',text: msg,contentId: roomDetails._id, username: userDetails.username, profilePic: userDetails.profilePic}});
							}
						}
						successMessage.message = "Audio Token generated successfully";
						successMessage.data = {accessToken: token, roomId: roomDetails._id.toString()};
						res.send(successMessage);
					} else {
						console.log('makeVideoCall------------>>>>"Room not created"');
						failedMessage.message = "Unable to connect to this user at this time";
						res.send(failedMessage);
					}
				} else {
					console.log('makeVideoCall------------>>>>"user data not found"');
					failedMessage.message = "Something went wrong! Please try again later";
					res.send(failedMessage);
				}
			} else {
				console.log('makeVideoCall------------>>>>"User ID or OppId is invalid"');
				failedMessage.message = "Someting went wrong! please try again later";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('makeVideoCall:::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.receiveCall = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let roomId = req.body.roomId;
			let token = req.headers.token;
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, isVerified: true, status: 'accept', role: 'user',loginToken: token});
				let roomDetails = await model.VideoChatRoom.findOne({_id:roomId, toId: userDetails._id, status: 'in-progress'});
				if (userDetails && roomDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}
					let token = videoHelper.createToken('video',userDetails._id.toString(),roomDetails.id.toString());

					successMessage.message = "Token generated successfully";
					successMessage.data = {accessToken: token, roomId: roomDetails._id.toString()};
					res.send(successMessage);
				} else {
					console.log('receiveCall----------->>>>"user data not found"');
					failedMessage.message = "Something went wrong";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User ID is invalid";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('receiveCall:::::::::::::::>>>Error: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.endCall = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			let roomId = req.body.roomId;

			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, isVerified: true, status: 'accept', role: 'user', loginToken:token});
			let roomDetails = await model.VideoChatRoom.findOne({_id: roomId, $or:[{fromId: userDetails._id},{toId: userDetails._id}] ,status: 'in-progress'});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				let roomData = await videoHelper.getRoom(roomId);
				if (roomData) {
					await videoHelper.removeParticipant(roomId, roomDetails.fromId.toString());
					await videoHelper.removeParticipant(roomId, roomDetails.toId.toString());
					await videoHelper.completeRoom(roomId);
				} 
				await model.VideoChatRoom.updateOne({_id:roomId},{status:'completed', updatedAt: new Date()});
				successMessage.message = "Call ended";
				res.send(successMessage);
			} else {
				failedMessage.message = "User data not found";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('endCall::::::::::::::>>>error: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.videoStatusCallback = async function(req, res) {
		let data = req.body;
		console.log('videoStatusCallback---------->>>>data: ',data);
		try {
			if (data) {
				let roomId = data.RoomName;
				let roomStatus = data.RoomStatus;
				let statusEvent = data.StatusCallbackEvent;
				let roomDetails = await model.VideoChatRoom.findOne({_id: roomId});
				if (roomDetails) {
					if (statusEvent == 'room-ended') {
						await model.VideoChatRoom.updateOne({_id:roomId},{status: 'completed',updatedAt: new Date()});
					}
					res.send('success');
				} else {
					console.log('videoStatusCallback----------->>>>"room data not found"');
					res.send('fail');
				}
			} else {
				console.log('videoStatusCallback----------->>>>"invalid data"');
				res.send('fail');
			}
		} catch (e) {
			console.log('videoStatusCallback::::::::::::::::>>>Error: ',e);
			res.send('fail');
		}
	}

	// [ APP - Call ]
	module.makeVideoCallApp = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			let oppId = req.body.oppId;
			let callTy = req.body.type;

			console.log('Req.body: ',req.body);
			console.log('makeVideoCallApp---------->>>>token: ',token);

			if (userId && oppId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, status: 'accept', isVerified: true, role: 'user', loginToken: token});
				let oppDetails = await model.User.findOne({_id: oppId, isDeleted: false, status: 'accept', isVerified: true, role: 'user'});
				if (userDetails && oppDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}

					// [ Already In Call ]
					// let isExists = await model.VideoChatRoom.countDocuments({
					// 	$or:[
					// 		{fromId: userDetails._id},{toId: userDetails._id}, 
					// 		{fromId: oppDetails._id}, {toId: oppDetails._id},
					// 	status:'in-progress'
					// });
					// if (isExists) {
					// 	failedMessage.message = "Cannot Connect With This Person at moment";
					// 	return res.send(failedMessage);
					// }
					let newRoom = {
						fromId: userDetails._id.toString(),
						toId: oppDetails._id.toString(),
						status:'in-progress'
					}
					var roomDetails = await model.VideoChatRoom.create(newRoom);
					if (roomDetails) {

						let token = videoHelper.tokenGenerator('audio',userDetails._id.toString(),roomDetails._id.toString());
						console.log('TOKEN: ',token);

						// let msg = "You have Audio Call From "+userDetails.username;
						// let notiData = {
						// 	senderId: userDetails._id,
						// 	receiverId: oppDetails._id,
						// 	type: 'audio',
						// 	text: msg,
						// 	contentId: roomDetails._id
						// };
						// await model.UserNotification.create(notiData);
						
						// [ Push Notification ]

						successMessage.message = "Token generated successfully";
						successMessage.data = {accessToken: token, roomId: roomDetails._id.toString()};
						res.send(successMessage);
					} else {
						console.log('makeVideoCall------------>>>>"Room not created"');
						failedMessage.message = "Unable to connect to this user at this time";
						res.send(failedMessage);
					}
				} else {
					console.log('makeVideoCall------------>>>>"user data not found"');
					failedMessage.message = "Something went wrong! Please try again later";
					res.send(failedMessage);
				}
			} else {
				console.log('makeVideoCall------------>>>>"User ID or OppId is invalid"');
				failedMessage.message = "Someting went wrong! please try again later";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('makeVideoCall:::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.makeCallAppAudio = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {

			console.log('Req.body: ',req.body);
			let to = req.body.to;

			let token = videoHelper.makeCall(to);
			console.log('TOKEN: ',token);

			successMessage.message = "To successfully";
			successMessage.data = {'voiceResponse': token, 'bodyData': req.body};
			res.send(successMessage);

		} catch (e) {
			console.log('makeVideoCall:::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	return module;
}