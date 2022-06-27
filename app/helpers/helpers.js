var xlsx = require('node-xlsx').default;
var path = require('path');
var fs = require('fs');
var handlebars = require('handlebars');
var path      = require("path");
var request = require('request');
const nodemailer = require("nodemailer");
const moment = require("moment");
const randomstring = require('randomstring');
var notificationCount = 0;
var multiPlayer = 0;
var config = require('../../config/constants.js');
const apn = require('apn');
module.exports.generatePassword  = function(length){	
    var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};
module.exports.randomString  = function(length){	
	var chars = '0123456789abcdefghijklmnopqrstuvwxyz#$%^&@';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};
module.exports.customDataFormat = function(date){
    let options = {  
       // weekday: "long", year: "numeric", month: "short",  
        year: "numeric", month: "short",  
        day: "numeric", hour: "2-digit", minute: "2-digit"  
    };
    return new Date(date).toLocaleString("en-us", options);
};
module.exports.onlyTime = function(date){
    let options = {  
       hour: "2-digit", minute: "2-digit"  
    };
    return new Date(date).toLocaleString("en-us", options);
};
module.exports.onlyDate = function(date){
    let options = {  
       year: "numeric", month: "short", day: "numeric"
    };
    return new Date(date).toLocaleString("en-us", options);
};

module.exports.sendMail  = async function(data){
	try{

		let transporter = nodemailer.createTransport({
		  	service: config.mail_service,
		  	auth: {
		    	user: config.smtp_user,
		    	pass: config.smtp_pass
		  	}
		});
		
		let info = await transporter.sendMail({
		    from: config.smtp_sender_mail_id, 
		    to: data.to_email, 
		    subject: data.subject, 
		    html: data.message 
		});

		return info;
	}catch(error){
		console.log("Amazon email send error: ", error)
		return false;
	}
};

module.exports.sendDirect = function(client, event, data) {
	try {
		client.emit(event, data);
	} catch(e) {
		console.log('sendDirect:::::::::::::::: ');
	}
}

module.exports.sendToOne  = function(socketId,event,data){	
	try {
		console.log('Sent');
    	io.sockets.connected[socketId].emit(event,data);
	} catch(e) {
		console.log('sendToOne::::::::::::::>>>');
	}
};
module.exports.sendToAll  = function(event,data){	
    io.emit(event,data);
};

module.exports.sendNotiCount = async function(model, userId){
	try {
		if (userId) {
			let userDetails = await model.User.findOne({_id: userId, isDeleted: false},{socketId:1});
			if (userDetails && userDetails.socketId) {
				let nCount = await model.UserNotification.countDocuments({userId: userDetails._id, isDeleted: false});
				if (nCount) {
					sendToOne(userDetails.socketId, 'userNotification', {nCount: nCount});
				}
			}
		} 
	} catch (e) {
		console.log('sendNotiCount--------->>>e: ',e);
	}
};

// [ This Function is For Leaderboard Winning Logic Please Don't Touch ]
module.exports.leaderBoard = async function(model){
	
	console.log('\x1b[36m%s\x1b[0m','--------------------------------------- ');
	console.log('\x1b[36m%s\x1b[0m','Leaderboard Result Declaring Start..... ');

	// [ Fetch Setting ]
		let sett = await model.Setting.findOne().select(['leaderBoardWinner']);
		console.log('sett: ',sett);

	// [ Fetch Users ]
		// await model.User.updateMany({role: 'user'},{isWin: false});
		let winners = await model.User.find({'isDeleted': false, role: 'user', isActive: true, isWin: false}).select([ 
			'trustScore', 
			'trustScoreUpdatedAt',
			'username'
		]).sort({'trustScore': -1}).limit(sett.leaderBoardWinner);

		winners.sort(function(a,b){

			// [ TrustScore ]
			if (a.trustScore > b.trustScore) {
				return a - b;
			}
			// [ Same TrustScore Then - Time Wise ]
				else if(a.trustScore == b.trustScore){
				return new Date(a.trustScoreUpdatedAt) - new Date(b.trustScoreUpdatedAt);
			}
		});

	// [ Add in Leaderboard's Table & Update Status - isWin & Update Time - winUpdatedAt ]
		var months    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
		let today = new Date();
		var monthName = months[today.getMonth()]+ '-' + today.getFullYear(); // [ March-2020 ]
		let endDate = today.setMonth(today.getMonth() + 1);

		let alreadyDeclared = await model.LeaderBoard.findOne({winnerMonth:monthName});
		if(!alreadyDeclared){
			for (let i = 0; i < winners.length; i++) {
				console.log('Winner - '+i+' : ',winners[i].username);
				await model.LeaderBoard.create({
					userId : winners[i]._id,
					winnerMonth: monthName,
					endDate: endDate
				});
				await model.User.updateOne({_id: winners[i]._id},{isWin: true, winUpdatedAt: today});
			}
		} else {
			console.log("already declared winner for this month ---------------------------------- ");
		}
		console.log('\x1b[36m%s\x1b[0m','--------------------------------------- ');
};

