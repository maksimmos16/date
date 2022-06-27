var dateformat = require('dateformat');
var currentDate = new Date();

module.exports = function(model,config){	
	var module = {};

    // [ View ]
	module.view = async function(req, res) {
        try{	
			
	        res.render('admin/testimonial/view', {
				title: 'Testimonial Management',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				settings: settings, //Global variable
				alias: 'testimonial'
			});
		} catch(error){
			req.flash('error',"testimonial under maintenance.");
			res.redirect('/admin/dashboard');
		}
	}

	// [ List ]
	module.getTestimonialList = async function(req, res){
		  
		let start = parseInt(req.body.start);
        let length = parseInt(req.body.length);
        let search = req.body.search.value;
        let query = {'isDeleted' : false}

		let userQuery = { 'userData.username': { $regex: '.*' + search + '.*', $options:'i' },'userData.isDeleted':false };

		let testimonialCount = await model.Testimonial.aggregate([
        	{ $match : query },
            {$group:
                    {_id:"$userId",
                        dateId:{$push: "$dateId"}},
                    },
            {
                $lookup:
                    {   
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "userData"
                    }
            },
            { $unwind:
                '$userData'
			},
			{ $match : userQuery },
            { $project : { 
                dateNo : {$size:"$dateId"},
                username : '$userData.username'
			}},
			{
		      $count: "totalCount"
		    }
		]);
		let data = await model.Testimonial.aggregate([
        	{ $match : query },
            {$group:
                    {_id:"$userId",
                        dateId:{$push: "$dateId"}},
                    },
            {
                $lookup:
                    {   
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "userData"
                    }
            },
            { $unwind:
                '$userData'
			},
			{ $match : userQuery },
            { $project : { 
                dateNo : {$size:"$dateId"},
                username : '$userData.username'
			}},
			{ "$skip": start },
			{ "$limit" : length },
			{ "$sort" : { "_id" : -1 } }
        ]);
        
		var obj = {
	      	'draw': req.query.draw,
	      	'recordsTotal': testimonialCount[0].totalCount,
	      	'recordsFiltered': testimonialCount[0].totalCount,
	      	'data': data
		};
	    return res.send(JSON.stringify(obj));
	};

	// [ View Detail ]
	module.viewDetails = async function(req, res) {
        try{
			if(req.session.admin){
				let user_id = req.params.id;
				let query = {'isDeleted' : false,'userId': mongoose.Types.ObjectId(user_id)}
				let userData = await model.Testimonial.aggregate([
					{ 
						$match : query
					},
					{
						$group:
						{
							_id:"$userId",
							testimonialData:{
								$push: {
											_id:"$_id",
											dateId : "$dateId",
											type : "$type",
											text : "$text",
										}
								}
					   },						
					},
					{ 
						$lookup:
						{ 
							from: "users",
							localField: "_id",
							foreignField: "_id",
							as: "userData"
						}
					},
					{ 
						$unwind:'$userData'
					},
					{ 
						$project : {
							testimonialData : "$testimonialData",
							username : '$userData.username',
							userimage : '$userData.profilePic',
						}
					},
				
				]);
				let newUserData = userData[0];
				if(newUserData){
					res.render('admin/testimonial/viewDetail', {
						title: 'Testimonial Detail',
						error: req.flash("error"),
						success: req.flash("success"),
						vErrors: req.flash("vErrors"),
						auth: req.session,
						config: config,
						settings: settings, //Global variable
						alias:'testimonial',
						userData : newUserData
					});
				} else {
					req.flash('error',"Testimonial detail not found, Please try again.");
					res.redirect('/admin/testimonial');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			console.log(err);			
			req.flash('error',"Something went wrong, Please try again.");
			res.redirect('/admin/testimonial');
		}
    }
    
    // [ Delete all Record of user ]
	module.deleteMany = async function(req, res){
		try{            
			if(req.session.admin){
				let pfId = mongoose.Types.ObjectId(req.params.id);
                let pfData = await model.Testimonial.find({'userId': pfId});
                
				if(pfData){
					await model.Testimonial.updateMany({'userId': pfId},{isDeleted:true});
					req.flash('success',"Testimonial Deleted Successfully.");
					res.redirect('/admin/testimonial');
				} else {
					req.flash('error',"Detail not found, Please try again.");
					res.redirect('/admin/testimonial');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
            console.log("err: ",err);
            
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/testimonial');
		}
	}

	// [ Delete ]
	module.delete = async function(req, res){
		try{            
			if(req.session.admin){
				let pfId = mongoose.Types.ObjectId(req.params.id);
                let pfData = await model.Testimonial.find({'_id': pfId});
                
				if(pfData){
					await model.Testimonial.updateMany({'_id': pfId},{isDeleted:true});
					req.flash('success',"Testimonial Deleted Successfully.");
					res.redirect('/admin/testimonial');
				} else {
					req.flash('error',"Detail not found, Please try again.");
					res.redirect('/admin/testimonial');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
            console.log("err: ",err);
            
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/testimonial');
		}
	}

	return module;
}

