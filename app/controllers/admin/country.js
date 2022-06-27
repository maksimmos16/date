
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/country/list', {
				title: 'All Country List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'country'
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.countryList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {$or:[
				{name:{ $regex: '.*' + search + '.*' , $options:'i'}},
				{countryCode:{ $regex: '.*' + search + '.*', $options:'i' }},
				{isoCode:{ $regex: '.*' + search + '.*', $options:'i' }}
			]};

			let columns = [
				'_id',
				'name',
				'countryCode',
				'isoCode'
			]

			let countryCount = await model.Country.countDocuments(query);
			let countrydata = await model.Country.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});
			
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': countryCount,
				'recordsFiltered': countryCount,
				'data': countrydata
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in countryList",e);
        }
	}

	// [ Add - Render ]
	module.add = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/country/add', {
				title: 'Add Country',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'country',
				country : null
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Add - Country ]
	module.addCountry = async function(req, res){
		try {
			if(req.session.admin){

				let name = req.body.countryName;
				let countryCode = req.body.countryCode;
				let isoCode = req.body.isoCode;
				isoCode = isoCode.toUpperCase();

				let valFields = await model.Country.findOne({$or:[{name:name},{countryCode:countryCode},{isoCode:isoCode}]});
				if(valFields){
					req.flash('error',"Make sure entered fields are unique.");
					res.redirect('/admin/country');
				} else {
					let countryData = await model.Country.create({
						name: name,
						countryCode: countryCode,
						isoCode: isoCode
					});
					
					if(countryData != null){
						req.flash('success',"Country Added Successfully.");
						res.redirect('/admin/country');
					}else{
						req.flash('error',"Country Not Added, Please Try Again.");
						res.redirect('/admin/country');
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

	// [ Delete - Country ]
	module.delete = async function(req, res){
		try{
			if(req.session.admin){
				let countryId = req.params.id;
				let countryData = await model.Country.findOne({'_id': countryId});
				if(countryData){
					await model.Country.deleteOne({'_id': countryId});
					req.flash('success',"Country Deleted Successfully");
					res.redirect('/admin/country');
				} else {
					req.flash('error',"Country detail not found, Please try again.");
					res.redirect('/admin/country');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/country');
		}
	}

	// [ Edit - Render ]
	module.editCountry = async function(req, res){
		try{
			if(req.session.admin){
				let countryData = await model.Country.findOne({'_id': req.params.id});
				if(countryData){
					res.render('admin/country/edit', {
						title: 'Edit Country Detail',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'country',
						country : countryData
					});
				} else {
					req.flash('error',"Country detail not found, Please try again.");
					res.redirect('/admin/country');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/country');
		}
	}

	// [ Update - Country ]
	module.updateCountry = async function(req, res){
		try{
			var countryId = req.params.id;
			if(req.session.admin){

				let name = req.body.countryName;
				let countryCode = req.body.countryCode;
				let isoCode = req.body.isoCode;
				isoCode = isoCode.toUpperCase();

				let valFields = await model.Country.findOne({$or:[{name:name},{countryCode:countryCode},{isoCode:isoCode}]});

				let updateCountry = true;

				if(valFields){
					if(valFields.id != countryId ){
						updateCountry = false;
					} else {
						updateCountry = true;
					}
				}

				if(updateCountry == false){
					req.flash('error',"Make sure entered fields are unique.");
					res.redirect('/admin/country');
				} else {

					let countryData = await model.Country.findOne({'_id': countryId});
					if(countryData){
						var update_country = {
							countryCode : countryCode,
							name : name,
							isoCode : isoCode
						}
	
						await model.Country.updateMany({'_id': countryId},update_country);
						req.flash('success','Country Detail Update Successfully');
						res.redirect('/admin/country')
					} else {
						req.flash('error',"Country Detail Not Found, Please Try Again");
						res.redirect('/admin/country');
					}
				}
				
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/country');
		}
	}

	return module;
}