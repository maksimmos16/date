var dateformat = require('dateformat');
const moment = require('moment');
var currentDate = new Date();
var md5 = require('md5');
var fs = require('fs');

module.exports = function(model,config){	
	var module = {};

	// [ offer View ]
	module.view = async function(req, res){
		if(req.session.admin){
			res.render('admin/offer/list', {
				title: 'All offer List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'offer',
				contList: null,
			});
		} else {
			res.redirect('/admin');
		}
	};

	// [ Filter ]
	module.offerList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			
			let query = {   $or:[
				{offerName:{ $regex: '.*' + search + '.*', $options:'i' }},
				{offerType:{ $regex: '.*' + search + '.*', $options:'i' }},
				{promoCode:{ $regex: '.*' + search + '.*', $options:'i' }}
			], 'isDeleted': false };

			let columns = [
				'_id',
				'offerName',
				'offerType',
				'promoCode',
				'discount',
				'perUser',
				'startDate',
				'endDate',
				'status',
				'created_at',
			]
		
			let countryCount = await model.Offer.countDocuments(query);
			let data = await model.Offer.find(query).skip(start).limit(length).select(columns).sort({"_id": -1}).lean();
			for(let i=0;i<data.length;i++){
				if(data[i].startDate && data[i].endDate){
					data[i].startDate = dateformat(new Date(data[i].startDate),'dd-mm-yyyy');
					data[i].endDate = dateformat(new Date(data[i].endDate),'dd-mm-yyyy');
				}
			}
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': countryCount,
				'recordsFiltered': countryCount,
				'data': data
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in offerlist",e);
        }
	}

	module.active = async function(req, res){
		try{
			if(req.session.admin){
				let offerId = req.params.id;
				let offerData = await model.Offer.findOne({'_id': offerId});
				let flag = true;
				if(offerData){
					if(offerData.status == true){
						flag = false;
					}else{
						flag = true;
					}
					await model.Offer.updateOne({'_id': offerId},{'status': flag});
					req.flash('success',"Offer active Successfully.");
					res.redirect('/admin/offer');
				} else {
					req.flash('error',"Offer detail not found, Please try again.");
					res.redirect('/admin/offer');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/offer');
		}
	}

    module.add = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/offer/add', {
				title: 'Add Offer',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'offer'
			});
		} else {
			res.redirect('/admin');
		}
	}

    module.addOffer = async function(req, res){
		try {
			var bothdate = req.body.range;
			var checkdate = bothdate.split(' - ');
			console.log("addOffer-------->>>checkdate: ",checkdate);
			
			let offerType = req.body.offerType;
			var start = '';
			var end = '';
			if(offerType == 'limited'){
				start = new Date(checkdate[0]);
				end = new Date(checkdate[1]);
			}
			var promoCode = req.body.promoCode;
			var obj = {
				'promoCode':promoCode,
				'isDeleted':false
			}
			var planData = await model.Offer.findOne(obj);
			if(planData){
				req.flash('error',"This promoCode is already used. Please try another...");
				return res.redirect('/admin/offer');
			}
			let offerName = req.body.offerName;
			if(req.session.admin){
              
				var offerData = await model.Offer.create({
					offerName: req.body.offerName,
					promoCode: req.body.promoCode,
					discount: parseFloat(req.body.discount),
					offerType:req.body.offerType,
					startDate:start,
					endDate:end,
					perUser: req.body.perUser,
					status: req.body.status,  
					isDeleted: false
				});
			
				
				let userNotiSetting = await model.UserNotification.create({
				  	senderId   : req.session.userSessionData.sessionId,
					type       : 'offers',
					text       : 'Use '+promoCode+' to get '+offerName,
					matched    : false,
					isDeleted  : false
				});
				
					
				let users = await model.User.find();
				let event = 'offer';
				let obj = {
					msg	: 'New Offer '+offerName+' for all'+promoCode
				}
					
				if(offerData){
					req.flash('success',"Offer Add Successfully...");
					res.redirect('/admin/offer');
				}else{
					req.flash('error',"Offer Not Add. Please Try Again...");
					res.redirect('/admin/offer');
				}		
			} else {
				res.redirect('/admin/offer');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/offer');
		}
	}

    module.edit = async function(req, res){
        var planData = await model.Offer.findOne({_id: req.params.id}).lean();

			planData.startDate = dateformat(new Date(planData.startDate),'yyyy-mm-dd');
			planData.endDate = dateformat(new Date(planData.endDate),'yyyy-mm-dd');

		if(req.session.admin){
		   	res.render('admin/offer/edit', {
				title: 'Add Offer Plan',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
        alias:'offer',
        planData: planData
			});
		} else {
			res.redirect('/admin');
		}
	}

    module.editOffer = async function(req, res){
		try{
			var delId = req.params.id;
			var bothdate = req.body.range;
			var checkdate = bothdate.split(' - ');
			let offerType = req.body.offerType;
			var start = '';
			var end = '';
			if(offerType == 'limited'){
				start = new Date(checkdate[0]);
				end = new Date(checkdate[1]);
			}
			var promoCode = req.body.promoCode;
			let getUserOffer = await model.UserOffer.findOne({'promoCodeId': delId});
			console.log('editOffer------->>>getUserOffer: ',getUserOffer);
			if(getUserOffer){
					req.flash('error',"This promoCode is User already used. Please try another...");
					return res.redirect('/admin/offer');
			}
			let getval = await model.Offer.findOne({'_id': delId});
			if(promoCode != getval.promoCode){
				var obj = {
					'promoCode':promoCode,
					'isDeleted':false
				}
				var planData = await model.Offer.findOne(obj);
				if(planData){
					req.flash('error',"This promoCode is already used. Please try another...");
					return res.redirect('/admin/offer');
				}
			}
			if(req.session.admin){
				
				let temp = await model.Offer.findOne({'_id': delId});

				if(temp){
					var updatesupportPageData = { 
						offerName: req.body.offerName,
						promoCode: req.body.promoCode,
						discount: req.body.discount,
						offerType:req.body.offerType,
						startDate:start,
						endDate:end,
						perUser: req.body.perUser,
						status: req.body.status,
						isDeleted: false
					}
				
					await model.Offer.updateOne({'_id': delId},updatesupportPageData);
					req.flash('success','Offer Update Successfully');
					res.redirect('/admin/offer')
				} else {
					req.flash('error',"Offer Not Found, Please Try Again");
					res.redirect('/admin/offer');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/offer');
		}
	}

	// [ Delete ]
	module.deleteOffer = async function(req, res){
		try{
			if(req.session.admin){
				let delId = req.params.id;
				let tmp = await model.Offer.findOne({'_id': delId});
				if(tmp){
					// await model.Offer.deleteOne({'_id': delId});
					await model.Offer.updateOne({_id: mongoose.Types.ObjectId(delId)},{'isDeleted': true});
					req.flash('success',"Offer Delete Successfully");
					res.redirect('/admin/offer');
				} else {
					req.flash('error',"Offer Page not found. Please try again.");
					res.redirect('/admin/offer');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/offer');
		}
	}
    
	return module;
}