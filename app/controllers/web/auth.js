var dateformat = require('dateformat');
var currentDate = new Date();
var reqest = require('request');

module.exports = function(model,config){
	var module = {};

	// [ Login ]
	module.login = async function (req, res) {
		console.log('login------------>>>req.session.userData: ',req.session.userData);
		try {
			// delete req.session.userData;
			if (req.session.userData && req.session.userData.isLogin) {
				res.redirect('/');
			} else {
	            res.render('web/auth/login', {
	                error: req.flash("error"),
	                success: req.flash("success"),
	                vErrors: req.flash("vErrors"),
					session: req.session,
					title: 'Login',
	                config: config,
					settings: settings //Global variable
	            });
			}
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/');
		}
	}

	// [ Mobile Login ]
	module.mobileLogin = async function (req, res) {
		try {
			let countryCode = await model.Country.find({},{countryCode:1});
            res.render('web/auth/mobileLogin', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				title: 'Mobile Login',
				config: config,
				settings: settings, //Global variable
				countryCode: countryCode
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/');
		}
	}

	// [ Store User Data in Session ]
	module.createSession = async function (req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let usrId = mongoose.Types.ObjectId(req.body.userId);
			let usrData = await model.Photo.findOne({'userId': usrId});
			let usr = await model.User.findOne({'_id': usrId});
			console.log('usrData: ',usrData);

			let userData = {
				userId      : req.body.userId,
				loginToken  : req.body.loginToken,
				phno        : req.body.phno,
				countryCode : req.body.countryCode,
				loginType   : req.body.loginType,
				deviceType  : req.body.deviceType,
				username    : usr.username,
				firstName   : usr.firstName,
				lastName    : usr.lastName,
				profilePic  : usr.profilePic
			}

			req.session.userData = userData;

			if(req.body.loginType == 'username'){

				req.session.userData.loginType = 'email';
				console.log("req.session.userData:::",req.session.userData);

				successMessage.message = "Successfully stored in session";		
				successMessage.data = { pageRender : '/home'};
				res.send(successMessage);

			} else {

				successMessage.message = "Successfully stored in session";		
				successMessage.data = { pageRender : '/mobileOtp'};
				res.send(successMessage);
			}

            
		} catch (e) {
			console.log('Error: ',e);
			failedMessage.message = "Error in Create session";
			res.send(failedMessage);
		}
	}

	// [ Mobile Otp Verification ]
	module.mobileOtp = async function (req, res) {
		try {
            res.render('web/auth/mobileOtp', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				title: 'Mobile Verify',
				settings: settings, //Global variable
				config: config
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/');
		}
	}

	// [ Email Login ]
	module.emailLogin = async function (req, res) {
		try {
            res.render('web/auth/emailLogin', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				title: 'Email Login',
				settings: settings, //Global variable
                config: config
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/');
		}
	}

	// [ Basic Details ]
	module.basicDetail = async function (req, res) {
		try {
			console.log('basicDetail------------>>>>req.session.userData: ',req.session.userData);
            res.render('web/auth/basicDetail', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				title: 'Basic Detail',
				settings: settings, //Global variable
                config: config
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/');
		}
	}

	// [ Additional Details ]
	module.additionalInfo = async function (req, res) {
		try {
            res.render('web/auth/additionalInfo', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				title: 'Additional Information',
				settings: settings, //Global variable
                config: config
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/');
		}
	}

	// [ Get Login Question ]
	module.getQuestion = async function (req, res) {
	
		try {
			res.render('web/auth/queNans', {
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				session: req.session,
				title: 'Question and Answer',
				settings: settings, //Global variable
				config: config
			});

		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}
	
	module.getMatchQues = async function (req, res) {
	
		try {
			let cmspagesData = await model.CMSPages.find();
			res.render('web/auth/matchQues', {
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				session: req.session,
				settings: settings,
				title: 'Match Question and Answer',
				config: config,
				cmspagesData: cmspagesData,
			});

		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	module.getMatchDetail = async function (req, res) {
	
		try {
			// console.log("req===>",req.session);
			// console.log('basicDetail------------>>>>req.session.userData: ',req.session.userData);
			let userId = mongoose.Types.ObjectId(req.params.id);
			let selfId = mongoose.Types.ObjectId(req.session.userData.userId);
			let userInfo = await model.User.aggregate([
				{ $match : {role: 'user', _id: userId }},
				{
					$lookup: {
                        from: "photos",
                        let: {userId: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                         $and: [
                                            {$eq: ['$userId','$$userId']},
                                            {$eq: ['$isDeleted', false]},
                                            {$ne: ['$type', 'document']},
                                        ]
                                    }
                                } 
                            },
                            {
                                $sort: {sortOrder:1}
                            }
                        ],
                        as: "photo"
                    }
				},
				{ "$sort" : { "_id" : 1 } },
			]);
			userInfo = userInfo[0];
			userInfo.matchPercentage = await helper.calculateMatchPoints(model,selfId, userInfo._id);
			let userBenefit = await model.User.findOne({'_id': selfId});

			let cmspagesData = await model.CMSPages.find();
			res.render('web/auth/matchDetail', {
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				session: req.session,
				title: 'Daters Match Question and Answer',
				config: config,
				cmspagesData: cmspagesData,
				settings: settings, //Global variable
				userInfo: userInfo,
				oppId: userId,
				userBenefit: userBenefit.benefits,
			});

		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}
	
    
	return module;
}