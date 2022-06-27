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
			res.render('admin/comment/list', {
				title: 'All comment List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				alias:'comment',
				contList: null,
			});
		} else {
			res.redirect('/admin');
		}
	};   
	module.add = async function(req, res){
		if(req.session.admin){
			var dataaa = await model.Comment.create({
				userid: mongoose.Types.ObjectId("5e4bd302b03b14586ff2010a"),
				photoId: mongoose.Types.ObjectId("5e71d8b0db36e549cd61af8e"),
				msg:'looking good', 
				isDeleted: false,
				createdAt:Date('2020-01-07T06:23:07.340+00:00'),
				updatedAt:Date('2020-01-07T06:23:06.340+00:00')
			});
			console.log("data--->>",dataaa);
			
		   	res.render('admin/comment/add', {
				title: 'Add comment',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'comment'
			});
		} else {
			res.redirect('/admin');
		}
	}

    module.addOffer = async function(req, res){
		try {
			if(req.session.admin){
              
				var offerData = await model.Comment.create({
					offerName: req.body.offerName,
					promoCode: req.body.promoCode,
					offerType:req.body.offerType,
					startDate:start,
					endDate:end,
          perUser: req.body.perUser,
          status: req.body.status,  
					isDeleted: false
				});
			
				

				if(offerData != null){
					req.flash('success',"comment Add Successfully...");
					res.redirect('/admin/comment');
				}else{
					req.flash('error',"comment Not Add. Please Try Again...");
					res.redirect('/admin/comment');
				}		
			} else {
				res.redirect('/admin/comment');
			}
		} catch(error){
			console.log('error: ',error);
			req.flash('error',"Something Went Wrong, Please Try Again");
			res.redirect('/admin/comment');
		}
	}

	// [ Filter ]
	module.commentList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;     
	  	var commentQuery ={ 'commentData.isDeleted' : false, 'commentData.msg': { $exists: true } }; 
			var userQuery = { 'userData.username': { $regex: '.*' + search + '.*' },'userData.isDeleted':false };
			var query = {'type':'photo','isDeleted' : false};
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
						  from: "comments",
						  localField: "_id",
						  foreignField: "photoId",
						  as: "commentData"
						}
					},		
				  { $match : commentQuery },
					{ $project : { 
							path : '$path',
							comment:{$size:'$commentData.msg'},
							username : '$userData.username',
							createdAt:'$createdAt'
					}}
				];
		    let userImageDataCount = await model.Photo.aggregate(dataQuery); 
				
				var tmp = [
							{ "$limit": start + length },
							{ $skip: parseInt(start)}
				];
				dataQuery = dataQuery.concat(tmp);
		    let userImageData = await model.Photo.aggregate(dataQuery); 
					
				var datav;
				for (let i = 0; i < userImageData.length; i++) {
					var datenew = userImageData[i].createdAt;
					var datav = dateformat(datenew, 'dd-mm-yyyy');
					userImageData[i].createdAt = datav; 
				}
				let countryCount = await model.Photo.countDocuments(userImageData.length);
				console.log("userImageData",userImageData);
				
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': userImageData.length,
				'recordsFiltered': userImageData.length,
				'data': userImageData
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in offerlist",e);
        }
	}

    module.edit = async function(req, res){

		var delId = req.params.id;
		var query = { '_id':mongoose.Types.ObjectId(delId),'type':'photo','isDeleted' : false };
		var commentQuery ={ 'commentData.msg': { $exists: true },'commentData.isDeleted' : false }; 
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
						{ $unwind:
								'$userData'
						},
						{
							$lookup:
								{   
									from: "comments",
									localField: "userId",
									foreignField: "userId",
									as: "commentData"
								}
						},
						{ $match : commentQuery },
						{ $project : { 
							path : '$path',
							commentId: '$commentData._id',
							comment:'$commentData.msg',
							userid: '$commentData.userId',
							username : '$userData.username',
						}}
					];
		   let userImageData = await model.Photo.aggregate(dataQuery); 	
			 var senderphotoQuery2 = { 'senderPhotoData.isDeleted':false };                       
			 var senderQuery2 = { 'senderData.isDeleted':false };
			 var query2 = { 'photoId':mongoose.Types.ObjectId(delId),'isDeleted':false };
		
			 var dataQuery2 = [
											 { $match : query2 },																							
											 {
												 $lookup:
													 {   
														 from: "users",
														 localField: "userId",
														 foreignField: "_id",
														 as: "senderData"
													 }
											 },
											 { $unwind:
												 '$senderData'
											 },
											 { $match : senderQuery2 },
											 {
												 $lookup:
													 {   
														 from: "photos",
														 localField: "photoId",
														 foreignField: "_id",
														 as: "senderPhotoData"
													 }
											 },
											 { $unwind:
												 '$senderPhotoData'
											 },
											 { $match : senderphotoQuery2 },
											 { $project : { 
												 username : '$senderData.username',
												 msg : '$msg',
												 photoId: '$senderPhotoData._id',
												 sendPath : '$senderPhotoData.path',
												 createdAt : '$createdAt'
											 }}
							 ];	
					 let userImageData2 = await model.Comment.aggregate(dataQuery2); 
			
		if(req.session.admin){
		   	res.render('admin/comment/edit', {
				title: 'Edit Comment ',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				alias:'comment',
				userImageData2:userImageData2,
				userImageData: userImageData
			});
		} else {
			res.redirect('/admin');
		}
	}

 
	// [ Delete ]
	module.deleteComment = async function(req, res){
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
					res.redirect('/admin/comment');
				} else {
					req.flash('error',"Comment Page not found. Please try again.");
					res.redirect('/admin/comment');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/comment');
		}
	}
    
	return module;
}