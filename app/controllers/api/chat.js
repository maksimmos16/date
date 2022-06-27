module.exports = function(model, config) {
	var module = {};

	module.sendChatMessage = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		console.log('sendChatMessage----------->>>>>req.body: ',req.body);
		try {

			let senderId = req.body.senderId;
			let token = req.headers.token;
			let receiverId = req.body.receiverId;
			let msg = req.body.msg;

			if(!msg) {
				console.log('sendChatMessage----------->>>>"message should not empty"');
				failedMessage.message = "Message should not empty";
				return res.send(ailedMessage)
			}

			let senderDetails = await model.User.findOne({_id: senderId, loginToken: token, role: 'user', isDeleted: false});
			if (senderDetails) {
				if (!senderDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}
				let receiverDetails = await model.User.findOne({_id: receiverId, role: 'user', isDeleted: false, isActive: true});
				if (receiverDetails) {
					let obj = {
				        senderId         : senderDetails._id,
						receiverId       : receiverDetails._id,
						message          : msg,
						msgType          : 'text'
					}

					let check = await model.Chat.create(obj);
					if (check) {
						let dataToSend = {
							senderId: senderDetails._id,
							receiverId: receiverDetails._id,
							msg: msg,
							createdAt: new Date()
						};
						if (receiverDetails.socketId) {
							helper.sendToOne(receiverDetails.socketId, 'receivedMessage', dataToSend);
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
								'message' : 'You Got Message From '+senderDetails.username,
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

						successMessage.message = "Message sent Successfully";
						successMessage.data = dataToSend;
						res.send(successMessage);
					} else {
						console.log('sendChatMessage------------->>>>"message not send"');
						failedMessage.message = "Message not sent";
						res.send(failedMessage);
					}
				} else {
					console.log('sendChatMessage------------->>>>"receiver details not found"');
					failedMessage.message = "Something went Wrong";
					res.send(failedMessage);
				}
			} else {
				console.log('sendChatMessage------------->>>"sender details not found"');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('sendChatMessage::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.getChatUserList = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		console.log('getChatUserList------------->>>req.body: ',req.body);

		try {

			let userId = req.body.userId;
			let token = req.headers.token;
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, loginToken: token, isDeleted: false, role: 'user'});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}
					var query = [
					    {
					        $match: {$or: [{senderId:userDetails._id},{receiverId: userDetails._id}],isDeleted: false, matched: true}
					    },
					    {
					        $addFields: {oppId: {$cond: [{$eq: ['$senderId',userDetails._id]},'$receiverId', '$senderId']}}
					    },
					    {
					        $lookup:{
					                from : 'users',
					                let: {userId: '$oppId'},
					                pipeline: [
					                    {
											$match: {
											    $expr: {
													$and: [
														{ $eq: ['$_id','$$userId']},
														{ $eq: ['$isDeleted',false]},
														{ $eq: ['$isActive', true]},
														{ $eq: ['$role','user']}
													]
											    }
											}
					                    },
					                    {
											$project: {
											    _id: 0,
											    username: 1,
											    profilePic:1
											}
					                    }
					                ],
					                as: 'oppData'
					        }
					    },
					    {
					        $unwind: '$oppData'
					    },
					    {
					        $group: {
					            _id: '$oppId',
					            username: {$last: '$oppData.username'},
					            profilePic: {$last: '$oppData.profilePic'},
					            date: {$last: '$createdAt'}
					        }
					    },
					    {
					        $sort: {date:-1}
					    }
					];

					let userList = await model.Like.aggregate(query);
					let photo = await model.Photo.countDocuments({userId: userDetails._id, type: 'document', isDeleted: false});
					let hasDocument = photo ? true: false;
					successMessage.message = "Chat user list";
					let freeTime = await helper.getTimerForFree(model, userDetails._id);
					successMessage.data = {userList: userList, hasDocument: hasDocument, isExpired: freeTime.isExpired, purchasePlan: freeTime.purchasePlan, timer: freeTime.timer};
					res.send(successMessage);
				} else {
					console.log('getChatUserList------------->>>>"User data not found"');
					failedMessage.message = "Something went wrong";
					res.send(failedMessage);
				}
			} else {
				console.log('getChatUserList------------->>>>"user id is invalid"');
				failedMessage.message = "user ID is invalid";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('getChatUserList::::::::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.getMessages = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		// console.log('getMessages------------>>>>req.body: ',req.body);
		let userId = req.body.userId;
		let token = req.headers.token;
		let oppId = req.body.oppId;
		try {
			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user',loginToken: token});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				let oppDetails = await model.User.findOne({_id: oppId, isDeleted: false, role: 'user'});
				if (oppDetails) {
					// let conversations = await model.Chat.find({$or:[{senderId: userDetails._id, receiverId: oppDetails._id},{senderId: oppDetails._id, receiverId: userDetails._id}], isDeleted: false},{senderId: 1, receiverId:1,message: 1,createdAt:1,msgType: 1}).sort({_id:-1}).limit(50);
					let conversations = await model.Chat.find({$or:[{senderId: userDetails._id, receiverId: oppDetails._id},{senderId: oppDetails._id, receiverId: userDetails._id}], isDeleted: false},{senderId: 1, receiverId:1,message: 1,createdAt:1,msgType: 1}).sort({'createdAt':1}).limit(50);
					let freeTime = await helper.getTimerForFree(model, userDetails._id);
					successMessage.message = "Message list";
					successMessage.data = {messageList: conversations,isExpired: freeTime.isExpired, purchasePlan: freeTime.purchasePlan, timer: freeTime.timer};
					res.send(successMessage);
				} else {
					console.log('oppDetails----------->>>"user details not found"');
					failedMessage.message = "Opp details not found";
					res.send(failedMessage);
				}
			} else {
				console.log('getMessages----------->>>>"user data not found"');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('getMessages::::::::::::::::>>>e: ',e);
			failedMessage.message = "Someting went wrong";
			res.send(failedMessage);
		}
	}

	module.uploadChatMedia = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {			
			console.log('uploadChatMedia -- req.files: ',req.files,' req.body: ',req.body);
			
			if (req.files && req.files.media) {
				var userId = req.body.userId;
				var token = req.headers.token;
				var type = req.body.type;

				var userDetail = await model.User.findOne({_id: userId, isDeleted: false, role: 'user',loginToken: token});
				if (userDetail) {
					if (!userDetail.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}

					let image = req.files.media;

					if (image) {
						if (!Array.isArray(image)) {
	 						image = [image];
						} else {
							if (image.length == 0) {
								failedMessage.message = "Please upload media";
								return res.send(failedMessage);
							}
						}
					} else {
						failedMessage.message = "Please upload media";
						return res.send(failedMessage);
					}

					if (image.length > 6) {
						failedMessage.message = "You cannot upload more than 6 media at a time";
						return res.send(failedMessage);
					}

					if (type == 'photo') {
						let tmpNum = helper.randomNumber(4);
						let datetime = dateFormat(new Date(), 'yyyymmddHHMMss');
						let mediaName = datetime+tmpNum+'.jpg';
						let mediaPath = '';
						let upData = {updatedAt: new Date(), visibleInPrivacy: true, deletedBy: '', deleteReason: ''};

						upData.status = 'approved';
						let sortOrder = 1;

						if (image && image.length > 1) {
							failedMessage.message = "You must only upload one profile image";
							return res.send(failedMessage);
						}

						let fileType = image[0].mimetype.split('/')[0];

						type = fileType == 'image' ? 'photo' : fileType;


						upData.sortOrder = sortOrder;
						if (type == 'photo') {
							successMessage.message = "Photo uploaded successfully";
						} else if (type == 'video'){
							mediaName = datetime+tmpNum+'.mp4';
							successMessage.message = "Video uploaded successfully";
						} else {
							failedMessage.message = "Media format not supported";
							return res.send(failedMessage);
						}
						mediaPath = 'upload/chat/'+mediaName;

						let mediaFullPath = './public/'+mediaPath;
						let uploadResp = await image[0].mv(mediaFullPath);

						upData.path = mediaPath;
						upData.type = type;


						console.log('uploadMedia------if----->>>> ',upData);
						upData.userId = userDetail._id;
						// upPhoto = await model.ChatMedia.create(upData);
						successMessage.data = {path: upData.path};
					}

					// helper.updateTrustScore(model, userDetail._id);
					res.send(successMessage);
				} else {
					failedMessage.message = "User Not Found";
					res.status(401).send(failedMessage);
				}
			} else {
				failedMessage.message = "Please upload media file";
				return res.send(failedMessage);
			}
		} catch(e) {
			console.log('uploadMedia:::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}


	module.chatScreenOn = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {			

			let onChatScreen = req.body.onChatScreen;
			let userId = req.body.userId;

			if(onChatScreen == 'true' || onChatScreen == true){

				let userDetail = await model.User.updateOne({_id: mongoose.Types.ObjectId(userId), role: 'user'},{'onChatScreen':true});

			} else if(onChatScreen == 'false' || onChatScreen == false) {

				let userDetail = await model.User.updateOne({_id: mongoose.Types.ObjectId(userId), role: 'user'},{'onChatScreen':false});
			}
			
			successMessage.message = "Updated Flag...";
			return res.send(successMessage);

		} catch(e) {
			console.log('chatScreenOn:::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}
	return module;
}