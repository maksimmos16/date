var dateformat = require('dateformat');
var currentDate = new Date();
var md5 = require('md5');
var fs = require('fs');

module.exports = function(model,config){	
	var module = {};

	// [ Contact View ]
	module.view = async function(req, res){
		if(req.session.admin){
			var contList = await model.Contact.find({'role': { $ne : 'admin' }});
			
			res.render('admin/contact/list', {
				title: 'All Contact List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'contact',
				contList: contList,
			});
		} else {
			res.redirect('/admin');
		}

	};

	// [ Filter ]
	module.contList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {  username: { $regex: '.*' + search + '.*' }, role: { $ne : 'admin'}, 'is_deleted': 0 };
			let columns = [
				'_id',
				'username',
				'contactDetails',
				'msg',
				'comId',
				'reply',
				'created_at',
				'status'
			]

			let countryCount = await model.Contact.countDocuments(query);
			let countryCount32 = await model.Contact.distinct("comId");
			query.comId = { '$in' : countryCount32 };
			let data32 = await model.Contact.find(query);
			let data = await model.Contact.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': countryCount,
				'recordsFiltered': countryCount,
				'data': data
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in countryList",e);
        }
	}

	// [ View Profile ]
	module.viewReply = async function(req, res){

		let conDt = await model.Contact.find({ comId: req.params.id});
		let adminDetail = '';
		if(conDt){
			adminDetail = await model.User.findOne({ _id: conDt[0].userId});
		}
		res.render('admin/contact/viewContact', {
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			session: req.session,
			settings: settings, //Global variable
			config: config,
			alias:'contact',
			adminDetail: adminDetail,
			conDt: conDt
		});
	};

    // [ Reply ]
	module.replyPage = async function(req, res){

		let contData = await model.Contact.findOne({ _id: req.params.id});

		res.render('admin/contact/reply', {
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			session: req.session,
			settings: settings, //Global variable
			config: config,
			contData: contData,
		});
	};

    module.reply = async function(req, res){
        try{
			
			var contactData = await model.Contact.findOne({'_id':req.params.id});

			// [ Mail Send ]
			var mailOptions = {					  	
				to_email: contactData.contactDetails,
				subject: 'IVI ( Innovative Vehicle Initiative ) : Reply',
				message: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
							<html xmlns="http://www.w3.org/1999/xhtml">
								<head>
									<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
									<title>IVI | One Time Password </title>
									<style> body { background-color: #FFFFFF; padding: 0; margin: 0; } </style>
								</head>
							
								<body style="background-color: #FFFFFF; padding: 0; margin: 0;">
									<table border="0" cellpadding="0" cellspacing="10" height="100%" bgcolor="#FFFFFF" width="100%" style="max-width: 650px;" id="bodyTable">
										<tr>
											<td align="center" valign="top">
												<table border="0" cellpadding="0" cellspacing="0" width="100%" id="emailContainer" style="font-family:Arial; color: #333333;">
													<!-- Logo -->
													<tr>
														<td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding-bottom: 10px;">
															<img alt="`+config.siteName+`" border="0" src="`+config.baseUrl+`/admin/images/icon/logo.png" title="`+config.siteName+`" class="sitelogo" width="60%" style="max-width:250px;" />
														</td>
													</tr>
													<!-- Title -->
													<tr>
														<td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding: 20px 0 10px 0;">
															<span style="font-size: 18px; font-weight: normal;">Dear `+contactData.username+`, `+req.body.reply+`</span></br>
														</td>
													</tr>
													<!-- Messages -->
													<tr>
														<td align="left" valign="top" colspan="2" style="padding-top: 10px;">
															<span style="font-size: 12px; line-height: 1.5; color: #333333;">
																`+config.siteName+` Customer Service
															</span>
														</td>
													</tr>
												</table>
											</td>
										</tr>
									</table>
								</body>
							</html>`
			};
			
			await helper.sendMail(mailOptions);

			await model.Contact.updateOne({'_id':req.params.id},{
				'reply': req.body.reply,
				'status': 'resolve',
				'updated_at' : currentDate
			});
			req.flash('success',"Mail Sent & Preblem Resolve.");
			res.redirect('/admin/contactUs');
        }
        catch(error){
            console.log('Error: ',error);
        }
    }

	// [ Delete User ]
	module.deleteUser = async function(req, res){
		try{
			var userId = req.params.id;
			if(userId != "" && userId != 0){
				await model.User.updateOne({ _id: userId },{"is_deleted":"1","status":"inactive"});
				req.flash('success',"User Delete Successfully.");
				res.redirect('/admin/user');
			}else{
				req.flash('error',"User Not Delete.");
				res.redirect('/admin/user');
			}
		}catch(err){
			console.log("user >> delete::::::::::>>error: ", error);
			req.flash('error',"User not delete.");
			res.redirect('/admin/user');
		}
	};

	return module;
}