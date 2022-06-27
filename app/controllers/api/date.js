var dateformat = require('dateformat');
var currentDate = new Date();
var md5 = require('md5');
var jwt = require('jsonwebtoken');

module.exports = function(model,config) {
	var module = {};

    module.getDateRef = async (req, res) => {
    	var successMessage = { status: 'success', message:"", data:{}};
    	var failedMessage = { status: 'fail', message:"", data:{}};
    	try {
    		let locations = await model.Location.find({isDeleted: false, status: true},{name:1, price: 1, location:1}).limit(4).lean();

    		successMessage.message = "Date Reference Loaded Successfully";
    		successMessage.data = {locations: locations}
    		res.send(successMessage);
    	} catch(e) {
    		console.log('getDateRef:::::::>>>>e ',e);
    		failedMessage.message = "Something went wrong";
    		res.send(failedMessage);
    	}
    }

    module.bookDate = async (req, res) => {
    	var successMessage = { status: 'success', message:"", data:{}};
    	var failedMessage = { status: 'fail', message:"", data:{}};
    	try {
    		console.log('bookDate----------->>>>req.body: ',req.body);
    		let userId = req.body.userId;
    		let oppId = req.body.oppId;
    		let token = req.headers.token;
    		//let locationId = req.body.locationId;
    		let date = req.body.date; // dd-mm-yyyy
    		let time = req.body.time; // hh:mm

    		// changes on 27 Aug 2020
    		let lat = Number(req.body.lat);
    		let long = Number(req.body.long);

			if (isNaN(lat)) {
				lat = 0;
			}
			if (isNaN(long)) {
				long = 0;
			}

    		let address = req.body.address;

    		// if(!locationId || locationId == '' || locationId == null || locationId == undefined){
    		// 	locationId = mongoose.Types.ObjectId("5e4276205d3cf6752891b077");
    		// }
    		// changes on 27 Aug 2020

    		let userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, isVerified: true, status: 'accept'});
    		let oppDetails = await model.User.findOne({_id: oppId, isDeleted: false});

    		if (userDetails && oppDetails) {
	    		if (!userDetails.isActive) {
					failedMessage.message = "You Have Been Blocked By Admin";
					return res.send(failedMessage);
				}
				let isExists = await model.Dates.find({initUserId: {$in:[userId, oppId]}, initOppId: {$in:[userId, oppId]}, status: 'pending'},{}).sort({createdAt:-1}).limit(1);
				if (isExists && isExists.length) {
					isExists = isExists[0];
					let dt = new Date();
					let diff = helper.timeDifference(isExists.createdAt, dt, 'hour');
					// console.log('bookDate--------->>>diff: ',diff, ' isExists.createdAt: ',isExists.createdAt);
					if (diff < 24) {
						failedMessage.message = "Date With Same Person is Already Booked";
						return res.send(failedMessage);
					}
				}

				let totalPrice = 0;
				// let locationDetails = await model.Location.findOne({_id: locationId/*, isDeleted: false, status: true*/});
				// console.log('bookDate--------->>>>locationDetails: ',locationDetails);
				// if (!locationDetails) {
				// 	failedMessage.message = "Location Details Not Found";
				// 	return res.send(failedMessage);
				// }

				// totalPrice += locationDetails.price;

				let dt = parseInt(date.split('-')[0]);
				let mn = parseInt(date.split('-')[1]);
				let yr = parseInt(date.split('-')[2]);
				let hr = parseInt(time.split(':')[0]);
				let mt = parseInt(time.split(':')[1]);

				console.log('bookDate----------->>>dt: '+dt+' mn: '+mn+' yr: '+yr+' hr: '+hr+' mt: '+mt);				
				let dateTime = new Date(yr, mn-1,dt,hr, mt);

				let obj = {
					initUserId: userDetails._id,
					initOppId: oppDetails._id,
					crtUserId: userDetails._id,
					crtOppId: oppDetails._id,
					totalPrice: totalPrice,
					paymentStatus: 'pending',
					dateAttemptCount: 1,
					dateTime: dateTime,
					// locationId: locationDetails._id,
					location: {
							type: 'Point',
							coordinates: [long,lat]
					},
					locationAddress:address

				};
				console.log('bookDate----------->>>>obj: ',obj);
				let newDate = await model.Dates.create(obj);
				if (newDate) {
					let dateId =  newDate._id;

					let notiData = {
						senderId: userDetails._id,
						receiverId: oppDetails._id,
						type: 'date',
						text: "Hurrey!! You Got a Request For Date",
						contentId: dateId,
						isRequest: true
					};
					await model.UserNotification.create(notiData);
					helper.sendNotiCount(model, userDetails._id);

					// [ Notification ]

					let tmUs = await model.User.findOne({_id: oppDetails._id}).select(['enabledNotifications', 'deviceType', 'deviceToken', 'email', 'socketId']);
					let NotificationPostData = {
						message : 'Hurrey!! You Got a Request For Date',
						device_type : tmUs.deviceType,
						device_token : tmUs.deviceToken,
						notification_data : {
							'senderId':userDetails._id,
							'receiverId':oppDetails._id,
							'type': 'date',
							'message' : 'Hurrey!! You Got a Request For Date',
						},
						notification_title : 'Date Request'
					};
					if(tmUs.enabledNotifications.includes('date-p') == true){
						helper.pushNotification(model, NotificationPostData);
					}
					else if(tmUs.enabledNotifications.includes('date-e') == true) {
						// Email 
						
						let obj = {
							uname:userDetails.username,
							msg:'Hurrey!! You Got a Request For Date',
							baseUrl:config.baseUrl,
							imgSrc: config.baseUrl + userDetails.profilePic,
							buttonName: 'Please Visit Once',
							appStoreLink:config.appStoreLink,
							playStoreLink:config.playStoreLink
						}
						let mailOptions = {
							to_email: tmUs.email,
							subject: 'Easy Date | Date',
							templateName: 'date',
							dataToReplace: obj//<json containing data to be replaced in template>
						};
						console.log('mailOptions: ',mailOptions);
						let send1 = await helper.sendTemplateMail(mailOptions);
						let nCountR = await model.UserNotification.countDocuments({receiverId: oppDetails._id, isRead: false});
						let tm = { 
							event : 'userNotification',
							ncount: nCountR
						}
						console.log('tm: ',tm);
						let send2 = await helper.sendToOne(tmUs.socketId, tm.event, tm);

					}

					successMessage.message = "Date Booked Successfully";
					successMessage.data = {dateId: dateId};
					res.send(successMessage);
				} else {
					console.log('bookDate----------->>>"Date not booked"');
					failedMessage.message = "Please Try Again";
					res.send(failedMessage);
				}
    		} else {
    			console.log('bookDate------------->>>>"user not found"');
    			failedMessage.message = "User Not Approved By Admin";
    			res.send(failedMessage);
    		}
    	} catch (e) {
    		console.log('bookDate:::::::::>>>>e: ',e);
    		failedMessage.message = "Something went wrong";
    		res.send(failedMessage)
    	}
    }

    module.viewDate = async (req, res) => {
    	var successMessage = { status: 'success', message:"", data:{}};
    	var failedMessage = { status: 'fail', message:"", data:{}};
    	try {	
    		let userId = mongoose.Types.ObjectId(req.body.userId);
    		let token = req.headers.token;
    		let dateId = mongoose.Types.ObjectId(req.body.dateId);

    		let userDetails = await model.User.findOne({_id: userId, isDeleted: false, isVerified: true, status: 'accept', loginToken: token});
    		if (userDetails) {
    			if (!userDetails.isActive) {
					failedMessage.message = "You Have Been Blocked By Admin";
					return res.send(failedMessage);
				}

				let query = [
					{
                		$match: {
	                        _id: dateId,
	                        $or: [{initUserId: userId},{initOppId: userId}],
		                }
			        },
			        {
		                $lookup: {
	                        from: 'users',
	                        localField: 'initUserId',
	                        foreignField: '_id',
	                        as: 'senderData'
		                }
			        },
			        {
			            $unwind: '$senderData'
		            },
			        {
		                $lookup: {
	                        from: 'users',
	                        localField: 'initOppId',
	                        foreignField: '_id',
	                        as: 'receiverData'
		                }
			        },
			        {
			            $unwind: '$receiverData'
		            },
			        {
		                $lookup: {
	                        from: 'locations',
	                        localField: 'locationId',
	                        foreignField: '_id',
	                        as: 'locationData'
		                }
			        },
			        {
			            $unwind: '$locationData'
		            },
		            {
	                	$project: {
	                        _id:1,
	                        'senderId':'$senderData._id',
	                        'senderName':'$senderData.username',
	                        'senderProfilePic': '$senderData.profilePic',
	                        'receiverId':'$receiverData._id',
	                        'receiverName':'$receiverData.username',
	                        'reciverProfilePic': '$receiverData.profilePic',
	                        locationName:'$locationData.name',
	                        location:1,
	                        locationAddress:1,
	                        locationPrice: '$locationData.price',
	                        totalPrice:1,
	                        status:1
	                    }
	                }
				];

				let dateDetails = await model.Dates.aggregate(query);
				console.log('viewDate--------->>>dateDetails: ',dateDetails);
				if (dateDetails && dateDetails.length) {
					successMessage.message = "Date Details Loaded Successfully";
					successMessage.data = dateDetails[0];
					res.send(successMessage);
				} else {
					failedMessage.message = "Date Details Not Found Or You Don't Have The Permission To View This Date";
					res.send(failedMessage);
				}
    		} else {
    			console.log('viewDate----------->>"user not found"');
    			failedMessage.message = "You Do Not Have Permission To View This Date";
    			res.send(failedMessage);
    		}
    	} catch (e) {
    		console.log('viewDate::::::::::>>>e: ',e);
    		failedMessage.message = "Something went wrong";
    		res.send(failedMessage);
    	}
    }

    module.approveDate = async(req, res) => {
    	var successMessage = { status: 'success', message:"", data:{}};
    	var failedMessage = { status: 'fail', message:"", data:{}};
    	try {
    		let userId = req.body.userId;
    		let dateId = req.body.dateId;
    		let token = req.headers.token;
    		let isApprove = req.body.isApprove;

    		let userDetails = await model.User.findOne({_id: userId, isDeleted: false, status: 'accept', loginToken: token, isVerified: true});
    		if (userDetails) {
    			if (!userDetails.isActive) {
					failedMessage.message = "You Have Been Blocked By Admin";
					return res.send(failedMessage);
				}
				let dateDetails = await model.Dates.findOne({_id: dateId});
				console.log('dateDetails: ',dateDetails);
				if (dateDetails) {
					if (dateDetails.status != 'pending' || dateDetails.isApproved) {
						if (dateDetails.status == 'accepted') {
							failedMessage.message = "Date Already Approved";
						} else {
							failedMessage.message = "Date Already Cancelled";
						}
						return res.send(failedMessage);
					}

					if (dateDetails.crtOppId.toString() != userId.toString()) {
						failedMessage.message = "You Are Not Eligible To Approve This Date";
						return res.send(failedMessage);
					}

					if (isApprove == 1) {
						let upData = {
							isApproved: true
						}
						await model.Dates.updateOne({_id: dateId},upData);
						let notiData = {
							senderId: userDetails._id,
							receiverId: dateDetails.crtUserId,
							type: 'date',
							text: "Congratulations!! Your Request For Date Has Been Approved",
							contentId: dateDetails._id,
							createdAt: new Date(),
							updatedAt: new Date()
						};
						await model.UserNotification.create(notiData);
						helper.sendNotiCount(model, userDetails._id);
						
						let passwordOtp = helper.randomNumber(6);
						let md5Password = md5(passwordOtp);
						let paymentId = helper.enc(md5Password, dateDetails._id.toString());


						let email1 = userDetails.email;
						let username1 = userDetails.username;
						let email2 = '';
						let username2 = '';

						let user2Id = (userId.toString() == dateDetails.initUserId.toString()) ? dateDetails.initOppId.toString() : dateDetails.initUserId.toString();

						let user2Details = await model.User.findOne({_id: user2Id},{email:1,username:1});

						if (user2Details) {
							email2 = user2Details.email;
							username2 = user2Details.username;
						}
						
						let locationName = '';
						let locationData = await model.Location.findOne({_id: dateDetails.locationId});
						if (locationData) {
							locationName = locationData.name;
						}	

						let paymentLink = config.baseUrl+'datePayment/'+paymentId;
						let btnName = 'Pay';
						let price = '$'+parseFloat(dateDetails.totalPrice/2).toFixed(2);						
						let obj = {
							uname:username1,
							msg:'Please Click on "'+btnName+'" Button and Proceed For The Date Payment',
							price: price,
							oppName: username2,
							// location:locationName,
							location:dateDetails.locationAddress,
							dateTime: helper.formatDate(dateDetails.dateTime, 'YYYY/MM/DD HH:mm'),
							buttonName:btnName,
							baseUrl:config.baseUrl,
							paymentLink:paymentLink,
							appStoreLink:config.appStoreLink,
							playStoreLink:config.playStoreLink
						}
						let mailOptions = {
							to_email: email1,
							subject: 'Easy Date | Payment Link For Date',
							templateName: 'payment_mail_template',
							dataToReplace: obj//<json containing data to be replaced in template>
						};

						let send1 = await helper.sendTemplateMail(mailOptions);

						mailOptions.to_email = email2;
						mailOptions.dataToReplace.uname = username2;
						mailOptions.dataToReplace.oppName = username1;


						let send2 = await helper.sendTemplateMail(mailOptions);
						// let send2 = await helper.sendMail(mailOptions);
						await model.UserNotification.updateMany({contentId: dateDetails._id, isRequest: true},{isDeleted: true, updatedAt: new Date()});

						// [ Push / Email ]
						let tmUs = await model.User.findOne({_id: dateDetails.crtUserId}).select(['enabledNotifications', 'deviceType', 'deviceToken', 'username']);
						let NotificationPostData = {
							message : 'Your Request For Date Has Been Approved',
							device_type : tmUs.deviceType,
							device_token : tmUs.deviceToken,
							notification_data : {
								'senderId':userDetails._id,
								'receiverId':dateDetails.crtUserId,
								'type': 'date',
								'message' : 'Your Request For Date Has Been Approved',
							},
							notification_title : 'Date Approved'
						};
						if(tmUs.enabledNotifications.includes('date-p') == true){
							helper.pushNotification(model, NotificationPostData);
						}
						else if(tmUs.enabledNotifications.includes('date-e') == true) {
							
							// commented on 8 Dec bcz no use ======================================================== start

							// [ Email ]
							// let obj = {
							// 	uname:tmUs.username,
							// 	msg:userDetails.username + ' Like You ',
							// 	baseUrl:config.baseUrl,
							// 	buttonName: 'Please Visit Once',
							// 	appStoreLink:config.appStoreLink,
							// 	playStoreLink:config.playStoreLink
							// }
							// let mailOptions = {
							// 	to_email: tmUs.email,
							// 	subject: 'Easy Date | Like',
							// 	templateName: 'like',
							// 	dataToReplace: obj//<json containing data to be replaced in template>
							// };

							// let send1 = await helper.sendTemplateMail(mailOptions);

							// commented on 8 Dec bcz no use ======================================================== end

							console.log('Email.....');
						}


						console.log('approveDate------------>>>>send1: ',send1,' send2: ',send2);
						successMessage.message = "Date approved successfully, payment link sent your email."; 
						res.send(successMessage);
					} else {
						let upData = {
							isApproved: false,
							status:'cancelled'
						}
						await model.Dates.updateOne({_id: dateId},upData);
						let notiData = {
							senderId: userDetails._id,
							receiverId: dateDetails.crtUserId,
							type: 'date',
							text: "Your request for date has been rejected",
							contentId: dateDetails._id,
							createdAt: new Date(),
							updatedAt: new Date()
						};
						await model.UserNotification.create(notiData);
						helper.sendNotiCount(model, userDetails._id);
						await model.UserNotification.updateMany({contentId: dateDetails._id, isRequest: true},{isDeleted: true, updatedAt: new Date()});
						successMessage.message = "Date rejected";
						res.send(successMessage);
					}
				} else {	
					failedMessage.message = "Date details not found";
					res.send(failedMessage);
				}
    		} else {
    			failedMessage.message = "User data not found";
    			res.send(failedMessage);
    		}
    	} catch (e) {
    		console.log('approveDate:::::::::::::::>>>>e: ',e);
    		failedMessage.message = "Something went wrong";
    		res.send(failedMessage);
    	}
    }

    module.updateDate = async (req, res) => {
    	var successMessage = { status: 'success', message:"", data:{}};
    	var failedMessage = { status: 'fail', message:"", data:{}};
    	try {
    		let userId = req.body.userId;
    		let dateId = req.body.dateId;    		
    		let token = req.headers.token;
    		let locationId = req.body.locationId;
    		let date = req.body.date; // dd-mm-yyyy
    		let time = req.body.time; // hh:mm

    		// changes on 27 Aug 2020
    		let lat = Number(req.body.lat);
    		let long = Number(req.body.long);

			if (isNaN(lat)) {
				lat = 0;
			}
			if (isNaN(long)) {
				long = 0;
			}

    		let address = req.body.address;

    		// if(!locationId || locationId == '' || locationId == null || locationId == undefined){
    		// 	locationId = mongoose.Types.ObjectId("5e4276205d3cf6752891b077");
    		// }
    		// changes on 27 Aug 2020

    		let userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, isVerified: true, status: 'accept'});
    		let dateDetails = await model.Dates.findOne({_id: dateId, $or:[{initUserId: userId},{initOppId: userId}]});

    		if (userDetails && dateDetails) {
    			if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				if (dateDetails.dateAttemptCount >= 3) {
					failedMessage.message = "You Cannot Change The Date Further";
					return res.send(failedMessage);
				}

				if (dateDetails.isApproved) {
					failedMessage.message = "Date Has Already Approved! You Cannot Change Now";
					return res.send(failedMessage);
				}

				if (dateDetails.status == 'cancelled') {
					failedMessage.message = "Date Has Been Cancelled! You Cannot Change It Now";
					return res.send(failedMessage);
				}

				if (dateDetails.status == 'completed') {
					failedMessage.message = "Date Has Been Completed";
					return res.send(failedMessage);
				}

				let totalPrice = 0;
				// let locationDetails = await model.Location.findOne({_id: locationId/*, isDeleted: false, status: true*/});
				// console.log('updateDate--------->>>>locationDetails: ',locationDetails);
				// if (!locationDetails) {
				// 	failedMessage.message = "Location Details Not Found";
				// 	return res.send(failedMessage);
				// }

				// totalPrice += locationDetails.price;

				let dt = parseInt(date.split('-')[0]);
				let mn = parseInt(date.split('-')[1]);
				let yr = parseInt(date.split('-')[2]);
				let hr = parseInt(time.split(':')[0]);
				let mt = parseInt(time.split(':')[1]);

				console.log('updateDate----------->>>dt: '+dt+' mn: '+mn+' yr: '+yr+' hr: '+hr+' mt: '+mt);				
				let dateTime = new Date(yr, mn-1,dt,hr, mt);

				let oppId = (dateDetails.initOppId.toString() == userId) ? dateDetails.initUserId : dateDetails.initOppId;

				let obj = {
					$set: {

						crtUserId: userDetails._id,
						crtOppId: oppId,
						totalPrice: totalPrice,
						paymentStatus: 'pending',
						dateTime: dateTime,
						// locationId: locationDetails._id,
						location: {
							type: 'Point',
							coordinates: [long,lat]
						},
						locationAddress:address
					},
					$inc: {
						dateAttemptCount: 1
					}
				};
				console.log('updateDate----------->>>>obj: ',obj);
				dateId = dateDetails._id;
				let check = await model.Dates.updateOne({_id: dateId}, obj);
				if (check && check.n && check.nModified) {
						
					let notiData = {
						senderId: userDetails._id,
						receiverId: oppId,
						type: 'date',
						text: "The Date Has Been Updated",
						contentId: dateId
					};
					await model.UserNotification.create(notiData);
					helper.sendNotiCount(model, userDetails._id);
					successMessage.message = "Date Updated Successfully";
					res.send(successMessage);
				} else {
					failedMessage.failedMessage = "Date Not Updated! Please Try Again";
					res.send(failedMessage);
				}
    		} else {
    			failedMessage.message = "User Or Date Data Not Found Or You Does Not Have Permssion To Update Date";
    			res.send(failedMessage);
    		}
    	} catch(e) {
    		console.log('updateDate::::::::::::::>>>e: ',e);
    		failedMessage.message = "Something went wrong";
    		res.send(failedMessage);
    	}
    }

    module.dateHistory = async (req, res) => {
    	var successMessage = { status: 'success', message:"", data:{}};
    	var failedMessage = { status: 'fail', message:"", data:{}};
    	try {
    		let userId = req.body.userId;
    		let token = req.headers.token;
    		if (userId) {
    			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token});
    			if (userDetails) {
    				if (!userDetails.isActive) {
						failedMessage.message = "You Have Been Blocked By Admin";
						return res.send(failedMessage);
					}

					let query = [
						{
							$match: {
								$or:[{
										initUserId: userDetails._id
									},{
										initOppId: userDetails._id
									}
								]
							}
						},
						{
							$project: {
								status: 1,
								isApproved: 1,
								location: 1,
								locationAddress:1,
								totalPrice: 1,
								dateTime: 1, 
								paymentStatus: 1,
								userPaymentStatus: 1,
								oppPaymentStatus: 1,
								initUserId: 1,
								initOppId: 1,
								senderData: 1,
								receiverData: 1
							}
						},
						{
							$lookup: {
								from : 'users',
								localField: 'initUserId',
								foreignField: '_id',
								as: 'senderData'
							}
						},
						{
							$unwind: '$senderData'
						},
						{
							$lookup: {
								from: 'users',
								localField: 'initOppId',
								foreignField: '_id',
								as: 'receiverData'
							}
						},
						{
							$unwind: '$receiverData'
						},
						{
							$lookup: {
								from: 'feebacks',
								let: {dateId: '$_id', userId: userDetails._id},
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{$eq: ['$dateId','$$dateId']},
													{$eq: ['$userId','$$userId']},
													{$eq: ['$isDeleted',false]}
												]
											}
										}
									},
									{
										$project: {
											_id:1
										}
									}
								],
								as: 'feedback'
							}
						},
						{
							$project: {
								_id:1,
								initUserId:1,
								initOppId:1,
								'senderData.username':1,
								'receiverData.username':1,
								status: 1,
								feedback:1,
							}
						}
					];
					let historyData = await model.Dates.aggregate(query);
					// console.log('dateHistory-------->>>>historyData: ',historyData);
					let finalHistory = [];
					if (historyData && historyData.length) {
						for(let i = 0; i < historyData.length; i++) {
							let msg = '';
							let uname = '';
							let isSender = false;
							let feedback = historyData[i].feedback.length ? true: false;
							if (historyData[i].initUserId.toString() == userId) {
								uname = historyData[i].receiverData.username;
								isSender = true;
							} else {
								uname = historyData[i].senderData.username;
							}

							if (historyData[i].status == 'pending') {
								if (isSender) {
									msg = 'You Have Requested '+uname+' For a Date';
								} else {
									msg = uname+' Requested You For a Date';
								}
							} else if (historyData[i].status == 'completed'){
								msg = 'You Have Completed Date With '+uname;
							} else {
								msg = 'Your Date With '+uname+' Has Been Cancelled';
							}
							finalHistory.push({_id: historyData[i]._id, msg: msg, feedback: feedback, status: historyData[i].status});
						} 
					}

					successMessage.message = "Date History Loaded Successfully";
					successMessage.data = {dateList: finalHistory};
					res.send(successMessage);					
    			} else {
    				console.log('dateHistory---------->>>"User data not found"');
    				failedMessage.message = "User Not Valid";
    				res.send(failedMessages);
    			}
    		} else {
    			console.log('dateHistory---------->>>>>"userid is invalid"');
    			failedMessage.message = "Something went wrong";
    			res.send(failedMessage);
    		}
    	} catch(e) {
    		console.log('dataHistory:::::::::::::>>>e: ',e);
    		failedMessage.message = "Something went wrong";
    		res.send(failedMessage);
    	}
    }

	return module;
}
