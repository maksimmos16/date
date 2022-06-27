var dateformat = require('dateformat');
var currentDate = new Date();
var md5 = require('md5');
var jwt = require('jsonwebtoken');

module.exports = function(model,config){
	var module = {};
	var checkScreen = async(userDetails) => {
		let screens = [
			'name', 
			'birth', 
			'gender', 
			'lifeStyle', 
			'idProof',
			'connection',
			'photo',
			'queAns',
			'home'
		]
		let screen = screens[0];
		if (userDetails) {
			if (userDetails.firstName && userDetails.lastName && userDetails.username && userDetails.email) {
				if (userDetails.dob) {
					if (userDetails.gender && userDetails.idealInfo && userDetails.idealInfo.gender) {
						if (userDetails.sexualOrientation) {
							let docExists = await model.Photo.countDocuments({userId: userDetails._id, isDeleted: false, type: 'document'});
							if (docExists) {
								if (userDetails.additionalInfo && userDetails.additionalInfo.connections && userDetails.additionalInfo.connections.length) {
									let photoExist = await model.Photo.countDocuments({userId: userDetails._id, isDeleted: false, type: {$in : ['photo','video']}});
									if (photoExist) {
										if (userDetails.isFirstTime) {
											screen = screens[7];
										} else {
											screen = screens[8];
										}
									} else {
										screen = screens[6];
									}								
								} else {
									screen = screens[5];
								}
							} else {
								screen = screens[4];
							}
						} else {
							screen = screens[3];
						}
					} else {
						screen = screens[2];
					}
				} else {
					screen = screens[1];
				}
			} else {
				screen = screens[0];
			}
		}
		return screen;
	}

	var checkOTP =  async (otp) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		let userDetail = await model.User.findOne({'otp':otp});
		if (userDetail) {
			var startDate = userDetail.otpSentTime;
			var endDate   = new Date();
			var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
			console.log('checkOTP--------->>>>seconds: ',seconds,' config.otpMaxTime: ',config.otpMaxTime);
			if(seconds < config.otpMaxTime){
				await model.User.updateOne({_id: userDetail._id, role: 'user'},{password: '', otp:'0',isVerified:true, isOnline: true});
				var userDetails = await model.User.findOne({'_id':userDetail._id}).lean();
				userDetails.screen = await checkScreen(userDetails);
				successMessage.message = "OTP Verified Sucessfully";
				successMessage.data = userDetails;
				return successMessage;
			} else {
				await model.User.updateOne({_id: userDetail._id, role: 'user'},{password: '', otp:'0'});
				failedMessage.message = "OTP Expire. Please Try Again.";
				return failedMessage;
			}
		} else {
			failedMessage.message = "Wrong OTP.";	
			return failedMessage;
		}
	}

	module.emailLogin = async (req, res) => {
		console.log('\nemailLogin--------->>>>req.session.userData: ',req.session.userData);
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		var userAgent = req.headers['user-agent'];
		var isAndroid = userAgent.match('android');
		var re = new RegExp('(iphone|ipad|ipod)');
		var isIOS = userAgent.match(re);
		var iosId = config.appStoreLink;
		var isMobile = (isIOS || isAndroid) ? 1: 0;
		var requestUri = '';
		var openLink = '';
		var webLink = config.webLink;
		if (isIOS) {
			openLink = config.scheme+'://open/'+requestUri;
		} else if (isAndroid) {
			openLink = 'intent:/'+requestUri+'#Intent;package='+config.androidPackage+';scheme='+config.scheme+';launchFlags=268435456;end;';
		} else {
			openLink = config.baseUrl+'home';			
		}


		try {
			var loginId = req.params.id;
			console.log('emailLogin---------->>>>userAgent: ',userAgent, ' loginId: '+loginId);
			var decData = helper.dec(loginId);
			var userId = decData.id;
			var pswd = decData.pswd;
			console.log('emailLogin--------->>>>decData: ',decData);

			if (!userId || userId.length != 24) {
				console.log('emailLogin--------->>>>>userId is invalid');
				failedMessage.message = "Link expire please try again later";
				return failedMessage;
			}

			var userDetail = await model.User.findOne({_id: mongoose.Types.ObjectId(userId), password: pswd, role: 'user'});
			if (userDetail) {

				var startDate = userDetail.otpSentTime;
				var endDate   = new Date();
				var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
				console.log('emailLogin--------->>>>seconds: ',seconds,' config.otpMaxTime: ',config.otpMaxTime,' startDate: ',startDate,' endDate: ',endDate);
				if(seconds < config.otpMaxTime){

					if (!isMobile) { 

						if (userDetail.isFirstTime) {
							webLink = config.baseUrl+'basicDetail';
						} else {
							webLink = config.baseUrl+'home';
						}
						console.log('emailLogin--------->>>>webLink: ',webLink,' userDetail.isFirstTime: ',userDetail.isFirstTime);
						let sessionData = {
	                        userId      : userDetail._id,
	                        loginToken  : userDetail.loginToken,
	                        phno        : userDetail.phno,
	                        countryCode : userDetail.countryCode,
	                        loginType   : 'email',
	                        email       : userDetail.email,
	                        deviceType  : userDetail.deviceType,
							role        : userDetail.role,
							username    : userDetail.username,
							profilePic  : userDetail.profilePic,
							isLogin		: true
	                    }
                    	req.session.userData = sessionData;
                    	console.log("emailLogin session set::::",req.session.userData);

                    	let checkLog = await model.userLogEvent.findOne({'userId':sessionData.userId});
                    	if(!checkLog){

                    		await model.userLogEvent.create({'userId':sessionData.userId});
                    	}
					}


					await model.User.updateOne({_id: userDetail._id, role: 'user'},{password: '', otp:'0',isVerified:true, isLogin: true});
					var userDetails = await model.User.findOne({'_id':userDetail._id});					
					successMessage.message = "Login Verified Sucessfully";
					successMessage.data = userDetails;

					let obj = {
						name: config.siteName,
						openLink: openLink,
						webLink:  webLink,
						isMobile: isMobile
					}
					console.log('emailLogin------------>>>>>obj: ',obj);
					return res.render('redirect.html',obj);
				} else {
					await model.User.updateOne({_id: userDetail._id, role: 'user'},{password: '', otp:'0'});
					failedMessage.message = "Link Expired. Please Try Again.";
					return res.send(failedMessage.message);
				}
			} else {
				console.log('emailLogin------else--->>>Error: "user not found"');
				failedMessage.message = "Link Expired. Please Try Again.";	
				return res.send(failedMessage.message);
			}
		} catch (e) {
			console.log('emailLogin:::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong"; 
			res.send(failedMessage.message);
		}
	}

	// [ Login ]
	module.login = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};

		try {

			console.log("New Email !!!!!!!!!!!------>>>>>>>>> ",email)
			var email = req.body.email;
			// email = email.toLowerCase();
			var phno = req.body.phno; 
			var countryCode = req.body.countryCode;
			var socialId = req.body.socialId;
			var loginType = req.body.loginType;
			var query = {isDeleted: false, role: 'user'};
			var deviceToken = req.body.deviceToken ? req.body.deviceToken: '';
			var deviceType = req.body.deviceType ? req.body.deviceType : '';

			// added for UserName Login
			if(loginType == 'username'){

				let username = req.body.username ? req.body.username : '';
				let password = req.body.password ? req.body.password : '';

				query.username = username;
				query.password = md5(password);

				let userDetail = await model.User.findOne(query);

				if (userDetail) {
					//user exist logic here 
					let passwordOtp = helper.randomNumber(6);
					// let md5Password = md5(passwordOtp);

					let dt = new Date();
					let otpExpire = config.otpMaxTime*1000;
					let token = jwt.sign({ data: userDetail._id }, config.jwt_secret, { expiresIn: config.jwt_expire });
					let upData = {
						loginType: 'email',
						deviceType: deviceType,
						otp: passwordOtp,
						otpSentTime: new Date(),
						otpExpire: otpExpire,
						loginToken: token ? token : '',
						role: 'user',
						password: md5(password),
						isLogin:true,
						updatedAt: new Date()
					};
					
					if (deviceToken) {
						upData.deviceToken = deviceToken;
					}
					if (socialId) {
						upData.socialId = socialId;
					}
					if (loginType == 'username') {
						upData.isVerified = true;
					}

					console.log('login username---------->>>>upData: ',upData);
					await model.User.updateOne({_id: userDetail._id},upData);

					let userDetail1 = await model.User.findOne({_id:userDetail._id}).lean();
					if (userDetail1) {

						let checkLog = await model.userLogEvent.findOne({'userId':userDetail1._id});
	                	if(!checkLog){
	                		await model.userLogEvent.create({'userId':userDetail1._id});
	                	}

						await helper.nearBy(model, userDetail1._id, userDetail1.location);
						userDetail1.screen = await checkScreen(userDetail1);

						if (loginType == 'username') {
						
							successMessage.status = 'usernameLogin'
							successMessage.message = "Please verify your mobile no otp.";
							successMessage.data = userDetail1;
							res.send(successMessage);

						} else {
							failedMessage.message = "Something went wrong. Please try again.";
							return res.send(failedMessage);
						}
					} else {
						failedMessage.message = "Something went wrong. Please try again.";
						return res.send(failedMessage);
					}
				} else {
					failedMessage.message = "Try Login with Email";
					res.send(failedMessage);
				}

			} else {

				if (loginType == 'phno' && countryCode != '') {
					query.phno = phno;
					query.countryCode = countryCode;
				} else if (loginType == 'email') {
					query.email = email
				} else if (loginType == 'gmail') {
					query.socialId = socialId
				} else {
					failedMessage.message = "Invalid login type";
					return res.send(failedMessage);
				}
				let userDetail = await model.User.findOne(query);

				if (userDetail) {
					//user exist logic here 
					let passwordOtp = helper.randomNumber(6);
					let md5Password = md5(passwordOtp);
					let dt = new Date();
					let otpExpire = config.otpMaxTime*1000;
					let token = jwt.sign({ data: userDetail._id }, config.jwt_secret, { expiresIn: config.jwt_expire });
					let upData = {
						loginType: loginType,
						deviceType: deviceType,
						otp: passwordOtp,
						otpSentTime: new Date(),
						otpExpire: otpExpire,
						loginToken: token ? token : '',
						role: 'user',
						password: md5Password,
						isLogin:true,
						updatedAt: new Date()
					};
					
					if (deviceToken) {
						upData.deviceToken = deviceToken;
					}
					if (socialId) {
						upData.socialId = socialId;
					}
					if (loginType == 'gmail') {
						upData.isVerified = true;
					}
					console.log('login---------->>>>upData: ',upData);
					await model.User.updateOne({_id: userDetail._id},upData);
					let userDetail1 = await model.User.findOne({_id:userDetail._id}).lean();
					if (userDetail1) {
						let checkLog = await model.userLogEvent.findOne({'userId':userDetail1._id});
                    	if(!checkLog){
                    		await model.userLogEvent.create({'userId':userDetail1._id});
                    	}
						await helper.nearBy(model, userDetail1._id, userDetail1.location);
						userDetail1.screen = await checkScreen(userDetail1);
						if (loginType == 'phno') {
							let smsTo = countryCode+phno;
							twilioMsg.messages.create({
							    body: 'Easy Date Verify OTP is '+passwordOtp,
							    from: config.callerNumber,
							    to: smsTo
						   	}).then(async message =>{								
								successMessage.message = "Please verify your mobile no otp.";
								successMessage.data = userDetail1;
								res.send(successMessage);
						 	}).catch(function(smsErr){
						 		console.log('login---------->>>>smsErr: ',smsErr);
						 		failedMessage.message = "Invalid mobile no.";
								return res.send(failedMessage);
						   	}).done();	
						} else if (loginType == 'email') {
							let loginId = helper.enc(md5Password, userDetail1._id.toString());
							console.log('login---------->>>>loginId: ',loginId);
							var resetLink = config.baseUrl+'api/auth/emailLogin/'+loginId;
						
							var objj = {
								uname:userDetail1.username,
								msg:'Flava Login, Please Click the button to login.',
								buttonName:'Login',
								note:'',
								baseUrl:config.baseUrl,
								resetLink:resetLink,
								appStoreLink:config.appStoreLink,
								playStoreLink:config.playStoreLink
							}
							let mailOptions = {
								to_email: userDetail1.email,
								subject: 'Easy Date : Login',
								// message: '<p>Easy Date Verify OTP is '+passwordOtp + '</p>',
								templateName: 'forgot_mail_template',
								dataToReplace: objj//<json containing data to be replaced in template>
							};
							let send = await helper.sendTemplateMail(mailOptions);
							//console.log("send ==",send);
							// let html  = '<p>Please click on login link to login</p><br>';
							// html+= '<a href="'+config.baseUrl+'api/auth/emailLogin/'+loginId+'">Login</a>';
							// let mailOptions = {
							//   	to_email: email,
							//   	subject: 'Easy Date | Login to your account',
							//   	message: html
							// };

							// let send = await helper.sendMail(mailOptions);
							successMessage.message = "We have sent you link on a registered email address. Please Login.";
							successMessage.data = userDetail1;

							res.send(successMessage);
						} else if (loginType == 'gmail'){
							successMessage.message = "User loggedIn successfully.";
							successMessage.data = userDetail1;
							res.send(successMessage);
						} else {
							failedMessage.message = "Something went wrong. Please try again.";
							return res.send(failedMessage);
						}
					} else {
						failedMessage.message = "Something went wrong. Please try again.";
						return res.send(failedMessage);
					}
				} else {
					//user not exist logic here
					let passwordOtp = helper.randomNumber(6);
					let md5Password = md5(passwordOtp);
					let dt = new Date();
					let otpExpire = config.otpMaxTime*1000;
					let location = {
						type: 'Point',
						coordinates: [0,0]
					}
					let inputData = {
						phno: phno ? phno : '',
						countryCode: countryCode ? countryCode : '',
						email: email ? email : '',
						socialId: socialId ? socialId : '',
						deviceType: deviceType ? deviceType: '',
						deviceToken: deviceToken ? deviceToken : '',
						loginType: loginType ? loginType : '',
						isLogin: true,
						role: 'user',
						otp: passwordOtp,
						location:location,
						password: md5Password,
						otpSentTime: new Date(),
						profilePic: 'upload/photos/defaultUser.png',
						otpExpire: otpExpire
					};
					if (loginType == 'gmail') {
						inputData.isVerified = true;
					}
					let loginDetail = await model.User.create(inputData);
					console.log('login---------create-------->>>>loginDetail: ',loginDetail);
					if(loginDetail){
						let token = jwt.sign({ data: loginDetail._id }, config.jwt_secret, { expiresIn: config.jwt_expire });
						await model.User.updateOne({_id: loginDetail._id},{loginToken: token, updatedAt: new Date()});
						let userDetail1 = await model.User.findOne({_id:loginDetail._id}).lean();
						if (userDetail1) {
							let checkLog = await model.userLogEvent.findOne({'userId':userDetail1._id});
	                    	if(!checkLog){
	                    		await model.userLogEvent.create({'userId':userDetail1._id});
	                    	}
							await helper.nearBy(model, userDetail1._id, userDetail1.location);
							userDetail1.screen = await checkScreen(userDetail1);
							if (loginType == 'phno') {
								let smsTo = countryCode+phno;
								twilioMsg.messages.create({
								    body: 'Easy Date Verify OTP is '+passwordOtp,
								    from: config.callerNumber,
								    to: smsTo
							   	}).then(async message =>{								
									successMessage.message = "Please verify your mobile no otp.";
									successMessage.data = userDetail1;
									res.send(successMessage);
							 	}).catch( async function(smsErr){
							 		console.log('login--------->>>smsErr: ',smsErr);
							 		await model.User.deleteOne({_id: userDetail1._id});
							 		failedMessage.message = "Invalid mobile no.";
									return res.send(failedMessage);
							   	}).done();	
							} else if (loginType == 'email') {
								
								let loginId = helper.enc(md5Password, userDetail1._id.toString());
								console.log('login---------->>>>loginId: ',loginId);
								// let html  = '<p>Please click on login link to login</p><br>';
								// html+= '<a href="'+config.baseUrl+'api/auth/emailLogin/'+loginId+'">Login</a>';
								// let mailOptions = {
								//   	to_email: email,
								//   	subject: 'Easy Date | Login to your account',
								//   	message: html
								// };

								// let send = await helper.sendMail(mailOptions);
								

								var resetLink = config.baseUrl+'api/auth/emailLogin/'+loginId;
								var objj = {
									msg:'Verificaion, Please Click the button to login and Verify your email id.',
									buttonName:'Verify',
									baseUrl:config.baseUrl,
									resetLink:resetLink,
									appStoreLink:config.appStoreLink,
									playStoreLink:config.playStoreLink
								}
								let mailOptions = {
									to_email: email,
									subject: 'Easy Date : Verify',
									// message: '<p>Easy Date Verify OTP is '+passwordOtp + '</p>',
									templateName: 'new_regi',
									dataToReplace: objj//<json containing data to be replaced in template>
								};
								let send = await helper.sendTemplateMail(mailOptions);
								successMessage.message = "We have sent you link on a registered email address. Please Verify.";
								successMessage.data = userDetail1;

								res.send(successMessage);
								
								// var otpobj = {
								// 	uname:userDetail1.username,
								// 	msg:'Your Otp Genrated',
								// 	otp: passwordOtp,
								// 	note:'otp can not share anyone',
								// 	baseurl:config.baseUrl,
								// 	baseUrl:config.baseUrl,
								// 	appStoreLink:config.appStoreLink,
								// 	playStoreLink:config.playStoreLink
								// }
								// let mailOptions = {
								// 	to_email: email,
								// 	subject: 'Easy Date : One Time Password',
								// 	 // message: '<p>Easy Date Verify OTP is '+passwordOtp + '</p>',
								// 	templateName: 'otp_mail_template',
								// 	dataToReplace: otpobj//<json containing data to be replaced in template>
								// };
				
								// let send = await helper.sendTemplateMail(mailOptions);
								// console.log("send>>>",send);

								
								// successMessage.message = "Please verify your otp sent to your mail address.";
								// successMessage.data = userDetail1;
								// res.send(successMessage);
							} else if (loginType == 'gmail'){
								successMessage.message = "User loggedIn successfully.";
								successMessage.data = userDetail1;
								res.send(successMessage);
							} else {
								failedMessage.message = "Something went wrong. Please try again.";
								return res.send(failedMessage);
							}
						} else {
							failedMessage.message = "Something went wrong. Please try again.";
							return res.send(failedMessage);
						}
					} else{
						failedMessage.message = "Something went wrong. Please try again.";
						return res.send(failedMessage);
					}
				}
			}

		} catch (e) {
			console.log('login::::::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong!";
			res.send(failedMessage);
		}
	}
	
	// [ Verify OTP ]
	module.verifyOTP = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let otp = req.body.otp;
			console.log('verifyOTP----------->>>>>otp: ',otp);
			let resp = await checkOTP(otp);
			console.log('verifyOTP----------->>>>otp: ',resp);
			return res.send(resp);

		} catch (error) {
			failedMessage.message = "Something went wrong, please try again.";
			return res.send(failedMessage);
		}
	};

	module.verifyOTP_old = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let verifyOTP = req.body.otp;
			let userDetail = await model.User.findOne({'otp':verifyOTP});
			if (userDetail) {
				var startDate = userDetail.otpSentTime;
				var endDate   = new Date();
				var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
				console.log('verifyOTP--------->>>>seconds: ',seconds,' config.otpMaxTime: ',config.otpMaxTime);
				if(seconds < config.otpMaxTime){
					await model.User.updateOne({_id: userDetail._id},{otp:'0',isVerified:true});
					var userDetails = await model.User.findOne({'_id':userDetail._id});					
					successMessage.message = "OTP Verified Sucessfully";
					successMessage.data = userDetails;
					return res.send(successMessage);
				} else {
					failedMessage.message = "OTP Expire. Please Try Again.";
					return res.send(failedMessage);
				}
			} else {
				failedMessage.message = "Wrong OTP.";	
				return res.send(failedMessage);
			}
		} catch (error) {
			failedMessage.message = "Something went wrong, please try again.";
			return res.send(failedMessage);
		}
	};

	// [ Resend OTP ]
	module.resendOTP = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var contactNo = req.body.phno;
			var countryCode = req.body.countryCode; 

			var loginType = req.body.loginType;
			var userDetail = '';

			if(loginType == 'email'){
				let userEmail = req.body.email;
				userDetail = await model.User.findOne({'email':userEmail,'role':'user','isDeleted':false});
			} else if(loginType == 'phno'){
				let userPhno = req.body.phno;
				userDetail = await model.User.findOne({'phno':userPhno,'role':'user','isDeleted':false});
			} else {
				failedMessage.message = "Invalid login type";
				return res.send(failedMessage);
			}

			if (userDetail) {
				var passwordOtp = helper.randomNumber(6);
				let md5Password = md5(passwordOtp);
				var smsTo = countryCode+contactNo;
				var dt = new Date();
				var otpExpire = config.otpMaxTime*1000;

				if (loginType == 'email') {

					let loginId = helper.enc(md5Password, userDetail._id.toString());
					console.log('login---------->>>>loginId: ',loginId);
					let html  = '<p>Please click on login link to login</p><br>';
					html+= '<a href="'+config.baseUrl+'api/auth/emailLogin/'+loginId+'">Login</a>';
					let mailOptions = {
					  	to_email: userDetail.email,
					  	subject: 'Easy Date | Login to your account',
					  	message: html
					};

					await model.User.updateOne({_id: userDetail._id},{password:md5Password, otp:passwordOtp, otpSentTime:new Date(), otpExpire: otpExpire,updatedAt: new Date()});
					await helper.sendMail(mailOptions);
					successMessage.message = "We have resend you link on a registered email address. Please Verify.";
					successMessage.data = { _id :userDetail._id};
					res.send(successMessage);
				} else if(loginType == 'phno') {

					// [ Number OTP ]
					twilioMsg.messages.create({
					     body: 'Easy Date  Resend OTP is '+passwordOtp,
					     from: config.callerNumber,
					     to: smsTo
				   	}).then(async message =>{
				   		await model.User.updateOne({_id: userDetail._id},{password:md5Password, otp:passwordOtp,otpSentTime:new Date(), otpExpire: otpExpire,updatedAt: new Date()});
						successMessage.message = "Successfully Resend OTP.";
						successMessage.data = { _id :userDetail._id};
						return res.send(successMessage);
				 	}).catch(function(smsErr){
						console.log('login--------->>>smsErr: ',smsErr);
				 		failedMessage.message = "Invalid Contact No. Please Check.";
						return res.send(failedMessage);
				   	}).done();		
				} else {
					failedMessage.message = "Something went wrong";
					return res.send(failedMessage);
				}
			} else {
				failedMessage.message = "Invalid contact no. Please check.";
				return res.send(failedMessage);
			}
		} catch (error) {
			console.log('resendOTP:::::::::::::>>>error: ',error);
			failedMessage.message = "Something went wrong, please try again.";
			return res.send(failedMessage);
		}
	}

	// [ Logout]
	module.logout = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		console.log('logout-------->>>>req.body: ',req.body);
		try {
			let token = req.headers.token;
			let userDetail = await model.User.findOne({loginToken:token});
			if (userDetail) {
				await model.User.updateOne({_id: userDetail._id},{isOnline: false,isLogin:false,loginToken:'',deviceToken:'',updatedAt: new Date()});
				await model.userLogEvent.deleteOne({'userId':userDetail._id});
			}
			delete req.session.userData;
			res.send({ status: 'success', message: 'Successfully logged out', data: {} });
		} catch (err) {
			res.send({ status: 'fail', message: 'Something went wrong, please try again.', data: {} });
		}
	}

	// [ Contact ]
	module.contact = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			
			var userId = req.body.userId;
			var userDetail = await model.User.findOne({'_id':userId,'isDeleted':false,'isVerified':true,'role':'user'});
			if(userDetail){
				
				let coId = (req.body.compStatus == 'old') ? req.body.comId : Date.now();
				var contDetail = {
					comId: coId,
					userId : userId,
					msg : req.body.msg,
					username : userDetail.username,
					contactDetails : userDetail.email
				}

				var conDt = await model.Contact.create(contDetail);
				if(conDt){
					successMessage.message = "Message Sent Successfully";
					successMessage.data = {
						comId : coId
					}
					return res.send(successMessage);
				} else {
					failedMessage.message = 'Message Not Send. Please Try Again.';
					return res.send(failedMessage);	
				}
			} else {
				failedMessage.message = 'user detail not found';
				return res.send(failedMessage);
			}
		} catch(error) {
			console.log('Error: ',error);
			failedMessage.message = "Something Went Wrong, Please Try Again.";
			return res.send(failedMessage);
		}
	}

	module.deleteUser = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};

		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user', loginToken: token});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}

					let check = await model.User.updateOne({_id: userId},{isDeleted: true, deleteReason: 'deleted by user', updatedAt: new Date()});
					if (check && check.nModified) {
						successMessage.message = "Account deleted successfully";
						res.send(successMessage);
					} else {
						failedMessage.message = "Account not deleted";	
						res.send(failedMessage);
					}
				} else {
					console.log('deleteUser--------->>>"user not found"');
					failedMessage.message = "Account not exists";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User id is invalid";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('deleteUser::::::::::::>>>e: ',e);
			failedMessage.message = "User deleted successfully";
			res.send(failedMessage);
		}
	}

	return module;
}