// [ Active Offer ]
module.exports.setSubscription = async function(userId, paymentId, type, redirectToHome, model){
	
	console.log('\x1b[36m%s\x1b[0m','--------------------------------------- ');
	console.log('\x1b[36m%s\x1b[0m','Leaderboard Active Offer Start..... ');

	let username = ''
    let email = ''
    let uBenefits = {}
    const userDetails = await model.User.findOne({ _id: userId }, { username: 1, email: 1, benefits: 1 }).lean()

    if (userDetails) {
      username = userDetails.username
      email = userDetails.email
      uBenefits = (userDetails.benefits) ? userDetails.benefits : {}
    }

    if (type == 'date') {
      const paymentDetails = await model.Dates.findOne({ _id: paymentId })
      if (paymentDetails) {
        const upData = {
          updatedAt: new Date()
        }
        if (paymentDetails.initUserId.toString() == userId.toString()) {
          upData.userPaymentStatus = 'completed'

          if (paymentDetail.oppPaymentStatus == 'completed') {
            upData.paymentStatus = 'completed'
          } else {
            upData.paymentStatus = 'partial'
          }
        } else if (paymentDetails.initOppId.toString() == userId.toString()) {
          upData.oppPaymentStatus = 'completed'

          if (paymentDetail.userPaymentStatus == 'completed') {
            upData.paymentStatus = 'completed'
          } else {
            upData.paymentStatus = 'partial'
          }
        }
        await model.Dates.updateOne({ _id: paymentDetails._id }, upData)
        if (redirectToHome) {
          try {
            const userData = await model.User.findOne({ _id: userId }, { socketId: 1 })
            if (userData && userData.socketId) {
              const client = io.sockets.connected[userData.socketId].emit('redirectToHome', { status: 'success', message: 'Payment successful', data: {} })
            }
          } catch (e) {
            console.log('setSubscription::::::::::::>>>>e: ', e)
          }
        }

        // Notification logic: start
        const oppId = (userDetails._id.toString() == paymentDetails.initUserId.toString()) ? paymentDetails.initOppId : paymentDetails.initUserId
        const notiData = {
          senderId: userDetails._id,
          receiverId: oppId,
          type: 'date',
          text: 'Payment done for the date',
          contentId: paymentDetails._id
        }
        await model.UserNotification.create(notiData)
        helper.sendNotiCount(model, userDetails._id)
        // Notification logic: end
      }
    } else {
      const paymentDetails = await model.Subscription.findOne({ _id: paymentId })
      if (paymentDetails) {
        const duration = paymentDetails.duration
        const durationType = paymentDetails.durationType
        let expireAt = ''
        const dt = new Date()
        if (duration && durationType && durationType != 'none') {
          let totalDuration = 0
          if (durationType == 'monthly') {
            totalDuration = duration * 30
          } else if (durationType == 'yearly') {
            totalDuration = duration * 365
          }

          dt.setTime(dt.getTime() + totalDuration * 86400000)
          expireAt = dt
        }

        const benefits = paymentDetails.benefits
        const benefitsArray = Object.keys(benefits)

        let subBenefits = []
        for (let i = 0; i < benefitsArray.length; i++) {
          if (benefits[benefitsArray[i]]) {
            subBenefits.push(benefitsArray[i])
          }
        }

        const newData = {
          userId: userId,
          planId: paymentDetails._id,
          planType: paymentDetails.planType,
          price: paymentDetails.price,
          benefits: subBenefits,
          createdAt: new Date(),
          expireAt: expireAt,
          isSpecial: true
        }
        await model.UserSubscription.create(newData) // add entry for user subscription

        if (benefits.viewMatchedDaters) {
          uBenefits.viewMatchedDaters = benefits.viewMatchedDaters
        }
        if (benefits.chatWithDaters) {
          uBenefits.chatWithDaters = benefits.chatWithDaters
        }
        if (benefits.canDoVideoChat) {
          uBenefits.canDoVideoChat = benefits.canDoVideoChat
        }
        if (benefits.privacyEnabled) {
          uBenefits.privacyEnabled = benefits.privacyEnabled
        }
        if (benefits.turnOffAds) {
          uBenefits.turnOffAds = benefits.turnOffAds
        }
        if (benefits.unlimitedLikes) {
          uBenefits.unlimitedLikes = benefits.unlimitedLikes
        }
        if (benefits.seeMorePeople) {
          uBenefits.seeMorePeople = benefits.seeMorePeople
        }
        if (benefits.seeAllQueAns) {
          uBenefits.seeAllQueAns = benefits.seeAllQueAns
        }
        if (benefits.allAlistBasic) {
          uBenefits.allAlistBasic = benefits.allAlistBasic
        }

        console.log('setSubscription------->>>>uBenefits: ', uBenefits)

        const upData = {
          benefits: uBenefits,
          updatedAt: new Date()
        }
        await model.User.updateOne({ _id: userId }, upData) // enable the subscriptions benifits

        // Mail Sent: Start

        if (email) {
          subBenefits = subBenefits.map(function (item) {
			            switch (item) {
			                case 'viewMatchedDaters': item = 'View Matched Daters'; break
			                case 'chatWithDaters': item = 'Chat With Daters'; break
			                case 'canDoVideoChat': item = 'Can Do Video Chat'; break
			                case 'privacyEnabled': item = 'Privacy Mode Available'; break
			                case 'turnOffAds': item = 'Turn Off the Ads'; break
			                case 'unlimitedLikes': item = 'Unlimited Likes'; break
			                case 'seeMorePeople': item = 'See More Features'; break
			                case 'seeAllQueAns': item = 'See All Questions & Answers'; break
			                case 'allAlistBasic': item = 'All Alist Basic Available'; break
			                case 'increaseLikes': item = 'Increase Likes'; break
			            }
			            return item
			        })

          let duration = paymentDetails.duration
          let durationType = paymentDetails.durationType
          const planType = paymentDetails.planType
          const price = paymentDetails.price
          durationType = (durationType == 'monthly') ? 'Month' : 'Year'
          durationType = (duration = 1) ? durationType : durationType + 's'

          const plan = duration + ' ' + durationType + ' ' + planType
          var dataToReplace = {
            uname: username,
			            msg: 'Here is the payment receipt for your subscription',
			            benefits: subBenefits,
			            plan: plan,
			            price: '$' + price,
			            appStoreLink: config.appStoreLink,
			            playStoreLink: config.playStoreLink
          }
          const mailOptions = {
            to_email: email,
            subject: 'Easy Date : Payment Receipt',
            templateName: 'subscription_receipt',
            dataToReplace: dataToReplace// <json containing data to be replaced in template>
          }
          const send = await helper.sendTemplateMail(mailOptions)
        }
        // Mail Sent: End

        if (redirectToHome) {
          try {
            const userData = await model.User.findOne({ _id: userId }, { socketId: 1 })
            if (userData && userData.socketId) {
              const client = io.sockets.connected[userData.socketId].emit('redirectToHome', { status: 'success', message: 'Payment successful', data: {} })
            }
          } catch (e) {
            console.log('setSubscription::::::::::::>>>>e: ', e)
          }
        }
      }
    }
	
	console.log('\x1b[36m%s\x1b[0m','--------------------------------------- ');
};

// [ NearBy Notification ]
module.exports.nearBy = async function(model, userId, location){
		
	// [ Fetch User ]
	let nearByUsers = await model.User.find({
		_id: { $ne: userId },
		"location": {
			$near: {
			  $geometry: {
				 type: "Point" ,
				 coordinates: [ location.coordinates[0] , location.coordinates[1] ]
			  },
			}
		},
		'isDeleted': false, 
		role: 'user', 
		isActive: true, 
		isLogin: true, 
		isOnline: true
	}).sort({createdAt: 1}).limit(5).select(['socketId', 'username']);
	
	// [ Send Notification ]
	for (let i = 0; i < nearByUsers.length; i++) {
		
		// [ Add Notification - UserNotification Table ]
		let check = await model.UserNotification.find({
				senderId: userId,
				receiverId: nearByUsers[i]._id,
				type: 'onlineNotify'
			});
		let tmp = await model.User.findOne({_id: userId}).select(['username']);

		// [ Already Notification Created ]
		if(check.length > 0){
			await model.UserNotification.updateMany({
				senderId: userId,
				receiverId: nearByUsers[i]._id,
				type: 'onlineNotify'
			},{
				updatedAt: new Date()
			});
		}

		// [ Created ]
		else{
			let jsn = {
				senderId: userId,
				receiverId: nearByUsers[i]._id,
				type: 'onlineNotify',
				text: tmp.username+' is near you, Do You Want to Connect?',
				matched: false,
				isDeleted: false
			}
			await model.UserNotification.create(jsn);

			// [ Broadcast To NearBy Users ]
			let nCountR = await model.UserNotification.countDocuments({receiverId: nearByUsers[i]._id});
			var client = io.sockets.connected[nearByUsers[i].socketId];

			if (client) { 
				client.emit('userNotification', {
					'message': jsn,
					'ncount': nCountR
				});
			} else {
				"do nothing"
			}
		}
	}
};

