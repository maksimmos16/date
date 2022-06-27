
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/city/list', {
				title: 'All City List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias:'city'
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.cityList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {$or:[
				{stateName:{ $regex: '.*' + search + '.*', $options:'i' }},
				{countryName:{ $regex: '.*' + search + '.*', $options:'i' }},
				{cityName: { $regex: '.*' + search + '.*', $options:'i' }}
			]};

			let cityCount = await model.City.countDocuments();
			let cityData = await model.City.aggregate([
				{
					$lookup:
					{
					  from: "states",		
					  localField: "stateId",
					  foreignField: "_id",
					  as: "state"
					}
				},
				{
					$unwind:'$state'
				},
				{
					$lookup:
					{
						from: "countries",
						localField: 'state.countryId',
						foreignField: "_id",
						as: "country"
					}
				},
			   	{ 
					$project : 
					{ 
						cityName : '$name',
						countryName : '$country.name',
						stateName: '$state.name'
					}
				},
				{ "$skip": start },
				{ "$limit" : length },
				{ "$sort" : { "_id" : -1 } },
				{ $match : query },
			]);

			var obj = {
				'draw': req.query.draw,
				'recordsTotal': cityCount,
				'recordsFiltered': cityCount,
				'data': cityData
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in cityList",e);
        }
	}

	// [ Add - Form ]
	module.add = async function(req, res){
		if(req.session.admin){

			let country = await model.Country.find({},{name:1});
			let state = await model.State.find({},{name:1});

		   	res.render('admin/city/add', {
				title: 'Add City',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'city',
				country : country,
				state: state,
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Add - City ]
	module.addCity = async function(req, res){
		try {
			if(req.session.admin){
				
				let cityName = req.body.cityName;
				let stateId = req.body.stateId;

				let valFields = await model.City.findOne({$and:[{name:cityName},{stateId:stateId}]});
				if(valFields){
					req.flash('error',"Make sure entered fields are unique.");
					res.redirect('/admin/city');
				} else {

					let cityData = await model.City.create({
						name: cityName,
						stateId: stateId
					});
					if(cityData != null){
						req.flash('success',"City Added Successfully.");
						res.redirect('/admin/city');
					}else{
						req.flash('error',"City Not Added, Please Try Again.");
						res.redirect('/admin/city');
					}		
				}
			} else {
				res.redirect('/admin/city');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/city');
		}
	}

	// [ Get States ]
	module.getStates = async function(req, res){
		try {
			if(req.session.admin){
				
				let countryId = req.body.countryId;
				
				if(countryId != ''){

					let states = await model.State.find({'countryId': countryId},{name:1});
					res.send(states);
				} else {
					let states = [];
					res.send(states);
				}
			} else {
				res.redirect('/admin/city');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/city');
		}
	}

	// [ Delete ]
	module.delete = async function(req, res){
		try{
			if(req.session.admin){
				let cityId = req.params.id;
				let cityData = await model.City.findOne({'_id': cityId});
				if(cityData){
					await model.City.deleteOne({'_id': cityId});
					req.flash('success',"City Deleted Successfully");
					res.redirect('/admin/city');
				} else {
					req.flash('error',"City detail not found. Please try again.");
					res.redirect('/admin/city');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/city');
		}
	}

	// [ Edit - Form ]
	module.editCity = async function(req, res){
		try{
			if(req.session.admin){

				let city = await model.City.findOne({'_id': req.params.id});
				let country = await model.Country.find({},{name:1});
				let cityId = mongoose.Types.ObjectId(req.params.id);
				
				// [ Edit Data ]
				let cityData = await model.City.aggregate([
					{ $match : { '_id' : cityId } },
					{
						$lookup:
						{
						  from: "states",
						  localField: "stateId",
						  foreignField: "_id",
						  as: "state"
						}
					},
					{
						$unwind:'$state'
					},
					{
						$lookup:
						{
							from: "countries",
							localField: 'state.countryId',
							foreignField: "_id",
							as: "country"
						}
					},
					   { 
						$project : 
						{ 
							cityName : '$name',
							countryName : '$country.name',
							stateName: '$state.name'
						}
					}
				]);
				
				// [ Selected Country's States ]
				let state = await model.State.find({'_id': city.stateId},{name:1});
				
				if(city){
					res.render('admin/city/edit', {
						title: 'Edit City',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'city',
						city : city,
						state: state,
						country: country,
						editData: cityData
					});
				} else {
					req.flash('error',"City detail not found. Please try again.");
					res.redirect('/admin/city');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/city');
		}
	}

	// [ Edit - City ]
	module.updateCity = async function(req, res){
		try{
			var cityId = req.params.id;
			if(req.session.admin){

				let cityName = req.body.cityName;
				let stateId = req.body.stateId;

				let valFields = await model.City.findOne({$and:[{name:cityName},{stateId:stateId}]});
				
				let updateCity = true;

				if(valFields){
					if(valFields.id != cityId ){
						updateCity = false;
					} else {
						updateCity = true;
					}
				}

				if(updateCity == false){
					req.flash('error',"Make sure entered fields are Unique.");
					res.redirect('/admin/city');
				} else {

					let cityData = await model.City.findOne({'_id': cityId});
					if(cityData){
						let update_city = {
							name : cityName,
							stateId : stateId
						}
						
						await model.City.updateMany({'_id': cityId},update_city);
						
						req.flash('success','City Detail Updated Successfully.');
						res.redirect('/admin/city')
					} else {
						req.flash('error',"City Detail Not Found, Please Try Again");
						res.redirect('/admin/city');
					}
				}

			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/city');
		}
	}

	return module;
}