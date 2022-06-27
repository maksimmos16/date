module.exports = function (model, config) {
	var module = {};

	module.list = async function(req, res) {
		if(req.session.admin){
		   	res.render('admin/location/list', {
				title: 'All Location List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias:'location'
			});
		} else {
			res.redirect('/admin');
		}
	}

	module.getListData = async function(req, res) {
		try {
			// console.log('getListData--------->>>>req.body: ',req.body);
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {$or:[
				{name:{ $regex: '.*' + search + '.*' , $options:'i'}},
				{decription:{ $regex: '.*' + search + '.*', $options:'i' }}
			],isDeleted: false};

			let columns = [
				'_id',
				'name',
				'price',
				'status'
			]

			let locationCount = await model.Location.countDocuments(query);
			let locationData = await model.Location.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});

			
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': locationCount,
				'recordsFiltered': locationCount,
				'data': locationData
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in countryList",e);
        }
	}

	module.add = async function(req, res) {
		if(req.session.admin){
		   	res.render('admin/location/add', {
				title: 'Add Location',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'location'				
			});
		} else {
			res.redirect('/admin');
		}
	}

	module.save = async function(req, res) {
		try {
			if(req.session.admin){

				let name = req.body.name;
				let price = req.body.price;
				let lat = parseInt(req.body.lat);
				let long = parseInt(req.body.long);
				let status = req.body.status;
				if (isNaN(lat)) {
					lat = 0;
				}
				if (isNaN(long)) {
					long = 0;
				}

				let isExists = await model.Location.countDocuments({name:name, isDeleted: false});
				if(isExists){
					req.flash('error',"Make sure entered location is not already exists.");
					res.redirect('/admin/location');
				} else {
					let countryData = await model.Location.create({
						name: name,
						price: price,
						status: status,
						location: {
							type: 'Point',
							coordinates: [long,lat]
						}
					});
					
					if(countryData){
						req.flash('success',"Location Added Successfully.");
						res.redirect('/admin/location');
					} else{
						req.flash('error',"Location Not Added, Please Try Again.");
						res.redirect('/admin/location');
					}
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/country');
		}
	}

	module.edit = async function(req, res) {
		try{
			if(req.session.admin){
				let locationData = await model.Location.findOne({'_id': req.params.id, isDeleted: false}).lean();
				if(locationData){
					let lat = 0;
					let long = 0;
					if (locationData.location) {
						if (locationData.location.coordinates && locationData.location.coordinates.length == 2) {
							lat = locationData.location.coordinates[1];
							long = locationData.location.coordinates[0];
						}
					}
 
					locationData.lat = lat;
					locationData.long = long;

					res.render('admin/location/edit', {
						title: 'Edit Location Detail',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'location',
						location : locationData
					});
				} else {
					req.flash('error',"Location detail not found, Please try again.");
					res.redirect('/admin/location');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/location');
		}
	}

	module.update = async function(req, res) {
		try{
			var locationId = req.params.id;
			if(req.session.admin){

				let name = req.body.name;
				let price = req.body.price;
				let lat = parseInt(req.body.lat);
				let long = parseInt(req.body.long);
				let status = req.body.status;

				if (isNaN(lat)) {
					lat = 0;
				}
				if (isNaN(long)) {
					long = 0;
				}

				let isExists = await model.Location.countDocuments({_id: {$ne: locationId}, name: name, isDeleted: false, });

				if(isExists){
					req.flash('error',"Make sure entered location is not already exists.");
					res.redirect('/admin/location');
				} else {

					let locationData = await model.Location.findOne({'_id': locationId, isDeleted: false});
					if(locationData){
						var upData = {
							name : name,
							price: price,
							status: status,
							location: {
								type: 'Point',
								coordinates: [long,lat]
							}
						}
	
						await model.Location.updateOne({'_id': locationId},upData);
						req.flash('success','Location Update Successfully');
						res.redirect('/admin/location')
					} else {
						req.flash('error',"Location Not Exists, Please Try Again");
						res.redirect('/admin/location');
					}
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('location >> update------------->>>>error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/location');
		}
	}

	module.delete = async function (req, res) {
		try{
			if(req.session.admin){
				let locationId = req.params.id;
				let tmp = await model.Location.findOne({'_id': locationId});
				if(tmp){
					await model.Location.updateOne({_id: mongoose.Types.ObjectId(locationId)},{isDeleted: true});
					req.flash('success',"Location Delete Successfully");
					res.redirect('/admin/location');
				} else {
					req.flash('error',"Location detail not found. Please try again.");
					res.redirect('/admin/location');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/location');
		}
	}
	return module;
}