// [ Trust Score ]
module.exports.updateTrustScore  = async function(model, userId){
	console.log('updateTrustScore-------------->>>>>>userId: ',userId);
	try{
		if (userId) {
			var query = [
				{
					$match: {
						_id: userId
					}
				},
				{
					$lookup: {
						from: 'photos',
						let: {userId: '$_id'},
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{
												$eq: ['$userId', '$$userId'],
	                                        },
	                                        {
												$eq: ['$isDeleted', false]
	                                        },
	                                        {
												$eq: ['$status', 'approved']
	                                        }
										]
									}
								}
							},
							{
								$project: {
									_id:0,
									type: 1,
									isLive: 1
								}
							}
						],
						as: 'photosData'
					}
				},
				{
					$lookup: {
						from: 'cards',
						let : {userId: '$_id'},
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{
												$eq: ['$userId','$$userId'],
												$eq: ['$isDeleted', false]
											}
										]
									}
								}
							},
							{
								$project: {
									_id: 1
								}
							}
						],
						as: 'cardsData'
					}
				},
				{
					$lookup: {
						from: 'userAnswers',
						let : {userId: '$_id'},
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{
												$eq: ['$userId','$$userId'],
												$eq: ['$isDeleted',false],
												$eq: ['$isSkipped',false]
											}
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
						as: 'userAnswerData'
					}
				},
				{
					$project: {
						email:1,
						phno:1,
						instaId:1,
						instaToken:1,
						photosData:1,
						cardsCount: {$size: '$cardsData'},
						answerCount: {$size: '$userAnswerData'}
					}
				}
			];

			var userDetail = await model.User.aggregate(query);
			if (userDetail && userDetail.length) {

				userDetail = userDetail[0];
			} else {
				userDetail = {};
			}

			let email = userDetail.email; //5
			let phno = userDetail.phno; // 5
			let instaToken = userDetail.instaToken; //5
			let cardsCount = userDetail.cardsCount; // 10
			let answerCount = userDetail.answerCount; // /50 = 5
			let photosData = userDetail.photosData; //d= 20, l= 5, v=5 

			let trustScore = 0;

			let checkObj = {
				email: false,
				phno: false,
				instaToken: false,
				cardsCount: false,
				answerCount: false,
				livePhoto: false,
				video: false,
				document: false
			};
			if (email) {
				trustScore += 5;
				checkObj.email = true;
			} 

			if (phno) {
				trustScore += 5;
				checkObj.phno = true;
			}

			if (instaToken) {
				trustScore += 5;
				checkObj.instaToken = true;
			}
			if (cardsCount) {
				trustScore += 10;
				checkObj.cardsCount = true;
			}
			if (answerCount) {
				trustScore += Math.floor(answerCount/50)*5;
				checkObj.answerCount = true;
			}
			if (photosData && photosData.length) {
				let hasLive = false;
				let hasDocument = false;
				let hasVideo = false;

				for(let i = 0; i < photosData.length; i++) {
					if (photosData[i].isLive) {
						hasLive = true;
					}
					if (photosData[i].type == 'video') {
						hasVideo = true;
					}
					if (photosData[i].type == 'document') {
						hasDocument = true;
					}
				}

				if (hasLive) {
					trustScore += 5;
					checkObj.livePhoto = true;
				}
				if (hasVideo) {
					trustScore += 5;
					checkObj.video = true;
				}
				if (hasDocument) {
					trustScore += 20;
					checkObj.document = true;
				}
			}
			let check = await model.User.updateOne({_id: userId},{trustScore: trustScore, updatedAt: new Date(),trustScoreUpdatedAt: new Date()});
			// console.log('trustScore------------->>>>>check: ',check);
		} else {
			console.log('updateTrustScore------------>>>>>"userId is invalid"');
			return false;
		}
	}catch(error){
		console.log("updateTrustScore:::::::::>>>error: ", error)
		return false;
	}
};

module.exports.sendTemplateMail = async function(data) {
	/****************************************************************************
		Description: Sends mail using template
		I/P : data = { 
				to_email: <mail id of receiver>
				subject: <subject of mail>
				templateName: <name of template i.e html file name>,
				dataToReplace: <json containing data to be replaced in template>
			}
	******************************************************************************/
	try {
		var templateName = data.templateName; //must be html file name
		var templatePath = path.join(__dirname,'..','views/template',templateName+'.html');
		var htmlData = fs.readFileSync(templatePath,'utf-8');
		var template = handlebars.compile(htmlData);
		var dataToReplace = data.dataToReplace;
		var newHtmlData = template(dataToReplace);
		
		let transporter = nodemailer.createTransport({
		  	service: config.mail_service,
		  	auth: {
		    	user: config.smtp_user,
		    	pass: config.smtp_pass
		  	}
		});
		
		 console.log('transporter------------->>>>>transporter: ',transporter);

		let info = await transporter.sendMail({
		    from: config.smtp_sender_mail_id, 
		    to: data.to_email, 
		    subject: data.subject, 
		    html: newHtmlData
		});
		// console.log('sendTemplateMail------------->>>>>info: ',info);
		return info;
	} catch (error) {
		console.log('sendTemplateMail------------->>>error: ',error);
		return false;
	}
}

