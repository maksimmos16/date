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
			var userQuery = { 'userData.username': { $regex: '.*' + search + '.*' },'userData.isDeleted':false, "datersData.isApproved" : true };
			var query = { 'isDeleted' : false, 'comment': { $ne: ''}};
		
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
						{
							$lookup:
							{   
								from: "dates",
								localField: "dateId",
								foreignField: "_id",
								as: "datersData"
							}
						},															
						{ $match : userQuery },
		
						{ $group : {_id:{dateId:"$userData._id"},
							username:{$addToSet: "$userData.username"},
							comment:{$push: "$comment"},
							createdAt: {$push: '$createdAt'}
						  }
						}, 
						{ $project : { 
								comment:{$size:'$comment'},
								username : '$username',
								createdAt: '$createdAt'	
						}}
					];
		    let userImageDataCount = await model.Feedback.aggregate(dataQuery); 
				
				var tmp = [
							{ "$limit": start + length },
							{ $skip: parseInt(start)}
				];
				dataQuery = dataQuery.concat(tmp);
		    let userImageData = await model.Feedback.aggregate(dataQuery);
					
				var datav;
				for (let i = 0; i < userImageData.length; i++) {
					var datenew = userImageData[i].createdAt[0];
					var datav = dateformat(datenew, 'dd-mm-yyyy');
					userImageData[i].createdAt = datav; 
				}
				let countryCount = await model.Feedback.countDocuments(userImageData.length);
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
		var query = { 'userId':mongoose.Types.ObjectId(delId),'isDeleted' : false, 'comment': { $ne: ''}};
		var commentQuery ={ 'commentData.msg': { $exists: true },'commentData.isDeleted' : false }; 
		var userQuery ={ 'userData.isDeleted' : false }; 
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
	        { 
	            $unwind:'$userData'
	        },
	        {
	                $lookup:
	                {   
	                        from: "dates",
	                        localField: "dateId",
	                        foreignField: "_id",
	                        as: "datersData"
	                }
	        },															
	        { $match : userQuery },
	        {
	                $lookup:
	                {   
	                        from: "questions",
	                        localField: "queId",
	                        foreignField: "_id",
	                        as: "questionData"
	                }
	        },
	        { 
	            $unwind:'$questionData'
	        },	
	        { $group : 
	            {
	                _id:{dateId:"$userData._id"},
	                username:{$push: "$userData.username"},
	                comment:{$push: "$comment"},
	                profilePic : {$push: "$userData.profilePic"},
	                question : {$push: "$questionData.que"},

	            }
	        }, 
	        { $project : { 
	                        comment: '$comment',
	                  question : '$question',
	                        username : '$username',
	                        profilePic : '$profilePic'	
	        }}
		];

		let userData = await model.Feedback.aggregate(dataQuery); 
		console.log("userData edit ===>  ",userData);
				
		if(req.session.admin){
		   	res.render('admin/comment/edit', {
				title: 'Comment Detail ',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				alias:'comment',
				userData: userData
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