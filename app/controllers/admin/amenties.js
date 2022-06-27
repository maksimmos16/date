var dateformat = require('dateformat');
const moment = require('moment');
var currentDate = new Date();
var md5 = require('md5');
var fs = require('fs');

module.exports = function(model,config){	
	var module = {};

	module.view = async function(req, res){
		if(req.session.admin){
			res.render('admin/amenties/list', {
				title: 'All amenties List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'amenties',
				contList: null,
			});
		} else {
			res.redirect('/admin');
		}
	};

	module.amentiesList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			let query = { amentiesName:{ $regex: '.*' + search + '.*', $options:'i' }, 'isDeleted': false };
			let columns = [
				'_id',
				'amentiesName'
			]
			let countryCount = await model.Amenties.countDocuments(query);
			let data = await model.Amenties.find(query).skip(start).limit(length).select(columns).sort({"_id": -1}).lean();
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': countryCount,
				'recordsFiltered': countryCount,
				'data': data
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in amentieslist",e);
        }
	}

    module.add = async function(req, res){
		if(req.session.admin){
            var locationData = await model.Location.find();
		   	res.render('admin/amenties/add', {
				title: 'Add amenties',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
                alias:'amenties',
                locationData: locationData 
			});
		} else {
			res.redirect('/admin');
		}
	}

    module.addAmenties = async function(req, res){
		try {
			
            let amentiesName = req.body.amentiesName;
            let locationName = req.body.locationName;
            var locationData = await model.Location.findOne({'name':locationName});
			if(req.session.admin){
				var amentiesData = await model.Amenties.create({
                    amentiesName: req.body.amentiesName,
                    placeId : locationData._id
				});
				if(amentiesData != null){
					req.flash('success',"Amenties Add Successfully...");
					res.redirect('/admin/amenties');
				}else{
					req.flash('error',"Amenties Not Add. Please Try Again...");
					res.redirect('/admin/amenties');
				}		
			} else {
				res.redirect('/admin/amenties');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/amenties');
		}
	}

    module.edit = async function(req, res){
        var amentiesData = await model.Amenties.findOne({_id: req.params.id}).lean();
        var locationName= await model.Location.findOne({_id: amentiesData.placeId});
        var locationData = await model.Location.find({_id: {$ne: locationName._id}});
		if(req.session.admin){
		   	res.render('admin/amenties/edit', {
				title: 'Add amenties Plan',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
                alias:'amenties',
                amentiesData: amentiesData,
                locationName: locationName.name,
                locationData:locationData
			});
		} else {
			res.redirect('/admin');
		}
	}

    module.editAmenties = async function(req, res){
		try{
			var delId = req.params.id;
			if(req.session.admin){
				
				let temp = await model.Amenties.findOne({'_id': delId});
                var locationData= await model.Location.findOne({'name': req.body.locationName});

				if(temp){
					var updateData = { 
                        amentiesName: req.body.amentiesName,
                        placeId: locationData._id
					}
					await model.Amenties.updateOne({'_id': delId},updateData);
					req.flash('success','Amenties Update Successfully');
					res.redirect('/admin/amenties')
				} else {
					req.flash('error',"Amenties Not Found, Please Try Again");
					res.redirect('/admin/amenties');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/amenties');
		}
	}

	// [ Delete ]
	module.deleteAmenties = async function(req, res){
		try{
			if(req.session.admin){
				let delId = req.params.id;
				let tmp = await model.Amenties.findOne({'_id': delId});
				if(tmp){
					await model.Amenties.updateOne({_id: mongoose.Types.ObjectId(delId)},{'isDeleted': true});
					req.flash('success',"Amenties Delete Successfully");
					res.redirect('/admin/amenties');
				} else {
					req.flash('error',"Amenties Page not found. Please try again.");
					res.redirect('/admin/amenties');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/amenties');
		}
	}
    
	return module;
}