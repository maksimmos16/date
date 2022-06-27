
module.exports = function(model,config){	
	var module = {};

	// [ List ]
	module.view = async function(req, res){
		if(req.session.admin){
		   	res.render('admin/request/list', {
				title: 'Users Match List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				subalias:'req',
				alias:'request',
				matchReqList : null
			});
		} else {
			res.redirect('/admin');
		}
	}

	// [ Filter ]
	module.matchRequestList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			let tmpp = {};
			if(search){
				tmpp.$or = [
					{ senderUsername: new RegExp(search, "i") },
					{ receiverUsername: new RegExp(search, "i") }
				];
			}
			var query = { 'matched':true, 'isDeleted': false, 'adminStatus': false };
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
			    },
			    { 
			    	$match : tmpp
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


	// [ Delete - Notification ]
	module.changeMatchRequest = async function(req, res){
		try{
			if(req.session.admin){
		
				console.log('req.params.id: ',req.params.id);
				let matchReqId = req.params.id;
				matchReqId = mongoose.Types.ObjectId(matchReqId);

				let matchReqData = await model.Like.findOne({'_id':matchReqId});
				 console.log("matchReqData",matchReqData);
				
				let userData = await model.User.findOne({_id:matchReqData.userId});
				
				var comment = req.body.comment
				if(matchReqData){
				var check =	await model.Like.updateOne({_id: mongoose.Types.ObjectId(matchReqId)},{'matched': false, 'adminStatus':true, 'deleteReason': req.body.comment});

				let notificationData = await model.UserNotification.findOne({'senderId': matchReqData.senderId,'receiverId':matchReqData.receiverId});
				
				var UpdateNotification = await model.UserNotification.updateOne({_id: mongoose.Types.ObjectId(notificationData._id)},{'isDeleted': true});

				res.send({status: 'success'});
					
				} else {
					res.send({status: 'fail'});
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			console.log(err);
			
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/request');
		}
	}

	// [ Edit - Render ]
	module.editMatchRequest = async function(req, res){
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
					res.render('admin/request/edit', {
						title: 'Users Match Detail',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						settings: settings, //Global variable
						config: config,
						subalias:'req',
						alias:'request',
						matchReqList : tmpVal
					});
				} else {
					req.flash('error',"Notification detail not found, Please try again.");
					res.redirect('/admin/request');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			console.log(err);
			
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/request');
		}
	}


	return module;
};