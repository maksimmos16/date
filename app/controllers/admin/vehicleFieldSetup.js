
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/vehicleFieldSetup/list', {
				title: 'All VehicleFieldSetup List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'vehicleFieldSetup'
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.vehicleFieldSetupList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {  fieldName: { $regex: '.*' + search + '.*' } };
			
			
			let vehicleFieldSetupCount = await model.VehicleFieldSetup.countDocuments(query);
			
			let tmp = await model.VehicleFieldSetup.aggregate( [
				{
				   $graphLookup: {
					  from: "vehiclefieldsetups",
					  startWith: "$_id",
					  connectFromField: "_id",
					  connectToField: "parentFieldId",
					  as: "childParent"
				   }
				},
				{ "$skip": start },
				{ "$limit": length },
				{ "$sort" : { "_id" : 1 } },
				{ $match : query }
			]);

			var obj = {
				'draw': req.query.draw,
				'recordsTotal': vehicleFieldSetupCount,
				'recordsFiltered': vehicleFieldSetupCount,
				'data': tmp
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in vehicleFieldSetupList",e);
        }
	}

	// [ Add - Form ]
	module.add = async function(req, res){
		if(req.session.admin){
            let parentField = await model.VehicleFieldSetup.find();
		   	res.render('admin/vehicleFieldSetup/add', {
				title: 'All VehicleFieldSetups',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias:'vehicleFieldSetup',
				parentField : parentField
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Add - Page ]
	module.addvehicleFieldSetup = async function(req, res){
		try {
			if(req.session.admin){

                // [ ParentId Check Post ]
                let tmp = (req.body.parentFieldId == '') ? null : req.body.parentFieldId;
                let tmpId = (tmp == null ) ? null : mongoose.Types.ObjectId(tmp);

				var spageData = await model.VehicleFieldSetup.create({
					fieldName: req.body.fieldName,
                    parentFieldId: tmpId,
                    isVisible: 0,
					is_deleted: 0
				});
				if(spageData != null){
					req.flash('success',"VehicleFieldSetup Add Successfully...");
					res.redirect('/admin/vehicleFieldSetup');
				}else{
					req.flash('error',"VehicleFieldSetup Not Add. Please Try Again...");
					res.redirect('/admin/vehicleFieldSetup');
				}		
			} else {
				res.redirect('/admin/vehicleFieldSetup');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/vehicleFieldSetup');
		}
	}

	// [ Delete ]
	module.deletePage = async function(req, res){
		try{
			if(req.session.admin){
				let delId = req.params.id;
				let tmp = await model.VehicleFieldSetup.findOne({'_id': delId});
				if(tmp){
					await model.VehicleFieldSetup.deleteOne({'_id': delId});
					req.flash('success',"VehicleFieldSetup Delete Successfully");
					res.redirect('/admin/vehicleFieldSetup');
				} else {
					req.flash('error',"CMS Page detail not found. Please try again.");
					res.redirect('/admin/vehicleFieldSetup');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/vehicleFieldSetup');
		}
	}

	// [ Edit - Form ]
	module.editPageDetail = async function(req, res){
		try{
			if(req.session.admin){
                let vehicleFieldSetup = await model.VehicleFieldSetup.findOne({'_id': req.params.id});
				let vfs = await model.VehicleFieldSetup.findOne({'_id': vehicleFieldSetup.parentFieldId});
				let tmp = await model.VehicleFieldSetup.find({'_id': { $ne : req.params.id }});
				
				if(vehicleFieldSetup){
					res.render('admin/vehicleFieldSetup/edit', {
						title: 'Edit VehicleFieldSetup Detail',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						settings: settings, //Global variable
						config: config,
						alias:'vehicleFieldSetup',
						vehicleFieldSetup : vehicleFieldSetup,
						vfs: vfs,
                        editData: tmp
					});
				} else {
					req.flash('error',"CMS Page detail not found. Please try again.");
					res.redirect('/admin/vehicleFieldSetup');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
            console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/vehicleFieldSetup');
		}
	}

	// [ Edit - Page ]
	module.updatePageDetail = async function(req, res){
		try{
			var delId = req.params.id;
			if(req.session.admin){
				let tmp = await model.VehicleFieldSetup.findOne({'_id': delId});
				if(tmp){
					var updatesupportPageData = { 
						fieldName : req.body.fieldName,
                        parentFieldId : req.body.parentFieldId
					}
					await model.VehicleFieldSetup.updateOne({'_id': delId},updatesupportPageData);
					req.flash('success','VehicleFieldSetup Detail Update Successfully');
					res.redirect('/admin/vehicleFieldSetup')
				} else {
					req.flash('error',"VehicleFieldSetup Detail Not Found, Please Try Again");
					res.redirect('/admin/vehicleFieldSetup');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/vehicleFieldSetup');
		}
	}

	return module;
}
