var dateformat = require('dateformat');
var currentDate = new Date();
const moment = require('moment');

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
        var query = { "isApproved" : true }
        let tmpp = {};
		if(search){
			tmpp.$or = [
				{ date: new RegExp(search, "i") }
			]
		}

		// [ Count ]
		let dataCount = await model.Dates.aggregate([
		    { $match: query },
		    { 
		        $group: 
		        { 
		            _id: { $dayOfYear: "$dateTime"},
		            count: { $sum: 1 },
		            date: { $first: { $dateToString: { format: "%m-%d-%Y", date: "$dateTime"} } }
		        } 
		    },
		    { $match : tmpp },
			{
				$count: 'date'
			}
		]);

		console.log('dataCount: ',dataCount);

		// [ Actual Data ]
  		let data = await model.Dates.aggregate([
		    { $match: query },
		    { 
		        $group: 
		        { 
		            _id: { $dayOfYear: "$dateTime"},
		            count: { $sum: 1 },
		            date: { $first: { $dateToString: { format: "%m-%d-%Y", date: "$dateTime"} } }
		        } 
		    },
		    { "$skip": start },
			{ "$limit" : length },
			{ "$sort" : { "dateTime" : -1 } }
		]);

		var obj = {
	      	'draw': req.query.draw,
	      	'recordsTotal': dataCount[0].date,
	      	'recordsFiltered': dataCount[0].date,
	      	'data': data
		};
	    return res.send(JSON.stringify(obj));
	};

	// [ View Detail ]
	module.viewDetails = async function(req, res) {
        try{
			if(req.session.admin){
				let date = req.params.id;
				console.log('date: ',date);
				
				var start = new Date(date);
				start.setHours(0,0,0,0);

				var end = new Date(date);
				end.setHours(23,59,59,999);

				console.log('start: ',start);
				console.log('end: ',end);
				let query = {
						"dateTime" : {
							"$gte": start,
	            			"$lt": end
	            		}
					}
				let tmpData = await model.Dates.aggregate([
				    { $match: query },
				    { $lookup:
				            {
				                    from: 'users',
				                    localField: 'initUserId',
				                    foreignField: '_id',
				                    as: 'sData'
				            }
				    },
				    {
				    	$unwind : '$sData'      
				    },
				    { $lookup:
				            {
				                    from: 'users',
				                    localField: 'initOppId',
				                    foreignField: '_id',
				                    as: 'rData'
				            }
				    },
				    {
				    	$unwind : '$rData'      
				    },
				    { $lookup:
					    {
					            from: 'locations',
					            localField: 'locationId',
					            foreignField: '_id',
					            as: 'lData'
					    }
					},
					{
						$unwind : '$lData'      
					},
				    { 
				        $project : 
				        { 
				                dater1 : '$sData.username',
				                dater1Id : '$sData._id',
				                dater1ProfilePic : '$sData.profilePic',
				                dater2: '$rData.username',
				                dater2Id : '$rData._id',
				                dater2ProfilePic : '$rData.profilePic',
				                location: '$lData.name',
				                price: '$totalPrice',
				                dateTime: { $dateToString: { format: "%m-%d-%Y [ %H:%M ]", date: "$dateTime"} }
				        } 
				    }
				]);

				console.log('tmpData: ',tmpData);

				let alldata  = await model.Testimonial.aggregate([
		
		
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
					{ $unwind:'$datersData'
					},               
					{
						$lookup:
						{   
							from: "locations",
							localField: "datersData.locationId",
							foreignField: "_id",
							as: "locationsData"
						}
					},
					{ $unwind:'$locationsData'
					},   
					{
						$lookup:
						{   
							from: "dateAmenities",
							localField: "dateId",
							foreignField: "dateId",
							as: "dateAmenitiesData"
						}
					},
					{ $unwind:'$dateAmenitiesData'
					},     
					{
						$lookup:
						{   
							from: "amenties",
							localField: "dateAmenitiesData.amenityId",
							foreignField: "_id",
							as: "amentiesData"
						}
					},
					{ $unwind:'$amentiesData'
					},  
					{ $group : {_id:{dateId:"$dateId"},
					            userIds:{$push: "$userData._id"},
								usernames:{$push: "$userData.username"},
								userPics:{$push: "$userData.profilePic"},
								date:{$first: { "$dateToString": { 
																	"format": "%d-%m-%Y", 
																	"date": "$createdAt"}}},
								dateTime:{$first:{ "$dateToString": { 
																		"format": "%d-%m-%Y %H:%M:%S", 
																		"date": "$datersData.dateTime"}}},
								locationsName:{$first:"$locationsData.name"},
								amentiesName:{$first:"$amentiesData.amentiesName"}
					}},
					{ "$project": {
						    "userIds":"$userIds",
							"usernames":"$usernames",
							"userPics":"$userPics",
							"date":"$date",
							"dateTime":"$dateTime",
							"locationsName":"$locationsName",
							"amentiesName":"$amentiesName"
					}}
                ]);
				// console.log("alldata",alldata);
				// console.log("alldata",alldata[0].username);

				// console.log("alldata",typeof(alldata[0].date));
				// console.log("date",date);
				// console.log("date",typeof(date));
				
			    var datasend = [];
				for (let i = 0; i < alldata.length; i++) {
				// console.log("alldata",alldata[i].usernames[0]);
				// console.log("alldata",alldata[i].usernames[1]);

					if(alldata[i].date == date){
							datasend.push(alldata[i]);
					}
				}
			
				// console.log("user2 tt edi2",datasend);

				if(datasend){
					res.render('admin/calendar/viewDetail', {
						title: 'Date Detail',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'calendar',
						datasend : datasend,
						tmpData: tmpData
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

