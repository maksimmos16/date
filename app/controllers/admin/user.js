var dateformat = require('dateformat');
var currentDate = new Date();
var md5 = require('md5');
var fs = require('fs');

module.exports = function(model,config){	
	var module = {};

	// [ User View ]
	module.view = async function(req, res){
		if(req.session.admin){
			var userList = await model.User.find({'role': { $ne : 'admin' }});
			
			res.render('admin/user/users', {
				title: 'All User List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				settings: settings, //Global variable
				config: config,
				alias:'user',
				userList:null,
			});
		} else {
			res.redirect('/admin');
		}

	};

	// [ Filter ]
	module.userList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;
			let query = {
				role: 'user',
				isDeleted: false,
				isVerified: true
			};
			if (search) {
				query['$or'] = [
					{username:{ $regex: '.*' + search + '.*', $options:'i' }},
					{phno:{ $regex: '.*' + search + '.*', $options:'i' },role: 'user', 'isDeleted': false}
				];
			}

			let columns = [
				'_id',
				'username',
				'email',
				'likeCount',
				// 'phno',
				'trustScore',
				'email',
				'createdAt',
				'status',
				'rightSwipe',
				'isActive'
			]

			let countryCount = await model.User.countDocuments(query);
			// let data = await model.User.find(query).skip(start).limit(length).select(columns).sort({"_id": -1});
			let data = await model.User.aggregate([
				{ $match : query },
				{ "$sort" : { "createdAt" : -1 } },
				{ "$skip": start },
				{ "$limit": length },
				{
				  $lookup:
					{
					  from: "photos",
					  localField: "_id",
					  foreignField: "userId",
					  as: "tmpp"
					},
				}
			]);
			
			var datav;
			for (let i = 0; i < data.length; i++) {
				var datenew = data[i].createdAt;
				var datav = dateformat(datenew, 'dd-mm-yyyy');
			  data[i].createdAt = datav; 
			}
		
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

	// [ Delete User ]
	module.deleteUser = async function(req, res){
		try{

			var userId = req.params.id;
			if(userId != "" && userId != 0){
				await model.User.updateOne({ _id: userId },{"isDeleted": true,"isActive":false, deleteReason: 'deleted by admin', updatedAt: new Date()});
				
				
				
				req.flash('success',"User Delete Successfully.");
				res.redirect('/admin/user');
			}else{
				req.flash('error',"User Not Delete.");
				res.redirect('/admin/user');
			}
		}catch(err){
			console.log("user >> delete::::::::::>>error: ", error);
			req.flash('error',"User not delete.");
			res.redirect('/admin/user');
		}
	};

	// [ View Profile ]
	module.viewProfile = async function(req, res){

		let adminDetail = await model.User.findOne({ _id: req.params.id});
		var datenew = adminDetail.dob;
					var datav = dateformat(datenew, 'dd-mm-yyyy');
					adminDetail.dob = datav; 
			
		res.render('admin/user/profile', {
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			session: req.session,
			config: config,
			settings: settings, //Global variable
			adminDetail: adminDetail,
			datav:datav
		});
	};
	
	// [ View RightSwipe ]
	module.viewRightSwipe = async function(req, res){

		let id = mongoose.Types.ObjectId(req.params.id);
		let adminDetail = await model.Like.distinct('receiverId',{'senderId':id,'isDeleted':false});
		let userData = await model.User.find({'_id' : { $in :  adminDetail }}).select(['username', 'profilePic']);

		res.render('admin/user/viewRightSwipe', {
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			session: req.session,
			config: config,
			settings: settings, //Global variable
			userData: userData,
		});
	};

	// [ View Document ]
	module.viewDocument = async function(req, res){

		let id = mongoose.Types.ObjectId(req.params.id);
		let imageData = await model.Photo.find({ 'userId': id, 'type': 'document' });
		console.log('imageData: ',imageData);
		
		res.render('admin/user/viewDocuments', {
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			session: req.session,
			config: config,
			imageData: imageData,
			settings: settings, //Global variable
		});
	};

	// [ Verify Document ]
	module.docVerify = async function(req, res){

		let type = (req.query.type == 'approved') ? 'approved' : 'reject';
		let id = mongoose.Types.ObjectId(req.params.id);
		let imageData = await model.Photo.findOneAndUpdate({ _id : id }, { status : type, 'type': 'document' });
		let us = await model.Photo.findOne({_id: id}).select(['userId']);
		let fl = (type == 'approved') ? 'accept' : 'reject';
		await model.User.findOneAndUpdate({_id: us.userId}, {status: fl});
		res.redirect('/admin/user/viewDocument/'+imageData.userId);
	};
	return module;
}