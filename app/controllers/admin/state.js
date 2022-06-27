
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/state/list', {
				title: 'All State List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias:'state',
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.stateList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {$or:[
							{stateName:{ $regex: '.*' + search + '.*', $options:'i' }},
							{countryName:{ $regex: '.*' + search + '.*', $options:'i' }}
						]};

			let stateCount = await model.State.countDocuments();
			let stateData = await model.State.aggregate([
				{
				  $lookup:
					{
					  from: "countries",
					  localField: "countryId",
					  foreignField: "_id",
					  as: "country"
					}
			   	},
			   	{ $project : { 
				   stateName : '$name',
				   countryName : '$country.name'
				}},
				{ "$skip": start },
				{ "$limit" : length },
				{ "$sort" : { "_id" : -1 } },
				{ $match : query },
			]);

			var obj = {
				'draw': req.query.draw,
				'recordsTotal': stateCount,
				'recordsFiltered': stateCount,
				'data': stateData
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in StateList",e);
        }
	}

	// [ Add - Form ]
	module.add = async function(req, res){
		if(req.session.admin){

			let country = await model.Country.find({},{name:1});

		   	res.render('admin/state/add', {
				title: 'Add States',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias:'state',
				country : country
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Add - State ]
	module.addState = async function(req, res){
		try {
			if(req.session.admin){
				
				let stateName = req.body.stateName;
				let countryId = req.body.countryId;

				let valFields = await model.State.findOne({$and:[{name:stateName},{countryId:countryId}]});
				if(valFields){
					req.flash('error',"Make sure entered fields are unique.");
					res.redirect('/admin/state');
				} else {

					let stateData = await model.State.create({
						name: stateName,
						countryId: countryId
					});
					if(stateData != null){
						req.flash('success',"State Added Successfully.");
						res.redirect('/admin/state');
					}else{
						req.flash('error',"State Not Added, Please Try Again.");
						res.redirect('/admin/state');
					}
				}
				
			} else {
				res.redirect('/admin/state');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/state');
		}
	}

	// [ Delete ]
	module.delete = async function(req, res){
		try{
			if(req.session.admin){
				let delId = req.params.id;
				let tmp = await model.State.findOne({'_id': delId});
				if(tmp){
					await model.State.deleteOne({'_id': delId});
					req.flash('success',"State Deleted Successfully");
					res.redirect('/admin/state');
				} else {
					req.flash('error',"State Detail not found. Please try again.");
					res.redirect('/admin/state');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/state');
		}
	}

	// [ Edit - Render ]
	module.editState = async function(req, res){
		try{
			if(req.session.admin){

				let state = await model.State.findOne({'_id': req.params.id});
				let countryOne = await model.Country.findOne({'_id': state.countryId});

				let country = await model.Country.find({},{name:1,isoCode:1});
				if(state){
					res.render('admin/state/edit', {
						title: 'Edit State',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'state',
						state : state,
						countryOne: countryOne,
						country: country,
					});
				} else {
					req.flash('error',"State detail not found, Please try again.");
					res.redirect('/admin/state');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/state');
		}
	}

	// [ Edit - State ]
	module.updateState = async function(req, res){
		try{
			var stateId = req.params.id;
			if(req.session.admin){

				let stateName = req.body.stateName;
				let countryId = req.body.countryId;
				
				let valFields = await model.State.findOne({$and:[{name:stateName},{countryId:countryId}]});

				let updateState = true;

				if(valFields){
					if(valFields.id != stateId ){
						updateState = false;
					} else {
						updateState = true;
					}
				}

				if(updateState == false){
					req.flash('error',"Make sure entered fields are unique.");
					res.redirect('/admin/state');
				} else {

					let stateData = await model.State.findOne({'_id': stateId});
					if(stateData){
	
						var update_state = { 
							name : stateName,
							countryId : countryId
						}
						
						await model.State.updateMany({'_id': stateId},update_state);
						req.flash('success','State Detail Updated Successfully.');
						res.redirect('/admin/state')
					} else {
						req.flash('error',"State Detail Not Found, Please Try Again.");
						res.redirect('/admin/state');
					}
				}
				
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/state');
		}
	}

	return module;
}