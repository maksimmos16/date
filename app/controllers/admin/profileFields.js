
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/profileFields/list', {
				title: 'All Profile Fields',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'profileField'
			});
		} else {
			res.redirect('/admin');
		}
	}
    
    // [ Filter ]
	module.profileFieldsList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {$or:[
				{title:{ $regex: '.*' + search + '.*' }},
				{type:{ $regex: '.*' + search + '.*' }}
            ],'isDeleted':false };
            
			let columns = [
				'slug',
				'title',
				'options',
				'type',
				'inIdealInfo'
			]

			let pfCount = await model.ProfileFields.countDocuments(query);
			let pfdata = await model.ProfileFields.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});
			
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': pfCount,
				'recordsFiltered': pfCount,
				'data': pfdata
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in profileFieldsList",e);
        }
	}

	// [ Add - Form ]
	module.add = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/profileFields/add', {
				title: 'Add Profile Fields',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'profileField'
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Add - Profile Field ]
	module.addProfileFields = async function(req, res){
		try {
			
            if(req.session.admin){

                let pfOption = req.body['pfOption'];
                if (typeof pfOption == 'string') {
                    pfOption = [pfOption];
                }
            
                pfOption = pfOption.map(function(data){
                    return data.trim();
                });

                let pfKey = req.body.pfKey;
				pfKey = pfKey.toLowerCase();
                // pfKey = pfKey.split(' ').join('_');
                pfKey = pfKey.replace(/\s+/g,"_");

                let pfTitle = req.body.pfTitle;
				let pfType  = req.body.pfType;
				let inIdealInfo = false;

				if(req.body.inIdeal){
					if(req.body.inIdeal == 'on'){
						inIdealInfo = true;
					}
				} else {
					inIdealInfo = false;
				}

                let create_pfData = {
					slug    	: pfKey,
					type   		: pfType,
					options 	: pfOption,
					title   	: pfTitle,
					inIdealInfo	: inIdealInfo
                }
                                
                let slugExists = await model.ProfileFields.findOne({slug:pfKey});

                if(slugExists){
                    if(slugExists.slug == pfKey){
						req.flash('error',"Field Key Should Be Unique.");
						res.redirect('/admin/profileFields');
					}
                } else {

                    let pfData = await model.ProfileFields.create(create_pfData);
                    
                    if(pfData != null){
                        req.flash('success',"Profile Field Added Successfully.");
                        res.redirect('/admin/profileFields');
                    }else{
                        req.flash('error',"Profile Field Not Added. Please Try Again.");
                        res.redirect('/admin/profileFields');
                    }
                }
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/profileFields');
		}
	}

	// [ Delete ]
	module.delete = async function(req, res){
		try{
			if(req.session.admin){
				let pfId = req.params.id;
				let pfData = await model.ProfileFields.findOne({'_id': pfId});
				if(pfData){
					await model.ProfileFields.updateOne({'_id': pfId},{isDeleted:true});
					req.flash('success',"Profile Fields Deleted Successfully.");
					res.redirect('/admin/profileFields');
				} else {
					req.flash('error',"Field Detail not found, Please try again.");
					res.redirect('/admin/profileFields');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/profileFields');
		}
	}

	// [ Edit - Form ]
	module.editProfileFields = async function(req, res){
		try{
			if(req.session.admin){
				let pfData = await model.ProfileFields.findOne({'_id': req.params.id});
				if(pfData){
					res.render('admin/profileFields/edit', {
						title: 'Edit Profile Field',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						settings: settings, //Global variable
						config: config,
						alias:'profileField',
						pfData : pfData
					});
				} else {
					req.flash('error',"Field Detail not found, Please try again.");
					res.redirect('/admin/profileFields/');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/profileFields');
		}
	}

	// [ Update - Profile Field ]
	module.updateProfileFields = async function(req, res){
		try{

            if(req.session.admin){

                let pfId = req.params.id;
                
                let pfOption = req.body['pfOption'];
                if (typeof pfOption == 'string') {
                    pfOption = [pfOption];
                }
            
                pfOption = pfOption.map(function(data){
                    return data.trim();
                });

                let pfKey = req.body.pfKey;
				pfKey = pfKey.toLowerCase();
                // pfKey = pfKey.split(' ').join('_');
                pfKey = pfKey.replace(/\s+/g,"_");

                let pfTitle = req.body.pfTitle;
				let pfType  = req.body.pfType;
				let inIdealInfo = false;

				if(req.body.inIdeal){
					if(req.body.inIdeal == 'on'){
						inIdealInfo = true;
					}
				} else {
					inIdealInfo = false;
				}

                let update_pfData = {
					slug   		: pfKey,
					type   		: pfType,
					options		: pfOption,
					title   	: pfTitle,
					inIdealInfo	: inIdealInfo
                }
                                
                let slugExists = await model.ProfileFields.findOne({slug:pfKey});

                let updatePF = true;

				if(slugExists){
                    if(slugExists.id != pfId){
                        if(slugExists.slug == pfKey){
                            updatePF = false;
                        }
                    } else {
                        updatePF = true;
                    }
                }

                if(updatePF == false){
                    req.flash('error',"Field Key Should Be Unique.");
                    res.redirect('/admin/profileFields');
                } else {

                    let pfData = await model.ProfileFields.updateMany({'_id': pfId},update_pfData);
                    
                    if(pfData != null){
                        req.flash('success',"Profile Field Updated Successfully.");
                        res.redirect('/admin/profileFields');
                    }else{
                        req.flash('error',"Profile Field Not Updated. Please Try Again.");
                        res.redirect('/admin/profileFields');
                    }
                }
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/questions');
		}
	}

	return module;
}