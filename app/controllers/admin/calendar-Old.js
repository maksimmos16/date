var dateformat = require('dateformat');
var currentDate = new Date();

module.exports = function(model,config){	
	var module = {};

    // [ View ]
	module.view = async function(req, res) {
        try{	
			
	        res.render('admin/calendar/view', {
				title: 'Calendar Management',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias: 'calendar'
			});
		} catch(error){
			req.flash('error',"Calendar under maintenance.");
			res.redirect('/admin/dashboard');
		}
	}

	// [ List ]
	module.getCalendarList = async function(req, res){
		
		let start = parseInt(req.body.start);
        let length = parseInt(req.body.length);
        let search = req.body.search.value;
        let query = {'isDeleted' : false}

		// let userQuery = { 'userData.username': {s $regex: '.*' + search + '.*' },'userData.isDeleted':false };

		let testimonialCount = await model.Testimonial.countDocuments(query);
		// let data = await model.Testimonial.aggregate([
        // 	{ $match : query },
        //     {$group:
        //             {_id:"$userId",
        //                 dateId:{$push: "$dateId"}},
        //             },
        //     {
        //         $lookup:
        //             {   
        //                 from: "users",
        //                 localField: "_id",
        //                 foreignField: "_id",
        //                 as: "userData"
        //             }
        //     },
        //     { $unwind:
        //         '$userData'
		// 	},
		// 	{ $match : userQuery },
        //     { $project : { 
        //         dateNo : {$size:"$dateId"},
        //         username : '$userData.username'
		// 	}},
		// 	{ "$skip": start },
		// 	{ "$limit" : length },
		// 	{ "$sort" : { "_id" : -1 } }
		// ]);



		// Static Data
		let current_datetime = new Date()
		let todayDate = current_datetime.getDate() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getFullYear()
		let datanew = {
			todayDate : todayDate,
			totalDates : testimonialCount
		};
		let data = [];
		data.push(datanew);
        
		var obj = {
	      	'draw': req.query.draw,
	      	'recordsTotal': testimonialCount,
	      	'recordsFiltered': testimonialCount,
	      	'data': data
		};
	    return res.send(JSON.stringify(obj));
	};

	// [ View Detail ]
	module.viewDetails = async function(req, res) {
        try{
			if(req.session.admin){
				// let user_id = req.params.id;
				// let query = {'isDeleted' : false,'userId': mongoose.Types.ObjectId(user_id)}
				// let userData = await model.Testimonial.aggregate([
				// 	{ 
				// 		$match : query
				// 	},
				// 	{
				// 		$group:
				// 		{
				// 			_id:"$userId",
				// 			testimonialData:{
				// 				$push: {

				// 							_id:"$_id",
				// 							dateId : "$dateId",
				// 							type : "$type",
				// 							text : "$text",
				// 						}
				// 				}
				// 	   },						
				// 	},
				// 	{ 
				// 		$lookup:
				// 		{ 
				// 			from: "users",
				// 			localField: "_id",
				// 			foreignField: "_id",
				// 			as: "userData"
				// 		}
				// 	},
				// 	{ 
				// 		$unwind:'$userData'
				// 	},
				// 	{ 
				// 		$project : {
				// 			testimonialData : "$testimonialData",
				// 			username : '$userData.username',
				// 			userimage : '$userData.profilePic',
				// 		}
				// 	},
				
				// ]);
				// let newUserData = userData[0];

				let newUserData = {
					todayDaters : [
						{
							_id:1,
							userImage: 'upload/photos/defaultUser.png',
							dateId: 1234,
							username: 'Person A'
						}, {
							_id:2,
							userImage: 'upload/photos/defaultUser.png',
							dateId: 1234,
							username: 'Person B'
						}, {
							_id:3,
							userImage: 'upload/photos/defaultUser.png',
							dateId: 5678,
							username: 'Person C'
						}, {
							_id:4,
							userImage: 'upload/photos/defaultUser.png',
							dateId: 5678,
							username: 'Person D'
						}
					]
				}

				if(newUserData){
					res.render('admin/calendar/viewDetail', {
						title: 'Date Detail',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'calendar',
						userData : newUserData
					});
				} else {
					req.flash('error',"Record detail not found, Please try again.");
					res.redirect('/admin/calendar');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			console.log(err);			
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/calendar');
		}
    }
    
    // [ Delete all Record of user ]
	module.deleteMany = async function(req, res){
		try{            
			if(req.session.admin){
				// let pfId = mongoose.Types.ObjectId(req.params.id);
				// let pfData = await model.Testimonial.find({'userId': pfId});
				
                let pfData = true; // static value
				if(pfData){
					// await model.Testimonial.updateMany({'userId': pfId},{isDeleted:true});
					req.flash('success',"Record Deleted Successfully.");
					res.redirect('/admin/calendar');
				} else {
					req.flash('error',"Detail not found, Please try again.");
					res.redirect('/admin/calendar');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
            console.log("err: ",err);
            
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/calendar');
		}
	}

	// [ Delete ]
	module.delete = async function(req, res){
		try{            
			if(req.session.admin){
				// let pfId = mongoose.Types.ObjectId(req.params.id);
                // let pfData = await model.Testimonial.find({'_id': pfId});
				
				let pfData = true; // static value
				if(pfData){
					// await model.Testimonial.updateMany({'_id': pfId},{isDeleted:true});
					req.flash('success',"Record Deleted Successfully.");
					res.redirect('/admin/calendar');
				} else {
					req.flash('error',"Detail not found, Please try again.");
					res.redirect('/admin/calendar');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
            console.log("err: ",err);
            
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/calendar');
		}
	}

	return module;
}

