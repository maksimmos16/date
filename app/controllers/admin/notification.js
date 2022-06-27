
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/notification/list', {
				title: 'Admin Notification',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'notification',
				notifyList : null
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.notifyList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {  fieldName: { $regex: '.*' + search + '.*', $options:'i' } };
			let columns = [
				'slug',
				'fieldName',
				'description',
				'byDefault',
				'isActive'
			]

			let notifyCount = await model.Notification.countDocuments(query);
			let notifyData = await model.Notification.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});

			let obj = {
				'draw': req.query.draw,
				'recordsTotal': notifyCount,
				'recordsFiltered': notifyCount,
				'data': notifyData
			};
			
			res.send(obj);
		} catch (e) {
			console.log("Error in notifyList",e);
		}
	}

	// [ Add - Render ]
	module.add = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/notification/add', {
				title: 'Add Notification',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'notification',
				notifyList : null
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Add - Notification ]
	module.addNotify = async function(req, res){
		try {
			if(req.session.admin){
				
				let fieldName = req.body.fieldName;
				let description = req.body.description;
				let slug = req.body.notifyKey;
				slug = slug.toLowerCase();
				// slug = slug.split(' ').join('_');
				slug = slug.replace(/\s+/g,"_");
				let byDefault = false;
				let notifyStatus = false;

				if(req.body.defStatus){
					if(req.body.defStatus == 'on'){
						byDefault = true;
					}
				} else {
					byDefault = false;
				}

				if(req.body.notifyStatus){
					if(req.body.notifyStatus == 'on'){
						notifyStatus = true;
					}
				} else {
					notifyStatus = false;
				}

				let create_notify = {
					fieldName	: fieldName,
					slug		: slug,
					description	: description,
					byDefault	: byDefault,
					isActive	: notifyStatus
				}

				let slugExists = await model.Notification.findOne({slug: slug});

				if(slugExists){
					if(slugExists.slug == slug){
						req.flash('error',"Notify Key Should Be Unique.");
						res.redirect('/admin/notification');
					}
				} else {
					
					let notifyData = await model.Notification.create(create_notify);
					
					if(notifyData != null){
						req.flash('success',"Notification Added Successfully.");
						res.redirect('/admin/notification');
					} else{
						req.flash('error',"Notification Not Added, Please Try Again.");
						res.redirect('/admin/notification');
					}
				}

			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again.");
			res.redirect('/admin/notification');
		}
	}

	// [ Delete - Notification ]
	module.deleteNotify = async function(req, res){
		try{
			if(req.session.admin){
				let notifyId = req.params.id;
				let notifyData = await model.Notification.findOne({'_id': notifyId});
				if(notifyData){
					await model.Notification.deleteOne({'_id': notifyId});
					req.flash('success',"Notification Deleted Successfully.");
					res.redirect('/admin/notification');
				} else {
					req.flash('error',"Notification detail not found, Please try again.");
					res.redirect('/admin/notification');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/notification');
		}
	}

	// [ Status - Notification ]
	module.statusNotify = async function(req, res){
		try{
			if(req.session.admin){
				let notifyId = req.params.id;
				let notifyData = await model.Notification.findOne({'_id': notifyId});

				let statusNotify = true;
				
				if(notifyData){

					if(notifyData.isActive == true){
						statusNotify = false;
					} else {
						statusNotify = true;
					}

					await model.Notification.updateOne({'_id': notifyId},{isActive: statusNotify});
					req.flash('success',"Notification Status Changed Successfully.");
					res.redirect('/admin/notification');
				} else {
					req.flash('error',"Notification detail not found, Please try again.");
					res.redirect('/admin/notification');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/notification');
		}
	}

	// [ Default Status - Notification ]
	module.defStatus = async function(req, res){
		try{
			if(req.session.admin){
				let notifyId = req.params.id;
				let notifyData = await model.Notification.findOne({'_id': notifyId});

				let defStatus = true;
				
				if(notifyData){

					if(notifyData.byDefault == true){
						defStatus = false;
					} else {
						defStatus = true;
					}

					await model.Notification.updateOne({'_id': notifyId},{byDefault: defStatus});
					req.flash('success',"Default Notification Status Changed Successfully.");
					res.redirect('/admin/notification');
				} else {
					req.flash('error',"Notification detail not found, Please try again.");
					res.redirect('/admin/notification');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/notification');
		}
	}

	// [ Edit - Render ]
	module.editNotify = async function(req, res){
		try{
			if(req.session.admin){
				let notifyList = await model.Notification.findOne({'_id': req.params.id});
				if(notifyList){
					res.render('admin/notification/edit', {
						title: 'Edit Notification',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						settings: settings, //Global variable
						config: config,
						alias:'notification',
						notifyList : notifyList
					});
				} else {
					req.flash('error',"Notification detail not found, Please try again.");
					res.redirect('/admin/notification');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/notification');
		}
	}

	// [ Edit - Update ]
	module.updateNotify = async function(req, res){
		try{
			if(req.session.admin){
				
				let notofyId = req.params.id;
				let notifyList = await model.Notification.findOne({'_id': notofyId});

				let fieldName = req.body.fieldName;
				let description = req.body.description;
				let slug = req.body.notifyKey;
				slug = slug.toLowerCase();
				// slug = slug.split(' ').join('_');
				slug = slug.replace(/\s+/g,"_");
				let byDefault = false;
				let notifyStatus = false;

				if(req.body.defStatus){
					if(req.body.defStatus == 'on'){
						byDefault = true;
					}
				} else {
					byDefault = false;
				}

				if(req.body.notifyStatus){
					if(req.body.notifyStatus == 'on'){
						notifyStatus = true;
					}
				} else {
					notifyStatus = false;
				}

				let update_notify = {
					fieldName	: fieldName,
					slug		: slug,
					description	: description,
					byDefault	: byDefault,
					isActive	: notifyStatus
				}

				let slugExists = await model.Notification.findOne({slug: slug});
				let updateNotify = true;

				if(slugExists){
					if(slugExists.id != notifyList.id){
						if(slugExists.slug == slug){
							updateNotify = false;
						}
					} else {
						updateNotify = true;
					}
				}

				if(updateNotify == false){

					req.flash('error',"Notify Key Should Be Unique.");
					res.redirect('/admin/notification');
					
				} else {
					
					let notifyData = await model.Notification.updateMany({'_id': notofyId},update_notify);
					
					if(notifyData != null){
						req.flash('success',"Notification Updated Successfully.");
						res.redirect('/admin/notification');
					}else{
						req.flash('error',"Notification Not Updated, Please Try Again.");
						res.redirect('/admin/notification');
					}	
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/notification');
		}
	}

	return module;
}