var dateformat = require('dateformat');
var currentDate = new Date();
var md5 = require('md5');
var fs = require('fs');

module.exports = function(model,config){	
	var module = {};

	// [ Subscription View ]
	module.view = async function(req, res){
		if(req.session.admin){
			res.render('admin/subscription/list', {
				title: 'All Subscription List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'subscription',
				contList: null,
			});
		} else {
			res.redirect('/admin');
		}

	};

	// [ Filter ]
	module.subscriptionList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = { $or:[ {planName: { $regex: '.*' + search + '.*' }},
													{planType:{ $regex: '.*' + search + '.*' }}
									], 'isDeleted': false };
			let columns = [
				'_id',
				'planName',
				'planType',
        'discount',
				'price',
				'durationType',
				'status'
			]

			let countryCount = await model.Subscription.countDocuments(query);
			let data = await model.Subscription.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': countryCount,
				'recordsFiltered': countryCount,
				'data': data
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in countryList",e);
        }
	}

	module.active = async function(req, res){
		try{
			if(req.session.admin){
				let notifyId = req.params.id;
				let notifyData = await model.Subscription.findOne({'_id': notifyId});
				let flag = true;
				if(notifyData){
					if(notifyData.status == true){
						flag = false;
					}else{
						flag = true;
					}
					await model.Subscription.updateOne({'_id': notifyId},{'status': flag});
					req.flash('success',"Subscription active Successfully.");
					res.redirect('/admin/subscription');
				} else {
					req.flash('error',"Subscription detail not found, Please try again.");
					res.redirect('/admin/subscription');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/subscription');
		}
	}

    module.add = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/subscription/add', {
				title: 'Add Subscription Plan',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias:'subscription'
			});
		} else {
			res.redirect('/admin');
		}
	}

    module.addSubscription = async function(req, res){
		try {
			if(req.session.admin){
				console.log('req.body: ',req.body);
				let benefits = {
					viewMatchedDaters: (req.body.viewMatchedDaters == 'true') ? true : false,
					chatWithDaters: (req.body.chatWithDaters == 'true') ? true : false,
					videoChat: (req.body.videoChat == 'true') ? true : false,
					privacyMode: (req.body.privacyMode == 'true') ? true : false,
					offAds: (req.body.offAds == 'true') ? true : false,
					boostMonth: (req.body.boostMonth == 'true') ? true : false,
					unlimitedLikes: (req.body.unlimitedLikes == 'true') ? true : false,
					increaseLikes: (req.body.increaseLikes == 'true') ? true : false,
					seeMorePeople: (req.body.seeMorePeople == 'true') ? true : false,
					seeAllQueAns: (req.body.seeAllQueAns == 'true') ? true : false,
					seeAllBasicFeatures: (req.body.seeAllBasicFeatures == 'true') ? true : false,
					increaseLikesUpto: (req.body.increaseLikesUpto == 'true') ? true : false,
					enableRewind: (req.body.enableRewind == 'true') ? true : false
				}
				var subcriptionData = await model.Subscription.create({
                    planName: req.body.planName,
                    planType: req.body.planType,
                    status: req.body.status,
                    discount: req.body.discount,
					price: req.body.price,
					durationType: req.body.durationType,
					duration: parseInt(req.body.duration),
					benefits: benefits,
					isDeleted: false
				});

				await model.Subscription.updateMany({planType: req.body.planType},{$set:{benefits: benefits}});
				if(subcriptionData != null){
					req.flash('success',"Plan Add Successfully...");
					res.redirect('/admin/subscription');
				}else{
					req.flash('error',"Plan Not Add. Please Try Again...");
					res.redirect('/admin/subscription');
				}		
			} else {
				res.redirect('/admin/subscription');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/subscription');
		}
	}

    module.edit = async function(req, res){
        var planData = await model.Subscription.findOne({_id: req.params.id});

		if(req.session.admin){
		   	res.render('admin/subscription/edit', {
				title: 'Add Subscription Plan',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
        alias:'subscription',
        planData: planData
			});
		} else {
			res.redirect('/admin');
		}
	}

    module.editSubscription = async function(req, res){
		try{
			var delId = req.params.id;
			if(req.session.admin){
				
				let temp = await model.Subscription.findOne({'_id': delId});
				if(temp){

					let benefits = {
						viewMatchedDaters: (req.body.viewMatchedDaters == 'true') ? true : false,
						chatWithDaters: (req.body.chatWithDaters == 'true') ? true : false,
						videoChat: (req.body.videoChat == 'true') ? true : false,
						privacyMode: (req.body.privacyMode == 'true') ? true : false,
						offAds: (req.body.offAds == 'true') ? true : false,
						boostMonth: (req.body.boostMonth == 'true') ? true : false,
						unlimitedLikes: (req.body.unlimitedLikes == 'true') ? true : false,
						increaseLikes: (req.body.increaseLikes == 'true') ? true : false,
						seeMorePeople: (req.body.seeMorePeople == 'true') ? true : false,
						seeAllQueAns: (req.body.seeAllQueAns == 'true') ? true : false,
						seeAllBasicFeatures: (req.body.seeAllBasicFeatures == 'true') ? true : false,
						increaseLikesUpto: (req.body.increaseLikesUpto == 'true') ? true : false,
						enableRewind: (req.body.enableRewind == 'true') ? true : false
					}

					var updateSubcriptionData = { 
						planName: req.body.planName,
						planType: req.body.planType,
						status: req.body.status,
						discount: req.body.discount,
						price: req.body.price,
						benefits: benefits,
						durationType: req.body.durationType,
						duration: parseInt(req.body.duration),
						isDeleted: false
					}
					
					await model.Subscription.updateOne({'_id': delId},updateSubcriptionData);
					await model.Subscription.updateMany({planType: req.body.planType},{$set:{benefits: benefits}});
					req.flash('success','Plan Update Successfully');
					res.redirect('/admin/subscription')
				} else {
					req.flash('error',"Plan Not Found, Please Try Again");
					res.redirect('/admin/subscription');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/subscriptionw');
		}
	}

	// [ Delete ]
	module.deleteSubscription = async function(req, res){
		try{
			if(req.session.admin){
				let delId = req.params.id;
				let tmp = await model.Subscription.findOne({'_id': delId});
				if(tmp){
					// await model.Subscription.deleteOne({'_id': delId});
					await model.Subscription.updateOne({_id: mongoose.Types.ObjectId(delId)},{'isDeleted': true});
					req.flash('success',"Subscription Delete Successfully");
					res.redirect('/admin/subscription');
				} else {
					req.flash('error',"CMS Page detail not found. Please try again.");
					res.redirect('/admin/subscription');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/subscription');
		}
	}
    
	return module;
}