
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/institute/list', {
				title: 'All Institute List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'institute'
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.instituteList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {$or:[
				{instituteType:{ $regex: '.*' + search + '.*' }},
				{name:{ $regex: '.*' + search + '.*' }}
            ]};
			
			let columns = [
				'_id',
				'name',
				'instituteType'
			]

			let instituteCount = await model.Institute.countDocuments(query);
			let instituteData = await model.Institute.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});

			let obj = {
				'draw': req.query.draw,
				'recordsTotal': instituteCount,
				'recordsFiltered': instituteCount,
				'data': instituteData
            };
			
			res.send(obj);
		} catch (e) {
			console.log("Error in instituteList",e);
		}
	}

	// [ Add - Render ]
	module.add = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/institute/add', {
				title: 'Add Institute',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'institute'
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Add - Institute ]
	module.addInstitute = async function(req, res){
		try {
			if(req.session.admin){

				let instituteName = req.body.instituteName;
				let instituteType = req.body.instituteType;

				let create_institute = {
					name		        : instituteName,
					instituteType		: instituteType
				}
					
                let instituteData = await model.Institute.create(create_institute);
                
                if(instituteData != null){
                    req.flash('success',"Institute Added Successfully.");
                    res.redirect('/admin/institute');
                }else{
                    req.flash('error',"Institute Not Added, Please Try Again.");
                    res.redirect('/admin/institute');
                }
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again.");
			res.redirect('/admin/institute');
		}
	}

	// [ Delete - Institute ]
	module.delete = async function(req, res){
		try{
			if(req.session.admin){
				let instituteId = req.params.id;
				let insData = await model.Institute.findOne({'_id': instituteId});
				if(insData){
					await model.Institute.deleteOne({'_id': instituteId});
					req.flash('success',"Institute Deleted Successfully.");
					res.redirect('/admin/institute');
				} else {
					req.flash('error',"Institute detail not found, Please try again.");
					res.redirect('/admin/institute');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/institute');
		}
	}

	// [ Edit - Render ]
	module.editInstitute = async function(req, res){
		try{
			if(req.session.admin){
				let instituteList = await model.Institute.findOne({'_id': req.params.id});
				if(instituteList){
					res.render('admin/institute/edit', {
						title: 'Edit Institute',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'institute',
						instituteList : instituteList
					});
				} else {
					req.flash('error',"Institute detail not found, Please try again.");
					res.redirect('/admin/institute/');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/institute');
		}
	}

	// [ Edit - Update ]
	module.updateInstitute = async function(req, res){
		try{
			if(req.session.admin){
                
                let instituteId = req.params.id;
                let instituteName = req.body.instituteName;
				let instituteType = req.body.instituteType;

				let update_institute = {
					name		        : instituteName,
					instituteType		: instituteType
                }
                
				let instituteData = await model.Institute.findOne({'_id': instituteId});
				if(instituteData){

                    let insData = await model.Institute.updateMany({'_id': instituteId},update_institute);
                    
                    if(insData != null){
                        req.flash('success',"Institute Updated Successfully.");
                        res.redirect('/admin/institute');
                    }else{
                        req.flash('error',"Institute Not Updated, Please Try Again.");
                        res.redirect('/admin/institute');
                    }

				} else {
					req.flash('error',"Institute Detail Not Found, Please Try Again.");
					res.redirect('/admin/institute');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/institute');
		}
	}

	return module;
}