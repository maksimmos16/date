module.exports = function(model, config) {
	var module = {};

	module.exploreFlava = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			
			console.log('req.body: ',req.body);

			var userId = req.body.userId;
			var token = req.headers.token;
			var isRewind = req.body.isRewind == 1 ? true : false;
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, isActive: true, loginToken: token, status: 'accept'});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}


					let city = userDetails.city;
					let state = userDetails.state;
					let country = userDetails.country;
					let lat1 = (userDetails.location.coordinates && userDetails.location.coordinates.length) ? userDetails.location.coordinates[1] : 0;
					let long1 = (userDetails.location.coordinates && userDetails.location.coordinates.length) ? userDetails.location.coordinates[0] : 0;
					let maxDistance = settings.minDistance ? settings.minDistance : config.minDistance;
					let mainQuery = [];
					
					let lastDislikeUserId = null;
					if (isRewind) {

						if (!userDetails.benefits.enableRewind || userDetails.didRewind) {
							console.log('exploreFlava--------->>>"donnot have benefits or have already done rewind" userDetails.benefits.enableRewind: '+userDetails.benefits.enableRewind+' userDetails.didRewind: '+userDetails.didRewind);
							failedMessage.message = "Rewind not possible!";
							return res.send(failedMessage);
						}

						let disLikeData = await model.Dislike.find({senderId: userDetails._id, isDeleted: false}).sort({_id: -1}).limit(1);
						if (disLikeData && disLikeData.length) {
							lastDislikeUserId = disLikeData[0].receiverId;
							await model.Dislike.deleteOne({_id: disLikeData});
						} else {		
							console.log('exploreFlava--------->>>"not last dislike user found"');					
							failedMessage.message = "Rewind not possible!2";
							return res.send(failedMessage);
						}
					}
 
					// let likeIds = await model.Like.distinct('receiverId',{senderId: userId, isDeleted: false});

					let likeDataTmp = await model.Like.find({
						$and: [
							{ $or: [ {"senderId":userId},{"receiverId":userId} ] },
							{ "isDeleted":false}
						]
					});
					let likeIds = [];
					for(let i = 0; i < likeDataTmp.length; i++){
						let tmpU = userId.toString();
						let tmpId = (likeDataTmp[i].senderId).toString();
						if(tmpU != tmpId){
							if(likeDataTmp[i].matched == true){
								likeIds.push(likeDataTmp[i].senderId);
							}
						} else {
							likeIds.push(likeDataTmp[i].receiverId);
						}
					}
					// console.log("likeIds::::",likeIds);

					// let dislikeIds = await model.Dislike.distinct('receiverId',{senderId: userId,isDeleted: false});

					let disLikeDataTmp = await model.Dislike.find({
						$and: [
							{ $or: [ {"senderId":userId},{"receiverId":userId} ] },
							{ "isDeleted":false}
						]
					});
					let dislikeIds = [];
					for(let i = 0; i < disLikeDataTmp.length; i++){
						let tmpU = userId.toString();
						let tmpId = (disLikeDataTmp[i].senderId).toString();
						if(tmpU != tmpId){
							dislikeIds.push(disLikeDataTmp[i].senderId);
						} else {
							dislikeIds.push(disLikeDataTmp[i].receiverId);
						}
					}

					let blockedIds = await model.Block.distinct('receiverId',{senderId: userId, isDeleted: false, isBlocked: true});
					let blockedByIds = await model.Block.distinct('senderId',{receiverId: userId, isDeleted: false, isBlocked: true});
					let invalidIds = [...likeIds, ...dislikeIds, ...blockedIds, ...blockedByIds];

					let uQuery = {
						_id: {$nin: invalidIds, $ne: mongoose.Types.ObjectId(userId)},
						isDeleted: false,
						role: 'user',
						isActive: true,
						status: 'accept',
						showInSwipe: true
					};

					if (isRewind) {
						uQuery._id = lastDislikeUserId;
					} else {

						let idealInfo = userDetails.idealInfo;
						if (idealInfo) {
							if (idealInfo.gender){
								uQuery.gender = idealInfo.gender;
							}
							// if (idealInfo.maxDistance) {
							// 	maxDistance = idealInfo.maxDistance;
							// }

							// if (idealInfo.connections && idealInfo.connections.length) {
							// 	uQuery['additionalInfo.connections'] = {$in: idealInfo.connections};
							// }

							// if (idealInfo.minAge && idealInfo.maxAge) {
							// 	let dt1 = new Date();
							// 	dt1.setTime(dt1.getTime()-idealInfo.maxAge*31536000000);
							// 	let dt2 = new Date();
							// 	dt2.setTime(dt2.getTime()-idealInfo.minAge*31536000000);
							// 	// console.log('exploreFlava--------->>>dt1: ',dt1,' dt2: ',dt2);
							// 	uQuery.dob = {$gte: dt1, $lte: dt2};
							// }
							// if (idealInfo.race) {
							// 	uQuery['additionalInfo.race'] = idealInfo.race;
							// }
							// if (idealInfo.religion) {
							// 	uQuery['additionalInfo.religion'] = idealInfo.religion;
							// }
							// if (idealInfo.occupation) {
							// 	uQuery['additionalInfo.occupation'] = idealInfo.occupation;
							// }
							// if (idealInfo.bodyType) {
							// 	uQuery['additionalInfo.bodyType'] = idealInfo.bodyType;
							// }
							// if (idealInfo.educationLevel) {
							// 	uQuery['additionalInfo.educationLevel'] = idealInfo.educationLevel;
							// }
							// if (idealInfo.sexualOrientation) {
							// 	uQuery.sexualOrientation = idealInfo.sexualOrientation;
							// }
							// if (idealInfo.home) {
							// 	uQuery['additionalInfo.home'] = idealInfo.home;
							// }
							// if (idealInfo.haveChildren) {
							// 	uQuery['additionalInfo.haveChildren'] = idealInfo.haveChildren;
							// }
						}

						if (userDetails.location) {
							let long =  (userDetails.location.coordinates) ? userDetails.location.coordinates[0]: 0;
							let lat =  (userDetails.location.coordinates) ? userDetails.location.coordinates[1]: 0;
							
							let locQuery = {
							    $geoNear: {
							       near: {
							            type: "Point",
							            coordinates: [long,lat]
							       }, 
							       key: "location",
							       spherical: true,
							       distanceField: "distance",
							       maxDistance: (maxDistance * 1609.34), // miles to meter
							       distanceMultiplier: 0.000621371 //in miles if you need in mile 0.000621371 set
							    }
							};
							mainQuery.push(locQuery);
						}
					}
					let photoQuery = {
		                from : 'photos',
		                let: {userId:'$_id'},
		                pipeline: [
		                    {
	                            $match: {
	                               $expr: {
	                                   $and: [
	                                        {
	                                            $eq: ['$userId', '$$userId'],
	                                        },
	                                        {
	                                            $eq: ['$isDeleted', false]
	                                        },
	                                        {$ne: ['$type', 'document']},
	                                        {
	                                            $eq: ['$status', 'approved']
	                                        }
	                                   ]
	                               }
	                            }
		                    },
		                    {
		                    	$sort: {sortOrder:1}
		                    },
		                    {
		                        $project: {
		                            _id: 1,
		                            path:1
		                        }
		                    }
		                ],
			            as: 'photoData'
			        };
			        // console.log('exploreFlava--------->>>>uQuery: ',uQuery,' photoQuery: ',photoQuery);
					mainQuery = mainQuery.concat([{$match: uQuery},{$limit:1},{$lookup:photoQuery
					},{$project:{username:1,dob:1,location:1,city:1,state:1,country:1,institute:1,photoData:1, songUrl: 1}}]);

					console.log('exploreFlava--------->>>>mainQuery: ',mainQuery);

					let flavaData = await model.User.aggregate(mainQuery);

					// console.log('exploreFlava--------->>>>mainQuery: ',mainQuery);

					if (flavaData && flavaData.length) {
						flavaData = flavaData[0];
						let age = helper.getAge(flavaData.dob);

						let lat2 = 0;
						let long2 = 0;
						let unit = (userDetails.additionalInfo && userDetails.additionalInfo.showDistance != 'kms') ? 'N': 'K';

						if (flavaData.location.coordinates && flavaData.location.coordinates.length) {
							lat2 = flavaData.location.coordinates[1];
							long2 = flavaData.location.coordinates[0];
						}

						let distance = parseInt(helper.getDistance(lat1, long1, lat2, long2, unit));
						unit = (userDetails.additionalInfo && userDetails.additionalInfo.showDistance) ? userDetails.additionalInfo.showDistance: 'kms';
						if (distance > 0) {
							distance = distance+' '+unit+' away';
						} else {
							distance = 'few '+unit+' away';
						}
						flavaData.age = age;
						flavaData.distance = distance;

						flavaData.points = await helper.calculateMatchPoints(model, userId, flavaData._id);
						if (isRewind) {

							await model.User.updateOne({_id: userDetails._id},{didRewind: true, updatedAt: new Date()});
						}
						delete flavaData.dob;
						delete flavaData.location;
						successMessage.message = "Flava loaded successfully";
						successMessage.data = flavaData;
						res.send(successMessage);
					} else {
						failedMessage.message = "We could not find easy date nearby you";
						res.send(failedMessage);
					}
				} else {
					let tempuser = await model.User.findOne({_id: userId});
					if(tempuser){
						if(tempuser.status != 'accept'){
							failedMessage.message = "Admin not approved your document";
							res.send(failedMessage);	
						} else {
							failedMessage.message = "User data not found";
							res.send(failedMessage);	
						}
					}else {
						failedMessage.message = "User data not found";
						res.send(failedMessage);
					}
				}
			} else {
				failedMessage.message = "UserId is invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('exploreFlava:::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.exploreFlava_old = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
			var token = req.headers.token;
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, isActive: true, loginToken: token, status: 'accept'});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}
					let city = userDetails.city;
					let state = userDetails.state;
					let country = userDetails.country;
					let lat1 = (userDetails.location.coordinates && userDetails.location.coordinates.length) ? userDetails.location.coordinates[1] : 0;
					let long1 = (userDetails.location.coordinates && userDetails.location.coordinates.length) ? userDetails.location.coordinates[0] : 0;
					let maxDistance = settings.minDistance ? settings.minDistance : config.minDistance;
					let mainQuery = [];
					let likeIds = await model.Like.distinct('receiverId',{isDeleted: false,senderId: userId});
					let dislikeIds = await model.Dislike.distinct('receiverId',{isDeleted: false,senderId: userId});
					likeIds = likeIds.concat(dislikeIds);
					let uQuery = {
						_id: {$nin: likeIds, $ne: mongoose.Types.ObjectId(userId)},
						isDeleted: false,
						role: 'user',
						isActive: true,
						status: 'accept',
						showInSwipe: true
					};

					let idealInfo = userDetails.idealInfo;
					if (idealInfo) {
						if (idealInfo.gender){
							uQuery.gender = idealInfo.gender;
						}
						if (idealInfo.maxDistance) {
							maxDistance = idealInfo.maxDistance;
						}

						if (idealInfo.connections && idealInfo.connections.length) {
							uQuery['additionalInfo.connections'] = {$in: idealInfo.connections};
						}

						if (idealInfo.minAge && idealInfo.maxAge) {
							let dt1 = new Date();
							dt1.setTime(dt1.getTime()-idealInfo.maxAge*31536000000);
							let dt2 = new Date();
							dt2.setTime(dt2.getTime()-idealInfo.minAge*31536000000);
							// console.log('exploreFlava--------->>>dt1: ',dt1,' dt2: ',dt2);
							uQuery.dob = {$gte: dt1, $lte: dt2};
						}
						if (idealInfo.race) {
							uQuery['additionalInfo.race'] = idealInfo.race;
						}
						if (idealInfo.religion) {
							uQuery['additionalInfo.religion'] = idealInfo.religion;
						}
						if (idealInfo.occupation) {
							uQuery['additionalInfo.occupation'] = idealInfo.occupation;
						}
						if (idealInfo.bodyType) {
							uQuery['additionalInfo.bodyType'] = idealInfo.bodyType;
						}
						if (idealInfo.educationLevel) {
							uQuery['additionalInfo.educationLevel'] = idealInfo.educationLevel;
						}
						if (idealInfo.sexualOrientation) {
							uQuery.sexualOrientation = idealInfo.sexualOrientation;
						}
						if (idealInfo.home) {
							uQuery['additionalInfo.home'] = idealInfo.home;
						}
						if (idealInfo.haveChildren) {
							uQuery['additionalInfo.haveChildren'] = idealInfo.haveChildren;
						}
					}

					if (userDetails.location) {
						let long =  (userDetails.location.coordinates) ? userDetails.location.coordinates[0]: 0;
						let lat =  (userDetails.location.coordinates) ? userDetails.location.coordinates[1]: 0;
						
						let locQuery = {
						    $geoNear: {
						       near: {
						            type: "Point",
						            coordinates: [long,lat]
						       }, 
						       key: "location",
						       spherical: true,
						       distanceField: "distance",
						       maxDistance: (maxDistance * 1609.34), // miles to meter
						       distanceMultiplier: 0.000621371 //in miles if you need in mile 0.000621371 set
						    }
						};
						mainQuery.push(locQuery);
					}
					let photoQuery = {
		                from : 'photos',
		                let: {userId:'$_id'},
		                pipeline: [
		                    {
	                            $match: {
	                               $expr: {
	                                   $and: [
	                                        {
	                                            $eq: ['$userId', '$$userId'],
	                                        },
	                                        {
	                                            $eq: ['$isDeleted', false]
	                                        },
	                                        {
	                                            $eq: ['$status', 'approved']
	                                        }
	                                   ]
	                               }
	                            }
		                    },
		                    {
		                    	$sort: {sortOrder:1}
		                    },
		                    {
		                        $project: {
		                            _id: 1,
		                            path:1
		                        }
		                    }
		                ],
			            as: 'photoData'
			        };
			        // console.log('exploreFlava--------->>>>uQuery: ',uQuery,' photoQuery: ',photoQuery);
					mainQuery = mainQuery.concat([{$match: uQuery},{$limit:1},{$lookup:photoQuery
					},{$project:{username:1,dob:1,location:1,city:1,state:1,country:1,institute:1,photoData:1}}]);

					// console.log('exploreFlava--------->>>>mainQuery: ',mainQuery);

					let flavaData = await model.User.aggregate(mainQuery);

					if (flavaData && flavaData.length) {
						flavaData = flavaData[0];
						let age = helper.getAge(flavaData.dob);

						let lat2 = 0;
						let long2 = 0;
						let unit = (userDetails.additionalInfo && userDetails.additionalInfo.showDistance != 'kms') ? 'N': 'K';

						if (flavaData.location.coordinates && flavaData.location.coordinates.length) {
							lat2 = flavaData.location.coordinates[1];
							long2 = flavaData.location.coordinates[0];
						}

						let distance = parseInt(helper.getDistance(lat1, long1, lat2, long2, unit));
						unit = (userDetails.additionalInfo && userDetails.additionalInfo.showDistance) ? userDetails.additionalInfo.showDistance: 'kms';
						if (distance > 0) {
							distance = distance+' '+unit+' away';
						} else {
							distance = 'few '+unit+' away';
						}
						flavaData.age = age;
						flavaData.distance = distance;

						flavaData.points = await helper.calculateMatchPoints(model, userId, flavaData._id);
						delete flavaData.dob;
						delete flavaData.location;
						successMessage.message = "Flava loaded successfully";
						successMessage.data = flavaData;
						res.send(successMessage);
					} else {
						failedMessage.message = "We could not find easy date nearby you";
						res.send(failedMessage);
					}
				} else {
					failedMessage.message = "User data not found";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "UserId is invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('exploreFlava:::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.viewFlava = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
			var token = req.headers.token;
			var oppId = req.body.oppId;
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, isActive: true, loginToken: token, status: 'accept'});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}
					let lat1 = (userDetails.location.coordinates && userDetails.location.coordinates.length) ? userDetails.location.coordinates[1] : 0;
					let long1 = (userDetails.location.coordinates && userDetails.location.coordinates.length) ? userDetails.location.coordinates[0] : 0;
					let uQuery = {
						_id: mongoose.Types.ObjectId(oppId),
						isDeleted: false,
						role: 'user',
						isActive: true,
						status: 'accept'
					}
					let photoQuery = {
		                from : 'photos',
		                let: {userId:'$_id'},
		                pipeline: [
		                    {
	                            $match: {
	                               $expr: {
	                                   $and: [
	                                        {
	                                            $eq: ['$userId', '$$userId'],
	                                        },
	                                        {
	                                            $eq: ['$isDeleted', false]
	                                        },
	                                        {$ne: ['$type', 'document']},
	                                        {
	                                            $eq: ['$status', 'approved']
	                                        }
	                                   ]
	                               }
	                            }
		                    },
		                    {
		                    	$sort: {sortOrder:1}
		                    },
		                    {
		                        $project: {
		                            _id: 1,
		                            path:1
		                        }
		                    }
		                ],
			            as: 'photoData'
			        };

			    	let mainQuery = [
			    		{
			    			$match: uQuery
			    		},{
			    			$limit:1
			    		},{
			    			$lookup:photoQuery
						},{
							$project: {
								username:1,
								dob:1,
								location:1,
								city:1,
								state:1,
								country:1,
								institute:1,
								photoData:1,
								spotifySong: 1,
								songUrl: 1,
								'additionalInfo.aboutMe':1,
								'additionalInfo.aspirations':1
							}
						}
					];

					let flavaData = await model.User.aggregate(mainQuery);
					if (flavaData && flavaData.length) {
						flavaData = flavaData[0];
						let age = helper.getAge(flavaData.dob);

						let lat2 = 0;
						let long2 = 0;
						let unit = (userDetails.additionalInfo && userDetails.additionalInfo.showDistance != 'kms') ? 'N': 'K';

						if (flavaData.location.coordinates && flavaData.location.coordinates.length) {
							lat2 = flavaData.location.coordinates[1];
							long2 = flavaData.location.coordinates[0];
						}

						let distance = parseInt(helper.getDistance(lat1, long1, lat2, long2, unit));
						unit = (userDetails.additionalInfo && userDetails.additionalInfo.showDistance) ? userDetails.additionalInfo.showDistance: 'kms';
						if (distance > 0) {
							distance = distance+' '+unit+' away';
						} else {
							distance = 'few '+unit+' away';
						}
						flavaData.age = age;
						flavaData.distance = distance;

						flavaData.points = await helper.calculateMatchPoints(model, userId, flavaData._id);
						if (flavaData.additionalInfo) {
							if (!flavaData.additionalInfo.aboutMe) {
								flavaData.additionalInfo.aboutMe = {
									title: '',
									ans: ''
								}
							}
							if (!flavaData.additionalInfo.aspirations) {
								flavaData.additionalInfo.aspirations = {
									title: '',
									ans: ''
								}
 							}
						} else {
							flavaData.additionalInfo = {
								aboutMe: {
									title: '',
									ans: ''
								},
								aspirations: {
									title: '',
									ans: ''
								}
							}
						}
						delete flavaData.dob;
						delete flavaData.location;
						successMessage.message = "Flava loaded successfully";
						successMessage.data = flavaData;
						res.send(successMessage);
					} else {
						failedMessage.message = "Flava data not found";
						res.send(failedMessage);
					}
				} else {
					let tempuser = await model.User.findOne({_id: userId});
					if(tempuser){
						if(tempuser.status != 'accept'){
							failedMessage.message = "Admin not approved your document";
							res.send(failedMessage);	
						} else {
							failedMessage.message = "User data not found";
							res.send(failedMessage);	
						}
					}else {
						failedMessage.message = "User data not found";
						res.send(failedMessage);
					}					
				}
			} else {
				failedMessage.message = "UserId is invalid";
				res.send(failedMessage);	
			}
		} catch (e) {
			console.log('viewFlava:::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	} 

	module.trustScoreBoard = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};

		try {
			// let trustScroreData = await model.User.find({isDeleted: false, username: {$nin: ["",null]}, role:'user', isActive: true, isWin: false},{trustScore: 1, username: 1, country :1,state: 1,city: 1,_id:1}).sort({trustScore: -1}).limit(10);

			var query = [
				{
					$match: {
						isDeleted: false,
						username: {$nin: ["",null]},
						role:'user',
						isActive: true,
						isWin: false						
					}
				},
				{ 
					$addFields: { 
						orderNumber:""
					}
				},
				{
					$project:{
						trustScore: 1,
						username: 1,
						country :1,
						state: 1,
						city: 1,
						_id:1,
						orderNumber:1
					}
				},
				{ 
					"$sort" : { 
						"trustScore": -1
					}
				},
				{ "$limit" : 10 }
			]

			let trustScroreData = await model.User.aggregate(query);

			for(let i = 0; i < trustScroreData.length; i++){
				trustScroreData[i].orderNumber = i+1;
			}

			console.log("trustScroreData:::::",trustScroreData);
			successMessage.message = "Trustscore list loaded successfully";
			successMessage.data = {list: trustScroreData};
			res.send(successMessage);
		} catch(e) {
			console.log('trustScoreBoard:::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.discoverFlava = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, role:'user'});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}

					// [ Filter ]
					let maleFemaleSelect = (userDetails.idealInfo != undefined && userDetails.idealInfo.gender != undefined) ? userDetails.idealInfo.gender : 'Female';
					let relSt = (userDetails.idealInfo != undefined && userDetails.idealInfo.relationshipStatus != undefined) ? userDetails.idealInfo.relationshipStatus : 'Single';
					let minAgeF = (userDetails.idealInfo != undefined && userDetails.idealInfo.minAge != undefined) ? userDetails.idealInfo.minAge : 18;
					let maxAgeF = (userDetails.idealInfo != undefined && userDetails.idealInfo.maxAge != undefined) ? userDetails.idealInfo.maxAge : 25;
					let sexOr = (userDetails.idealInfo != undefined && userDetails.idealInfo.sexualOrientation != undefined) ? userDetails.idealInfo.sexualOrientation : 'Straight';
					let reli = (userDetails.idealInfo != undefined && userDetails.idealInfo.religion != undefined) ? userDetails.idealInfo.religion : 'Hinduism';
					let bodyF = (userDetails.additionalInfo != undefined && userDetails.additionalInfo.bodyType != undefined) ? userDetails.additionalInfo.bodyType : 'normal';


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

					let blockedIds = await model.Block.distinct('receiverId',{senderId: userId, isDeleted: false, isBlocked: true});
					let blockedByIds = await model.Block.distinct('senderId',{receiverId: userId, isDeleted: false, isBlocked: true});

					let quAr = [ ...likeData, ...disLikeData, ...blockedIds, ...blockedByIds];

					let userData = await model.User.aggregate([
						{ $match : {

							role: 'user',
							isDeleted: false,
							status: 'accept',
							gender: maleFemaleSelect,
							// relationshipStatus: relSt,
							// sexualOrientation: sexOr,
							// 'idealInfo.religion': reli,
							// 'idealInfo.bodyType': bodyF,
							username: { "$nin": ["",null]},
							_id: { $nin: quAr, $ne: mongoose.Types.ObjectId(userId) }
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
						{ $addFields: { matchPercentage: 0,km: 0,address:"" } },
						// {
						// 	$project: {
						// 		profilePic: 1,
						// 		country:1,
						// 		state: 1,
						// 		city:1,
						// 		username: 1,
						// 		location:1,
						// 		isOnline:1,
						// 		_id:1
						// 	}
						// },
						{ "$sort" : { "_id" : 1 } },
					]);
					for (let i = 0; i < userData.length; i++) {

						let dob = await helper.getAge(userData[i].dob);

						if(minAgeF <= dob && maxAgeF >= dob){ // [ 18 < 20 && 25 > 20 ]
							let mp = await helper.calculateMatchPoints(model,userId, userData[i]._id);
							userData[i].matchPercentage = mp;
							let diss = await helper.getDistance(userDetails.location.coordinates[0], userDetails.location.coordinates[1], userData[i].location.coordinates[0], userData[i].location.coordinates[1], 'K');
							userData[i].km = Math.round(diss);
							var cn = (userData[i].country && userData[i].country != '') ? userData[i].country + ', ': '';
							var st = (userData[i].state && userData[i].state != '') ? userData[i].state + ', ': '';
							var ct = (userData[i].city && userData[i].city != '') ? userData[i].city: '';
							userData[i].address = cn+st+ct;
							delete userData[i].country;
							delete userData[i].state;
							delete userData[i].city;
							delete userData[i].location;
						}
						else {
							userData.splice(i, 1);
						}
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

					// [ NearBy ]
					// nearBy.sort(GetSortOrder("km"));
					nearBy.sort(function(a, b) {
					    return a.km - b.km;
					});
					
					let online = userData.filter(data => {
						if (data.isLogin) {
							return data;
						}
					})

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
				                let: {userId: '$userId', crtUserId: userDetails._id},
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
			                                profilePic: 1
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


					let instaFeeds = await helper.discoverFeeds(model, userDetails._id);
					if (instaFeeds && instaFeeds.length) {
						for (let i = 0; i < instaFeeds.length; i++) {
							let mp = await helper.calculateMatchPoints(model,userId, instaFeeds[i].userId);
							instaFeeds[i].matchPercentage = mp;
						}
					}

					successMessage.message = "Discover data loaded successfully";
					successMessage.data = {
						topMatch: userData,
						nearby: nearBy,
						online: online,
						talkingAbout: talkingAbout,
						instagram: instaFeeds
					};
					// console.log('discoverFlava--------->>>>>>successMessage.data: ',successMessage.data);
					res.send(successMessage);
				} else {
					console.log('discoverFlava--------->>>>"userDetails not found"');
					failedMessage.message = "Something went wrong";
					res.send(failedMessage);
				}
			} else {
				console.log('discoverFlava----------->>>>"User id is invalid"');
				failedMessage.message = "User Id is invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('discoverFlava:::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.unmatch = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			let oppId = req.body.oppId;
			
			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user', loginToken: token});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				oppId = mongoose.Types.ObjectId(oppId);

				let check = await model.Like.updateOne({$or: [{senderId: userDetails._id, receiverId: oppId},{senderId: oppId, receiverId: userDetails._id}]},{isDeleted: true, deleteReason: 'unmatched by '+userDetails.username, updatedAt: new Date()});
				console.log('unmatch----------->>>check: ',check);
				successMessage.message = "User unamatched successfully";
				res.send(successMessage);
			} else {
				console.log('unmatch----------->>>"user not found"');
				failedMessage.message = "User not found";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('unmatch:::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);			
		}
	}

	module.block = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			let oppId = req.body.oppId;

			let userDetails = await model.User.findOne({_id: userId, loginToken: token, isDeleted: false, role: 'user'});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}
				let obj = {
					senderId: userDetails._id,
					receiverId: oppId,
					isBlocked: true,
					isDeleted: false
				};

				let likeData = await model.Block.create(obj);
				
				if(likeData){
					successMessage.message = "Successfully blocked";
					res.send(successMessage);
				} else {
					failedMessage.message = "Something went wrong";
					res.send(failedMessage);
				}	
			} else {
				console.log('block------------>>>"user not found"');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
			
		} catch(e) {
			console.log('block:::::::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.report = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			console.log('report----------->>>>req.body: ',req.body);
			let userId     = mongoose.Types.ObjectId(req.body.userId);
			let token = req.headers.token;
			let oppId     = mongoose.Types.ObjectId(req.body.oppId);
			let text = req.body.text;

			let userDetails = await model.User.findOne({_id: userId, loginToken: token, isDeleted: false, role: 'user'});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}
				let check = await model.Report.create({
					senderId: userId,
					receiverId: oppId,
					reportText: text
				});

				if (check) {
					successMessage.message = "User reported successfully";
					res.send(successMessage);
				} else {
					failedMessage.message = "Someting went wrong please try again later";
					res.send(failedMessage);
				}
			} else {
				console.log('flava > report -------------->>>"user not found"');
				failedMessage.message = "User not found";
				res.send(failedMessage);
			}

		} catch (e) {
			console.log('report::::::::::::>>>>e: ',e );
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}
	return module;
}