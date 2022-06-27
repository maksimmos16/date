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
			res.render('admin/userSubscription/list', {
				title: 'All User Subscription List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				alias:'userSubscription',
				contList: null,
			});
		} else {
			res.redirect('/admin');
		}
	};   

	// [ Filter ]
	module.userSubscriptionList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;     
	  		var subscriptionQuery = { 'subscriptionData.isDeleted' : false }; 
			var userQuery = { 'userData.username': { $regex: '.*' + search + '.*' },'userData.isDeleted':false };
			var query = {'isDeleted' : false};
				var dataQuery = [
					{ $match : query },
					{
						$lookup:
							{   
								from: "users",
								localField: "userId",
								foreignField: "_id",
								as: "userData"
							}
					},
					{ $unwind:'$userData'
					},
					{ $match : userQuery },
					{
						$lookup:
						{   
						  from: "subscriptions",
						  localField: "planId",
						  foreignField: "_id",
						  as: "subscriptionData"
						}
					},		
				  // { $match : subscriptionQuery },
					{ $project : { 
						//	plans     :{$size:'$subscriptionData.planName'},
							planName  : '$subscriptionData.planName',
							planType  : '$subscriptionData.planType',
							discount  : '$subscriptionData.discount',
							durationType  : '$subscriptionData.durationType',
							userId    : '$userData._id',
							username  : '$userData.username',
							planType  : '$planType',
							price	  : '$price',
							createdAt : '$createdAt',
							expiryAt  : '$expireAt',

					}}
				];
		    	let userImageDataCount = await model.UserSubscription.aggregate(dataQuery); 
				console.log('userImageDataCount: ',userImageDataCount);

				var tmp = [
							{ "$limit": start + length },
							{ $skip: parseInt(start)}
				];
				dataQuery = dataQuery.concat(tmp);
		    	let userPlanData = await model.UserSubscription.aggregate(dataQuery); 
				console.log("userPlanData",userPlanData);
			
					
				var datav;
				for (let i = 0; i < userPlanData.length; i++) {
					var datenew = userPlanData[i].expiryAt;
					var datav = dateformat(datenew, 'dd-mm-yyyy');
					userPlanData[i].expiryAt = datav; 
				}
				// let userdata = await model.UserSubscription.find({_id:userId}); 
				// console.log("userData",userdata);
				//  let countryCount = await model.UserSubscription.countDocuments(userImageData.length);
				// console.log("userImageData",userImageData);
				
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': userImageDataCount.length,
				'recordsFiltered': userImageDataCount.length,
				'data': userPlanData
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in offerlist",e);
        }
	}

    module.edit = async function(req, res){

		var delId = req.params.id;
		console.log('delId: ',delId);

		var subscriptionQuery ={ 'subscriptionData.isDeleted' : false, }; 
		var userQuery = { 'userData.isDeleted':false };
		var query = { '_id':mongoose.Types.ObjectId(delId),'isDeleted' : false};
			var dataQuery = [
				{ $match : query },
				{
					$lookup:
						{   
							from: "users",
							localField: "userId",
							foreignField: "_id",
							as: "userData"
						}
				},
				{ $unwind:'$userData'
				},
				{ $match : userQuery },
				{
					$lookup:
					{   
						from: "subscriptions",
						localField: "planId",
						foreignField: "_id",
						as: "subscriptionData"
					}
				},		
				// { $match : subscriptionQuery },
				{ $project : {
						planName  : '$subscriptionData.planName',
						discount  : '$subscriptionData.discount',
					  durationType  : '$subscriptionData.durationType',
						username  : '$userData.username',
						planType  : '$planType',
						price			: '$price',
					  createdAt : '$createdAt',
						expiryAt  : '$expireAt',
				}}
			];
			
			let userPlanData = await model.UserSubscription.aggregate(dataQuery); 
			console.log("userPlanData edit",userPlanData);
				
			var dataC,dataU;
			for (let i = 0; i < userPlanData.length; i++) {
				var datenew = userPlanData[i].expiryAt;
				var dateneww = userPlanData[i].createdAt;
				var dataC = dateformat(dateneww, 'dd-mm-yyyy');
				userPlanData[i].createdAt = dataC; 
				var dataU = dateformat(datenew, 'dd-mm-yyyy');
				userPlanData[i].expiryAt = dataU; 
			}
			
		if(req.session.admin){
		   	res.render('admin/userSubscription/edit', {
				title: ' Subscription Plan Detail',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				alias:'userSubscription',
				userPlanData: userPlanData
			});
		} else {
			res.redirect('/admin');
		}
	}

 
	// [ Delete ]
	module.deleteUserSubscription = async function(req, res){
		try{
			if(req.session.admin){
				let delId = req.params.id;
				console.log("del",delId);
				
				let tmp = await model.Comment.findOne({'_id': delId});
				console.log("tmp",tmp);
				
				if(tmp){
					// await model.Offer.deleteOne({'_id': delId});
					await model.Comment.updateOne({_id: mongoose.Types.ObjectId(delId)},{'isDeleted': true});
					req.flash('success',"Comment Delete Successfully");
					res.redirect('/admin/userSubscription');
				} else {
					req.flash('error',"Comment Page not found. Please try again.");
					res.redirect('/admin/userSubscription');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/userSubscription');
		}
	}
    
	return module;
}