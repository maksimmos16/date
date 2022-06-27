module.exports = function (model) {
	var module = {};
	const config = require('../../config/constants.js');
	module.auth = require('./api/auth')(model,config);
	module.chat = require('./api/chat')(model,config);
	module.cms = require('./api/cms')(model,config);
	module.date = require('./api/date')(model,config);
	// module.dislike = require('./api/dislike')(model,config);
	module.feedback = require('./api/feedback')(model,config);
	module.flava = require('./api/flava')(model,config);
	module.instagram = require('./api/instagram')(model, config);
	module.like = require('./api/like')(model,config);
	module.notification = require('./api/notification')(model,config);
	module.payment = require('./api/payment')(model,config);
	module.profile = require('./api/profile')(model,config);
	module.userAnswer = require('./api/userAnswer')(model,config);
	module.videoChat = require('./api/videoChat')(model,config);

	return module;
}
