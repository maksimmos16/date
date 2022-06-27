var md5 = require('md5');
const { check, validationResult } = require('express-validator');
var nodemailer = require('nodemailer');

module.exports = function(model,config){
	var module = {};

	module.login = async function(req, res){
		var emailId = "";
		var password = "";
		if(req.cookies.admin_login_detail){
			var emailId = req.cookies.admin_login_detail.email_id;
			var password = req.cookies.admin_login_detail.password;
		}
		
		res.render('admin/auth/login', {
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			session: req.session,
			config: config,
			settings: settings, //Global variable
			emailId: emailId,
			password: password,
		});
	};

	module.viewProfile = async function(req, res){
		var emailId = "";
		var password = "";
		console.log("req.cookies.",req.cookies.pwd);
		
		if(req.cookies.admin_login_detail){
			 password = req.cookies.pwd;
		}
		let adminDetail = await model.User.findOne({ _id: req.session.admin._id});

		res.render('admin/auth/profile', {
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			session: req.session,
			config: config,
			settings: settings, //Global variable
			emailId: emailId,
			adminDetail: adminDetail,
			password: req.cookies.pwd
		});
	};

	module.updateProfileDetail = async function(req, res){
		try{

			// [ Body CheckPost ]
			if(req.body != null){

				if(req.session.admin){

					var adminDetail = await model.User.findOne({ _id: req.session.admin._id});
		
					if(adminDetail){
				
						if(adminDetail.isLogin){
		
							var updateAdminDetail = { 
								name : req.body.name,
								username: req.body.username,
								email : req.body.email,
								phno: req.body.phno,
							}
							let image_name = "";
							if(req.files != null){
								if(req.files.profile_image){
									if(adminDetail.profilePic != 'default.png'){
										fs.unlink('./public/admin/images/icon/'+adminDetail.profilePic, function (err) {
										    if (err) {
								            		console.log('File deleted!',err);
										    } else {
											console.log('File deleted!');    	
										    }
										}); 
									}
									let profile_images = req.files.profile_image;
									var tempNum = helper.randomOnlyNumber(4);
									var datetime = dateFormat(new Date(),'yyyymmddHHMMss');
									image_name = datetime + tempNum + ".jpg";
									profile_images.mv('./public/admin/images/icon/'+image_name, async function (uploadErr) {
									});
									updateAdminDetail.profilePic = image_name;
									req.session.admin.profilePic = updateAdminDetail.profilePic;
								}
							}
							if(req.body.password){
								updateAdminDetail.password = md5(req.body.password);
							}
							await model.User.updateOne({ _id: req.session.admin._id},updateAdminDetail);
							req.flash('success',"Admin Profile Update Successfully");
							res.redirect('/admin/profile');
						} else {
							req.flash('success',"Admin Detail Not Found. Please login.");
							res.redirect('/admin/profile');
						}
					} else {
						req.flash('error',"Admin Detail Not Found. Please Login.");
						res.redirect('/admin/profile');
					}
				}else{
					req.flash('error',"Admin detail not found");
					res.redirect('/admin');
				}				
			}else{
				req.flash('error',"Profile detail not save, please try again");
				res.redirect('/admin/profile');
			}
		}catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/profile');
		}
	};

	module.loginCheck = async function(req, res){
		let emailId = req.body.email;
		let password = md5(req.body.password);
			
		try{
			let adminDetail = await model.User.findOne({ email: emailId, password: password, role: 'admin'});
			
			// [ Admin Found ]
			if(adminDetail){
				var getSessionData = helper.checkSession(emailId,password,req.sessionID);	
				if(getSessionData.checkStatus == true){				
					getSessionData.sessionData.admin = adminDetail;
					getSessionData.sessionData.userSessionData.sessionId = adminDetail._id;
					req.session.admin = getSessionData.sessionData.admin;
					req.session.userSessionData = getSessionData.sessionData.userSessionData;
					req.flash('success',"Login successfully");								
					res.redirect('/admin/dashboard');
				} else{
					if(req.cookies.admin_login_detail){
						res.clearCookie('admin_login_detail');
					}						
					if(adminDetail != null && adminDetail.status == "accept"){									
						if(req.body.remember){
							res.cookie('admin_login_detail' , {'email_id':emailId, 'password':req.body.password});
						}else{
							if(req.cookies.admin_login_detail){
								res.clearCookie('admin_login_detail');
							}
						}
						let  userSessionData = {};		
						let startDate = new Date();				
						let endDate = new Date();				
							endDate.setHours(endDate.getHours() + 1);  				
						let sesstionTime = helper.convertHourMinutSecondToMili(startDate,endDate);								
						req.session.admin = adminDetail;		
						userSessionData.session_timeout = sesstionTime; 
						userSessionData.status = true;
						userSessionData.sessionId = adminDetail._id;
						req.session.userSessionData = userSessionData;
						req.session.userSessionData.start_sessionDate = startDate;		
		
						req.flash('success',"Login successfully");				
						res.redirect('/admin/dashboard');				
					}else{				
						if(adminDetail!=null && adminDetail.status != "accept"){
							req.flash('error',"Your account has been blocked!");
							res.redirect('/admin');
						}else{
							req.flash('error',"Email-id or password invalid");
							res.redirect('/admin');
						}
					}
				}
			} else {
				req.flash('error',"The Email or Password you entered is incorrect.");
				res.redirect('/admin');
			}
		}catch(err){
			console.log("login >> signincheck::::::::::::::>>error: ", err);
			req.flash('error',"Email-id or password invalid");
			res.redirect('/admin');
		}
	};

	module.logout = function(req, res){		
		delete req.session.admin;
		delete req.session.userSessionData;
		res.redirect('/admin');
	};

	// [ Forget ]
	module.forget = function(req, res){
		res.render('admin/auth/forget', {
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			session: req.session,
			settings: settings, //Global variable
			config: config
		});
	};

	// [ Forget Password ]
	module.forgetPassword = async function(req, res){
		var emailId = req.body.email;
		try{
			if(emailId != "" && emailId != null){
				var userDetail = await model.User.findOne({'email':emailId,'role':admin});
			
				console.log("userDetail",userDetail);
				
				if(userDetail){

					var uid = userDetail._id;
					// var pswd = userDetail.password;
					// console.log("uid",uid);
					// console.log("pswd",pswd);
					
					
					var dt = new Date();

					// var resetId = helper.enc(uid);
					// console.log("res",resetId);
					
					var resetLink = config.baseUrl+'reset?id='+uid;
					console.log("resetLink",resetLink);
					
					// var mailOptions = {					  	
					//   	to_email: emailId,
					//   	subject: 'IVI ( Innovative Vehicle Initiative ) : Forgot Password',
					//   	// message: '<p>Hello ' + userDetail.username + ',<br><br>Click <a href="'+resetLink+'">here</a> to reset your password</p>'
					//   	message: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
					// 				<html xmlns="http://www.w3.org/1999/xhtml">
					// 					<head>
					// 						<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
					// 						<title>IVI | Forget Password </title>
					// 						<style> body { background-color: #FFFFFF; padding: 0; margin: 0; } </style>
					// 					</head>
									
					// 					<body style="background-color: #FFFFFF; padding: 0; margin: 0;">
					// 						<table border="0" cellpadding="0" cellspacing="10" height="100%" bgcolor="#FFFFFF" width="100%" style="max-width: 650px;" id="bodyTable">
					// 							<tr>
					// 								<td align="center" valign="top">
					// 									<table border="0" cellpadding="0" cellspacing="0" width="100%" id="emailContainer" style="font-family:Arial; color: #333333;">
					// 										<!-- Logo -->
					// 										<tr>
					// 											<td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding-bottom: 10px;">
					// 												<img alt="`+config.siteName+`" border="0" src="`+config.baseUrl+`/admin/images/icon/logo.png" title="`+config.siteName+`" class="sitelogo" width="60%" style="max-width:250px;" />
					// 											</td>
					// 										</tr>
					// 										<!-- Title -->
					// 										<tr>
					// 											<td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding: 20px 0 10px 0;">
					// 												<span style="font-size: 18px; font-weight: normal;">FORGOT PASSWORD</span>
					// 											</td>
					// 										</tr>
					// 										<!-- Messages -->
					// 										<tr>
					// 											<td align="left" valign="top" colspan="2" style="padding-top: 10px;">
					// 												<span style="font-size: 12px; line-height: 1.5; color: #333333;">
					// 													We have sent you this email in response to your request to reset your password on `+config.siteName+`. After you reset your password.
					// 													<br/><br/>
					// 													To reset your password for <a href="`+config.baseUrl+`/admin">`+config.baseUrl+`/admin</a>, please follow the link below:
					// 													<a href="`+resetLink+`">`+resetLink+`</a>
					// 													<br/><br/>
					// 													We recommend that you keep your password secure and not share it with anyone.If you feel your password has been compromised, you can change it by going to your `+config.siteName+` My Profile Page and Change Email Address or Password.
					// 													<br/><br/>
					// 													If you need help, or you have any other questions, feel free to email php1@aistechnolabs.co.uk, or call `+config.siteName+` customer service toll-free at very soon.
					// 													<br/><br/>
					// 													`+config.siteName+` Customer Service
					// 												</span>
					// 											</td>
					// 										</tr>
					// 									</table>
					// 								</td>
					// 							</tr>
					// 						</table>
					// 					</body>
					// 				</html>`
					// };
					
					// await helper.sendMail(mailOptions);
					var otpobj = {
						uname: userDetail.username,
						msg:'We have sent you this email in response to your request to reset your password',
						buttonName:'Verify',
						note:'password can not share anyone',
						baseUrl:config.baseUrl,
						appStoreLink:config.appStoreLink,
						playStoreLink:config.playStoreLink,
						resetLink:resetLink
					}
					let mailOptions = {
						to_email: 'binita@aistechnolabs.biz',
						subject: 'Easy Date : Reset Password',
						 // message: '<p>Easy Date Verify OTP is '+passwordOtp + '</p>',
						templateName: 'forgot_mail_template',
						dataToReplace: otpobj//<json containing data to be replaced in template>
					};
	
					let send = await helper.sendTemplateMail(mailOptions);
					console.log("send>>>",send);

					req.flash('success',"Password reset link sent to your email address");
					if (req.query && req.query.type == 'resend') {
						res.send('/admin');
					} else {
						res.redirect('/admin');
					}
				}else{
					req.flash('error',"Email-id is wrong.");
					if (req.query && req.query.type == 'resend') {
						res.send('/forget');
					} else {
						res.redirect('/forget');
					}
				}
			}else{
				req.flash('error',"Please enter email-id.");
				if (req.query && req.query.type == 'resend') {
					res.send('/forget');
				} else {
					res.redirect('/forget');
				}
			}
		}catch(err){
			console.log("forgot password:::::::::::>> err:", err);
			req.flash('error',"Email-id is wrong.");
			if (req.query && req.query.type == 'resend') {
				res.send('/forget');
			} else {
				res.redirect('/forget');
			}
		}
	};

	
	module.resetPassword = async function(req, res) {
	
		var txt = req.query.id;
		console.log("txt",txt);
	
		
		if (txt) {
			// var obj = helper.dec(txt);
			// console.log("obj",obj);
			
			// if (obj && obj.id) {

				// var dt = new Date();
				// var linkDate = new Date(parseInt(obj.time));

				// var diff = helper.getTimeDiff(linkDate, dt, 'minute');
				// if (diff <= 5) { //if link clicked within 5 minutes else link expires
					var userDetail = await model.User.findOne({_id: txt});
					console.log('userDetail: -------->',userDetail);
					
					if (userDetail) {

						res.render('admin/auth/resetPassword', {
							title: "Reset Password",
							error: req.flash("error"),
							success: req.flash("success"),
							vErrors: req.flash("vErrors"),
							session: req.session,
							settings: settings, //Global variable
							config: config
						});
					} else {
						//user not found
						console.log('resetPassword---11------>>>"user not found"');
						res.send('link is invalid or expired');
					}
				// } else {
				// 	//link expires
				// 	console.log('resetPassword---22------>>>>"user not found"');
				// 	res.send('link expired');
				// }
			// } else {
			// 	//invalid link
			// 	console.log('resetPassword--------->>>>"invalid link"');
			// 	res.send('invalid link');
			// }
		} else {
			//broken link
			console.log('resetPassword--------->>>"broken link"');
			res.send('broken link');
		}
	}

	module.resetPasswordPost = async function(req, res) {
		
		console.log('resetPasswordPost------------>>>req.query: ',req.query);
		var resetId = req.query.id;
		if (resetId) {
			// var obj = helper.dec(resetId);
			
			// if (obj && obj.id && obj.pswd && obj.time) {

				// var dt = new Date();
				// var linkDate = new Date(parseInt(obj.time));

				// var diff = helper.getTimeDiff(linkDate, dt, 'minute');
				// console.log('resetPasswordPost--------->>>diff: ',diff,' dt: ',dt,' linkDate: ',linkDate);
				// if (diff <= 5) { //if link clicked within 5 minutes else link expires
					var userDetail = await model.User.findOne({_id: resetId});
					console.log("user,.,><<<,>>>>>>>>",userDetail);
					
					if (userDetail) {
						
						let newPassword = md5(req.body.newPassword);
						var updateData = await userDetail.updateOne({password:newPassword});

						req.flash('success',"Password change successfully.");
						res.redirect('/admin');
					} else {
						//user not found
						req.flash('error',"Link is invalid or expired");
						res.redirect('/reset?id='+resetId);			
					}
				// } else {
				// 	//link expires
				// 	req.flash('error',"Sorry! link is expired");
				// 	res.redirect('/reset?id='+resetId);		
				// }
			// } else {
			// 	req.flash('error',"Something went wrong...");
			// 	res.redirect('/reset?id='+resetId);	
			// }
		} else {
			req.flash('error',"Oops! something went wrong...");
			res.redirect('/reset');
		}
	}

	module.sessionTimeout = async function(req, res){

	    if(req.session.admin) {	    		
        		return res.send({status:"success",'message':"User Data logged in......"});
	    } else {
	        return res.send({status:"fail",'message':"Please Login......"});	        
        	    }
	}
	return module;
}


function generatePassword(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyz#$%^&@';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}