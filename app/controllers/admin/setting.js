var md5 = require('md5');
const { check, validationResult } = require('express-validator');
var nodemailer = require('nodemailer');

module.exports = function(model,config){
	var module = {};

	module.viewSetting = async function(req, res){
		res.render('admin/auth/setting', {
			title: 'Setting',
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			auth: req.session,
			config: config,
			alias:'setting',
			subAlias:'setting',
			settings: settings //Global variable
		});
	};

	module.updateSettingDetail = async function(req, res){
		try{
			var setting = await model.Setting.findOne({});
			if(setting){
				var updateData = {
					site_name: req.body.site_name,
					support_email: req.body.support_email,
					support_number: req.body.support_number,
					site_address: req.body.site_address,
					likesLimit: req.body.likesLimit,
					privacyMediaLimit: req.body.privacyMediaLimit,

					verfiyIdentity: req.body.verfiyIdentity,
					leaderBoardDisplay: req.body.leaderBoardDisplay,
					leaderBoardWinner: req.body.leaderBoardWinner,
					nearByDistance: req.body.nearByDistance,

					otpMaxTime: req.body.otpMaxTime,
					minAge: req.body.minAge,
					maxAge: req.body.maxAge,
					minDistance: req.body.minDistance,
					maxDistance: req.body.maxDistance,

					coinPayment: req.body.coinPayment,
					iosPayment: req.body.iosPayment,
					stripePayment: req.body.stripePayment,
				};
				var updateSettingData = await model.Setting.updateOne({ adminId: req.session.admin._id},updateData);
				if(updateSettingData != null){
					helper.getDefaultSetting(model);					
					req.flash('success',"Site Setting Update Successfully");
					res.redirect('/admin/setting');	
				} else {
					req.flash('error',"Site Setting Detail Not Update");
					res.redirect('/admin/setting');
				}				
			}else{
				let setData = {
					site_name: req.body.site_name,
					support_email: req.body.support_email,
					support_number: req.body.support_number,
					site_address: req.body.site_address,
					adminId: req.session.admin._id
				}
				await model.Setting.create(setData);
				req.flash('success',"Site Setting Created Successfully");
				res.redirect('/admin/setting');
			}
		}catch(err){
			console.log('Error: ',err);
			req.flash('error',"Something Went Wrong. Please Try Again");
			res.redirect('/admin/setting');
		}
	};

	return module;
}
