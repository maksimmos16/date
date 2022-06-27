
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/userImage/list', {
				title: 'User Image',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'userImage',
				userImageList : null
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.userImageList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			let query = {'isDeleted' : false}

			let userQuery = { 'userData.isDeleted':false };
			console.log('userQuery : ',userQuery);
			let dataQuery = [
				
				{ $match : query },
				{$group:
						{_id:"$userId",
						 path:{$push: "$path"}},						
						},
				{
				  $lookup:
						{   
						  from: "users",
						  localField: "_id",
						  foreignField: "_id",
						  as: "userData"
						}
				},
				{ $unwind:
					'$userData'
				},
				{ $match : userQuery },
				{ $project : { 
				   path : {$size:"$path"},
				   username : '$userData.username'
				}}
			];

			let dataQuery32 = [
				
				{ $match : query },
				{$group:
						{_id:"$userId",
						 path:{$push: "$path"}},						
						},
				{
				  $lookup:
						{   
						  from: "users",
						  localField: "_id",
						  foreignField: "_id",
						  as: "userData"
						}
				},
				{ $unwind:
					'$userData'
				},
				{ $match : userQuery },
				{ $project : { 
				   path : {$size:"$path"},
				   username : '$userData.username'
				}},
				{
			      $count: "totalCount"
			    }
			];


			var tmp = [
				{ "$limit": start + length },
		        { $sort : { "_id" : -1 } },
				{ $skip: parseInt(start)}
	        ];
			dataQuery = dataQuery.concat(tmp);
			let userImageData = await model.Photo.aggregate(dataQuery);

			console.log('dataQuery: ',dataQuery);
			console.log('userImageData: ',userImageData);

			let userImageData32 = await model.Photo.aggregate(dataQuery32);
			console.log('userImageData32: ',userImageData32);

			let obj = {
				'draw': req.query.draw,
				'recordsTotal': userImageData32[0].totalCount,
				'recordsFiltered': userImageData32[0].totalCount,
				'data': userImageData
			};

			res.send(obj);
		} catch (e) {
			console.log("Error in notifyList",e);
		}
	}

	module.deleteUserImage = async function(req, res){
		try{
			if(req.session.admin){

				let userImageId = req.params.id;
				let userImageData = await model.Photo.findOne({'_id':userImageId});
				let userData = await model.User.findOne({_id:userImageData.userId});
				let comment = req.body.comment;
				if(userImageData){
					await model.Photo.updateOne({_id: mongoose.Types.ObjectId(userImageId)},{'isDeleted': true, 'deleteReason': req.body.comment});
					let sender = await model.User.findOne({_id: userImageData.userId}).select(['socketId']);
					let event = 'removeImage';
					let obj = { msg	: 'Your Image is deleted because '+comment }
						
					// helper.sendToOne(sender.socketId,event,obj);

				// 	let mailOptions = {
				// 		to_email: userData.email,
				// 		subject: 'Easy Date || Photo Deleted',
				// 		message: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
				// 					<html xmlns="http://www.w3.org/1999/xhtml">
				// 						<head>
				// 							<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
				// 							<title>Easy Date || Photo Deleted</title>
				// 							<style> body { background-color: #FFFFFF; padding: 0; margin: 0; } </style>
				// 						</head>
									
				// 						<body style="background-color: #FFFFFF; padding: 0; margin: 0;">
				// 							<table border="0" cellpadding="0" cellspacing="10" height="100%" bgcolor="#FFFFFF" width="100%" style="max-width: 650px;" id="bodyTable">
				// 								<tr>
				// 									<td align="center" valign="top">
				// 										<table border="0" cellpadding="0" cellspacing="0" width="100%" id="emailContainer" style="font-family:Arial; color: #333333;">
				// 											<!-- Logo -->
				// 											<tr>
				// 												<td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding-bottom: 10px;">
				// 													<img alt="`+config.siteName+`" border="0" src="`+config.baseUrl+`/backend/images/icon/logo.png" title="`+config.siteName+`" class="sitelogo" width="60%" style="max-width:250px;" />
				// 												</td>
				// 											</tr>
				// 											<!-- Title -->
				// 											<tr>
				// 												<td align="left" valign="top" colspan="2" style="border-bottom: 1px solid #CCCCCC; padding: 20px 0 10px 0;">
				// 													<span style="font-size: 18px; font-weight: normal;">Your Photo is Deleted Because `+req.body.comment+`</span>
				// 												</td>
				// 											</tr>
				// 											<!-- Messages -->
				// 											<tr>
				// 												<td align="left" valign="top" colspan="2" style="padding-top: 10px;">
				// 													<span style="font-size: 12px; line-height: 1.5; color: #333333;">
				// 														`+config.siteName+` Customer Service
				// 													</span>
				// 												</td>
				// 											</tr>
				// 										</table>
				// 									</td>
				// 								</tr>
				// 							</table>
				// 						</body>
				// 					</html>`
				//   };
				 	// await helper.sendMail(mailOptions);
					req.flash('success',"Photo Deleted Successfully.");
					res.redirect('/admin/userImage');
				} else {
					req.flash('error',"Photo Detail Not Found, Please try again.");
					res.redirect('/admin/userImage');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			console.log(err);
			
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/userImage');
		}
	}

	// [ Edit - Render ]
	module.editUserImage = async function(req, res){
		try{
			if(req.session.admin){
				let photoid = req.params.id;
				let query = {'isDeleted' : false,'userId': mongoose.Types.ObjectId(photoid)}
				let userImageData = await model.Photo.aggregate([
					
					{ $match : query },
					{$group:
							{_id:"$userId",
							 imageData:{$push: {_id:"$_id",path:"$path",type:"$type"}}},						
							},
					{
					  $lookup:
							{   
							  from: "users",
							  localField: "_id",
							  foreignField: "_id",
							  as: "userData"
							}
					},
					{ $unwind:
						'$userData'
					},
					{ $project : { 
					   imageData : "$imageData",
					   username : '$userData.username'
					}}
			
				]);

				console.log('userImageData: ',userImageData[0].imageData);
				
				if(userImageData){
					res.render('admin/userImage/edit', {
						title: 'Delete Image',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'userImage',
						userImageList : userImageData
					});
				} else {
					req.flash('error',"Notification detail not found, Please try again.");
					res.redirect('/admin/userImage');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			console.log(err);
			
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/userImage');
		}
	}

	module.updateUserImage = async function(req, res){
		try{
			if(req.session.admin){
				
				let notofyId = req.params.id;
				let query = {
					'userId' : notofyId
				}
				let userImageData = await model.Photo.aggregate([
				
					{ $match : query },
					{$group:
							{_id:"$userId",
							 path:{$push: "$path"}},						
							},
					{
					  $lookup:
							{   
							  from: "users",
							  localField: "_id",
							  foreignField: "_id",
							  as: "userData"
							}
					},
					{ $unwind:
						'$userData'
					},
					{ $project : { 
					   path : {$size:"$path"},
					   username : '$userData.username'
					}},
					{ $limit : length },
					{ $sort : { _id : -1 } }
				]);
					if(userImageData != null){
						req.flash('success',"Notification Updated Successfully.");
						res.redirect('/admin/userImage');
					}else{
						req.flash('error',"Notification Not Updated, Please Try Again.");
						res.redirect('/admin/userImage');
					}	

			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/userImage');
		}
	}

	return module;
}