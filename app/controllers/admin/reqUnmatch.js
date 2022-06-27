
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/reqUnmatch/list', {
				title: 'Users Unmatch List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				subalias:'req',
				alias:'reqUnmatch',
				unmatchReqList : null
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.unmatchRequestList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
		// 	let query = { 'matched':false, 'adminStatus':true, 'isDeleted':false };
			
		// 	var senderphotoQuery = { 'senderPhotoData.isDeleted':false, 'senderPhotoData.sortOrder':1 };                       
		// 	var receiverphotoQuery = { 'receiverPhotoData.isDeleted':false, 'receiverPhotoData.sortOrder':1 };
		// 	var senderQuery = { 'senderData.username': { $regex: '.*' + search + '.*' },'senderData.isDeleted':false };
		// 	var receiverQuery = { 'receiverData.isDeleted':false };

		// 	var dataQuery = [
		// 						{ $match : query },
		// 						{
		// 							$lookup:
		// 								{   
		// 									from: "users",
		// 									localField: "senderId",
		// 									foreignField: "_id",
		// 									as: "senderData"
		// 								}
		// 						},
		// 						{ $unwind:
		// 							'$senderData'
		// 						},
		// 						{ $match : senderQuery },
		// 						{
		// 							$lookup:
		// 								{   
		// 									from: "users",
		// 									localField: "receiverId",
		// 									foreignField: "_id",
		// 									as: "receiverData"
		// 								}
		// 						},
		// 						{ $unwind:
		// 							'$receiverData'
		// 						},
		// 						{ $match : receiverQuery },
		// 						{
		// 							$lookup:
		// 								{   
		// 									from: "photos",
		// 									localField: "senderId",
		// 									foreignField: "userId",
		// 									as: "senderPhotoData"
		// 								}
		// 						},
		// 						{ $unwind:
		// 							'$senderPhotoData'
		// 						},
		// 						{ $match : senderphotoQuery },
		// 						{
		// 							$lookup:
		// 								{   
		// 									from: "photos",
		// 									localField: "receiverId",
		// 									foreignField: "userId",
		// 									as: "receiverPhotoData"
		// 								}
		// 						},
		// 						{ $unwind:
		// 							'$receiverPhotoData'
		// 						},
		// 						{ $match : receiverphotoQuery },
		// 						{ $project : { 
		// 							senderUsername : '$senderData.username',
		// 							receiverUsername : '$receiverData.username',
		// 							sendPath : '$senderPhotoData.path',
		// 							receiverPath : '$receiverPhotoData.path',
		// 						}}
		// 					];
					
		// let userImageDataCount = await model.Like.aggregate(dataQuery); 
			
		// 	var tmp = [
		// 		{ "$limit": start + length },
		// 		{ $skip: parseInt(start)}
		// 	];
		// 	dataQuery = dataQuery.concat(tmp);
		// let userImageData = await model.Like.aggregate(dataQuery); 
		// let unmatchReqCount = await model.Like.countDocuments(query);

		var query = { 'adminStatus': true };
		let newQ = [
		    { $match : query },
		    { $sort: { 'createdAt' : -1 }},
		    {
		        $lookup:
		                {   
		                    from: "users",
		                    localField: "senderId",
		                    foreignField: "_id",
		                    as: "sData"
		                }
		    },
		    { $unwind:
		        '$sData'
		    },
		    {
		        $lookup:
		                {   
		                    from: "users",
		                    localField: "receiverId",
		                    foreignField: "_id",
		                    as: "rData"
		                }
		    },
		    { $unwind:
		        '$rData'
		    },
		    { 
		        $project : { 
		            senderUsername : '$sData.username',
		            receiverUsername : '$rData.username'
		        }
		    }
		];
		let tmpVal = await model.Like.aggregate(newQ);
		var tmp = [
					{ "$limit": start + length },
					{ $skip: parseInt(start)}
				];
		newQ = newQ.concat(tmp);
		let userImageData = await model.Like.aggregate(newQ);
				
			let obj = {
				'draw': req.query.draw,
				'recordsTotal': tmpVal.length,
				'recordsFiltered': tmpVal.length,
				'data': userImageData
			};
			
			res.send(obj);
		} catch (e) {
			console.log("Error in notifyList",e);
		}
	}

	// [ Edit - Render ]
	module.changeUnmatchRequest = async function(req, res){
		try{
			if(req.session.admin){
				var delId = req.params.id;
				console.log("delid",delId);
				let tmpVal;
				if(delId){

					var query = { '_id':mongoose.Types.ObjectId(delId), 'matched':true, 'isDeleted': false };
					let newQ = [
					    { $match : query },
					    { $sort: { 'createdAt' : -1 }},
					    {
					        $lookup:
					                {   
					                    from: "users",
					                    localField: "senderId",
					                    foreignField: "_id",
					                    as: "sData"
					                }
					    },
					    { $unwind:
					        '$sData'
					    },
					    {
					        $lookup:
					                {   
					                    from: "users",
					                    localField: "receiverId",
					                    foreignField: "_id",
					                    as: "rData"
					                }
					    },
					    { $unwind:
					        '$rData'
					    },
					    { 
					        $project : { 
					            senderUsername : '$sData.username',
					            senderProfilePic : '$sData.profilePic',
					            receiverUsername : '$rData.username',
					            receiverProfilePic : '$rData.profilePic'
					        }
					    }
					];
					tmpVal = await model.Like.aggregate(newQ);
					tmpVal = tmpVal[0];
				}
				if(tmpVal){
					res.render('admin/reqUnmatch/edit', {
						title: 'Users Unmatch Detail',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						settings: settings, //Global variable
						config: config,
						subalias:'req',
						alias:'reqUnmatch',
						matchReqList : tmpVal
					});
				} else {
					req.flash('error',"Notification detail not found, Please try again.");
					res.redirect('/admin/reqUnmatch');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			console.log(err);
			
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/reqUnmatch');
		}
	}


	return module;
};