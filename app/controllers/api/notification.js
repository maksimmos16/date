module.exports = function(model, config) {
	var module = {};

	module.getNotificationsSettings = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try { 
			let userId = req.body.userId;
			let token = req.headers.token;
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user' ,loginToken: token});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}
					let enabledNotifications = userDetails.enabledNotifications;
					let disabledNotifications = userDetails.disabledNotifications;
					if (!enabledNotifications) {
						enabledNotifications = [];
					}
					if (!disabledNotifications) {
						disabledNotifications = [];
					}

					let allNotifications = await model.Notification.find({isActive: true},{slug:1, fieldName: 1, description: 1, byDefault: 1}).lean();
					if (allNotifications && allNotifications.length) {
						for (let i = 0; i < allNotifications.length; i++) {
							if (allNotifications[i].byDefault) {
								if (disabledNotifications.indexOf(allNotifications[i].slug) > -1) {
									allNotifications[i].isActive = false;
								} else {
									allNotifications[i].isActive = true;
								}
							} else {
								if (enabledNotifications.indexOf(allNotifications[i].slug) > -1) {
									allNotifications[i].isActive = true;
								} else {
									allNotifications[i].isActive = false;
								}
							}
							delete allNotifications[i].byDefault;
						}
						successMessage.message = "Notification settings loaded successfully";
					} else {
						allNotifications = [];
						successMessage.message = "Notification not available";
					}
					uniq = [...new Set(userDetails.enabledNotifications)];
					successMessage.data = {notificationList: allNotifications, notification: uniq};
					res.send(successMessage);
				} else {
					failedMessage.message = "User data not found";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User ID is invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('getNotificationSettings::::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}	

	module.setNotifications = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			let slug = req.body.slug;
			let isActive = req.body.isActive;
			
			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user', loginToken: token});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				let enabledNotifications = userDetails.enabledNotifications;
				if (!enabledNotifications) {
					enabledNotifications = [];
				}
				let disabledNotifications = userDetails.disabledNotifications;
				if (!disabledNotifications) {
					disabledNotifications = [];
				}
				let isValidSlug = await model.Notification.countDocuments({slug: slug});
				if (isValidSlug) {
					if (isActive == '1') {
						
						if (disabledNotifications.indexOf(slug) > -1) {
							disabledNotifications.splice(disabledNotifications.indexOf(slug),1);
						}

						if (enabledNotifications.indexOf(slug) == -1) {
							enabledNotifications.push(slug);
						}
					} else {
						if (enabledNotifications.indexOf(slug) > -1) {
							enabledNotifications.splice(enabledNotifications.indexOf(slug),1);
						}

						if (disabledNotifications.indexOf(slug) == -1) {
							disabledNotifications.push(slug);
						}
					}
					await model.User.updateOne({_id: userId},{enabledNotifications: enabledNotifications, disabledNotifications: disabledNotifications, updatedAt: new Date()});
					successMessage.message = "Notification updated successfully";							
					res.send(successMessage);
				} else {
					failedMessage.message = "Slug is invalid";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User data is not found";
				res.send(failedMessage);
			}
			
		} catch(e) {
			console.log('setNotifications::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.setNotificationsApp = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			let slug = req.body.slug;
			let isActive = req.body.isActive;
			// console.log('req.body: ',req.body);

			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user', loginToken: token});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				let enabledNotifications = userDetails.enabledNotifications;
				if (!enabledNotifications) {
					enabledNotifications = [];
				}
				let disabledNotifications = userDetails.disabledNotifications;
				if (!disabledNotifications) {
					disabledNotifications = [];
				}

				let newSlug = slug.split('-');
				let newSlug32 = slug.split('-');
				// console.log('newSlug: ',newSlug);
				newSlug = newSlug[0];
				console.log('newSlug: ',newSlug);
				
				let twSl = (newSlug32[1] == 'e') ? newSlug32[0]+'-p' : (newSlug32[1] == 'p') ? newSlug32[0]+'-e' : slug;
				console.log('twSl: ',twSl);

				let isValidSlug = await model.Notification.countDocuments({slug: newSlug});
				if (isValidSlug) {
					if (isActive == '1') {
						
						if (disabledNotifications.indexOf(slug) > -1 || disabledNotifications.indexOf(twSl) > -1) {
							if(disabledNotifications.includes(slug)){
								disabledNotifications.splice(disabledNotifications.indexOf(slug),1);
							}
							else if(disabledNotifications.includes(twSl)){
								disabledNotifications.splice(disabledNotifications.indexOf(twSl),1);
							}
						}

						// [ Enable ]
						if (enabledNotifications.indexOf(slug) == -1 || enabledNotifications.indexOf(twSl) == -1) {
							
							// [ Update ]
							if(enabledNotifications.includes(twSl)){
								// console.log('elif - Update');
								enabledNotifications.splice(enabledNotifications.indexOf(twSl),1);
								enabledNotifications.push(slug);
							}

							// [ New Entry ]
							else {
								// console.log('New Entry');
								enabledNotifications.push(slug); // [ message - e ]
							}
						}

					} 
					else {
						
						if (enabledNotifications.indexOf(slug) > -1 || enabledNotifications.indexOf(twSl) > -1) {
							
							if(enabledNotifications.includes(slug)){
								enabledNotifications.splice(enabledNotifications.indexOf(slug),1);
							}
							else if(enabledNotifications.includes(twSl)){
								enabledNotifications.splice(enabledNotifications.indexOf(twSl),1);
							}

						}

						if (disabledNotifications.indexOf(slug) == -1 || disabledNotifications.indexOf(twSl) == -1) {
							
							// [ Update ]
							if(disabledNotifications.includes(twSl)){
								// console.log('elif - Update');
								disabledNotifications.splice(disabledNotifications.indexOf(twSl),1);
								disabledNotifications.push(slug);
							}

							// [ New Entry ]
							else {
								// console.log('New Entry');
								disabledNotifications.push(slug); // [ message - e ]
							}
						}
					}

					await model.User.updateOne({_id: userId},{enabledNotifications: enabledNotifications, disabledNotifications: disabledNotifications, updatedAt: new Date()});
					successMessage.message = "Notification updated successfully";							
					res.send(successMessage);
				} else {
					failedMessage.message = "Slug is invalid";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User data is not found";
				res.send(failedMessage);
			}
			
		} catch(e) {
			console.log('setNotifications::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.getNotification = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try{
			let userId = req.body.userId;
			let token = req.headers.token;
			if (!userId) {
				failedMessage.message = "User id is invalid";
				return res.send(failedMessage);
			}
			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role : 'user', loginToken: token});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				let query = [
					{
						$match: {
							receiverId: userDetails._id,
							isDeleted: false,
							type: {$nin: ['video','audio']}
						}
					},
					{
						$addFields: {
							oppId: {$cond: [{$eq: ['$senderId',userDetails._id]},'$receiverId','$senderId']}
						}
					},
					{
						$lookup: {
							from :'users',
							let: {oppId: '$oppId'},
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [
												{$eq: ['$_id','$$oppId']},
												{$eq: ['$isDeleted',false]},
												{$eq: ['$isActive',true]},
												{$eq: ['$role','user']}
											]
										}
									}
								},
								{
									$project: {
										_id: 1,
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
						$project: {
							_id: 1,
							oppId: 1,
							type: 1,
							createdAt:1,
							oppData :1,
							text:1,
							contentId:1,
							isRequest:1
						}
					},
					{
						$sort: {createdAt: -1}
					}
				];


				let notificationList = await model.UserNotification.aggregate(query);
				let notiList = [];
				if (notificationList && notificationList.length) {
					for (let i = 0; i < notificationList.length; i++) {
						if (notificationList[i].type == 'date') {
							let query = {
								_id: notificationList[i].contentId, 								
							};
							let dateData = await model.Dates.findOne(query);
							if (dateData) {
								if (notificationList[i].isRequest && dateData.crtOppId.toString() == userDetails._id.toString() && dateData.isApproved == false) {
									notificationList[i].showBtn = true;
								} else {
									notificationList[i].showBtn = false;
								}
								notiList.push(notificationList[i]);
							}
						} else if (notificationList[i].type.match(new RegExp('like','i'))) {
							let query = {
								isDeleted: false,
								$or: [
									{
										senderId:  notificationList[i].oppId, 
										receiverId: userDetails._id, 
									},
									{
										senderId: userDetails._id,
										receiverId:  notificationList[i].oppId, 									
									}
								]
							};
							let likeData = await model.Like.findOne(query);
							if (likeData){ 
								if (notificationList[i].isRequest && likeData.receiverId._id.toString() == userDetails._id.toString() && likeData.matched == false) {
									notificationList[i].showBtn = true;
								} else {
									notificationList[i].showBtn = false;
								}
								notiList.push(notificationList[i]);
							} 
						} else {
							notificationList[i].showBtn = false;
							notiList.push(notificationList[i]);
						}
					}
				}

				uniq = [...new Set(userDetails.enabledNotifications)];

				successMessage.message = "Notification list";
				successMessage.data = {notificationList: notiList, notification: uniq};
				res.send(successMessage);
			} else {
				console.log('getNotification------------->>>"user not found"');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('getNotification::::::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	return module;
}