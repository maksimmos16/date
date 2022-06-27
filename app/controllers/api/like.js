var dateformat = require('dateformat');
var currentDate = new Date();
var md5 = require('md5');
var jwt = require('jsonwebtoken');

module.exports = function(model,config){
	var module = {};
	
    
	// [ Like ]
	module.like = async(req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{} };
		try {
			
			console.log('\x1b[36m%s\x1b[0m','Req.Data.like: ',req.body);

			// [ Params Setup ]
			let senderId     = mongoose.Types.ObjectId(req.body.senderId);
			let senderData   = await model.User.findOne({_id: senderId}).select(['username', 'email', 'deviceType', 'deviceToken', 'enabledNotifications', 'profilePic']);
			let receiverId   = mongoose.Types.ObjectId(req.body.receiverId);
			let receiverData   = await model.User.findOne({_id: receiverId}).select(['username', 'email', 'deviceType', 'deviceToken', 'enabledNotifications', 'profilePic']);
			let text = '';
			let likeData = '';
			
			// [ Muliple Request Checkpost ]
			let checkpost = await model.Like.findOne({
				senderId: senderId,
				receiverId: receiverId,
				type: req.body.type
			});
			if(checkpost != null){
				failedMessage.message = 'Already Liked';
				return res.send(failedMessage);
			}

			// [ Already Liked ????? ]
			let alreadyLiked = await model.Like.findOne({
				senderId: receiverId,
				receiverId: senderId
			});

			// [ Matched Entry ]
			if(alreadyLiked){
				
				// [ Update Flava Matched in Like Table ]
				likeData = await model.Like.updateOne({
					senderId: receiverId,
					receiverId: senderId
				},{
					type: req.body.type,
					matched: true,
					updatedAt: new Date()
				});
				
				text = `Congratulations `+senderData.username+` `+req.body.type+` You Back, Now You Can Chat`;

				// [ Update notification table]
				await model.UserNotification.updateOne({
					senderId: receiverId,
					receiverId: senderId
				},{
					type: req.body.type,
					matched: true,
					// text: text,
					// contentId: alreadyLiked._id
				});

				// [ Same Create ]
				await model.UserNotification.create({
					senderId: senderId,
					receiverId: receiverId,
					type: req.body.type,
					text: text,
					matched: true,
					isDeleted: false,
					contentId: alreadyLiked._id,
					createdAt: new Date(),
					updatedAt: new Date()
				});

				// [ Push Notification ]
					let NotificationPostData = {
						message : text,
						device_type : receiverData.deviceType,
						device_token : receiverData.deviceToken,
						notification_data : {
							'senderId':senderId,
							'receiverId':receiverId,
							'type': req.body.type,
							'message' : text,
						},
						notification_title : 'You Got Like'
					};

					if(receiverData.enabledNotifications.includes('match-p') == true){
						helper.pushNotification(model, NotificationPostData);
					}
					else if(receiverData.enabledNotifications.includes('match-e') == true) {
						// Email 
						
						let obj = {
							uname:receiverData.username,
							msg:text,
							baseUrl:config.baseUrl,
							imgSrc: config.baseUrl + senderData.profilePic,
							buttonName: 'Please Visit Once',
							appStoreLink:config.appStoreLink,
							playStoreLink:config.playStoreLink
						}
						let mailOptions = {
							to_email: receiverData.email,
							subject: 'Easy Date | Match',
							templateName: 'like',
							dataToReplace: obj//<json containing data to be replaced in template>
						};

						let send1 = await helper.sendTemplateMail(mailOptions);

						console.log('Email.....');
					}

				await model.UserNotification.updateMany({contentId: alreadyLiked._id, isRequest: true},{$set: {isDeleted: true, updatedAt: new Date()}});
			} else{

				// [ Entry in Like Table ]
				likeData = await model.Like.create({
					senderId: senderId,
					receiverId: receiverId,
					type: req.body.type,
					matched: false,
					isDeleted: false,
					createdAt: new Date(),
					updatedAt: new Date()
				});

				if (likeData) {

					text = senderData.username+` `+req.body.type+` You`;
					let tx = (req.body.type == 'like') ? 'likeCount' : 'superLikeCount';
					await model.User.updateOne({_id: senderId},{ $inc : { tx : 1 }});
					await model.UserNotification.create({
						senderId: senderId,
						receiverId: receiverId,
						type: req.body.type,
						text: text,
						matched: false,
						isDeleted: false,
						isRequest: true,
						contentId: likeData._id,
						createdAt: new Date(),
						updatedAt: new Date()
					});

					// [ Push Notification ]
					let NotificationPostData = {
						message : text,
						device_type : receiverData.deviceType,
						device_token : receiverData.deviceToken,
						notification_data : {
							'senderId':senderId,
							'receiverId':receiverId,
							'type': req.body.type,
							'message' : text,
						},
						notification_title : 'You Got Like'
					};

					if(receiverData.enabledNotifications.includes('like-p') == true){
						helper.pushNotification(model, NotificationPostData);
					}
					else if(receiverData.enabledNotifications.includes('like-e') == true) {
						// Email 
						
						let obj = {
							uname:receiverData.username,
							msg:senderData.username + ' Like You ',
							baseUrl:config.baseUrl,
							imgSrc: config.baseUrl + senderData.profilePic,
							buttonName: 'Please Visit Once',
							appStoreLink:config.appStoreLink,
							playStoreLink:config.playStoreLink
						}
						let mailOptions = {
							to_email: receiverData.email,
							subject: 'Easy Date | Like',
							templateName: 'like',
							dataToReplace: obj//<json containing data to be replaced in template>
						};

						let send1 = await helper.sendTemplateMail(mailOptions);

						console.log('Email.....');
					}

				} else {
					failedMessage.message = "Something went wrong";
					return res.send(failedMessage);
				}
			}

			if(likeData){
				successMessage.message = "Liked Successfully";
				return res.send(successMessage);
			} else {
				failedMessage.message = 'Issue in Like';
				return res.send(failedMessage);
			}
		} catch(error) {
			console.log('like------------->>>>error : ',error);
			failedMessage.message = "Something Went Wrong, Please Try Again";
			return res.send(failedMessage);
		}
	}

	// [ Dislike ]
	module.dislike = async(req, res) => {
		try {
			var successMessage = { status: 'success', message:"", data:{}};
    		var failedMessage = { status: 'fail', message:"", data:{}};
			// [ Params Setup ]
			let senderId     = mongoose.Types.ObjectId(req.body.senderId);
			let receiverId   = mongoose.Types.ObjectId(req.body.receiverId);
				
			// [ Muliple Request Checkpost ]
			let checkpost = await model.Dislike.findOne({
				senderId: senderId,
				receiverId: receiverId,
				type: req.body.type
			});
			if(checkpost != null){
				failedMessage.message = 'Already Disliked';
				return res.send(failedMessage);
			}

			// [ Dislike Table ]
			let disLikeData = await model.Dislike.create({
				senderId: senderId,
				receiverId: receiverId,
				type: req.body.type,
				matched: false,
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			});
				
			// [ Response ]
			if(disLikeData){
				let check = await model.Like.findOneAndUpdate({$or: [{senderId: senderId, receiverId: receiverId},{senderId: receiverId, receiverId: senderId}]},{isDeleted: true, deleteReason: 'dislike', updatedAt: new Date()},{new: true});
				if (check) {
					await model.UserNotification.updateMany({contentId: check._id, isRequest: true},{$set: {isDeleted: true, updatedAt: new Date()}});
				}
				await model.User.updateOne({_id: senderId},{didRewind: false, updatedAt: new Date()});
				successMessage.message = "Dislike Successfully";
				return res.send(successMessage);
			} else {
				console.log('dislike---------->>>>"dislike entry failed"');
				failedMessage.message = 'Something went wrong';
				return res.send(failedMessage);
			}
		} catch(error) {
			console.log('dislike::::::::::::::>>>error:  ',error);
			failedMessage.message = "Something Went Wrong, Please Try Again";
			return res.send(failedMessage);
		}
	}

	// [ Who likes you ] 
	module.getFlavaLikes = async(req, res) => {
		console.log('getFlavaLikes-------->>>>>');
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};

		try {
			let userId = req.body.userId;

			if (userId) {
				userId = mongoose.Types.ObjectId(userId);
				token = req.headers.token; 
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token});

				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}

					// [ Like Table > Id > User Table - Photo ]
					let dislikeByMe = await model.Dislike.distinct('receiverId',{isDeleted: false, senderId: userId});

					let allLikeMe = await model.Like.aggregate([
						{ $match : {$or:[{'receiverId': userId},{senderId: userId, matched: true}], 'isDeleted':false,senderId: {$nin: dislikeByMe},receiverId: {$nin: dislikeByMe}}},
						{
							$addFields: {oppId: {$cond:[{$eq: ['$senderId', userId]},'$receiverId','$senderId']}}
						},
						{
							$lookup: {
								from: "users",
								localField: "oppId",
								foreignField: "_id",
								as: "userData"
							}
						},
						{ $unwind: '$userData'},
						{ $match : {'userData.role': 'user', 'userData.username': { "$nin": ["",null]}}},
						{ "$sort" : { "_id" : -1 } },
						{ "$limit" : 10 },
						{
							$project: {
								matched: 1,
								userId: '$userData._id',
								username: '$userData.username',
								profilePic: '$userData.profilePic',
								country: '$userData.country',
								state: '$userData.state',
								city: '$userData.city',
								dob: '$userData.dob'
							}
						}
					]);

					// [ Date Entry or Not ]
					
					for (let i = 0; i < allLikeMe.length; i++) {
						let queryDate = {
							$or : [ 
								{ initUserId: userId, initOppId: allLikeMe[i].userId },
								{ initUserId: allLikeMe[i].userId, initOppId: userId }
							],
		    				"status" : "pending"
						}
						let dt = await model.Dates.countDocuments(queryDate);
						allLikeMe[i].dateOrNot = dt > 0 ? true : false;
						allLikeMe[i].age = allLikeMe[i].dob ? helper.getAge(allLikeMe[i].dob) : 0;
					}


					// [ Like Table > Id > User Table - Photo ]
					let iLikeAll = await model.Like.aggregate([
						{ 
							$match : {$or:[{'senderId': userId},{receiverId: userId, matched: true}], 'isDeleted':false, receiverId: {$nin: dislikeByMe},senderId: {$nin: dislikeByMe}}
						},
						{
							$addFields: {oppId: {$cond:[{$eq: ['$senderId', userId]},'$receiverId','$senderId']}}
						},
						{
							$lookup: {
								from: "users",
								localField: "oppId",
								foreignField: "_id",
								as: "userData"
							}
						},
						{ $unwind: '$userData'},
						{ $match : {'userData.role': 'user', 'userData.username': { "$nin": ["",null]}}},
						{ "$sort" : { "_id" : -1 } },
						{ "$limit" : 10 },
						{
							$project: {
								matched: 1,
								userId: '$userData._id',
								username: '$userData.username',
								profilePic: '$userData.profilePic',
								country: '$userData.country',
								state: '$userData.state',
								city: '$userData.city',
								dob: '$userData.dob'
							}
						}
					]);

					// [ Date Entry or Not ]

					for (let i = 0;i < iLikeAll.length; i++) {
						let queryDate = {
							$or : [ 
								{ initUserId: userId, initOppId: iLikeAll[i].userId },
								{ initUserId: iLikeAll[i].userId, initOppId: userId }
							],
		    				"status" : "pending"
						}
						let dt = await model.Dates.countDocuments(queryDate);
						iLikeAll[i].dateOrNot = dt > 0 ? true : false;
						iLikeAll[i].age = iLikeAll[i].dob ? helper.getAge(iLikeAll[i].dob) : 0;
					}


					successMessage.message = "Flava likes loaded successfully";
					successMessage.data = {
						allLikeMe: allLikeMe,
						iLikeAll: iLikeAll
					};
					res.send(successMessage);
				} else {
					console.log('getFlavaLikes------------->>>"user detail not found"');
					failedMessage.message = "Something went wrong";
					res.send(failedMessage);
				}
			} else {
				console.log('getFlavaLikes---------->>>>UserId is invalid');
				failedMessage.message = "User id is invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('getFlavaLikes:::::::::::>>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}
	return module;
}