module.exports.generateTransactionId  = function(length){	
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

module.exports.randomNumber  = function(length){	
    var chars = '0123456789';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

module.exports.importXls  = async function(model){	
	try{
		const sheetDataArr = xlsx.parse('./public/upload/lotpackage/import/myFile.xlsx');
		if(sheetDataArr.length > '0'){		
			for(var i=0; i<sheetDataArr.length; i++){
				if(sheetDataArr[i].data.length > 0){
					for(var j=1; j<sheetDataArr[i].data.length; j++){
						var priceDetail = sheetDataArr[i].data[j];
						let inputData = {
					        name: priceDetail[0],
					        weight: priceDetail[1],
					        image: priceDetail[2],
					        ca: priceDetail[3],
					        fr: priceDetail[4],
					        de: priceDetail[5],
					        it: priceDetail[6],
					        jp: priceDetail[7],
					        uk: priceDetail[8],
					        us: priceDetail[9],
					        status: 'active'
				      	};

				      	var priceData = await model.LotPrice.create(inputData);
					}
				}
			}
		}
	}catch(error){
		console.log('exception error: ', error);
	}
};

module.exports.getDefaultSetting  = async function(model){
	global.settings = await model.Setting.findOne();
	// global.referral_setting = await model.ReferEarnSetting.findOne().lean();
	return true;
};

module.exports.exportXls  = async function(model){	
	try{
		var priceList = await model.LotPrice.find();
		var exportDataArr = new Array();
		exportDataArr.push(['name','weight','image','ca','fr','de','it','jp','uk','uk']);
		if(priceList.length > 0){
			for(var i=0; i<priceList.length; i++){
				var priceDetail = priceList[i];
				var dataTempArr = new Array();
				dataTempArr = [priceDetail.name, priceDetail.weight, priceDetail.image, priceDetail.ca, priceDetail.fr, priceDetail.de, priceDetail.it, priceDetail.jp, priceDetail.uk, priceDetail.us];
				exportDataArr.push(dataTempArr);
			}
			var buffer = xlsx.build([{name: "lotpricepackage.xlsx", data: exportDataArr}]);

		}

		fs.writeFileSync('./public/upload/lotpackage/export/lotpricepackage.xlsx',buffer);
	}catch(error){
		console.log('exception error: ', error);
	}
};

module.exports.getUserCountryCode  = async function(model, userId){	
	try{
		var userDetail = await model.User.findById(userId).populate('country_id');
		if(userDetail != null){
			if(userDetail.country_id.country_code){
				return userDetail.country_id.country_code;
			}else{
				return 'us';
			}
		}else{
			return 'us';
		}
	}catch(error){
		console.log('exception error: ', error);
	}
};

module.exports.pushNotification = async (model, NotificationPostData) => {
	try {
		console.log('pushNotification--------->>>>>NotificationPostData: ',NotificationPostData,' '+new Date());
		let Message = NotificationPostData.message;
		if(NotificationPostData.device_type === "android" && NotificationPostData.device_token) { //disabled temporarily
			

		console.log("NotificationPostData.device_token : "+NotificationPostData.device_token);
		console.log("NotificationPostData.notification_data : ",NotificationPostData.notification_data);
		console.log("NotificationPostData.notification_title : "+NotificationPostData.notification_title);
		console.log("NotificationPostData.message : "+NotificationPostData.message);
		

			var collapseKey = 'new_message';
			var message = {
				to: NotificationPostData.device_token,
				data: NotificationPostData.notification_data,
				notification: {
					title: NotificationPostData.notification_title,
					body: NotificationPostData.message,
					tag: collapseKey,
					icon: 'ic_notification',
					color: '#18d821',					
					sound: 'default',

				},
			};


			Fcm.send(message, function(err, response){
				if (err) {
					console.log("pushNotification::::Android:::::>>>>>e: ",err)
				} else {
					if(response.failed) {
						console.log('pushNotification------Android--->>>>response.failed:', response.failed);
					}
				}
			})
		} else if(NotificationPostData.device_type === "ios" && NotificationPostData.device_token) { //disabled temporarily

			let options = {
				token: {
					key: 'config/AuthKey_DH39ASFAS4.p8', // p8key
					keyId: config.iosKeyId,
					teamId: config.iosTeamId
				},
				production: false
			};
			// console.log('pushNotification------------ios---->>>options: ',options);
			let apnProvider = new apn.Provider(options);
			
			// Replace deviceToken with your particular token:
			let deviceToken = NotificationPostData.device_token; 
			
			// Prepare the notifications
			let notification = new apn.Notification();
			notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
			notification.badge = 0;
			notification.sound = "default";
			//notification.alert = Message;
			notification.alert = NotificationPostData.notification_data.message;
			notification.payload = NotificationPostData.notification_data;
			
			notification.topic = config.iosNotificationTopic; //Bundle Id For project
			console.log('notification: ',notification);
			apnProvider.send(notification, deviceToken).then( (result, err) => {	
				if (err) {
					console.log('pushNotification:::::::IOS::::::::>>>>err:',err );
				} else {
					console.log('result hello dost: ',result);
					if (result && result.failed && result.failed.length) {
						console.log('pushNotification----IOS----->>>>>\nresult.failed: ',result.failed);
					}
				}
			});

			apnProvider.shutdown();
			// console.log('pushNotification--------->>>"apnProvider shutdown"');
		} else {
			console.log('pushNotification--------->>>>"Anonymous data"');
		}
	} catch(error) {
		console.log("Notification error", error);
	}
};

module.exports.sentMessage  = async function(url,callback){	
	var bodyData = {};
	var bodyData = await request(url, function (error, response, body) {
	  	// console.log('error:', error); // Print the error if one occurred
	  	// console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
	  	// console.log('body:', response.body); // Print the HTML for the Google homepage.
		callback(response.body);	  
	});	
};

module.exports.updateLocation  = async function(model,url,data,callback){	
	var bodyData = {};
	var bodyData = await request(url,async function(error, response, body) {
	  	console.log('error:', error); // Print the error if one occurred
	  	console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
	  	console.log('body:', response.body); // Print the HTML for the Google homepage.
	  	var obj = response.body;
	  	// var obj = JSON.parse(response.body);
		if(obj.Response['View']!=undefined && obj.Response['View'][0].Result[0].Location.Address.PostalCode){
			await model.User.updateOne({_id:data._id},{"city":obj.Response['View'][0].Result[0].Location.Address.District,'post_code':obj.Response['View'][0].Result[0].Location.Address.PostalCode});
		}
		callback(response.body);	  
	});	
};


module.exports.updateCity  = async function(model,url,callback){	
	var bodyData = {};
	console.log(url);
	var bodyData = await request(url,async function(error, response, body) {
	  	console.log('error:', error); // Print the error if one occurred
	  	console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
	  	var obj = JSON.parse(response.body);
	  	console.log('updateCity body:', obj.results[0].address_components); // Print the HTML for the Google homepage.
	  	var city = "";
	  	if(response.statusCode == 200){
		  	for (var i = obj.results[0].address_components.length - 1; i >= 0; i--) {
		  		if(obj.results[0].address_components[i].types[0]=="administrative_area_level_2"){
		  			console.log("administrative_area_level_2",obj.results[0].address_components[i].long_name);
		  			city = obj.results[0].address_components[i].long_name;
		  		}
		  		if(city!=undefined && city!=null && city!=""){
		  			break;
		  		}
		  	}
		  	if(city == undefined || city==null || city!=""){
			  	for (var i = obj.results[0].address_components.length - 1; i >= 0; i--) {
			  		if(obj.results[0].address_components[i].types[0]=="postal_town"){
			  			console.log("postal_town",obj.results[0].address_components[i].long_name);
			  			city = obj.results[0].address_components[i].long_name;
			  		}
			  		if(city!=undefined && city!=null && city!=""){
			  			break;
			  		}
			  	}
		  	}
	  	}
		/*if(obj.results[0].address_components[1].long_name){
			var city = obj.results[0].address_components[1].long_name;
		}else{
			var city =  obj.results[0].address_components[1].long_name;
		}*/
		if(city == 'greater london'){
			city = 'city of london';			
		}

		callback({status:"success",data:city});	  
	});	
};

module.exports.refundAmountStripe  = async function(model,data,callback){	
	console.log("Stripe Refund Process:::::: Start")

	CronCancel.log({
        level: 'error',
        time: "Helper_Refund_Strip_"+moment().format("YYYY-MM-DD HH:mm:ss"),
        message: {'Helper_Refund_Strip_':data}
    });

	var total_amount = (data.total_amount*100);
	await stripe.refunds.create({
		  charge: data.stripe_charge_id,
		  amount: total_amount,
		  reason:"requested_by_customer",
		  reverse_transfer:false
	}, function(err, refund) {
		if(err){
			CronCancel.log({
		        level: 'error',
		        time: "Helper_Refund_Strip_Error_"+moment().format("YYYY-MM-DD HH:mm:ss"),
		        message: {'Helper_Refund_Strip_Error_':err}
		    });
			console.log("Stripe Refund Process:::::: Error")
			return callback({"status":"fail","message":err.message,data:err});
		  	console.log("accountD:::",err);
		}else{
			CronCancel.log({
		        level: 'error',
		        time: "Helper_Refund_Strip_Success_"+moment().format("YYYY-MM-DD HH:mm:ss"),
		        message: {'Helper_Refund_Strip_Refund_':refund}
		    });
			
		  	// console.log("accountD:::",refund);
			console.log("Stripe Refund Process:::::: end 1")
			return callback({"status":"success","message":"Refund Data Successfully.",data:refund});
		}
	});

};

module.exports.refundAmount  = async function(model,data,callback){	
	
	CronCancel.log({
        level: 'error',
        time: "Helper_Refund_Wallet_"+moment().format("YYYY-MM-DD HH:mm:ss"),
        message: {'Helper_Refund_Wallet_':data}
    });

	var userDetail = await model.User.findById(data.user_id);
	if(userDetail != ""){
		var wallet = await model.UserWallet.findOne({"user_id":data.user_id,"country_code":'uk'})
		console.log("Get New wallet:",wallet);
		if(wallet != null){
			var RefundAmt =  parseFloat(wallet.money)+parseFloat(data.amount);
			console.log("RefundAmt",RefundAmt);
			await wallet.updateOne({"money":RefundAmt});
			return callback({"status":"success","message":"Refund Data Successfully."});
			
		}else{
			var PostData = {"user_id":data.user_id,"country_code":'uk',"money":parseFloat(data.amount)};
			console.log("Create New wallet:",PostData);
			var wallet = await model.UserWallet.create(PostData);
			return callback({"status":"success","message":"Refund Data Successfully."});
		}
	}else{
		return callback({"status":"fail","message":"Refund Data Successfully."});
	}	
};

/*Start Dev*/
module.exports.convertHourMinutSecondToMili = function(startDate,endDate){ 	
	//Start Timer
	return getDiffTim(startDate,endDate);
}
function getDiffTim(startDate,endDate){
	// console.log("start ......."+startDate +"End Tiner"+endDate);
	var startTime = new Date(startDate);
	var endTime = new Date(endDate); 	
	let startHours = parseInt(startTime.getHours());
	let startMinit = parseInt(startTime.getMinutes());
	let startSecond = parseInt(startTime.getSeconds());
	let startMiniSecond = (startHours*60*60+startMinit*60+startSecond)*1000;


	//End Time
	let endHours = parseInt(endTime.getHours());
	let endMinit = parseInt(endTime.getMinutes());
	let endSecond = parseInt(endTime.getSeconds());
	let endMiniSecond = (endHours*60*60+endMinit*60+endSecond)*1000;
	
	//Get Diff
	let diffTimer = endMiniSecond - startMiniSecond;
	
	return diffTimer;
}

module.exports.timeDifference = function(startDate, endDate, type){
	if (startDate && endDate) {
		let diff = endDate - startDate;

		if (isNaN(diff)) {
			return 0;
		}

		switch(type) {
			case 'day': return diff/86400000;
			case 'hour': return diff/3600000;
			case 'minute': return diff/60000;
			case 'seconds': return diff/1000;
			default: return diff;
		}
	} else {
		return 0;
	}
}

module.exports.checkSession = function(email,password){	
	
	var SessionData = [];
	var file_name ='';
	var userData=[];
	var checkStatus =false;
	var pathfilec = path.join(__dirname,'../','../','sessions');	
	var countfile=0;
	var timeDiffer=0;
	fs.readdirSync(pathfilec)
	.filter(file => ~file.search(/^[^\.].*\.json$/))
	.forEach(function(file) {		
		var sessiondata = SessionData[file.split('.')[0]] = require(path.join(pathfilec, file))			
		if(countfile == 0){				
			if(sessiondata.userSessionData != undefined  && sessiondata.admin._id != undefined){
				if((sessiondata.admin.email == email && sessiondata.admin.password == password) && sessiondata.userSessionData.status == true){						
					var diffTimer  = getDiffTim(sessiondata.userSessionData.start_sessionDate,sessiondata.cookie.expires);
					
					if(diffTimer <= 3600000){
						file_name = path.basename(file,path.extname(file));			
						userData = sessiondata;																		
						countfile =1;				
						checkStatus = true;
						timeDiffer=diffTimer;
					}			 			
				}
			}											
		}			
	});	
	let returnData = {
		sessionData:userData,
		fileName:file_name,
		checkStatus:checkStatus,
		timeDiffer:timeDiffer		
	}
	return returnData;
};

module.exports.enc = function(pswd, id) {
	var temp = '';
	// console.log('enc------>>>pswd: ',pswd.length,' id: ',id.length);
	if (pswd && pswd.length == 32 && id && id.length == 24) {

		var dt = new Date();

		var k = 0;
		for (let i = 0; i < 3; i++) {
			temp += pswd.substr(k,8)+id.substr(k,8);
			k += 8;
		}
		temp += pswd.substr(k,8);
		temp += dt.getTime();
		temp = temp.toUpperCase();
	}

	return temp;
}

module.exports.dec = function(txt) {
	var obj = null;
	if (txt && txt.length > 66) {
		var id = '';
		var pswd = '';
		var time = '';
		
		txt = txt.toLowerCase();
		var k = 0;
		var check = 0;
		for (let i = 0; i < 7 ; i++) {
			if (check == 1) {
				id += txt.substr(k,8);
				check = 0;
			} else {
				pswd += txt.substr(k,8);
				check = 1;
			}
			k += 8;
		}
		time += txt.substr(k);
		
		obj = {
			id: id,
			pswd: pswd,
			time: time
		};
	}

	return obj;
}


module.exports.getTimeDiff = function(start, end, type) {
	var diff = end - start;

	if (type == 'day') {
		diff = Math.floor(diff/1000/60/60/24);
	} else if (type == 'hour') {
		diff = Math.floor(diff/1000/60/60);
	} else if (type == 'minute') {
		diff = Math.floor(diff/1000/60);
	} else {
		diff = Math.floor(diff/1000);
	}
	return diff;
}



var degreeToRadian = function(degree){
	return degree * 0.017444444;
}

module.exports.getDistance = function(lat1, lon1, lat2, lon2, unit) {	
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	} else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
};

module.exports.getDisplacement = function(lat1,lon1,lat2,lon2){
	var R = 6371; // metres
	var φ1 = degreeToRadian(lat1);
	var φ2 = degreeToRadian(lat2);
	var Δφ = degreeToRadian(lat2-lat1);
	var Δλ = degreeToRadian(lon2-lon1);

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	        Math.cos(φ1) * Math.cos(φ2) *
	        Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var d = R * c;

	return d;
}

module.exports.timeConvert = function (time, numToString) {
	if (numToString) {
		
		let hour = Math.floor(time/60)%24;
		let minute = time%60;

		hour = hour < 10 && hour > 0 ? '0'+hour : hour;
		hour = hour ? hour : '00';

		minute = minute < 10 && minute > 0 ? '0'+minute : minute;
		minute = minute ? minute : '00';

		return hour+':'+minute;
	} else {
		let timeSplit = time.split(':');

		if (timeSplit.length != 2) {
			return 0;
		}

		let hour = parseInt(timeSplit[0]);
		let minute = parseInt(timeSplit[1]);

		return hour*60 + minute;
	}
}

module.exports.getCurrency = function (code) {
	let url = 'https://restcountries.eu/rest/v2/callingcode/'+code;

	return new Promise(function(resolve, reject){
		request(url, function(err, resp, body) {
			try {
				if (body) {
					body = JSON.parse(body);
					if (body.length && body[0].currencies && body[0].currencies.length && body[0].currencies[0]) {
						resolve(body[0].currencies[0]);
					} else {
						resolve({code: 'GBP', name: "British pound", symbol: '£'});
					}
				} else {
					resolve({code: 'GBP', name: "British pound", symbol: '£'});
				}
			} catch (e) {
				resolve({code: 'GBP', name: "British pound", symbol: '£'});
			}
		});
	});
}

module.exports.formatDate = function(date, format) {
	return moment(date).format(format);
}

module.exports.randomOnlyNumber  = function(length){    
    var chars = '0123456789';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

module.exports.getRandomFloat = function(min, max) {
    var float_val = Math.random() * (max - min) + min;
    return float_val.toFixed(2);
};

module.exports.IsJsonString = function (str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

//match points calculations start
var getAgePoints = function(age1, age2, min1, max1, min2, max2) {
	let pt1 = 0; //10%
	let pt2 = 0; //10%
	
	if (min1 > 0 && max1 > 0 && age2 >= min1 && age2 <= max1)  {
		let maxDiff = Infinity;
		let revDiff = 0;
		if (age1 > age2) {
			if (age1 < max1) {
 				maxDiff = age1 - (min1 - 1);
 				revDiff = age2 - (min1 - 1);
			} else { //age1 >= max1
				maxDiff = max1 - (min1 - 1);
				revDiff = age2 - (min1 - 1);
			}
			pt1 = Math.round(revDiff * 10 / maxDiff);
		} else if (age1 < age2) {
			if (age1 > min1) {
				maxDiff = max1 - age1 + 1;
				revDiff = max1 - age2 + 1;
			} else { //age1 <= min1
				maxDiff = max1 - min1 + 1;
				revDiff = max1 - age2 + 1;
			}
			pt1 = Math.round(revDiff * 10 / maxDiff);
		} else {
			pt1 = 10;
		}
	}
	if (min2 > 0 && max2 > 0 && age1 >= min2 && age1 <= max2)  {
		let maxDiff = Infinity;
		let revDiff = 0;
		if (age2 > age1) {
			if (age2 < max2) {
 				maxDiff = age2 - (min2 - 1);
 				revDiff = age1 - (min2 - 1);
			} else { //age2 >= max2
				maxDiff = max2 - (min2 - 1);
				revDiff = age1 - (min2 - 1);
			}
			pt2 = Math.round(revDiff * 10 / maxDiff);
		} else if (age2 < age1) {
			if (age2 > min2) {
				maxDiff = max2 - age2 + 1;
				revDiff = max2 - age1 + 1;
			} else { //age2 <= min2
				maxDiff = max2 - min2 + 1;
				revDiff = max2 - age1 + 1;
			}
			pt2 = Math.round(revDiff * 10 / maxDiff);
		} else {
			pt2 = 10;
		}
	}
	return (pt1 + pt2);
}

module.exports.getAge = function (date) {

	try {
		if (!date) {
			return 0;
		}
		let yr1 = date.getFullYear(); //1994
		let mt1 = date.getMonth() + 1; //3
		let dt1 = date.getDate(); //17

		let dt = new Date();
		let yr2 = dt.getFullYear();
		let mt2 = dt.getMonth() + 1;
		let dt2 = dt.getDate();

		if (dt2 < dt1) {
			dt2 += 30;
			mt2 -= 1;
		}

		if (mt2 < mt1) {
			mt2 += 12;
			yr2 -= 1;
		}
		let age = yr2 - yr1;
		return age;

	} catch (e) {
		console.log('getAge:::::::::::>>>e: ',e);
		return 0		
	}
}

getAge = function (date) {

	try {
		let yr1 = date.getFullYear(); //1994
		let mt1 = date.getMonth() + 1; //3
		let dt1 = date.getDate(); //17

		let dt = new Date();
		let yr2 = dt.getFullYear();
		let mt2 = dt.getMonth() + 1;
		let dt2 = dt.getDate();

		if (dt2 < dt1) {
			dt2 += 30;
			mt2 -= 1;
		}

		if (mt2 < mt1) {
			mt2 += 12;
			yr2 -= 1;
		}
		let age = yr2 - yr1;
		return age;

	} catch (e) {
		console.log('getAge:::::::::::>>>e: ',e);
		return 0		
	}
}

var getZodiacMatchPoints = function (sign1, sign2) {

	let points = {
		Aries: {
			Aries: 23,
			Taurus: 21,
			Gemini: 24,
			Cancer: 20,
			Leo: 27,
			Virgo: 18,
			Libra: 26,
			Scorpio: 18,
			Sagittarius: 27,
			Capricorn: 20,
			Aquarius: 24,
			Pisces: 21
		},
		Taurus: {
			Aries: 21,
			Taurus: 23,
			Gemini: 21,
			Cancer: 24,
			Leo: 20,
			Virgo: 27,
			Libra: 18,
			Scorpio: 26,
			Sagittarius: 18,
			Capricorn: 27,
			Aquarius: 20,
			Pisces: 24
		},
		Gemini: {
			Aries: 24,
			Taurus: 21,
			Gemini: 23,
			Cancer: 21,
			Leo: 24,
			Virgo: 20,
			Libra: 27,
			Scorpio: 18,
			Sagittarius: 26,
			Capricorn: 18,
			Aquarius: 27,
			Pisces: 20
		},
		Cancer: {
			Aries: 20,
			Taurus: 24,
			Gemini: 21,
			Cancer: 23,
			Leo: 21,
			Virgo: 24,
			Libra: 20,
			Scorpio: 27,
			Sagittarius: 18,
			Capricorn: 26,
			Aquarius: 18,
			Pisces: 27
		},
		Leo: {
			Aries: 27,
			Taurus: 20,
			Gemini: 24,
			Cancer: 21,
			Leo: 23,
			Virgo: 21,
			Libra: 24,
			Scorpio: 20,
			Sagittarius: 27,
			Capricorn: 18,
			Aquarius: 26,
			Pisces: 18
		},
		Virgo: {
			Aries: 18,
			Taurus: 27,
			Gemini: 20,
			Cancer: 24,
			Leo: 21,
			Virgo: 23,
			Libra: 21,
			Scorpio: 24,
			Sagittarius: 20,
			Capricorn: 27,
			Aquarius: 18,
			Pisces: 26
		},
		Libra: {
			Aries: 26,
			Taurus: 18,
			Gemini: 27,
			Cancer: 20,
			Leo: 24,
			Virgo: 21,
			Libra: 23,
			Scorpio: 21,
			Sagittarius: 24,
			Capricorn: 20,
			Aquarius: 27,
			Pisces: 18
		},
		Scorpio: {
			Aries: 18,
			Taurus: 26,
			Gemini: 18,
			Cancer: 27,
			Leo: 20,
			Virgo: 24,
			Libra: 21,
			Scorpio: 23,
			Sagittarius: 21,
			Capricorn: 24,
			Aquarius: 20,
			Pisces: 27
		},
		Sagittarius: {
			Aries: 27,
			Taurus: 18,
			Gemini: 26,
			Cancer: 18,
			Leo: 27,
			Virgo: 20,
			Libra: 24,
			Scorpio: 21,
			Sagittarius: 23,
			Capricorn: 21,
			Aquarius: 24,
			Pisces: 20
		},
		Capricorn: {
			Aries: 20,
			Taurus: 27,
			Gemini: 18,
			Cancer: 26,
			Leo: 18,
			Virgo: 27,
			Libra: 20,
			Scorpio: 24,
			Sagittarius: 21,
			Capricorn: 23,
			Aquarius: 21,
			Pisces: 24
		},
		Aquarius: {
			Aries: 24,
			Taurus: 20,
			Gemini: 27,
			Cancer: 18,
			Leo: 26,
			Virgo: 18,
			Libra: 27,
			Scorpio: 20,
			Sagittarius: 24,
			Capricorn: 21,
			Aquarius: 23,
			Pisces: 21
		},
		Pisces: {
			Aries: 21,
			Taurus: 24,
			Gemini: 20,
			Cancer: 27,
			Leo: 18,
			Virgo: 26,
			Libra: 18,
			Scorpio: 27,
			Sagittarius: 20,
			Capricorn: 24,
			Aquarius: 21,
			Pisces: 23
		}
	}


	if (points[sign1] && points[sign1][sign2]) {
		return points[sign1][sign2];
	} else {
		return 0;
	}
}

module.exports.calculateMatchPoints = async function (model, userId1, userId2) {
	var userDetail1 = await model.User.findOne({_id: userId1});
	var userDetail2 = await model.User.findOne({_id: userId2});

	if (userDetail1 && userDetail2) {
		let agePoints = 0; // 20
		let zodiacPoints = 0; //30
		let quePoints = 0; //50

		let age1 = userDetail1.dob ? getAge(userDetail1.dob) : 0;
		let age2 = userDetail2.dob ? getAge(userDetail2.dob) : 0;
		let minAge1 = (userDetail1.idealInfo) ? userDetail1.idealInfo.minAge : 0;
		let maxAge1 = (userDetail1.idealInfo) ? userDetail1.idealInfo.maxAge : 0;
		let minAge2 = (userDetail2.idealInfo) ? userDetail2.idealInfo.minAge : 0;
		let maxAge2 = (userDetail2.idealInfo) ? userDetail2.idealInfo.maxAge : 0;

		let sign1 = userDetail1.zodiacSign ? userDetail1.zodiacSign : '';
		let sign2 = userDetail2.zodiacSign ? userDetail2.zodiacSign : '';


		agePoints = getAgePoints(age1, age2, minAge1, maxAge1, minAge2, maxAge2);
		zodiacPoints = getZodiacMatchPoints(sign1, sign2);

		let userAnswers1 = await model.UserAnswer.find({userId:userDetail1._id, isDeleted:false,isSkipped:false},{queId:1,ans:1,oppAns:1});
		let userAnswers2 = await model.UserAnswer.find({userId:userDetail2._id, isDeleted:false,isSkipped:false},{queId:1,ans:1,oppAns:1});

		if (userAnswers1 && userAnswers1.length && userAnswers2 && userAnswers2.length) {
			let totalPoints = 0;
			let matchPoints = 0;
			for (let i = 0; i < userAnswers1.length; i++) {
				for (let j = 0; j < userAnswers2.length; j++) {
					if (userAnswers1[i].queId.toString() == userAnswers2[j].queId.toString()) {
						totalPoints += 2;

						if (userAnswers1[i].oppAns.indexOf(userAnswers2[j].ans) != -1) {
							matchPoints++;
						}
						if (userAnswers2[j].oppAns.indexOf(userAnswers1[i].ans) != -1) {
							matchPoints++;
						}
						break;
					}
				}
			}
			totalPoints = totalPoints ? totalPoints : Infinity;

			quePoints = Math.round(matchPoints * 50 / totalPoints);
		} 
		// console.log('totalMatchPoints-------->>>agePoints: '+agePoints+' zodiacPoints: '+zodiacPoints+' quePoints: '+quePoints)
		let totalMatchPoints = agePoints + zodiacPoints + quePoints;
		return totalMatchPoints;
	} else {
		return 0;
	}
}
//match points calculations end


module.exports.getTimerForFree = async function (model, userId) {
	let obj = {
		isExpired: false,
		purchasePlan: true,
		timer: 0
	};
	try {
		if (userId) {
			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user'},{createdAt: 1});
			if (userDetails) {
				let dt = new Date();
				let diff = this.getTimeDiff(userDetails.createdAt, dt,'day');

				let runningPlanCount = await model.UserSubscription.countDocuments({userId: userDetails._id, isExpired: false, isDeleted: false, isSpecial: false});
				if (runningPlanCount) {
					obj = {
						isExpired: false,
						purchasePlan: false,
						timer: 0
					}
				} else {
					if (diff <= 3) {
						diff = this.getTimeDiff(userDetails.createdAt, dt);

						obj = {
							isExpired: false,
							purchasePlan: false, 
							timer: diff
						}
					} else {
						let expiredPlan = await model.UserSubscription.find({userId: userDetails._id, isExpired: true, isDeleted: false, isSpecial: false},{expireAt:1}).sort({expireAt: -1}).limit(1);
						if (expiredPlan && expiredPlan.length) {
							obj = {
								isExpired: true,
								purchasePlan: true,
								timer: 0
							};
						} else {
							obj = {
								isExpired: false,
								purchasePlan: true,
								timer: 0
							};
						}
					}
				}
			} else {
				console.log('getTimerForFree--------->>>>"user details not found"');
			}
		} else {
			console.log('getTimerForFree------------->>>>"user id is invalid"');
		}
		return obj;
	} catch (e) {
		console.log('getTimerForFree:::::::::::::>>>e: ',e);
		return obj;
	}
}

module.exports.discoverFeeds = async function(model, userId) {
	try {
		if (typeof userId == 'string') {

			userId = mongoose.Types.ObjectId(userId);
		}

		let likeIds = await model.Like.distinct('receiverId',{senderId: userId, isDeleted: false});
		let dislikeIds = await model.Dislike.distinct('receiverId',{senderId: userId, isDeleted: false});
		let blockedIds = await model.Block.distinct('receiverId',{senderId: userId, isDeleted: false, isBlocked: true});
		let blockedByIds = await model.Block.distinct('senderId',{receiverId: userId, isDeleted: false, isBlocked: true});
		let invalidIds = [...likeIds, ...dislikeIds, ...blockedIds, ...blockedByIds, userId];

		var query = [
		    {
		    	$match : {
		    		_id :{$nin: invalidIds},
		    		isDeleted: false,
		    		isActive: true,
		    		role: 'user'
		    	}
		    },
		    {
				$lookup: {
				    from : 'instaFeeds',
				    let: {instaId: '$instaId'},
				    pipeline: [
				        {
				            $match: {
								$expr: {
									$and: [
										{$eq: ['$instaId','$$instaId']},
										{$eq: ['$parentMediaId','']}
									]
								}
				            }
				        },
				        {
				            $sort: {createdAt: -1},
				        },
				        {
				            $limit: 4
				        },
				        {
				            $project: {
				                instaUsername:1,
				                instaId:1,
				                mediaType:1,
				                mediaUrl:1
				            }
				        }
				    ],
				    as: 'instaData'
				}
		    },
		    {
				$project: {
					userId: '$_id',
					username: '$username',
					address: {$concat: ['$city',', ','$state',', ','$country']},
					profilePic: '$profilePic',
					instaData:1,
					feedCount: {$size: '$instaData'}
				}
		    },
		    {$match: {feedCount: {$gt: 0}}}
		];

		let instaFeeds = await model.User.aggregate(query);
		// console.log('discoverFeeds---->>>>instaFeeds: ',instaFeeds);
		return instaFeeds;
	} catch(e) {
		console.log('discoverFeeds::::::::::::>>>>"something went wrong" e: ',e);
		return [];
	}
}	

module.exports.getFriendsFeeds = async function(model, userId) {
	try {
		if (typeof userId == 'string') {

			userId = mongoose.Types.ObjectId(userId);
		}

		var query = [
		    {
				$match: {
				    $or: [{senderId: userId},{receiverId: userId}],
				    matched: true,
				    isDeleted: false
				}
		    },
		    {
				$addFields: {oppId: {$cond: [{$eq: ['$senderId',userId]},'$receiverId','$senderId']}}
		    },
		    {
				$lookup: {
				    from: 'users',
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
				            $project:{
			                    _id: 1,
			                    instaId: 1,
			                    country:1,
			                    state:1,
			                    city: 1,
			                    profilePic:1,
			                    username:1
				            }
				        }
				    ],
				    as: 'oppData',
				}
		    },
		    {
				$unwind: '$oppData',
		    },
		    {
				$lookup: {
				    from : 'instaFeeds',
				    let: {instaId: '$oppData.instaId'},
				    pipeline: [
				        {
				            $match: {
								$expr: {
									$and: [
										{$eq: ['$instaId','$$instaId']},
										{$eq: ['$parentMediaId','']}
									]
								}
				            }
				        },
				        {
				            $sort: {createdAt: -1},
				        },
				        {
				            $limit: 4
				        },
				        {
				            $project: {
				                instaUsername:1,
				                instaId:1,
				                mediaType:1,
				                mediaUrl:1
				            }
				        }
				    ],
				    as: 'instaData'
				}
		    },
		    {
				$project: {
					userId: '$oppData._id',
					username: '$oppData.username',
					address: {$concat: ['$oppData.city',', ','$oppData.state',', ','$oppData.country']},
					profilePic: '$oppData.profilePic',
					instaData:1,
					feedCount: {$size: '$instaData'}
				}
		    },
		    {$match: {feedCount: {$gt: 0}}}
		];

		let instaFeeds = await model.Like.aggregate(query);
		// console.log('getFriendsFeeds---->>>>instaFeeds: ',instaFeeds);
		return instaFeeds;
	} catch(e) {
		console.log('getFriendsFeeds::::::::::::>>>>"something went wrong" e: ',e);
		return [];
	}
}

module.exports.checkNotiPermission = async function (userId, notiKey) {
	try {
		if (!userId || !notiKey){
			console.log('checkNotiPermission------->>>userId or notiKey is invalid');
			return false;
		}

		let userDetails = await model.User.findOne({_id: userId, role: 'user', isDeleted: false, isActive: true},{enabledNotifications: 1,disabledNotifications:1});
		if (userDetails) {
			let notiData = await model.Notification.findOne({slug: notiKey, isActive: true},{slug:1, byDefault: 1});
			if (notiData) {
				let enabledNotifications = userDetails.enabledNotifications;
				let disabledNotifications = userDetails.disabledNotifications;
				if (!enabledNotifications) {
					enabledNotifications = [];
				}
				if (!disabledNotifications) {
					disabledNotifications = [];
				}
				let check = false;
				if (notiData.byDefault) {
					if (disabledNotifications.indexOf(notiData.slug) > -1) {
						check = false;
					} else {
						check = true;
					}
				} else {
					if (enabledNotifications.indexOf(notiData.slug) > -1) {
						check = true;
					} else {
						check = false;
					}
				}

				return check;
			} else {
				console.log('checkNotiPermission-------->>>>noti data not found');
				return false;
			}
		} else {
			console.log('checkNotiPermission-------->>>user data not found');
			return false;
		}

	} catch (e) {
		console.log('checkNotiPermission::::::::::>>>e: ',e);
		return false;
	}
}
/*End Dev*/