let dateformat = require('dateformat');
const moment = require('moment');
let currentDate = new Date();

module.exports = function(model,config){
	let module = {};

	module.view = async function(req, res){

		// console.log('req.session: ',req.session);

		// [ User Count ]
		let userCount = await model.User.countDocuments({isDeleted: false, role: 'user'});

		// [ Male ]
		let maleCount = await model.User.countDocuments({isDeleted: false, gender: 'Male', _id: { $ne : req.session.admin._id}});

		// [ Female ]
		let femaleCount = await model.User.countDocuments({isDeleted: false, gender: 'Female', _id: { $ne : req.session.admin._id}});
		
		// [ Profile Photo ]
		let img = await model.User.findOne({_id: req.session.admin._id}).select(['profilePic']);
		
		// [ Total Online Users ]
		let totalOnlineUserCount = await model.User.countDocuments({isDeleted: false,isLogin:true});

		// [ Total Active Users ]
		let totalActiveUserCount = await model.User.countDocuments({isDeleted: false,isActive:true});

		// [ Total Inactive Users ]
		let totalInActiveUserCount = await model.User.countDocuments({isDeleted: false,isActive:false});

		let getCurrentYear = new Date().getFullYear();
		let totalMonth = [1,2,3,4,5,6,7,8,9,10,11,12]
		
		// [ Like Report ]
		let totalYearlyLikeCount = await model.Like.find({isDeleted: false});
		// console.log('totalYearlyLikeCount: ',totalYearlyLikeCount);
		let totalYearlyLikeArray = [];
		let assignArrayLikeValue = [];
		for (let j=0; j<totalMonth.length; j++) {
			for (let i=0; i<totalYearlyLikeCount.length; i++) {
				let getCurrentYearMonths = moment(totalYearlyLikeCount[i].createdAt);
				let months = parseInt(getCurrentYearMonths.format('M'));
				if(totalMonth[j] == months){
					let fn = await model.Like.aggregate([
					  {$project: {type: 1, month: {$month: '$createdAt'}, isDeleted: 1}},
					  {$match: {month: months, isDeleted: false}},
					  {
					        $group: {
					                _id: null,
					                count: { $sum: 1 }
					        }
					  }
					])
					let cn = (fn && fn[0] && fn[0].count) ? fn[0].count : 0;
					assignArrayLikeValue.push(cn)
					break;
				}
			}	
			totalYearlyLikeArray.push(assignArrayLikeValue);
			assignArrayLikeValue = [];
		}
		let finalArrayLike = [];
		for (let x=0; x<totalYearlyLikeArray.length; x++) {
			if(totalYearlyLikeArray[x].length){
				finalArrayLike.push({'totalMonthRent': totalYearlyLikeArray[x]})
			} else {
				finalArrayLike.push({'totalMonthRent':0})
			}
		}

		// [ Match Report ]	
		let totalYearlyMatchCount = await model.Like.find({isDeleted: false, matched : true});
		// console.log('totalYearlyMatchCount: ',totalYearlyMatchCount);
		let totalYearlyMatchArray = [];
		let assignArrayMatchValue = [];
		for (let j=0; j<totalMonth.length; j++) {
			for (let i=0; i<totalYearlyMatchCount.length; i++) {
				let getCurrentYearMonths = moment(totalYearlyMatchCount[i].createdAt);
				let months = parseInt(getCurrentYearMonths.format('M'));
				if(totalMonth[j] == months){
					let fn = await model.Like.aggregate([
					  {$project: {type: 1, month: {$month: '$createdAt'}, isDeleted: 1, matched: 1}},
					  {$match: {month: months, isDeleted: false, matched : true}},
					  {
					        $group: {
					                _id: null,
					                count: { $sum: 1 }
					        }
					  }
					])
					let cn = (fn && fn[0] && fn[0].count) ? fn[0].count : 0;
					assignArrayMatchValue.push(cn)
					break;
				}
			}	
			totalYearlyMatchArray.push(assignArrayMatchValue);
			assignArrayMatchValue = [];
		}
		let finalArrayMatch = [];
		for (let y=0; y<totalYearlyMatchArray.length; y++) {
			if(totalYearlyMatchArray[y].length){
				finalArrayMatch.push({'totalMonthSell':totalYearlyMatchArray[y]})
			} else {
				finalArrayMatch.push({'totalMonthSell':0})
			}
		}

		// console.log('finalArrayLike: ',finalArrayLike);
		// console.log('finalArrayMatch: ',finalArrayMatch);

		res.render('admin/dashboard', {
			title : 'Dashboard',
			error: req.flash("error"),
			success: req.flash("success"),
			vErrors: req.flash("vErrors"),
			auth: req.session,
			config: config,
			img: img.profilePic,
			settings: settings, //Global variable
			alias: 'dashboard',
			userCount : userCount,
			totalOnlineUserCount : totalOnlineUserCount,
			totalActiveUserCount: totalActiveUserCount,
			totalInActiveUserCount: totalInActiveUserCount,
			maleCount: maleCount,
			femaleCount: femaleCount,
			totalOfflineUserCount : 0,
			finalArrayLike : JSON.stringify(finalArrayLike),
			finalArrayMatch : JSON.stringify(finalArrayMatch),
		});
	};

	return module;
}