module.exports = function(model, config) {
	var module = {};

	module.authResp = async (req, res) => {

		console.log('authResp----------->>>>req.originalUrl: '+req.originalUrl+' req.query: ',req.query,' req.session.userData: ',req.session.userData,' req.body: ',req.body);

		let userId = req.session.userData ? req.session.userData.userId : null;
		let code = req.query.code;
		if (userId && code) {
			var userDetails = await model.User.findOne({_id: userId, isDeleted: false});
			if (userDetails) {
				let check = await model.User.updateOne({_id: userDetails._id},{instaToken: code});
				if (check && check.nModified) {
					console.log('authResp----------->>>>>"user token updated"');
					helper.updateTrustScore(model, userDetails._id);
					res.redirect('/profileSetting');
				} else {
					console.log('authResp----------->>>>"token not updated" ');
					res.redirect('/');
				}
			} else {
				console.log('authResp----------->>>>"user data not found" userId: ',userId);
				res.redirect('/');
			}			
		} else {
			console.log('authResp------------>>>>>"userId or code is invalid" userId: '+userId+' code: '+code);
			res.redirect('/');
		}
	}

	return module;
}