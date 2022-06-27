module.exports = function(model){
	var module = {};

	// [ Login ]
	module.login = function(req, res, next){
		
		req.checkBody('email', 'Email Address is Required').notEmpty();
		req.checkBody('password', 'Password is Required').notEmpty();
		req.checkBody('email', 'Please Enter Valid Email-Id').isEmail();

	   	var errors = req.validationErrors();
	   	if(errors){
	   		req.flash('vErrors',errors);
	      	res.redirect('/admin');
	   	}else{
	      next();
	   	}
	};
	
	// [ Profile ]
	module.profile = function(req, res, next){
		
		// [ Username ]
		req.checkBody('name', 'User name is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/profile');
	   	}

		// [ Email ]
	   	req.checkBody('email', 'Email address is required').notEmpty().isEmail().withMessage('Please enter valid email-id');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/profile');
	   	}

		// [ Phno ]
	   	req.checkBody('phno', 'Phno is required').notEmpty().isLength({ min: 10 , max: 15 }).withMessage('Phno must be at least 10 to 15 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/profile');
	   	}
	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Phno only allow numbers"}];
	   	if(!alNumRegex.test(req.body.phno)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/profile');
		}

		// [ Password ]
	   	if(req.body.password != ''){
		   	req.checkBody('password', 'Password is required').notEmpty();
			var errors = req.validationErrors();
		   	if(errors){
		   		req.flash('vErrors',errors);
		      		return res.redirect('/admin/profile');
		   	}
		   	
			req.checkBody('cpassword','Confirm password is required').notEmpty();
			var errors = req.validationErrors();
		   	if(errors){
		   		req.flash('vErrors',errors);
		      		return res.redirect('/admin/profile');
		   	}
		   	
		   	var errors = [{msg:"Password and confirm password not match. please try again"}];
			if(req.body.password != req.body.cpassword){
		   		req.flash('vErrors',errors);
		      		return res.redirect('/admin/profile');
		   	}
		}

		next();
	};
	
	// [ Update Setting ]
	module.updateSettingDetail = function(req, res, next){

		// [ Site Name ]
		req.checkBody('site_name', 'Site name is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/setting');
	   	}
		
		// [ Site Mail ]
	   	req.checkBody('support_email', 'Support email address is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/setting');
	   	}

		// [ Site Number ]
	   	req.checkBody('support_number', 'Support number is required').notEmpty().isLength({ min: 10 , max: 15 }).withMessage('Support number must be at least 10 to 15 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/setting');
	   	}
	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Support number only allow numbers"}];
	   	if(!alNumRegex.test(req.body.support_number)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/setting');
		}

		// [ Site Address ]
	   	req.checkBody('site_address', 'Site address is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/setting');
	   	}
		next();
	};
	
	//Start: Validation for user edit
	module.editUser = function(req, res, next){
		req.checkBody('name', 'User name is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
			return res.redirect('/admin/user/edit/'+req.params.id);
	   	}

	   	req.checkBody('email', 'Email address is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/user/edit/'+req.params.id);
	   	}

	   	req.checkBody('phno', 'Phno is required').notEmpty().isLength({ min: 10 , max: 15 }).withMessage('Phno must be at least 10 to 15 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/user/edit/'+req.params.id);
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Support number only allow numbers"}];
	   	if(!alNumRegex.test(req.body.phno)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/user/edit/'+req.params.id);
		}
	    	next();
	};
	//End: Validation for user edit

	//Start: Validation for support reply
	module.supportReply = function(req, res, next){
		req.checkBody('emailText', 'Email text is required').notEmpty().isLength({ min: 10 , max: 50 }).withMessage('Email text must be at least 10 to 50 chars long');;
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/support/reply/'+req.params.id);
	   	}
	    	next();
	};
	//End: Validation for support reply


	//Start: Validation for save admin property type
	module.saveAdminPropertyType = function(req, res, next){
		req.checkBody('property_type_name', 'Property type name is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddpropertytype');
	   	}
	    	next();
	};
	//End: Validation for save admin property type

	//Start: Validation for update admin property type
	module.updateAdminPropertyType = function(req, res, next){
		req.checkBody('property_type_name', 'Property type name is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminEditPropertyType/'+req.params.id);
	   	}
	    	next();
	};
	//End: Validation for update admin property type

	//Start: Validation for save  admin property
	module.saveAdminProperty = function(req, res, next){
		
		// [ Title ]
		req.checkBody('title', 'Title is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
				return res.redirect('/admin/adminaddproperty');
		}

		req.checkBody('address', 'Address is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('country', 'Please select country').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('state', 'Please select state').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('city', 'Please select city').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('zipcode', 'Zipcode is required').notEmpty().isLength({ min: 4, max: 8 }).withMessage('Zipcode must be at least 4 to 8chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Zipcode only allow numbers"}];
	   	if(!alNumRegex.test(req.body.zipcode)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
		}

		req.checkBody('phno', 'Phno is required').notEmpty().isLength({ min: 10, max:15 }).withMessage('Phno must be at least 10 to 15 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Phno only allow numbers"}];
	   	if(!alNumRegex.test(req.body.phno)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
		}

	   	req.checkBody('propert_giving_status', 'Property giving status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('property_type', 'Property type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('propert_giving_type', 'Property giving type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('property_person', 'Property person is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('number_of_bedrooms', 'Number of bedrooms is required').notEmpty().isLength({ min: 1, max:2 }).withMessage('Number of bedrooms must be at least 1 to 2 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Number of bedrooms only allow numbers"}];
	   	if(!alNumRegex.test(req.body.number_of_bedrooms)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
		}

		req.checkBody('number_of_bathrooms', 'Number of bathrooms is required').notEmpty().isLength({ min: 1, max:2 }).withMessage('Number of bathrooms must be at least 1 to 2 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Number of bathrooms only allow numbers"}];
	   	if(!alNumRegex.test(req.body.number_of_bathrooms)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
		}

	   	req.checkBody('price', 'Price is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Price only allow numbers"}];
	   	if(!alNumRegex.test(req.body.price)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
		}

	   	req.checkBody('floor_zise', 'Floor size is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Floor size only allow numbers"}];
	   	if(!alNumRegex.test(req.body.floor_zise)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
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

	 //   	req.checkBody('year_of_build', 'Year of build is required').notEmpty();
		// var errors = req.validationErrors();
		// if(errors){
		// 	req.flash('vErrors',errors);
	 //      		return res.redirect('/admin/adminaddproperty');
	 //   	}

	 //   	var alNumRegex = /^([0-9]+)$/;
	 //   	var errors = [{msg:"Year of build only allow numbers"}];
	 //   	if(!alNumRegex.test(req.body.year_of_build)) {
		//  	req.flash('vErrors',errors);
	 //      		return res.redirect('/admin/adminaddproperty');
		// }

	   	req.checkBody('property_availabel_status', 'Property availabel status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('property_status', 'Property status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('furniture_type', 'Furniture type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('property_description', 'Property description is required').notEmpty().isLength({ min: 10, max:500 }).withMessage('Property description must be at least 10 to 500 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('latitude', 'Latitude is required. Please select map location').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}

	   	req.checkBody('longitude', 'Longitude is required, Please select map location').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/adminaddproperty');
	   	}
	    	next();
	};
	//End: Validation for save admin property

	//Start: Validation for update  admin property
	module.updateAdminProperty = function(req, res, next){
		req.checkBody('address', 'Address is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('country', 'Please select country').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('state', 'Please select state').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('city', 'Please select city').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('zipcode', 'Zipcode is required').notEmpty().isLength({ min: 4, max: 8 }).withMessage('Zipcode must be at least 4 to 8chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Zipcode only allow numbers"}];
	   	if(!alNumRegex.test(req.body.zipcode)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
		}

		req.checkBody('phno', 'Phno is required').notEmpty().isLength({ min: 10, max:15 }).withMessage('Phno must be at least 10 to 15 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Phno only allow numbers"}];
	   	if(!alNumRegex.test(req.body.phno)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
		}

	   	req.checkBody('propert_giving_status', 'Property giving status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('property_type', 'Property type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('propert_giving_type', 'Property giving type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('property_person', 'Property person is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('number_of_bedrooms', 'Number of bedrooms is required').notEmpty().isLength({ min: 1, max:2 }).withMessage('Number of bedrooms must be at least 1 to 2 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Number of bedrooms only allow numbers"}];
	   	if(!alNumRegex.test(req.body.number_of_bedrooms)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
		}

		req.checkBody('number_of_bathrooms', 'Number of bathrooms is required').notEmpty().isLength({ min: 1, max:2 }).withMessage('Number of bathrooms must be at least 1 to 2 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Number of bathrooms only allow numbers"}];
	   	if(!alNumRegex.test(req.body.number_of_bathrooms)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
		}

	   	req.checkBody('price', 'Price is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Price only allow numbers"}];
	   	if(!alNumRegex.test(req.body.price)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
		}

	   	req.checkBody('floor_zise', 'Floor size is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Floor size only allow numbers"}];
	   	if(!alNumRegex.test(req.body.floor_zise)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
		}

	   	req.checkBody('year_of_build', 'Year of build is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	var alNumRegex = /^([0-9]+)$/;
	   	var errors = [{msg:"Year of build only allow numbers"}];
	   	if(!alNumRegex.test(req.body.year_of_build)) {
		 	req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
		}

	   	req.checkBody('property_availabel_status', 'Property availabel status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('property_status', 'Property status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('furniture_type', 'Furniture type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('property_description', 'Property description is required').notEmpty().isLength({ min: 10, max:50 }).withMessage('Property description must be at least 10 to 50 chars long');
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('latitude', 'Latitude is required. Please select map location').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}

	   	req.checkBody('longitude', 'Longitude is required, Please select map location').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
	      		return res.redirect('/admin/admineditproperty/'+req.params.id);
	   	}
	    	next();
	};
	//End: Validation for update admin property

		// [ Add Question Page ]
	module.questionsPagesDetail = function(req, res, next){
		
		// [ Title ]
		req.checkBody('que', 'Question is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
			return res.redirect('/admin/questions');
	   	}
		
		// [ Description ]
	   	// req.checkBody('description', 'Description is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
			return res.redirect('/admin/questions');
	   	}
		next();
	};
		// [ Add subscription Page ]
	module.subscriptionDetail = function(req, res, next){
		
		// [ Title ]
		req.checkBody('planName', 'planName is required').notEmpty();
		req.checkBody('planType', 'planType is required').notEmpty();
		req.checkBody('status', 'status is required').notEmpty();
		req.checkBody('discount', 'discount is required').notEmpty();
		req.checkBody('durationType', 'duration type is required').notEmpty();
		req.checkBody('duration', 'duration is required').notEmpty();
		
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
			return res.redirect('/admin/subscription');
		}
		
		next();
	};

		// [ Add offer Page ]
	module.offerPagesDetail = function(req, res, next){
		
		// [ Title ]
		req.checkBody('offerName', 'offer name is required').notEmpty();
		req.checkBody('offerType', 'offer type is required').notEmpty();
		req.checkBody('promoCode', 'promoCode is required').notEmpty();
		req.checkBody('discount', 'discount is required').notEmpty();
		req.checkBody('perUser', 'perUser is required').notEmpty();
		req.checkBody('status', 'status is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
			return res.redirect('/admin/offer');
		}
		next();
	};
	// [ Add Support Page ]
	module.cmsPagesDetail = function(req, res, next){
		
		// [ Title ]
		req.checkBody('title', 'Title is required').notEmpty();
	   	req.checkBody('description', 'Description is required').notEmpty();
		req.checkBody('cmsKey', 'CMS Key is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
			return res.redirect('/admin/cmsPages/add');
	   	}
	
		next();
	};

	// [ Notification ]
	module.notification = function(req, res, next){
		
		req.checkBody('fieldName', 'Field Name is required').notEmpty();
	   	req.checkBody('description', 'Description is required').notEmpty();
		req.checkBody('notifyKey', 'Notify Key is required').notEmpty();
		   
		var errors = req.validationErrors();
		if(errors){
			req.flash('vErrors',errors);
			return res.redirect('/admin/notification/add');
	   	}
		next();
	};
	
	return module;	
}