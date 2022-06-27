module.exports = function (model) {
	var module = {};

	const config        	 = require('../../config/constants.js');
	module.amenties			 = require('./admin/amenties')(model,config);
	module.auth         	 = require('./admin/auth')(model,config);
	module.country      	 = require('./admin/country')(model,config);
	module.city         	 = require('./admin/city')(model,config);
	module.contact			 = require('./admin/contact')(model,config);
	module.cmsPages		 	 = require('./admin/cmsPages')(model,config);
	module.comment           = require('./admin/comment')(model,config);
	module.dashboard    	 = require('./admin/dashboard')(model,config);
	module.institute       	 = require('./admin/institute')(model,config);
	module.language     	 = require('./admin/language')(model,config);
	module.leaderBoard     	 = require('./admin/leaderBoard')(model,config);
	module.location     	 = require('./admin/location')(model,config);
	module.notification	 	 = require('./admin/notification')(model,config);
	module.offer             = require('./admin/offer')(model,config);
	module.profileFields   	 = require('./admin/profileFields')(model,config);
	module.questions		 = require('./admin/questions')(model,config);
	module.request           = require('./admin/request')(model,config);
	module.reqUnmatch        = require('./admin/reqUnmatch')(model,config);
	module.state        	 = require('./admin/state')(model,config);
	module.setting      	 = require('./admin/setting')(model,config);
	module.subscription		 = require('./admin/subscription')(model,config);
	module.userSubscription	 = require('./admin/userSubscription')(model,config);
	module.transaction  	 = require('./admin/transaction')(model,config);
	module.testimonial  	 = require('./admin/testimonial')(model,config);
	module.calendar		  	 = require('./admin/calendar')(model,config);
	module.user         	 = require('./admin/user')(model,config);
	module.userImage         = require('./admin/userImage')(model,config);
	module.vehicle      	 = require('./admin/vehicle')(model,config);
	module.vehicleFieldSetup = require('./admin/vehicleFieldSetup')(model,config);

	return module;
}
