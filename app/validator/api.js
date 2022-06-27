var md5 = require('md5');
module.exports = function(model){
	var module = {};
		
	module.verifyOTP = function(req, res, next){
		   
		// [ OTP ]
		req.checkBody('otp', 'OTP is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
		
	   	next();
	};
	
	module.resendOTP = function(req, res, next){
		
		// [ Phno ]
		req.checkBody('phno', 'Phno is required').notEmpty().isLength({ min: 10, max:15 }).withMessage('Phno must be at least 10 to 15 chars long');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = req.validationErrors();
	   	if(!alNumRegex.test(req.body.phno)) {
		 	return res.send({ status: 'fail', message:"Phno only allow numbers", data:{}});
		}

		// [ Country Code ]
		req.checkBody('country_code', 'Country code is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		   
	   	next();
	}
	
	module.forgot = function(req, res, next){

		// [ Flag - phno/email ]
		req.checkBody('flag', 'Flag is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}	
		   
		// [ Value ]
		req.checkBody('value', 'Value is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

	   	next();
	};

	module.forgotPasswordChange = function(req, res, next){

		// [ Flag - phno/email ]
		req.checkBody('userId', 'Flag is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}	
		   
		// [ Password ]
		req.checkBody('password', 'Password is required').notEmpty().isLength({ min: 6, max:10 }).withMessage('Password must be at least 6 to 10 chars long');
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	next();
	};	
	
	module.twoWay = function(req, res, next){
		
		// [ User Id ]
		req.checkBody('userId', 'UserId is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
		
		next();
	}

	module.forgotPasswordChange = function(req, res, next){
   		req.checkBody('otp', 'Please enter otp').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('id', 'Id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('new_password', 'New Password is required').notEmpty().isLength({ min: 6, max:10 }).withMessage('Password must be at least 6 to 10 chars long');
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
	   	
		req.checkBody('confirm_newpassword','Confirm New password is required').notEmpty().isLength({ min: 6, max:10 }).withMessage('Confirm password must be at least 6 to 10 chars long');
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
	   	}
	   	
	   	if(req.body.new_password != req.body.confirm_newpassword){
	   		return res.send({ status: 'fail', message:'Confirm Password should match new password', data:"" });
	   	}

	   	next();
	};

	module.login = function(req, res, next){

		if (req.body.loginType == '') {
			req.checkBody('loginType', 'Logintype is required').notEmpty()
			var errors = req.validationErrors();
			if(errors){
				return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		   	}	
		}

		let loginType = req.body.loginType;
		if (loginType == 'email') {

			req.checkBody('email', 'Email Address is required').notEmpty().isEmail().withMessage('Please enter valid email-id');
			var errors = req.validationErrors();
			if(errors){
				return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		   	}	
		} else if (loginType == 'phno') {
			
			req.checkBody('countryCode',' Country code is required').notEmpty();
			req.checkBody('phno', 'Phone number is required').notEmpty().isLength({ min: 10, max:15}).withMessage('Phno must be at least 10 to 15 chars long');
			var errors = req.validationErrors();
			if(errors){
				return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		   	}	
		} else if (loginType == 'gmail') {
			req.checkBody('socialId', 'Social ID is required').notEmpty();
			var errors = req.validationErrors();
			if(errors){
				return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		   	}	
		} else if (loginType == 'username') {
			
			req.checkBody('username', 'username is required').notEmpty();
			req.checkBody('password', 'password is required').notEmpty();
			var errors = req.validationErrors();
			if(errors){
				return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		   	}	
		} else {
			return res.send({ status: 'fail', message: 'login type is not valid', data:{}});
		}

   		
		req.checkBody('deviceType', 'Device type is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	if (req.body.deviceType == 'android' || req.body.deviceType == 'ios') {

			req.checkBody('deviceToken', 'Device token is required').notEmpty();
			var errors = req.validationErrors();
		   	if(errors){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		   	}
	   	}	

	   	next();
	};

	module.editProfile = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		if(req.body.password){
		   	req.checkBody('password', 'Password is required').notEmpty().isLength({ min: 6, max:10 }).withMessage('Password must be at least 6 to 10 chars long');;
			var errors = req.validationErrors();
		   	if(errors){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		   	}
		   	
			req.checkBody('cpassword','Confirm password is required').notEmpty();
			var errors = req.validationErrors();
		   	if(errors){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		   	}
		   	
		   	var errors = [{msg:"Password and confirm password not match. please try again"}];
			if(req.body.password != req.body.cpassword){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		   	}
		}
	    	next();
	};

	module.selectSong = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('songUrl', 'Song URL is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	};

	module.support = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('name', 'User name is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('email', 'Email address is required').notEmpty().isEmail().withMessage('Please enter valid email-id');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('message', 'Message is required').notEmpty().isLength({ min: 10 , max :50}).withMessage('Message length should be 10 to 50 chars.');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
	    	next();
	};

	module.addAndupdateProperty = function(req, res, next){

		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		if(req.body.PropertyId == '') {
			req.checkBody('PropertyId', 'Property id is required').notEmpty();
			var errors = req.validationErrors();
		   	if(errors){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
			}
		}

		req.checkBody('address', 'Address is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('country', 'Country is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('state', 'State is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('city', 'City is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('zipcode', 'Zipcode is required').notEmpty().isLength({ min: 4 , max :8 }).withMessage('Zipcode must be at least 4 to 8 chars long');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	if(!alNumRegex.test(req.body.zipcode)) {
		 	return res.send({ status: 'fail', message:"Zipcode only allow numbers", data:{}});
		}

		req.checkBody('phno', 'Phno is required').notEmpty().isLength({ min: 10, max:15 }).withMessage('Phno must be at least 10 to 15 chars long');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	if(!alNumRegex.test(req.body.phno)) {
		 	return res.send({ status: 'fail', message:"Phno only allow numbers", data:{}});
		}

	   	req.checkBody('propert_giving_status', 'Property giving status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('property_type', 'Property type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

	   	req.checkBody('propert_giving_type', 'Property giving type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('property_person', 'Property person is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('number_of_bedrooms', 'Number of bedrooms is required').notEmpty().isLength({ min: 1, max:2 }).withMessage('Number of bedrooms must be at least 1 to 2 chars long');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('number_of_bathrooms', 'NUmber of bathrooms is required').notEmpty().isLength({ min: 1, max:2 }).withMessage('Number of bathrooms must be at least 1 to 2 chars long');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('price', 'Price is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	if(!alNumRegex.test(req.body.price)) {
		 	return res.send({ status: 'fail', message:"Price only allow number", data:{}});
		}

	   	req.checkBody('floor_zise', 'Floor size is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	if(!alNumRegex.test(req.body.floor_zise)) {
		 	return res.send({ status: 'fail', message:"Floor size only allow numbers", data:{}});
		}

		req.checkBody('floors_number', 'Floor number is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	if(!alNumRegex.test(req.body.floors_number)) {
		 	return res.send({ status: 'fail', message:"Floor number only allow numbers", data:{}});
		}

	   	req.checkBody('year_of_build', 'Year of build is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	if(!alNumRegex.test(req.body.year_of_build)) {
		 	return res.send({ status: 'fail', message:"Year of build only allow numbers", data:{}});
		}

	   	req.checkBody('property_availabel_status', 'Property availabel status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('property_status', 'Property status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('furniture_type', 'Furniture type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('property_description', 'Property description is required').notEmpty().isLength({ min: 10, max:50 }).withMessage('Property description must be at least  10 to 50 chars long');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('latitude', 'Latitude is required. Please select map location').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

	   	req.checkBody('longitude', 'Longitude is required, Please select map location').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
	    	next();
	};

	module.listEditAndDeleteUserProperty = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		if(req.body.PropertyId == '') {
			req.checkBody('PropertyId', 'Property id is required').notEmpty();
			var errors = req.validationErrors();
		   	if(errors){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
			}
		}

	    	next();
	};

	module.detailPageUserAndAdminProperty = function(req, res, next){
		req.checkBody('PropertyId', 'Property id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
	    	next();
	};

	module.userAddFavouriteProperty = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('PropertyId', 'Property id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('type', 'Type is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
		
	    	next();
	};

	module.userListFavouriteProperty = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
	    	next();
	};

	module.userNotificationOnOff = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('notificationtype', 'Notification type is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

	    	next();
	};

	module.userInquiryProperty = function(req, res, next){
		
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('PropertyId', 'Property id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
	    	next();
	};
	
	module.userInquiryOtherPropertyAddNotification = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
	    	next();
	};
	
	module.userGivePropertyRating = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('PropertyId', 'Property id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('UserRatingValue', 'User rating value is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
	    	next();
	};
	
	module.userGiveAppReviewAndRating = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('userReview', 'User review value is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('userRating', 'User rating value is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
	    	next();
	};
	
	module.userAddAppReportProblem = function(req, res, next){
		req.checkBody('loginUserID', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}

		req.checkBody('email', 'Email address is required').notEmpty().isEmail().withMessage('Please enter valid email-id');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

		req.checkBody('message', 'Message is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:"" });
		}
	    	next();
	};
	
	module.uploadMedia = function (req, res, next) {
		req.checkBody('userId', 'UserId is required').notEmpty();
		req.checkBody('type', 'Type is required').notEmpty();

		// if (req.body.type != 'document') {
		// 	req.checkBody('isLive', 'isLive is required').notEmpty();
		// 	req.checkBody('isProfile','isProfile is required').notEmpty();
		// }

		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, data: {}});
		} else {
			if (req.body.type == 'photo' || req.body.type == 'video' || req.body.type == 'document') {
				next();
			} else {	
				res.send({status: 'fail', message: "Please select valid file type", data: {}});
			}
		}
	}

	module.uploadChatMedia = function (req, res, next) {
		req.checkBody('userId', 'UserId is required').notEmpty();
		req.checkBody('type', 'Type is required').notEmpty();
		
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, data: {}});
		} else {
			if (req.body.type == 'photo' || req.body.type == 'video' || req.body.type == 'document') {
				next();
			} else {	
				res.send({status: 'fail', message: "Please select valid file type", data: {}});
			}
		}
	} 
	
	module.deleteMedia = function(req, res, next) {
		req.checkBody('userId', 'UserId is required').notEmpty();
		req.checkBody('mediaId', 'MediaId is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, data: {}});
		} else {
			next();
		}
	}
	
	module.sortMedia = function(req, res, next) {
		req.checkBody('userId', 'UserId is required').notEmpty();
		req.checkBody('mediaIds', 'MediaIds are required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, data: {}});
		} else {
			next();
		}
	}
	
	module.addAnswer = function(req, res, next) {
		req.checkBody('userId', 'UserId is required').notEmpty();
		req.checkBody('queId', 'Questions ID is required').notEmpty();

		let isSkipped = req.body.isSkipped;
		console.log("skipp",isSkipped);
		
		 isSkipped = (isSkipped && isSkipped == 1) ? true : false;
		
		console.log("skipp",isSkipped);

		if (!isSkipped) {
			req.checkBody('ans', 'Answer is required').notEmpty();
			req.checkBody('oppAns', 'Opponent answer is required').notEmpty();
		}

		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, data: {}});
		} else {
			let oppAns = req.body.oppAns;
			if (typeof oppAns == 'string') {
				oppAns = (helper.IsJsonString(oppAns)) ? JSON.parse(oppAns) : [];
			} 
		
			if (oppAns && oppAns.length) {
				next();
			} else {
				// next();
				if(!isSkipped){
					res.send({status: 'fail', message: 'Please select opponent answer..........', data: {}});
				}
				else{
					next();
				}
			}
		}
	}
	
	module.viewAnswer = function(req, res, next) {
		req.checkBody('userId', 'UserId is required').notEmpty();
		req.checkBody('queId', 'Questions ID is required').notEmpty();

		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, data: {}});
		} else {
			next();
		}
	}
	
	module.sendFeedback = function(req, res, next) {
		req.checkBody('userId', 'UserId is required').notEmpty();
		req.checkBody('dateId', 'Date Id is required').notEmpty();
		req.checkBody('feedbacks', 'Feedbacks are required').notEmpty();

		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, data: {}});
		} else {
			next();
		}
	}
		
	module.setNotifications = function(req, res, next) {
		req.checkBody('userId','User ID is required').notEmpty();
		req.checkBody('slug','Slug is required').notEmpty();
		req.checkBody('isActive','Is Active is required').notEmpty();

		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}
	}
	
	module.commentPhoto = function (req, res, next) {
		req.checkBody('userId','User ID is required').notEmpty();
		req.checkBody('photoId','Photo ID is required').notEmpty();
		req.checkBody('msg','Mesage is required').notEmpty();

		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}
	} 

	module.activateSubscription = function (req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('paymentId','PaymentId is required').notEmpty();
		req.checkBody('paymentType','Payment Type is required').notEmpty();

		let paymentType = req.body.paymentType;
		if (paymentType == 'card') {
			req.checkBody('stripeChargeId','Stripe Charge ID is required').notEmpty();			
		} else if (paymentType == 'netBank') {
			req.checkBody('plaidPublicToken', 'Plaid public token is required').notEmpty();
			req.checkBody('accountId','accountId is required').notEmpty();
		}

		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}

	module.compareAnswer = function (req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('oppId', 'Opp Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}
	}

	module.viewFlava = function (req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('oppId', 'Opp Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}
	}
	
	module.bookDate = function (req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('oppId', 'Opp Id is required').notEmpty();
		// req.checkBody('locationId', 'Location Id is required').notEmpty();
		req.checkBody('lat', 'lat is required').notEmpty();		
		req.checkBody('long', 'long is required').notEmpty();		
		req.checkBody('address', 'address is required').notEmpty();
		req.checkBody('date', 'Date is required').notEmpty();		
		req.checkBody('time', 'Time is required').notEmpty();		


		var errors = req.validationErrors();
		if (errors) {
			return res.send({status: 'fail', message: errors[0].msg, date: {}});
		}

		let crtDt = new Date();
		let date = req.body.date.split('-');
		let dt = parseInt(date[0]);
		let mn = parseInt(date[1]);
		let yr = parseInt(date[2]);

		let time = req.body.time.split(':');
		let hr = parseInt(time[0]);
		let mt = parseInt(time[1]);

		if (!date || date.length != 3 || isNaN(dt) || isNaN(mn) || isNaN(yr)) {
			return res.send({status: 'fail', message: "Date is invalid", date: {}});
		}

		if (!time || time.length != 2 || isNaN(hr) || isNaN(mt)) {
			return res.send({status: 'fail',message: "Time is invalid", date: {}});
		}

		let mainDt = new Date(yr, mt-1, dt, hr, mt);

		if (mainDt < dt) {
			return res.send({status: 'fail', message: "Date and time are not valid", date: {}});
		}

		next();	
	}

	module.updateDate = function (req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('dateId', 'Date Id is required').notEmpty();
		// req.checkBody('locationId', 'Location Id is required').notEmpty();	
		req.checkBody('lat', 'lat is required').notEmpty();		
		req.checkBody('long', 'long is required').notEmpty();		
		req.checkBody('address', 'address is required').notEmpty();	
		req.checkBody('date', 'Date is required').notEmpty();		
		req.checkBody('time', 'Time is required').notEmpty();	

		var errors = req.validationErrors();
		if (errors) {
			return res.send({status: 'fail', message: errors[0].msg, date: {}});
		}

		let crtDt = new Date();
		let date = req.body.date.split('-');
		let dt = parseInt(date[0]);
		let mn = parseInt(date[1]);
		let yr = parseInt(date[2]);

		let time = req.body.time.split(':');
		let hr = parseInt(time[0]);
		let mt = parseInt(time[1]);

		if (!date || date.length != 3 || isNaN(dt) || isNaN(mn) || isNaN(yr)) {
			return res.send({status: 'fail', message: "Date is invalid", date: {}});
		}

		if (!time || time.length != 2 || isNaN(hr) || isNaN(mt)) {
			return res.send({status: 'fail',message: "Time is invalid", date: {}});
		}

		let mainDt = new Date(yr, mt-1, dt, hr, mt);

		if (mainDt < dt) {
			return res.send({status: 'fail', message: "Date and time are not valid", date: {}});
		}

		next();	
	}

	module.viewDate = function (req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('dateId', 'Date Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}
	}

	module.approveDate = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('dateId', 'Date Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}


	module.getMessages = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('oppId', 'Opp Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}

	module.makeVideoCall = function(req, res, next) {
		console.log('makeVideoCall: ',req.body);
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('oppId', 'Opp Id is required').notEmpty();
		req.checkBody('type', 'Type is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}		
	}

	module.receiveCall = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('roomId', 'Room Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}		
	}

	module.endCall = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('roomId', 'Room Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}			
	}

	module.block = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('oppId', 'Opp Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}

	module.updateInstaTokenId = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('instaId', 'Insta Id is required').notEmpty();
		req.checkBody('instaToken', 'Insta token is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}

	
	module.getUserInstaFeeds = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('oppId', 'Opp Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}

	module.getTestimonials = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}

	module.report = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('oppId', 'Opp Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}	

	module.unmatch = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('oppId', 'Opp Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}	

	module.cancelSubscription = function(req, res, next) {
		req.checkBody('userId', 'User Id is required').notEmpty();
		req.checkBody('subscriptionId', 'Subscription Id is required').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			res.send({status: 'fail', message: errors[0].msg, date: {}});
		} else {
			next();
		}	
	}	
	return module;	
}