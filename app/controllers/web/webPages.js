var dateformat = require('dateformat');
var currentDate = new Date();

// [ Spotify ]
var SpotifyWebApi = require('spotify-web-api-node');
// scopes = ['user-read-private', 'user-read-email','playlist-modify-public','playlist-modify-private']
scopes = [
	'user-read-private', 
	'user-read-email', 
	'user-read-playback-state', 
	'user-read-playback-position', 
	'user-read-currently-playing',
	'user-library-read',
	'user-top-read',
	'playlist-modify-public',
	'user-follow-read',
	'user-modify-playback-state',
	'playlist-read-private',
	'user-library-modify',
	'playlist-read-collaborative',
	'playlist-modify-private',
	'user-follow-modify',
	'user-read-recently-played'
]

var spotifyApi = new SpotifyWebApi({
  clientId: configAuth.spotifyAuth.clientID,
  clientSecret: configAuth.spotifyAuth.clientSecret,
  redirectUri: configAuth.spotifyAuth.callbackURL,
});

module.exports = function(model,config){
	var module = {};

	// [ Home Page ]
	module.home = async function (req, res) {
		try {
			// console.log('home---------------->>>>>req.session.userData: ',req.session.userData);
			if(req.session.userData == undefined){
				req.flash('error',"Please Login");
				res.redirect('/');
			}			
			let user = req.session.userData.userId;
			let userId = mongoose.Types.ObjectId(user);

			let logUs = await model.User.findOne({_id: userId});
			
			let maleFemaleSelect = (logUs.idealInfo != undefined && logUs.idealInfo.gender != undefined) ? logUs.idealInfo.gender : 'Female';
			let relSt = (logUs.idealInfo != undefined && logUs.idealInfo.relationshipStatus != undefined) ? logUs.idealInfo.relationshipStatus : 'Single';
			let minAgeF = (logUs.idealInfo != undefined && logUs.idealInfo.minAge != undefined) ? logUs.idealInfo.minAge : 18;
			let maxAgeF = (logUs.idealInfo != undefined && logUs.idealInfo.maxAge != undefined) ? logUs.idealInfo.maxAge : 25;
			let sexOr = (logUs.idealInfo != undefined && logUs.idealInfo.sexualOrientation != undefined) ? logUs.idealInfo.sexualOrientation : 'Straight';
			let reli = (logUs.idealInfo != undefined && logUs.idealInfo.religion != undefined) ? logUs.idealInfo.religion : 'Hinduism';
			let bodyF = (logUs.additionalInfo != undefined && logUs.additionalInfo.bodyType != undefined) ? logUs.additionalInfo.bodyType : 'normal';




			// [ I - Like - U ]
			// let likeData = await model.Like.distinct('receiverId',{'senderId': userId, 'isDeleted':false});

			let likeDataTmp = await model.Like.find({
				$and: [
					{ $or: [ {"senderId":userId},{"receiverId":userId} ] },
					{ "isDeleted":false}
				]
			});
			let likeData = [];
			for(let i = 0; i < likeDataTmp.length; i++){
				let tmpU = userId.toString();
				let tmpId = (likeDataTmp[i].senderId).toString();
				if(tmpU != tmpId){
					if(likeDataTmp[i].matched == true){
						likeData.push(likeDataTmp[i].senderId);
					}
				} else {
					likeData.push(likeDataTmp[i].receiverId);
				}
			}



			// [ I - Block - U ]
			let iBlockU = await model.Block.distinct('receiverId',{'senderId': userId, "isBlocked" : true, 'isDeleted':false});

			// [ U - Block - I ]
			let uBlockI = await model.Block.distinct('senderId',{'receiverId': userId, "isBlocked" : true, 'isDeleted':false});




			// let disLikeData = await model.Dislike.distinct('receiverId',{'senderId': userId, 'isDeleted':false});

			let disLikeDataTmp = await model.Dislike.find({
				$and: [
					{ $or: [ {"senderId":userId},{"receiverId":userId} ] },
					{ "isDeleted":false}
				]
			});
			let disLikeData = [];
			for(let i = 0; i < disLikeDataTmp.length; i++){
				let tmpU = userId.toString();
				let tmpId = (disLikeDataTmp[i].senderId).toString();
				if(tmpU != tmpId){
					disLikeData.push(disLikeDataTmp[i].senderId);
				} else {
					disLikeData.push(disLikeDataTmp[i].receiverId);
				}
			}





			let quAr = [ ...likeData, ...disLikeData, ...iBlockU, ...uBlockI, userId];
			let userData = await model.User.aggregate([
				{ 
					$match : {
						role: 'user', 
						isDeleted: false, 
						gender: maleFemaleSelect, 
						// relationshipStatus: relSt,
						// sexualOrientation: sexOr,
						// 'idealInfo.religion': reli,
						// 'idealInfo.bodyType': bodyF,
						username: { "$nin": ["",null]}, 
						_id : { '$nin' : quAr},
						showInSwipe: true
					}
				},
				{
					$lookup: {
                        from: "photos",
                        let: {userId: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {$eq: ['$userId','$$userId']},
                                            {$eq: ['$isDeleted', false]},
                                            {$ne: ['$type', 'document']},
                                        ]
                                    }
                                } 
                            },
                            {
                                $sort: {sortOrder:1}
                            }
                        ],
                        as: "userPhoto"
                    }
				},
				{ "$sort" : { "_id" : 1 } },
			]);
			let trustScores = null;
			let matchUser = mongoose.Types.ObjectId(user);
			let userInfo = null;
			let FirstMp = null;

			if(userData.length > 0){

				
				// [ Matched Score User ]

				for (let i = 0; i < userData.length; i++) {

					let dob = await helper.getAge(userData[i].dob);

					//if(minAgeF <= dob && maxAgeF >= dob){ // [ 18 < 20 && 25 > 20 ]
						let mp = await helper.calculateMatchPoints(model,userId, userData[i]._id);
						userData[i].matchPercentage = mp;
						var cn = (userData[i].country && userData[i].country != '') ? userData[i].country + ', ': '';
						var st = (userData[i].state && userData[i].state != '') ? userData[i].state + ', ': '';
						var ct = (userData[i].city && userData[i].city != '') ? userData[i].city: '';
						userData[i].address = cn+st+ct;	
					// }
					// else {
					// 	userData.splice(i, 1);
					// }
				}

				// [ High Score Match User ]
				for (var j=0 ; j<userData.length ; j++) {

					console.log('userData[j].username: ',userData[j].username);
					console.log('userData[j].matchPercentage: ',userData[j].matchPercentage);

					if(userData[j].matchPercentage != undefined){
						if (FirstMp == null || parseInt(userData[j].matchPercentage) > parseInt(FirstMp.matchPercentage))
						FirstMp = userData[j];
					}

				}
				
				userInfo = await model.User.aggregate([
					{ $match : {role: 'user', isDeleted: false, _id: FirstMp._id }},
					{
						$lookup: {
	                        from: "photos",
	                        let: {userId: '$_id'},
	                        pipeline: [
	                            {
	                                $match: {
	                                    $expr: {
	                                         $and: [
	                                            {$eq: ['$userId','$$userId']},
	                                            {$eq: ['$isDeleted', false]},
	                                            {$ne: ['$type', 'document']},
	                                        ]
	                                    }
	                                } 
	                            },
	                            {
	                                $sort: {sortOrder:1}
	                            }
	                        ],
	                        as: "photo"
	                    }
					},
					{ "$sort" : { "_id" : 1 } },
				]);
				FirstMp.photo = userInfo[0].photo;
				
				// [ Location ]
				let logUsr = await model.User.distinct('location',{ _id: matchUser});
				logUsr = logUsr[0];
				let shDs = (FirstMp.additionalInfo != undefined && FirstMp.additionalInfo.showDistance == 'kms') ? 'K' : 'N';
				let diss = await helper.getDistance(FirstMp.location.coordinates[0], FirstMp.location.coordinates[1], logUsr.coordinates[0], logUsr.coordinates[1], shDs);
				FirstMp.shDs = (shDs == 'K') ? 'KM' : 'Miles';
				let dob = await helper.getAge(FirstMp.dob);
				FirstMp.km = Math.round(diss);
				FirstMp.age = dob;

				// [ Trust Score ]
				// trustScores = await model.User.find({'isDeleted': false, role: 'user', isActive: true}).select([ 'trustScore', 'username', 'country', 'state', 'city' ]).sort({'trustScore': 1});
				trustScores = await model.User.aggregate([
					{ $match : {'isDeleted': false, _id : { '$nin' : quAr}, username: { "$nin": ["",null]}, role: 'user', isActive: true, isWin: false}},
					{ "$sort" : { "trustScore" : -1 } },
					{ $limit: 10 },
					{ $project : { trustScore: 1, username: 1, country: 1, state: 1, city: 1, _id: 1 } },
				]);
			}
			
			// [ Comparer Function ] 
			function GetSortOrder(prop) {  
				return function(a, b) {  
					if (a[prop] < b[prop]) {  
						return 1;  
					} else if (a[prop] > b[prop]) {  
						return -1;  
					}  
					return 0;  
				}  
			} 

			if (trustScores && trustScores.length) {
				trustScores.sort(GetSortOrder("trustScore"));
				for (let i = 0; i < trustScores.length; i++) {
					var cn = (trustScores[i].country && trustScores[i].country != '') ? trustScores[i].country + ', ': '';
					var st = (trustScores[i].state && trustScores[i].state != '') ? trustScores[i].state + ', ': '';
					var ct = (trustScores[i].city && trustScores[i].city != '') ? trustScores[i].city: '';
					trustScores[i].address = cn+st+ct;
				}
			} 

			

			// [ Subscription Plan Start ]
			let planData = await model.Subscription.find({}).lean();
			let benefitArr = [];
			for (let i = 0; i < planData.length; i++) {
				let benefitKey = Object.keys(planData[i].benefits);
				for (let j = 0; j < benefitKey.length; j++) {
					if(planData[i].benefits[benefitKey[j]]){
						benefitArr.push(benefitKey[j]);
					}	
				}
			 planData[i].benefits = benefitArr
			}
			var benefits = benefitArr.filter(function(item, pos) {
				return benefitArr.indexOf(item) == pos;
			})
			// [ Subscription Plan End ]

			// [ Testimonials ]
			// let testimonials = await model.Testimonial.find().sort({'createdAt':-1}).limit(10);
			let testimonial = await model.Testimonial.aggregate([
				{ $match : { isDeleted: false }},
				{ $sort : { createdAt : -1 } },
				{ $limit : 10 },
				{ $lookup:
					{
						from: 'users',
						localField: 'userId',
						foreignField: '_id',
						as: 'userData'
					}
				},
				{ $project : 
					{ 	
						type : 1,
						userId: 1,
						text: 1,
						username : '$userData.username',
						profilePic : '$userData.profilePic',
					} 
				},
			]);

			req.session.id = user;
			let cmspagesData = await model.CMSPages.find();
			req.session.userData.isLogin = true;
            res.render('web/home', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				settings: settings, //Global variable
				config: config,
				title: 'Home',
				alias: 'explore',
				benefits:benefits,
				userData: userData,
				trustScores: trustScores,
				testimonial: testimonial,
				planData:planData,
				userInfo: FirstMp,
				cmspagesData: cmspagesData
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/');
		}
	}

	//  [ Discover ]
	module.discover = async function (req, res) {
		try {			

			let userId = mongoose.Types.ObjectId(req.session.userData.userId);
			let tmpUsr = await model.User.findOne({_id: userId});

			// [ Filter ]
			let maleFemaleSelect = (tmpUsr.idealInfo != undefined && tmpUsr.idealInfo.gender != undefined) ? tmpUsr.idealInfo.gender : 'Female';
			let relSt = (tmpUsr.idealInfo != undefined && tmpUsr.idealInfo.relationshipStatus != undefined) ? tmpUsr.idealInfo.relationshipStatus : 'Single';
			let minAgeF = (tmpUsr.idealInfo != undefined && tmpUsr.idealInfo.minAge != undefined) ? tmpUsr.idealInfo.minAge : 18;
			let maxAgeF = (tmpUsr.idealInfo != undefined && tmpUsr.idealInfo.maxAge != undefined) ? tmpUsr.idealInfo.maxAge : 25;
			let sexOr = (tmpUsr.idealInfo != undefined && tmpUsr.idealInfo.sexualOrientation != undefined) ? tmpUsr.idealInfo.sexualOrientation : 'Straight';
			let reli = (tmpUsr.idealInfo != undefined && tmpUsr.idealInfo.religion != undefined) ? tmpUsr.idealInfo.religion : 'Hinduism';
			let bodyF = (tmpUsr.additionalInfo != undefined && tmpUsr.additionalInfo.bodyType != undefined) ? tmpUsr.additionalInfo.bodyType : 'normal';



			// let likeData = await model.Like.distinct('receiverId',{'senderId': userId, 'isDeleted':false});

			let likeDataTmp = await model.Like.find({
				$and: [
					{ $or: [ {"senderId":userId},{"receiverId":userId} ] },
					{ "isDeleted":false}
				]
			});
			let likeData = [];
			for(let i = 0; i < likeDataTmp.length; i++){
				let tmpU = userId.toString();
				let tmpId = (likeDataTmp[i].senderId).toString();
				if(tmpU != tmpId){
					if(likeDataTmp[i].matched == true){
						likeData.push(likeDataTmp[i].senderId);
					}
				} else {
					likeData.push(likeDataTmp[i].receiverId);
				}
			}



			// let disLikeData = await model.Dislike.distinct('receiverId',{'senderId': userId, 'isDeleted':false});

			let disLikeDataTmp = await model.Dislike.find({
				$and: [
					{ $or: [ {"senderId":userId},{"receiverId":userId} ] },
					{ "isDeleted":false}
				]
			});
			let disLikeData = [];
			for(let i = 0; i < disLikeDataTmp.length; i++){
				let tmpU = userId.toString();
				let tmpId = (disLikeDataTmp[i].senderId).toString();
				if(tmpU != tmpId){
					disLikeData.push(disLikeDataTmp[i].senderId);
				} else {
					disLikeData.push(disLikeDataTmp[i].receiverId);
				}
			}

			


			let quAr = [ ...likeData, ...disLikeData, userId];
			let userData = await model.User.aggregate([
				{ 
					$match : {
						role: 'user', 
						isDeleted: false, 
						gender: maleFemaleSelect, 
						// relationshipStatus: relSt,
						// sexualOrientation: sexOr,
						// 'idealInfo.religion': reli,
						// 'idealInfo.bodyType': bodyF,
						username: { "$nin": ["",null]}, 
						_id : { '$nin' : quAr}
					} 
				},
				{
					$lookup: {
                        from: "photos",
                        let: {userId: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                         $and: [
                                            {$eq: ['$userId','$$userId']},
                                            {$eq: ['$isDeleted', false]},
                                            {$ne: ['$type', 'document']},
                                        ]
                                    }
                                } 
                            },
                            {
                                $sort: {sortOrder:1}
                            }
                        ],
                        as: "userPhoto"
                    }
				},
				{ "$sort" : { "_id" : 1 } },
			]);
			// [ Matched Score ]
			for (let i = 0; i < userData.length; i++) {

				let dob = await helper.getAge(userData[i].dob);

				// if(minAgeF <= dob && maxAgeF >= dob){ // [ 18 < 20 && 25 > 20 ]
					let mp = await helper.calculateMatchPoints(model,userId, userData[i]._id);
					userData[i].matchPercentage = mp;
					let diss = await helper.getDistance(tmpUsr.location.coordinates[0], tmpUsr.location.coordinates[1], userData[i].location.coordinates[0], userData[i].location.coordinates[1], 'K');
					userData[i].km = Math.round(diss);
					var cn = (userData[i].country && userData[i].country != '') ? userData[i].country + ', ': '';
					var st = (userData[i].state && userData[i].state != '') ? userData[i].state + ', ': '';
					var ct = (userData[i].city && userData[i].city != '') ? userData[i].city: '';
					userData[i].address = cn+st+ct;	
				// }
				// else {
				// 	userData.splice(i, 1);
				// }

				
			}
			let nearBy = [ ...userData];
			let onlineDaters = [ ...userData];

			// [ Comparer Function ] 
			function GetSortOrder(prop) {  
				return function(a, b) {  
					if (a[prop] < b[prop]) {  
						return 1;  
					} else if (a[prop] > b[prop]) {  
						return -1;  
					}  
					return 0;  
				}  
			} 
			userData.sort(GetSortOrder("matchPercentage"));

			var mainQuery = [
			    {
			        $match: {isDeleted: false, isSkipped: false, isPrivate: false}
			    },
			    {
			        $lookup: {
		                from : 'questions',
		                let: {'queId':'$queId'},
		                pipeline: [
		                    {
		                        $match: {
		                            $expr: {
		                                $and: [
		                                    {$eq: ['$_id','$$queId']},
		                                    {$eq: ['$status',true]},
		                                    {$eq: ['$isDeleted',false]},
		                                    {$ne: ['$quesType', 'feedback']}
		                                ]
		                            } 
		                        }
		                    },
		                    {
		                        $project: {
	                                _id: 1,
	                                que: 1,
	                                categoryName: 1
		                        }
		                    }
		                ],
		                as : 'queData'
			        }
			    },
			    {
			        $unwind: '$queData'
			    },
			    {
			         $lookup: {
		                from : 'users',
		                let: {userId: '$userId', crtUserId: userId},
		                pipeline: [
		                    {
		                        $match: {
	                                $expr: {
                                        $and: [
                                        	{
                                        		$ne: ['$_id','$$crtUserId']
                                        	},
                                            {
                                                $eq: ['$_id','$$userId']
                                            },
                                            {
                                                $eq: ['$isDeleted',false]
                                            },
                                            {
                                                $eq: ['$status','accept']
                                            },
                                            {
                                                $eq: ['$isActive',true]
                                            },
                                            {
                                                $eq: ['$role','user']
                                            }
                                        ]
	                                }
		                        }
		                    },
		                    {
		                        $project: {
	                                _id:1,                                
	                                profilePic: 1,
	                                username: 1
		                        }
		                    }
		                ],
		                as: 'userData'
			        }
			    },
			    {
			        $unwind: '$userData'
			    },
			    {
			        $group: {
			            _id: {queId: '$queId', ans: '$ans'},
			            total: {$sum: 1},
			            userId: {$last: '$userData._id'},
			            username: { $last: '$userData.username'},
			            userProfile: {$last: '$userData.profilePic'},
			            question: {$first: '$queData.que'},
			            categoryName: {$first: '$queData.categoryName'},
			            answer: {$first: '$ans'}
			        }
			    },
			    {
			        $sort: {total: -1}  
			    },
			    {
			        $limit: 5
			    },
			    {
			    	$project: {
			    		_id:0,
			    		total:0
			    	}	
			    }
			];

			let talkingAbout = await model.UserAnswer.aggregate(mainQuery);

			// let user32 = [ ...userAnswerData, ...userAnswerData2, ...userAnswerData3, ...userAnswerData4 ];

			// [ NearBy ]
			// nearBy.sort(GetSortOrder("km"));
			nearBy.sort(function(a, b) {
			    return a.km - b.km;
			});
			let instaFeeds = await helper.discoverFeeds(model, userId);

			if (instaFeeds && instaFeeds.length) {
				for (let i = 0; i < instaFeeds.length; i++) {
					let mp = await helper.calculateMatchPoints(model,userId, instaFeeds[i].userId);
					instaFeeds[i].matchPercentage = mp;
				}
			}
			
			let cmspagesData = await model.CMSPages.find();

			// console.log("userData",userData);

			res.render('web/discover', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				settings: settings, //Global variable
				config: config,
				title : 'Discover',
				alias: 'discover',
				// benefits:benefits,
				userData: userData,
				nearBy: nearBy,
				userAnswerData: talkingAbout,
				cmspagesData: cmspagesData,
				instagram: instaFeeds
				// planData:planData,
				// userInfo: userInfo
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ User Info ]
	module.userInfo = async function (req, res) {
		try {
			// console.log('req.params: ',req.session);
			let fl = (req.params.flag == 'full') ? 'full' : 'half';
			
			// [ Person - B Id ]
			let userId = mongoose.Types.ObjectId(req.params.id);
			let selfId = mongoose.Types.ObjectId(req.session.userData.userId);
			let tmpUsr = await model.User.findOne({_id: selfId});
			let userInfo = await model.User.aggregate([
				{ $match : {role: 'user', _id: userId }},
				{
					$lookup: {
                        from: "photos",
                        let: {userId: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                         $and: [
                                            {$eq: ['$userId','$$userId']},
                                            {$eq: ['$isDeleted', false]},
                                            {$ne: ['$type', 'document']},
                                            {$ne: ['$visibleInPrivacy', true]},
                                        ]
                                    }
                                } 
                            },
                            {
                                $sort: {sortOrder:1}
                            }
                        ],
                        as: "photo"
                    }
				},
				{ "$sort" : { "_id" : 1 } },
			]);
			userInfo = userInfo[0];
			let shDs = (userInfo.additionalInfo.showDistance == 'kms') ? 'K' : 'N';
			let diss = await helper.getDistance(userInfo.location.coordinates[0], userInfo.location.coordinates[1], tmpUsr.location.coordinates[0], tmpUsr.location.coordinates[1], shDs);
			userInfo.matchPercentage = await helper.calculateMatchPoints(model,selfId, userInfo._id);
			let dob = await helper.getAge(userInfo.dob);
			userInfo.km = Math.round(diss);
			userInfo.age = dob;
			userInfo.shDs = (shDs == 'K') ? 'KM' : 'Miles';
			var cn = (userInfo.country && userInfo.country != '') ? userInfo.country + ', ': '';
			var st = (userInfo.state && userInfo.state != '') ? userInfo.state + ', ': '';
			var ct = (userInfo.city && userInfo.city != '') ? userInfo.city: '';
			userInfo.address = cn+st+ct;

			// let liked = await model.Like.findOne({'senderId': selfId, 'receiverId': userId, 'isDeleted':false});

			let liked = await model.Like.findOne({
				$and: [
					{ $or: [ {"senderId":selfId},{"receiverId":selfId} ] },
					{ $or: [ {"senderId":userId},{"receiverId":userId} ] },
					{ "isDeleted":false}
				]
			});

			if(liked != null){
				if(liked.type == 'like'){
					if(liked.matched){
						liked = 'matched';
					}
					else{
						
						// liked = 'like';

						// new condition --- start
						let tmpU = selfId.toString();
						let tmpId = (liked.senderId).toString();
						if(tmpU == tmpId){
							liked = 'like';
						}else{
							liked = 'new';
						}
						// new condition --- end
					}
				}
				else{
					if(liked.matched){
						liked = 'matched';
					}
					else{

						// liked = 'superLike';

						// new condition --- start
						let tmpU = selfId.toString();
						let tmpId = (liked.senderId).toString();
						if(tmpU == tmpId){
							liked = 'superLike';
						}else{
							liked = 'new';
						}
						// new condition --- end
					}
				}
			}
			else{
				liked = 'new';
			}

			let cmspagesData = await model.CMSPages.find();

			console.log('height: ',userInfo.additionalInfo);
			console.log('height: ',userInfo.additionalInfo.height);

            res.render('web/userInfo', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				settings: settings, //Global variable
				config: config,
				flag: fl,
				selUs: tmpUsr,
				title: 'User Info',
				alias: 'explore',
				userInfo: userInfo,
				cmspagesData: cmspagesData,
				liked: liked
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	//  [ Flava Likes ]
	module.flavaLikes = async function (req, res) {
		try {

			let user = req.session.userData.userId;
			let userId = mongoose.Types.ObjectId(user);

			let blockedIds = await model.Block.distinct('receiverId',{senderId: userId, isDeleted: false, isBlocked: true});
			let blockedByIds = await model.Block.distinct('senderId',{receiverId: userId, isDeleted: false, isBlocked: true});

			let quAr = [ ...blockedIds, ...blockedByIds];

			// [ Like Table > Id > User Table - Photo ]
			let allLikeMe = await model.Like.aggregate([
				{ $match : {'receiverId': userId, 'isDeleted':false}},
				{
					$lookup: {
						from: "users",
						localField: "senderId",
						foreignField: "_id",
						as: "userData"
					}
				},
				{ $match : {'userData._id' : { '$nin' : quAr},'userData.role': 'user', 'userData.username': { "$nin": ["",null]}}},
				{ "$sort" : { "_id" : 1 } },
				// { "$limit" : 10 },
				{
					$project: {
						matched: 1,
						userId: '$userData._id',
						username: '$userData.username',
						profilePic: '$userData.profilePic'
					}
				}
			]);

			// [ Date Entry or Not ]
			allLikeMe.map(async function(data){
				let queryDate = {
					$or : [ 
						{ initUserId: userId, initOppId: data.userId[0] },
						{ initUserId: data.userId[0], initOppId: userId }
					],
    				"status" : "pending"
				}
				let dt = await model.Dates.countDocuments(queryDate);
				data.dateOrNot = dt;
				return data;
			});

			// [ Plan Setup ]
			let premiumPerson = false;
			let tmp = await model.UserSubscription.find({userId: userId, isExpired: false});
			premiumPerson = (tmp) ? true : false;

			// [ Like Table > Id > User Table - Photo ]
			let iLikeAll = await model.Like.aggregate([
				{ 
					$match : {'senderId': userId, 'isDeleted':false}
				},
				{
					$lookup: {
						from: "users",
						localField: "receiverId",
						foreignField: "_id",
						as: "userData"
					}
				},
				{ $match : {'userData._id' : { '$nin' : quAr},'userData.role': 'user', 'userData.username': { "$nin": ["",null]}}},
				{ "$sort" : { "_id" : -1 } },
				// { "$limit" : 10 },
				{
					$project: {
						matched: 1,
						userId: '$userData._id',
						username: '$userData.username',
						profilePic: '$userData.profilePic'
					}
				}
			]);
			// console.log('iLikeAll: ',iLikeAll);

			// [ Date Entry or Not ]
			iLikeAll.map(async function(data){
				let queryDate = {
					$or : [ 
						{ initUserId: userId, initOppId: data.userId[0] },
						{ initUserId: data.userId[0], initOppId: userId }
					],
    				"status" : "pending"
				}
				let dt = await model.Dates.countDocuments(queryDate);
				data.dateOrNot = dt;
				return data;
			});
				

			let userBenefit = await model.User.findOne({'_id': userId});

			// console.log('iLikeAll32: ',iLikeAll);

			let cmspagesData = await model.CMSPages.find();

			res.render('web/flavaLikes', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				settings: settings, //Global variable
				config: config,
				userBenefit: userBenefit.benefits,
				allLikeMe: allLikeMe,
				premiumPerson: premiumPerson,
				iLikeAll: iLikeAll,
				title : 'Flava Likes',
				cmspagesData: cmspagesData,
				alias: 'flavaLikes',
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	//  [ Book Date ]
	module.bookDate = async function (req, res) {
		try {

			let userId = mongoose.Types.ObjectId(req.params.id);
			let user = req.session.userData.userId;
			let selfId = mongoose.Types.ObjectId(user);


			let userPlan = await model.UserSubscription.findOne({userId:selfId});
			if(!userPlan){
				console.log(':::::::::userPlan not Found bookDate:::::::::');
				req.flash('error',"Subscription plan is not purchased.");
				res.redirect('/home');
			}else{
				if(userPlan.isExpired == true){
					console.log('userPlan is Expired bookDate::::: ',userPlan);
					req.flash('error',"Subscription plan is Expired.");
					res.redirect('/home');
				} else {

					let userData = await model.User.aggregate([
						{ $match : {_id : userId}},
						{
							$lookup:
							{
								from: "photos",
								localField: "_id",
								foreignField: "userId",
								as: "userPhoto"
							}
						},
						{ "$sort" : { "_id" : 1 } },
					]);
					
					userData = userData[0];

					let mt = {
						$or : [ 
								{ initUserId: userId, initOppId: selfId },
								{ initUserId: selfId, initOppId: userId }
							],
							"paymentStatus" : "pending",
							"userPaymentStatus" : "pending",
		    				"oppPaymentStatus" : "pending",
		    				"status" : "pending"
					}

					let dateFind = await model.Dates.aggregate([
						{ $match : mt },
					]);

					console.log('dateFind: ',dateFind);

					let flgg = 'normalView';
					if(dateFind.length > 0 ){
						flgg = 'editView';
					}

					let headerText = (flgg == 'normalView') ? 'Book Date' : 'Edit Date';

					let cmspagesData = await model.CMSPages.find();

					res.render('web/bookDate', {
		                error: req.flash("error"),
		                success: req.flash("success"),
		                vErrors: req.flash("vErrors"),
						session: req.session,
						settings: settings,
						config: config,
						userData: userData,
						flgg: flgg,
						dateFind: dateFind,
						title : headerText,
						cmspagesData: cmspagesData,
						alias: 'flavaLikes',
		            });

					//  Backup on 17 Dec ========================================================= start
					// let dateFind = await model.Dates.aggregate([
					// 	{ $match : mt },
					// 	{
					// 		$lookup: {
					// 			from: "locations",
					// 			localField: "locationId",
					// 			foreignField: "_id",
					// 			as: "locationData"
					// 		}
					// 	},
					// 	{
					// 		$lookup: {
					// 			from: "dateAmenities",
					// 			localField: "_id",
					// 			foreignField: "dateId",
					// 			as: "amenities"
					// 		}
					// 	},
					// 	{
					// 		$lookup: {
					// 			from: "amenties",
					// 			localField: "amenities.amenityId",
					// 			foreignField: "_id",
					// 			as: "amenitiesData"
					// 		}
					// 	},
					// 	{
					// 		$project: {
					// 			initUserId: 1,
					// 			initOppId: 1,
					// 			totalPrice: 1,
					// 			dateAttemptCount: 1,
					// 			dateTime: 1,
					// 			locationName: '$locationData.name',
					// 			amentiesName: '$amenitiesData.amentiesName',
					// 			amentiesId: '$amenitiesData._id',
					// 			locationId: '$locationData._id'
					// 		}
					// 	}

					// ]);

					// console.log('dateFind: ',dateFind);

					

					// // [ Location ]
					// let location = await model.Location.find({ isDeleted: false }).limit(4).lean();
					// let amenities = null;
					// let flgg = 'normalView';
					// if(dateFind.length > 0 ){
					// 	flgg = 'editView';
					// 	for (var i = 0; i < location.length; i++) {
					// 		if(location[i]._id.toString() == dateFind[0].locationId[0].toString()){
					// 			amenities = await model.Amenties.find({ placeId: dateFind[0].locationId[0] ,isDeleted: false }).lean();
					// 				console.log('amenities: ',amenities);
					// 				for (var j = 0; j < amenities.length; j++) {
					// 					amenities[j].flag = false;
					// 					for (var k = 0; k < dateFind[0].amentiesId.length; k++) {
					// 						if(dateFind[0].amentiesId[k].toString() == amenities[j]._id.toString()){
					// 							amenities[j].flag = true;
					// 						}
					// 					}
					// 				}
					// 				location[i].flag = true;
					// 		}
					// 		else {
					// 			location[i].flag = false;
					// 		}
					// 	}
					// }
					// else {
					// 	amenities = await model.Amenties.find({ placeId: location[0]._id ,isDeleted: false });
					// }

					// console.log('location: ',location);
					// console.log('Amenities: ',amenities);

					// let headerText = (flgg == 'normalView') ? 'Book Date' : 'Edit Date';

					// let cmspagesData = await model.CMSPages.find();

					// res.render('web/bookDate', {
		   //              error: req.flash("error"),
		   //              success: req.flash("success"),
		   //              vErrors: req.flash("vErrors"),
					// 	session: req.session,
					// 	settings: settings,
					// 	config: config,
					// 	userData: userData,
					// 	flgg: flgg,
					// 	dateFind: dateFind,
					// 	location: location,
					// 	amenities: amenities,
					// 	title : headerText,
					// 	cmspagesData: cmspagesData,
					// 	alias: 'flavaLikes',
		   //          });

		   			//  Backup on 17 Dec ========================================================= End
				}
			}
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	//  [ Chat ]
	module.chat = async function (req, res) {
		try {
			let userId = mongoose.Types.ObjectId(req.session.userData.userId);

			let blockedIds = await model.Block.distinct('receiverId',{senderId: userId, isDeleted: false, isBlocked: true});
			let blockedByIds = await model.Block.distinct('senderId',{receiverId: userId, isDeleted: false, isBlocked: true});

			let quAr = [ ...blockedIds, ...blockedByIds];
			
			let likeMeList = await model.Like.aggregate([
						{ $match : {'receiverId': userId, 'isDeleted':false, matched: true}},
						{
							$lookup: {
								from: "users",
								localField: "senderId",
								foreignField: "_id",
								as: "userData"
							}
						},
						{ $match : {'userData.role': 'user', 'userData.username': { "$nin": ["",null]}}},
						{ "$sort" : { "createdAt" : -1 } },
						{
							$project: {
								matched: 1,
								userId: '$userData._id',
								username: '$userData.username',
								photo: '$userData.profilePic'
							}
						}
					]);
			let likeThemList = await model.Like.aggregate([
				{ $match : {'senderId': userId, 'isDeleted':false, matched: true}},
				{
					$lookup: {
						from: "users",
						localField: "receiverId",
						foreignField: "_id",
						as: "userData"
					}
				},
				{ $match : {'userData.role': 'user', 'userData.username': { "$nin": ["",null]}}},
				{ "$sort" : { "createdAt" : -1 } },
				{
					$project: {
						matched: 1,
						userId: '$userData._id',
						username: '$userData.username',
						photo: '$userData.profilePic'
					}
				}
			]);
			let sideList = [ ...likeMeList, ...likeThemList];
			let chatHistory = null;
			let blockList = {};
			
			// [ Unread Messages ]
			sideList.map(async function(sideMapData){
				let queryDate = { senderId: sideMapData.userId[0], receiverId: userId, isRead: false };
				let counter = await model.Chat.countDocuments(queryDate);
				sideMapData.counter = counter;
				return sideMapData;
			});

			if(sideList.length > 0){
				chatHistory = await model.Chat.find({
					$or : [ 
						{ senderId: sideList[0].userId, receiverId: userId },
						{ senderId: userId, receiverId: sideList[0].userId }
					]
				}).limit(20).lean();
				chatHistory.map(function(data){
					let date = helper.customDataFormat(data.createdAt);
					let time = helper.onlyTime(data.createdAt);
					let onlyDate = helper.onlyDate(data.createdAt);
					let flag = (data.senderId.toString() == userId.toString()) ? 'right' : 'left';
					data.date = date;
					data.time = time;
					data.flag = flag;
					data.onlyDate = onlyDate;
					return data;
				});
				// console.log('sideList[0].userId: ',sideList[0].userId[0]);
				// console.log('userId: ',userId);
				blockList = await model.Block.findOne({
					$or : [ 
						{ senderId: sideList[0].userId[0], receiverId: userId },
						{ senderId: userId, receiverId: sideList[0].userId[0] }
					]
				}).lean();
				// console.log('blockListData: ',blockList);
				if(blockList == null){
					blockList = {
						display : 'normalView',
					}
				}
				else {
					blockList.display = 'blockView';
					let flgg = (blockList.senderId == userId) ? true : false;
					blockList.flg = flgg;
				}
			}
			
			let usData = await model.User.findOne({_id: userId});
			let fl = (usData.status == 'accept' && usData.isDeleted == false && usData.isVerified == true && usData.isActive == true) ? true : false;
			let bnFl = (usData.benefits && usData.benefits.chatWithDaters == true) ? true : false;
			let videoFl = (usData.benefits && usData.benefits.canDoVideoChat == true) ? true : false;
			
			// [ Privacy Mode Checkpost ]
			let privacyCheck = await model.Setting.findOne().select(['verfiyIdentity']);

			let instaFeeds = await helper.getFriendsFeeds(model, userId);
			let cmspagesData = await model.CMSPages.find();
			res.render('web/chat', {
                error: req.flash("error"),
                success: req.flash("success"),
                vErrors: req.flash("vErrors"),
				session: req.session,
				settings: settings,
				config: config,
				sideList: sideList,
				blockList: blockList,
				chatHistory: chatHistory,
				usData: usData,
				fl: fl,
				bnFl: bnFl,
				videoFl: videoFl,
				instaFeeds: instaFeeds,
				cmspagesData: cmspagesData,
				privacyCheck: privacyCheck.verfiyIdentity,
				// location: location,
				// amenities: amenities,
				title : 'My Messages',
				alias: 'myMessage',
            });
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ Messages ]
	module.getMessages = async function (req, res){
		try{
			let userId = mongoose.Types.ObjectId(req.session.userData.userId);
			let daterId = mongoose.Types.ObjectId(req.body.daterId);
			let chatHistory = await model.Chat.find({
				$or : [ 
					{ senderId: daterId, receiverId: userId },
					{ senderId: userId, receiverId: daterId }
				  ]
			}).limit(20).lean();

			// [ Read Message ]
			let queryDate = { senderId: daterId, receiverId: userId, isRead: false };
			await model.Chat.updateMany(queryDate,{$set:{isRead: true}});

			let userData = await model.User.aggregate([
				{ $match : {_id : daterId}},
				{
					$lookup:
					{
						from: "photos",
						localField: "_id",
						foreignField: "userId",
						as: "userPhoto"
					}
				},
				{ "$sort" : { "_id" : 1 } },
			]);
			userData = userData[0];
			chatHistory.map(function(data){
				// let date = helper.customDataFormat(data.createdAt);
				let onlyDate = helper.onlyDate(data.createdAt);
				let time = helper.onlyTime(data.createdAt);
				let flag = (data.senderId.toString() == userId.toString()) ? 'right' : 'left';
				// data.date = date;
				data.time = time;
				data.onlyDate = onlyDate;
				data.flag = flag;
				return data;
			});

			// [ Block ]
			let blockList = await model.Block.findOne({
				$or : [ 
					{ senderId: daterId, receiverId: userId },
					{ senderId: userId, receiverId: daterId }
				]
			}).lean();
			if(blockList == null){
				blockList = {
					display : 'normalView',
				}
			}
			else {
				blockList.display = 'blockView';
				let flgg = ((blockList.senderId).toString() == (userId.toString())) ? true : false;
				blockList.flg = flgg;
			}
			res.send({
				chat: chatHistory,
				user: userData,
				blockList: blockList
			});
		}
		catch(e){
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ Amenities ]
	module.getAmenities = async function (req, res){
		try{
			let amenities = await model.Amenties.find({ placeId: req.body.locationId ,isDeleted: false });
			res.send(amenities);
		}
		catch(e){
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ Feedback ]
	module.feedback = async function (req, res) {
		try {
			let userId = mongoose.Types.ObjectId(req.params.id);
			let oppId = mongoose.Types.ObjectId(req.params.recId);
			let dateFind = await model.Dates.find({
				$or : [ 
					{ initUserId: oppId, initOppId: userId },
					{ initUserId: userId, initOppId: oppId }
				  ]
			}).select(['status']);
			let dtId = dateFind[0]._id;
			let check = await model.Feedback.find({dateId: dtId, userId: userId});
			if(check.length > 0){
				req.flash('error',"Already Filled Feedback");
				res.redirect('/home');
			}
			else {
				let cmspagesData = await model.CMSPages.find();
				res.render('web/feedback', {
	                error: req.flash("error"),
	                success: req.flash("success"),
	                vErrors: req.flash("vErrors"),
					session: req.session,
					settings: settings, //Global variable
					config: config,
					cmspagesData: cmspagesData,
					dateId: dtId
	            });
			}
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ Feedback ]
	module.activePlan = async function (req, res) {
		try {
			let userId = mongoose.Types.ObjectId(req.params.userId);
			let planId = mongoose.Types.ObjectId(req.params.planId);
			
			console.log('here Broo..',req.params);

			let userSubData = await model.UserSubscription.countDocuments({userId: userId, expireAt: {$gte: new Date()} ,isDeleted: false, isSpecial: true});
			console.log('userSubData: ',userSubData);
			
			if(userSubData){
				req.flash('error',"Plan Already Activated.....");
				res.redirect('/home');
				
			}
			else {
				req.flash('success',"Plan Activated.....");
				res.redirect('/home');
				await helper.setSubscription(userId, planId, 'plan', false, model);
			}
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ Date History ]
	module.dateHistory = async function (req, res) {
		try {
			let user = req.session.userData.userId;
			let userId = mongoose.Types.ObjectId(user);

			let dateFind = await model.Dates.find({
				$or : [ 
					{ initUserId: userId},
					{ initOppId: userId }
				  ]
			}).lean();
			for (var i = 0; i < dateFind.length; i++) {
				let oppId = (dateFind[i].initUserId.toString() == userId.toString()) ? dateFind[i].initOppId : dateFind[i].initUserId;
				let userData32 = await model.User.findOne({role: 'user', isDeleted: false, _id: oppId}).select(['profilePic', 'username']);
				let check = await model.Feedback.find({dateId: dateFind[i]._id, userId: userId});
				let flgg = false;
				if(check.length > 0){
					flgg = false;
				}
				else {
					flgg = true;
				}
				dateFind[i].profilePic = userData32.profilePic;
				dateFind[i].username = userData32.username;
				dateFind[i].flgg = flgg;
				dateFind[i].oppId = oppId;
				dateFind[i].userId = userId;
			}
			// let check = await model.Feedback.find({dateId: dtId, userId: oppId});
			// if(check.length > 0){
			// 	req.flash('error',"Already Filled Feedback");
			// 	res.redirect('/home');
			// }
			// else {
				let cmspagesData = await model.CMSPages.find();
				res.render('web/dateHistory', {
	                error: req.flash("error"),
	                success: req.flash("success"),
	                vErrors: req.flash("vErrors"),
					session: req.session,
					settings: settings, //Global variable
					config: config,
					cmspagesData: cmspagesData,
					userData: dateFind
	            });
			// }
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ CMS Pages ]
	module.cmspages = async function (req, res) {
	
		try {
			let cmsSlug = req.query.cmsSlug;
			
			let cmspagesData = await model.CMSPages.find();
			console.log("cmspagesData",cmspagesData);
			
			res.render('web/cmspages', {
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				session: req.session,
				config: config,
				title : 'CMS',
				settings: settings, //Global variable
				cmspagesData:cmspagesData,
				cmsSlug:cmsSlug
			});
			

		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ Other App ]
	module.otherApp = async function (req, res) {
	
		try {

			let cmspagesData = await model.CMSPages.find();
			let otherAppData = await model.CMSPages.findOne({slug: 'our_other_apps'});
			
			res.render('web/otherApp', {
				error: req.flash("error"),
				success: req.flash("success"),
				vErrors: req.flash("vErrors"),
				session: req.session,
				config: config,
				title : 'CMS',
				otherAppData: otherAppData,
				cmspagesData: cmspagesData,
				settings: settings
			});
			

		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ Spotify ]
	module.spotify = async function (req, res) {
		try {
			let state = 'some-state-of-my-choice';
			var html = spotifyApi.createAuthorizeURL(scopes, state);
			// console.log("Call.....",html);
			// let code = '';
			// spotifyApi.authorizationCodeGrant(code).then(
			// 	function(data) {
			// 	  console.log('The token expires in ' + data.body['expires_in']);
			// 	  console.log('The access token is ' + data.body['access_token']);
			// 	  console.log('The refresh token is ' + data.body['refresh_token']);
			   
			// 	  // Set the access token on the API object to use it in later calls
			// 	  spotifyApi.setAccessToken(data.body['access_token']);
			// 	  spotifyApi.setRefreshToken(data.body['refresh_token']);
			// 	},
			// 	function(err) {
			// 	  console.log('Something went wrong!', err);
			// 	}
			//   );
			var s = "<script>window.location='"+html+"&show_dialog=true';</script>";
			res.send(s);
		} catch (e) {
			console.log('Error: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/');
		}
	}

	module.spotifyCallback = async function (req, res) {
		const { code } = req.query;		
		try {
			console.log("spotifyCallback::::called");
		  var data = await spotifyApi.authorizationCodeGrant(code)
		  const { access_token, refresh_token } = data.body;
		  console.log('body: ',access_token);
		  spotifyApi.setAccessToken(access_token);
		  spotifyApi.setRefreshToken(refresh_token);
	  
			// let dt = spotifyApi.getNewReleases({ limit : 5, offset: 0, country: 'IN' })
			// .then(async function(data) {
			// 	let arr = [];
			// 	for (let i = 0; i < data.body.albums.items.length; i++) {
			// 		let tmpJson = {};
			// 		tmpJson.songId = data.body.albums.items[i].id;
			// 		tmpJson.name = data.body.albums.items[i].name;
			// 		tmpJson.songPic = data.body.albums.items[i].images[2].url;
			// 		tmpJson.singerName = data.body.albums.items[i].artists[0].name;
			// 		arr.push(tmpJson);
			// 	}				
			// 	await model.User.updateOne({ _id: req.session.userData.userId},{ spotifyTracks: arr, spotifyId: access_token });
			// }).catch(function(err) {
			// 	console.log("spotify Something went wrong!", err);
			// });

			let dt = spotifyApi.getNewReleases({ limit : 10, offset: 0, country: 'SE' })
			.then(async function(data) {
				let arr = [];
				
				console.log('data: ',data);

				let albmData = await spotifyHelper.getAlbum(model, data, spotifyApi, access_token);
				let tmpp = JSON.parse(albmData);
				console.log('tmpp: ',tmpp);
				console.log('tmpp.length: ',tmpp.length);

				console.log('\x1b[36m%s\x1b[0m','tmpp.tracks.items.length: ',tmpp.tracks.items.length);

				let tmpN = (tmpp.tracks.items.length > 10) ? 10 : tmpp.tracks.items.length;

				console.log('tmpN: ',tmpN);

				for (var i = 0; i < tmpN; i++) {

					let songData = await spotifyHelper.getSong(model, tmpp.tracks.items[i], spotifyApi, access_token);
					console.log('\x1b[36m%s\x1b[0m','songData: ',songData);

					let tmp32 = JSON.parse(songData);
					console.log('tmp32: ',tmp32);
					let jssn = {
						'songPurl' : tmp32.preview_url,
						'songName' : tmp32.name,
						'songId'   : tmp32.id,
						'songImage': tmp32.album.images[0].url
					};

					arr.push(jssn);
					console.log('\x1b[36m%s\x1b[0m','jssn: ',jssn);
					console.log('\x1b[36m%s\x1b[0m','arrTmp: ',arr);

				}
				let usId = req.session.userData.userId;
				await model.User.updateOne({ _id: usId },{ spotifyTracks: arr, spotifyId: access_token });
				let songs = await model.User.findOne({ _id: usId }).select(['spotifyTracks']);
				console.log('\x1b[36m%s\x1b[0m','songs: ',songs);
				res.redirect(config.baseUrl+'profileSetting');

			}).catch(function(err) {
				console.log("spotify Something went wrong!", err);
				req.flash('error', "Unauthorized Token");
				res.redirect(config.baseUrl+'profileSetting');
			});
		} catch(err) {
			console.log('err: ',err);
		    res.redirect('/#/error/invalid token');
		}
	}
	
	// [ Spotify Search ]
	module.spotifySearch = async function (req, res) {
		try {
			console.log('spotifySearch--------->>>>req.body: ',req.body);
			let usData = await model.User.findOne({ _id: req.session.userData.userId }).select(['spotifyId']);
			console.log('usData: ',usData);
			let keyWo = req.body.keyword;
			keyWo = keyWo.replace(' ','%20');
			console.log('keyWo: ',keyWo);
			let songData = await spotifyHelper.searchSong(model, keyWo, spotifyApi, usData.spotifyId);
			console.log('\x1b[36m%s\x1b[0m','songData: ',songData);

			let tmp32 = JSON.parse(songData);
			// console.log('tmp32: ',tmp32);
			console.log('tmp32: ',tmp32.tracks.items[0]);

			// var result = await spotifyApi.searchTracks(req.body.keyword)
			// .then(function(data) {
			//   console.log('spotifySearch-------->>> data.body: ', data.body);
			//   console.log('spotifySearch------->>>data.body.tracks.items[0]: ', data.body.tracks.items[0]);
			let songArr = [];
			  for (let i = 0; i < tmp32.tracks.items.length; i++) {
				let tmpJson = {};
				tmpJson.songPurl = tmp32.tracks.items[i].preview_url;
				tmpJson.songName = tmp32.tracks.items[i].name;
				tmpJson.songImage = tmp32.tracks.items[i].album.images[2].url;
				tmpJson.songId = tmp32.tracks.items[i].id;
				songArr.push(tmpJson);
			  }
			console.log('songArr: ',songArr);
			await model.User.updateOne({ _id: req.session.userData.userId },{ spotifyTracks: songArr });
			//   // console.log("spotifySearch---------->>>songArr: ",songArr);
			res.send({songArr : songArr, status: 'success'});
			// }, function(err) {
			//   console.error('spotifySearch---------->>>err: ',err);
			// });
		} catch (err) {
		  	console.error('spotifySearch:::::::::>>>err: ',err);
			res.status(400).send(err)
		}
	}

	// [ Spotify Select ]
	module.spotifySelectSong = async function (req, res) {
		try {
			console.log('spotifySelectSong---------->>>>req.body: ',req.body);
			await model.User.updateOne({ _id: req.session.userData.userId},{ songUrl: req.body.songId });
			res.send({ status: 'success', message: 'Song Selected...'});
		} catch (err) {
			res.status(400).send(err)
		}
	}

	module.playlists = async function (req, res) {
		try {
			var result = await spotifyApi.getUserPlaylists();
			res.status(200).send(result.body);
		  } catch (err) {
		  	console.log('playlists:::::::::>>>err: ',err);
			res.status(400).send(err)
		  }
	}

	// [ Profile Setting ]
	module.profileSetting = async function (req, res) {
		try {

			let spotifyRfTkn = await spotifyApi.refreshAccessToken().then(
				function(data) {
				  // console.log('profileSetting------->>>>data: ',data);
			   
				  // Save the access token so that it's used in future calls
				  spotifyApi.setAccessToken(data.body['access_token']);
				},
				function(err) {
				  // console.log('profileSetting------->>>err: ', err);
				}
			  );
			// console.log('profileSetting------->>>>spotifyRfTkn: ',spotifyRfTkn);
			let userId = mongoose.Types.ObjectId(req.session.userData.userId);

			// let userData = await model.User.findOne({'_id':userId});

			let userData = await model.User.aggregate([
				{ $match : {role: 'user', _id: userId }},
				{
					$lookup: {
                        from: "photos",
                        let: {userId: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                         $and: [
                                            {$eq: ['$userId','$$userId']},
                                            {$eq: ['$isDeleted', false]},
                                            {$ne: ['$type', 'document']},
                                        ]
                                    }
                                } 
                            },
                            {
                                $sort: {sortOrder:1}
                            }
                        ],
                        as: "photo"
                    }
				},
				{ "$sort" : { "_id" : 1 } },
			]);
			console.log("userData:::::",userData[0]);

			var countryName = userData[0].country;
			var countryId = null;
			var countryData = await model.Country.findOne({name: countryName});
			if(countryData){
				countryId = countryData._id;
			}
			if(userData[0].dob){
				var datenew = userData[0].dob;
				// var datav = dateformat(datenew, 'dd/mm/yyyy');
				// userData[0].dob = datav;

				function appendLeadingZeroes(n){
					if(n <= 9){
						return "0" + n;
					}
					return n
				}
				var datav = datenew.getFullYear() + "-" + appendLeadingZeroes(datenew.getMonth() + 1) + "-" + appendLeadingZeroes(datenew.getDate());
			}
			
			var stateName = userData[0].state;
			var stateId = null;
			stateData = await model.State.findOne({name: stateName});
			if(stateData){
				stateId = stateData._id;
			}

			let cmspagesData = await model.CMSPages.find();
			
			res.render('web/profile', {
				error		: req.flash("error"),
				success		: req.flash("success"),
				vErrors		: req.flash("vErrors"),
				session		: req.session,
				config		: config,
				settings	: settings, //Global variable
				title		: 'Profile',
				userData	: userData[0],
				countryId	: countryId,
				cmspagesData: cmspagesData,
				stateId		: stateId,
				datav		: datav
			});

		} catch (e) {
			console.log('profileSetting------->>>e: ',e);
			req.flash('error',"Something went wrong. Please try again.");
			res.redirect('/home');
		}
	}

	// [ Payment ]
	module.payment = async function(req, res) {
		// console.log('payment----------->>>>');
		try {
			var paymentId = req.params.id;
			var type = (req.query.type) ? req.query.type : 'plan';
			var userId = req.session.userData ? req.session.userData.userId : null;
			console.log('payment-------->>>userId: ',userId,' paymentId: ',paymentId);
			if (userId && paymentId) {
				var userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user'});
				var paymentDetails = null;
				if (type == 'date') {
					paymentDetails = await model.Dates.findOne({_id: paymentId, $or:[{initUserId: userId},{initOppId: userId}], status:'pending', paymentStatus: {$ne: 'completed'}, isApproved: true}).lean();
					if (paymentDetails && paymentDetails.initUserId.toString() == userId.toString() && paymentDetails.userPaymentStatus == 'completed') {
						paymentDetails = null;
						req.flash('error',"Payment Already done for this date");
						return res.redirect('/home');
					} else if (paymentDetails && paymentDetails.initOppId.toString() == userId.toString() && paymentDetails.oppPaymentStatus == 'completed') {
						paymentDetails = null;
						req.flash('error',"Payment Already done for this date");
						return res.redirect('/home');
					}
				} else {
					paymentDetails = await model.Subscription.findOne({_id: paymentId, isDeleted: false, status: true}).lean();
				}
				if (userDetails && paymentDetails) {
					console.log('payment---------->>>>>userDetails and paymentDetails found');
					if (!userDetails.isActive) {
						req.flash('error',"You have been blocked by admin");
						res.redirect('/home');
					}
					let userSubData = null;
					if (type == 'plan') {
						userSubData = await model.UserSubscription.countDocuments({userId: userDetails._id, planType: paymentDetails.planType, expireAt: {$gte: new Date()} ,isDeleted: false, isSpecial: false});
					}
					console.log('payment----------->>>>userSubData: ',userSubData);
					if (userSubData) {
						req.flash('error',"Subscription plan with same type is already activated");
						res.redirect('/home');
					} else {
						console.log('payment----------->>>"payment details found"');

						res.render('web/payment', {
							error		: req.flash("error"),
							success		: req.flash("success"),
							vErrors		: req.flash("vErrors"),
							session		: req.session,
							config		: config,
							settings	: settings, //Global variable
							title		: 'Payment',
							userData	: userDetails,
							paymentData : paymentDetails,
							type        : type
						});
					}
				} else {
					console.log('web >> payment------------->>>"userData or payment data not found"');
					req.flash('error', 'Something went wrong. Please try again');
					res.redirect('/home');		
				}
			} else {
				console.log('web >> payment-------->>>"userID or paymentId is invalid"');
				req.flash('error', 'Something went wrong. Please try again');
				res.redirect('/home');	
			}
		} catch (e) {
			console.log('web >> payment::::::::::::>>>>e: ',e);
			req.flash('error', 'Something went wrong. Please try again');
			res.redirect('/home');
		}
	}

	module.payment_old = async function(req, res) {
		console.log('payment----------->>>>');
		try {
			var paymentId = req.params.id;
			var type = (req.query.type) ? req.query.type : 'plan';
			var userId = req.session.userData ? req.session.userData.userId : null;
			console.log('payment-------->>>userId: ',userId,' paymentId: ',paymentId);
			if (userId && paymentId) {
				var userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user'});
				var paymentDetails = null;
				if (type == 'date') {
					paymentDetails = await model.Dates.findOne({_id: paymentId, $or:[{initUserId: userId},{initOppId: userId}], status:'pending', paymentStatus: {$ne: 'completed'}, isApproved: true}).lean();
					if (paymentDetails && paymentDetails.initUserId.toString() == userId.toString() && paymentDetails.userPaymentStatus == 'completed') {
						paymentDetails = null;
						req.flash('error',"Payment Already done for this date");
						return res.redirect('/home');
					} else if (paymentDetails && paymentDetails.initOppId.toString() == userId.toString() && paymentDetails.oppPaymentStatus == 'completed') {
						paymentDetails = null;
						req.flash('error',"Payment Already done for this date");
						return res.redirect('/home');
					}
				} else {
					paymentDetails = await model.Subscription.findOne({_id: paymentId, isDeleted: false, status: true}).lean();
				}
				if (userDetails && paymentDetails) {
					console.log('payment---------->>>>>userDetails and paymentDetails found');
					if (!userDetails.isActive) {
						req.flash('error',"You have been blocked by admin");
						res.redirect('/home');
					}
					let userSubData = null;
					if (type == 'plan') {
						userSubData = await model.UserSubscription.countDocuments({userId: userDetails._id, planType: paymentDetails.planType, expireAt: {$gte: new Date()} ,isDeleted: false});
					}
					console.log('payment----------->>>>userSubData: ',userSubData);
					if (userSubData) {
						req.flash('error',"Subscription plan with same type is already activated");
						res.redirect('/home');
					} else {
						console.log('payment----------->>>"payment details found"');
						let durationType = paymentDetails.durationType;
						let duration = (paymentDetails.duration > 0) ? paymentDetails.duration : 1;
						let price = 0;
						if (type == 'date') {
							price = paymentDetails.totalPrice / 2;
							paymentDetails.price = price;
						} else {
							price = paymentDetails.price;
						}
						paymentDetails.pricePerUnit = (price / duration).toFixed(2);
						paymentDetails.singleDuration = durationType == 'monthly' ? 'Month' : 'Year';
						paymentDetails.finalDuration = duration == 1 ? paymentDetails.singleDuration: paymentDetails.singleDuration+'s';
						let btcChange = config.btcChange ? config.btcChange : 1;
						let bchChange = config.bchChange ? config.bchChange : 1;
						let ltcChange = config.ltcChange ? config.ltcChange : 1;
						let ethChange = config.ethChange ? config.ethChange : 1;

						paymentDetails.btcPrice = (price / btcChange).toFixed(5);
						paymentDetails.bchPrice = (price / bchChange).toFixed(5);
						paymentDetails.ltcPrice = (price / ltcChange).toFixed(5);
						paymentDetails.ethPrice = (price / ethChange).toFixed(5);


						let paymentIntent = await stripeHelper.createIntent(price, 'usd', {integration_check: 'accept_a_payment'});

						if (paymentIntent) {
							console.log('payment--------->>>"intent created"');
							res.render('web/payment', {
								error		: req.flash("error"),
								success		: req.flash("success"),
								vErrors		: req.flash("vErrors"),
								session		: req.session,
								config		: config,
								settings	: settings, //Global variable
								title		: 'Payment',
								userData	: userDetails,
								paymentData : paymentDetails,
								type        : type,
								clientSecret: paymentIntent.client_secret,
								stripePublishKey: config.stripePublishKey
							});
						} else {
							console.log('web >> payment------------->>>"payment intent not created"');
							req.flash('error', 'Something went wrong. Please try again');
							res.redirect('/home');			
						}
					}
				} else {
					console.log('web >> payment------------->>>"userData or payment data not found"');
					req.flash('error', 'Something went wrong. Please try again');
					res.redirect('/home');		
				}
			} else {
				console.log('web >> payment-------->>>"userID or paymentId is invalid"');
				req.flash('error', 'Something went wrong. Please try again');
				res.redirect('/home');	
			}
		} catch (e) {
			console.log('web >> payment::::::::::::>>>>e: ',e);
			req.flash('error', 'Something went wrong. Please try again');
			res.redirect('/home');
		}
	}
	
	module.sendCardDetails = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			console.log('sendCardDetails---------->>>>req.body: ',req.body);
			var userId = req.body.userId; 
			var token = req.headers.token;
			var planId = req.body.planId;

			var userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, role: 'user', isVerified: true, status: 'accept'});
			var planDetails = await model.Subscription.findOne({_id: planId, isDeleted: false, status: true});
			if (userDetails && planDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}
				let userSubData = await model.UserSubscription.countDocuments({userId: userDetails._id, planType: planDetails.planType, expireAt: {$gte: new Date()} ,isDeleted: false});
				if (userSubData) {
					failedMessage.message = "Subscription plan with same type is already activated";
					return res.send(failedMessage);
				}
				let paymentIntent = await stripeHelper.createIntent(planDetails.price, 'usd', {integration_check: 'accept_a_payment'});

				console.log('sendCardDetails----------->>>>paymentIntent: ',paymentIntent);
				if (paymentIntent) {
					
					successMessage.message = "Payment successful";
					successMessage.data = {clientSecret: paymentIntent.client_secret, stripePublishKey: config.stripePublishKey}
					console.log('sendCardDetails----------->>>>successMessage: ',successMessage);
					res.send(successMessage);
				} else {
					console.log('sendCardDetails----------->>>>"payment intent not found"');
					failedMessage.message = "Something went wrong";
					res.send(failedMessage);
				}

			} else {
				console.log('sendCardDetails----------->>>>userData or planData not found or expiry date is invalid');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('sendCardDetails:::::::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.sendCardDetails_old1 = async function(req, res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			console.log('sendCardDetails---------->>>>req.body: ',req.body);
			var userId = req.body.userId; 
			var token = req.headers.token;
			var planId = req.body.planId;

			var userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, role: 'user', isVerified: true, status: 'accept'});
			var planDetails = await model.Subscription.findOne({_id: planId, isDeleted: false, status: true});
			if (userDetails && planDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}
				let userSubData = await model.UserSubscription.countDocuments({userId: userDetails._id, planType: planDetails.planType, expireAt: {$gte: new Date()} ,isDeleted: false});
				if (userSubData) {
					failedMessage.message = "Subscription plan with same type is already activated";
					return res.send(failedMessage);
				}
				let paymentIntent = await stripeHelper.createIntent(planDetails.price, 'usd', {integration_check: 'accept_a_payment'});

				console.log('sendCardDetails----------->>>>paymentIntent: ',paymentIntent);
				if (paymentIntent) {
					let transactionId = helper.generateTransactionId(15);
					let obj = {
						userId: userDetails._id,
						planId: planDetails._id,
						planName: planDetails.planName,
						transactionId: transactionId,
						transactionAmount: planDetails.price,
						bankTransactionId: paymentIntent.id,
						bankTransactionToken: paymentIntent.client_secret,
						paymentType: 'card',
						description: 'Payment received for subscription',
						transactionForm: 'debit',
						transactionType: 'plan',
						status: 'pending',
						created_at: new Date()
					};
					var transData = await model.Transaction.create(obj);

					if (transData) {
						successMessage.message = "Payment successful";
						successMessage.data = {transId:transData._id}
						console.log('sendCardDetails----------->>>>successMessage: ',successMessage);
						res.send(successMessage);
					} else {
						console.log('sendCardDetails----------->>>"transaction not creared"');
						failedMessage.message = "Something went wrong";
						res.send(failedMessage);
					}
				} else {
					console.log('sendCardDetails----------->>>>"payment intent not found"');
					failedMessage.message = "Something went wrong";
					res.send(failedMessage);
				}

			} else {
				console.log('sendCardDetails----------->>>>userData or planData not found or expiry date is invalid');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('sendCardDetails:::::::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.checkout = async function(req, res) {
		try {
			let transId = req.params.transId;
			console.log('checkout---------->>>>transId: ',transId);
			if (transId && transId.length == 24) {
				let transData = await model.Transaction.findOne({_id: transId, status: 'pending'});
				let userData = await model.User.findOne({_id: transData.userId},{loginToken: 1});
				if (transData) {
					let obj = {
						baseUrl: config.baseUrl,
						clientSecret: transData.bankTransactionToken,
						stripePublishKey: config.stripePublishKey,
						userId: transData.userId,
						planId: transData.planId,
						token: userData.loginToken
					};
					res.render('web/checkout', obj);
				} else {
					console.log('checkout------------>>>>"transData not found"');
					res.redirect('/home');
				}
			} else {
				console.log('checkout------------>>>"transId is invalid"');
				res.redirect('/home');
			}
		} catch(e) {
			console.log('checkout:::::::::::::>>>>e: ',e);
			res.redirect('/home');
		}
	}

	module.sendBankDetails = async function(req ,res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
			var token = req.headers.token;
			var planId = req.body.paymentId;
			var bankName = req.body.bankName;
			var swiftCode = req.body.swiftCode;
			var accNo = req.body.accNo;
			var accHolder = req.body.accHolder;
			var saveDetails = req.body.saveDetails == 1 ? true : false;

			var userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, role: 'user', isVerified: true, status: 'accept'});
			var planDetails = await model.Subscription.findOne({_id: planId, isDeleted: false, status: true});
			if (userDetails && planDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				if (saveDetails) {
					
					let upData = {
						bankName: bankName,
						accNo: accNo,
						accHolder: accHolder,
						swiftCode: swiftCode,
						updatedAt: new Date(),
						$setOnInsert:{
							userId: userId,
							createdAt: new Date()
						}
					};
					await model.BankDetails.updateOne({userId: userDetails._id, bankName: bankName, accNo: accNo}, upData,{upsert:true});
				}

				//TODO: stripe create payment intent using netbanking logic here
				successMessage.message = "Payment successful";
				res.send(successMessage);
			} else {
				console.log('sendBankDetails----------->>>>userData or planData not found or expiry date is invalid');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('sendBankDetails::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.datePayment = async (req, res) => {    	
    	try {
    		var paymentId = req.params.id;
			console.log('datePayment---------->>>>paymentId: '+paymentId);
			var decData = helper.dec(paymentId);
			var dateId = decData.id;
			var pswd = decData.pswd;
			console.log('datePayment--------->>>>decData: ',decData);

			if (!dateId || dateId.length != 24) {
				console.log('datePayment--------->>>>>dateId is invalid');
				failedMessage.message = "Link expire please try again later";
				return failedMessage;
			}

			res.redirect('/payment/'+dateId+'?type=date');

    	} catch (e) {
    		console.log('datePayment:::::::::::::>>>>e: ',e);
    		res.redirect('/home');
    	}
    }

	return module;
}