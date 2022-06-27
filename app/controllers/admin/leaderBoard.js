var dateformat = require('dateformat');
const moment = require('moment');
var currentDate = new Date();
var md5 = require('md5');
var fs = require('fs');

module.exports = function(model,config){	
	var module = {};

	// console.log('LeaderBoard Calling...');
		// // await helper.leaderBoard(model);
		// let usId = '5e57c8e58ed39c7dd2a52b7c';
		// let usData = await model.User.findOne({_id: usId}).select(['location']);
		// console.log('usData: ',usData);
		// await helper.nearBy(model, usData._id, usData.location);
		// console.log('LeaderBoard Setup Done...');

	// [ offer View ]
	module.view = async function(req, res){
		if(req.session.admin){
			res.render('admin/leaderBoard/list', {
				title: 'All User leaderBoard List',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				alias:'leaderBoard',
				contList: null,
			});
		} else {
			res.redirect('/admin');
		}
	};   

	// [ Filter ]
	module.leaderBoardList = async function(req, res){
		try {
		
			let start = parseInt(req.body.start);
			let length = parseInt(req.body.length);
			let search = req.body.search.value;    
			var query = { 'winnerMonth': { $regex: '.*' + search + '.*', $options:'i' } };
			var userQuery = { 'userData.isDeleted':false };
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
									{ $group : {_id:{winnerMonth:"$winnerMonth"},
															username:{$push: "$userData.username"}
														 }
									},
									{ $project : { 
											totalWinner:{$size:'$username'},
											username : '$username',
											winnerMonth:'$winnerMonth'
									}}
			];

		    let userImageDataCount = await model.LeaderBoard.aggregate(dataQuery); 
				
				var tmp = [
							{ "$limit": start + length },
				      { $sort : { "_id" : -1 } },
							{ $skip: parseInt(start)}
				];
				dataQuery = dataQuery.concat(tmp);

				var month = [ 'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December' ]
				var allMonths;
				for (let i = 0; i < month.length; i++) {
					allMonths = Array.apply(0, Array(12)).map(function(_,i){return moment().month(i).format('MMMMYYYY')})
					
				}
			console.log("allMonths",allMonths);
			
		    let LeaderBoardData = await model.LeaderBoard.aggregate(dataQuery); 
				let countryCount = await model.LeaderBoard.countDocuments(LeaderBoardData.length);
				// LeaderBoardData = LeaderBoardData.concat({'allMonths':allMonths});

				console.log("LeaderBoardData====",LeaderBoardData);
				
			var obj = {
				'draw': req.query.draw,
				'recordsTotal': LeaderBoardData.length,
				'recordsFiltered': LeaderBoardData.length,
				'data': LeaderBoardData,
				'data2': allMonths
			};
			res.send(obj);
        } catch (e) {
          console.log("Error in offerlist",e);
        }
	}

    module.edit = async function(req, res){

		var delId = req.params.id;
		var userQuery = { 'userData.isDeleted':false };
			
		var query = {'winnerMonth': delId};

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
			{ $project : { 
					username : '$userData.username',
					trustScore: '$userData.trustScore',
					isMailSend : '$isMailSend'
			}}
		];
			
			let LeaderBoardData = await model.LeaderBoard.aggregate(dataQuery); 
		let subSc = await model.Subscription.find({'planName': '1'});
			
		if(req.session.admin){
		   	res.render('admin/leaderBoard/edit', {
				title: 'LeaderBoard Detail',
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				auth: req.session,
				config: config,
				alias:'leaderBoard',
				LeaderBoardData: LeaderBoardData,
				subSc: subSc
			});
		} else {
			res.redirect('/admin');
		}
	}

 
	// [ Delete ]
	module.mailSendLeaderBoard = async function(req, res){
		try{
			if(req.session.admin){
				let delId = req.params.id;
				let planId = req.params.planId;
				
				let tmp = await model.LeaderBoard.findOne({'_id': delId});
				
				if(tmp){
					var userDetail =  await model.User.findOne({'_id': tmp.userId});
					
					let subSc = await model.Subscription.findOne({'_id': planId}).select(['benefits']);
					
					await model.LeaderBoard.updateOne({_id: mongoose.Types.ObjectId(delId)},{'isMailSend': true});
					if(userDetail){
					  var resetLink = config.baseUrl+'activePlan/'+planId+'/'+tmp.userId;
							
								var obj = {
								uname:userDetail.username,
								msg:'Congratulation, You are Winner, Please Click the button and Activate your Plan. This plan is a gift from Easy Date',
								buttonName:'Activate',
								note:'',
								baseUrl:config.baseUrl,
								resetLink:resetLink,
								appStoreLink:config.appStoreLink,
								playStoreLink:config.playStoreLink
							}
							let mailOptions = {
								to_email: userDetail.email,
								subject: 'Easy Date : Winner',
								// message: '<p>Easy Date Verify OTP is '+passwordOtp + '</p>',
								templateName: 'forgot_mail_template',
								dataToReplace: obj//<json containing data to be replaced in template>
							};
				  
							let send = await helper.sendTemplateMail(mailOptions);
						}
					req.flash('success',"Sent Mail Successfully");
					res.redirect('/admin/leaderBoard');
				} else {
					req.flash('error',"LeaderBoard Page not found. Please try again.");
					res.redirect('/admin/leaderBoard');
				}
			} else {
				res.redirect('/admin');
			}
		} catch(err){
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/admin/leaderBoard');
		}
	}
    
	return module;
}