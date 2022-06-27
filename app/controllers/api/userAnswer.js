module.exports = function(model, config) {
	var module = {};

 	module.getQuestion = async (req, res) => {
 		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
 		try {
 			var userId = req.body.userId;
			var token = req.headers.token;
			 
 			if (userId) {
 				var userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, role: 'user'}).lean();
 				if (userDetails) {
 					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}
					var query = [
					    {
					        $match: {
					            userId: userDetails._id,
					            isDeleted: false
					        }
					    },
					    {
					        $lookup: {
				                from: 'questions',
				                localField: 'queId',
				                foreignField: '_id',
				                as: 'queData'
					        }
					    },
					    {
					        $unwind: '$queData'
					    },
					    {
					        $sort: {'queData.priorityNo':1}
					    },
					    {
					        $group: {
				                _id:'$userId',
				                queIds: {$push: '$queId'},
				                lastPriorityNo:{$last: '$queData.priorityNo'}
					        }
					    }
					]
					let userAnswerData1 = await model.UserAnswer.aggregate(query);

					let queIds = [];
					let lastPriorityNo = 0;
					if (userAnswerData1 && userAnswerData1.length) {
						queIds = userAnswerData1[0].queIds;
						lastPriorityNo = userAnswerData1[0].lastPriorityNo;
					}
					let userAnswerNumber = queIds.length+1;
					let primaryQueCount = await model.Questions.countDocuments({isDeleted: false, status: true, quesType: 'primary'});

					if (userAnswerNumber > primaryQueCount) {
						await model.User.updateOne({_id: userDetails._id},{isFirstTime: false});
					}

					let checkFirstTime = (!userDetails.isFirstTime || userAnswerNumber <= primaryQueCount); 
					let userAnswerData2 = await model.Questions.find({isDeleted: false, status: true, quesType: {$in:['primary','secondary']} , _id: {$nin: queIds} ,priorityNo: {$gte: lastPriorityNo}},{_id: 1, que: 1, ans:1}).sort({quesType:1, priorityNo:1}).limit(1).lean();
					
					if (userAnswerData2 && userAnswerData2.length && checkFirstTime) {
						successMessage.message = "Question loaded successfully";
						userAnswerData2[0].userAnswerNumber = userAnswerNumber;
						userAnswerData2[0].primaryQueCount = primaryQueCount;
						successMessage.data = userAnswerData2[0];
						console.log('getQuestion------->>>>>successMessage.data: ',successMessage.data);
						res.send(successMessage);
					} else {
						failedMessage.message = "More questions are coming soon";
						res.send(failedMessage);
					}
 				} else {
 					failedMessage.message = "User data not found";
 					res.send(failedMessage);
 				}
 			} else {
 				failedMessage.message = "User Id is invalid";
 				res.send(failedMessage);
 			}
 		} catch(e) {
 			console.log('getQuestion:::::::::::>>>>e: ',e);
 			failedMessage.message = "Something went wrong";
 			res.send(failedMessage);
 		}
 	}

 	module.addAnswer = async (req, res) => {
 		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
 		try {
			 
 			var userId = req.body.userId;
 			var queId = req.body.queId;
 			var ans = req.body.ans;
 			var oppAns = req.body.oppAns;
 			var token = req.headers.token;
			var isSkipped = req.body.isSkipped;
			var isPrivate = req.body.isPrivate;
			
			console.log('req.body - checkpost: ',req.body);

			isSkipped = (isSkipped && isSkipped == 1) ? true : false;
			isPrivate = (isPrivate && isPrivate == 1) ? true : false;

 			var userDetails = await model.User.findOne({_id: userId, loginToken: token, isDeleted: false, role: 'user'});
 			if (userDetails) {
 				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				let queData = await model.Questions.findOne({_id: queId, status: true, isDeleted: false});
				if (queData) {
					
					
					if (isSkipped) {
						
						let upData = {
							ans: '',
							oppAns: [],
							isSkipped: true,
							updateAt: new Date()
						};
						let userAnswerData = await model.UserAnswer.findOne({queId: queId, userId: userDetails._id, isDeleted: false});
						// console.log("userAnswerData",userAnswerData);
						
						if (userAnswerData) {
						
							
							await model.UserAnswer.updateOne({_id: userAnswerData},upData);
							successMessage.message = "Answer skipped successfully";
						} else {
						
							
							upData.queId = queData._id;
							upData.userId = userDetails._id;
							upData.createdAt = new Date();
							await model.UserAnswer.create(upData);
							successMessage.message = "Answer skipped successfully";
						}
						helper.updateTrustScore(model, userDetails._id);
						// console.log("successMessage.,.,.,.,.,",successMessage);
						
						res.send(successMessage);
					} else {

						let options = queData.ans;
						
						
						if (typeof oppAns == 'string') {
							oppAns = (helper.IsJsonString(oppAns)) ? JSON.parse(oppAns) : [];
						} 
						// console.log("opp",oppAns);

						oppAns = oppAns.map(data => data.trim());
						console.log("opp",oppAns);
						
						if (oppAns && oppAns.length) {
							let userAnsCheck = false;
							for (let i = 0; i < options.length; i++ ) {
								if (ans == options[i]) {
									userAnsCheck = true;
								}
							}

							let oppAnsCheck = false;
							for (let j = 0; j < oppAns.length; j++) {
								oppAnsCheck = false;
								for (let k = 0; k < options.length; k++) {
									if (oppAns[j] == options[k]) {
										oppAnsCheck = true;
										break;
									}
								}
								if (!oppAnsCheck) {
									break;
								}
							}
							
							
							if (userAnsCheck && oppAnsCheck) {
								let upData = {
									ans: ans,
									oppAns: oppAns,
									isSkipped: false,
									isPrivate: isPrivate,
									updateAt: new Date()
								};
								let userAnswerData = await model.UserAnswer.findOne({queId: queId, userId: userDetails._id, isDeleted: false});
								if (userAnswerData) {
									await model.UserAnswer.updateOne({_id: userAnswerData},upData);
									successMessage.message = "Answer updated successfully";
								} else {
									upData.queId = queData._id;
									upData.userId = userDetails._id;
									upData.createdAt = new Date();
									await model.UserAnswer.create(upData);
									successMessage.message = "Answer added successfully";
								}
								helper.updateTrustScore(model, userDetails._id);
								res.send(successMessage);
							} else {
								failedMessage.message = "User or opponent answer is invalid"; 
								res.send(failedMessage);
							}
						} else {
							failedMessage.message = "Please select opponent answer";
							res.send(failedMessage);
						}
					}
				} else {
					failedMessage.message = "Question not found";
					res.send(failedMessage);
				}
 			} else {
 				failedMessage.message = "User data not found";
 				res.send(failedMessage);
 			}
 		} catch(e) {
 			console.log('addAnswer::::::::::::::>>>e: ',e);
 			failedMessage.message = "Something went wrong";
 			res.send(failedMessage);
 		}
 	}

 	module.viewAnswerList = async (req, res) => {
 		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
 		try {
 			var userId = req.body.userId;
 			var token = req.headers.token;
 			if (userId) {
 				let userDetails = await model.User.findOne({_id: userId, loginToken: token, isDeleted: false, role:'user'});
 				if (userDetails) {
 					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}
 					var query = [{
				        $match: {
				                userId: userDetails._id,
				                isDeleted: false
				            }
				    	},
					    {
				            $lookup: {
			                    from: 'questions',
			                    localField: 'queId',
			                    foreignField: '_id',
			                    as: 'queData'
				            }
					    },
					    {
					    	$unwind: '$queData'
					    },
					    {
					    	$match: {
					    		'queData.status': true,
					    		'queData.isDeleted': false
					    	}
					    },
					    {
					    	$sort: {
					    		'queData.quesType':1,'queData.priorityNo':1
					    	}
					    },
					    {
				         	$project:{
				         		_id: 0,
				         		queId: 1,
				                que: '$queData.que',
				                ans: 1,
				                isPrivate:1,
				                isSkipped:1,
				                options: '$queData.ans'
				            }
				        }
				    ]
				    let answerList = await model.UserAnswer.aggregate(query);

 					if (answerList && answerList.length) {
 						successMessage.message = "Answers loaded successfully";
 						successMessage.data = {answerList: answerList};
 					} else {
 						successMessage.message = "You haven't answered any questions yet";
 						successMessage.data = {answerList:[]}
 					}
					res.send(successMessage);
 				} else {
 					failedMessage.message = "User data not found";
 					res.send(failedMessage);
 				}
 			} else {
 				failedMessage.message = "User Id is invalid";
 				res.send(failedMessage);
 			}
 		} catch(e) {
 			console.log('viewAnswer::::::::::>>>e: ',e);
 			failedMessage.message = "Something went wrong";
 			res.send(failedMessage);
 		}
 	}

 	module.viewAnswer = async (req, res) => {
 		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
			var token = req.headers.token;
			var queId = req.body.queId;


			var userDetails = await model.User.findOne({_id: userId, loginToken: token ,isDeleted: false, role: 'user'});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}
				queId = mongoose.Types.ObjectId(queId);
				var query = [
					{
				        $match: {
			                userId: userDetails._id,
			                queId: queId,
			                isDeleted: false,
			            }
				    },
				    {
			            $lookup: {
		                    from: 'questions',
		                    localField: 'queId',
		                    foreignField: '_id',
		                    as: 'queData'
			            }
				    },
				    {
				     	$unwind: '$queData'
				    },
				    {
				        $match: {
			                'queData.status': true,
			                'queData.isDeleted': false
				        }
				    },
			     	{
			     		$sort: {'queData.quesType':1,'queData.priorityNo':1}
			     	},
			     	{
						$project:{
							_id:0,
							queId: 1,
						    que: '$queData.que',
						    ans: 1,
						    options: '$queData.ans',
						    oppAns: 1
					 	}
					}
			    ]
			    let answerData = await model.UserAnswer.aggregate(query);
			    console.log('answerData - checkpost: ',answerData);
			    
			    if (answerData && answerData.length) {
			    	answerData = answerData[0];
			    	successMessage.message = "Answer loaded succesfully";
			    	successMessage.data = answerData;
			    	res.send(successMessage);
			    } else {

			    	// failedMessage.message = "Question not valid";
			    	// res.send(failedMessage);

			    	console.log("else viewAnswer::::::::::::");
			    	let queData = await model.Questions.findOne({'_id':queId,"isDeleted":false,status: true});
			    	if(queData){

				    	let snedData = {
				    		"queId": queId,
				    		"ans":"",
				    		"oppAns":[],
				    		"que":queData.que,
				    		"options":queData.ans,
				    		// "quesType":queData.quesType,
				    		// "categoryName":queData.categoryName,
				    		// "priorityNo":queData.priorityNo
				    	}

				    	successMessage.message = "success";
				    	successMessage.data = snedData;
				    	res.send(successMessage);
				    	
			    	} else {

			    		failedMessage.message = "Question not valid";
			    		res.send(failedMessage);
			    	}

			    }
			} else {
				failedMessage.message = "User data not found";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('viewAnswer:::::::::::::>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}
	 
	module.getMatchQues = async (req, res) => { // for web
		var successMessage = { status: 'success', message:"", data:{}};
	   	var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
		    var token = req.headers.token;
			
			if (userId) {
				var userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, role: 'user'});
				if (userDetails) {
					if (!userDetails.isActive) {
					   failedMessage.message = "You have been blocked by admin";
					   return res.send(failedMessage);
				   	}
				   successMessage.data = {
					'queAnsData':{
						userAnswerNumber: 0,
						primaryQueCount:0,
						que: '',
						ans: []
					},
					'reAnsCompareData':[],
					'reAnswerData':[],
					'unAnswerData':[]
				   };

				   var query = [
					   {
						   $match: {
							   userId: userDetails._id,
							   isDeleted: false
						   }
					   },
					   {
						   $lookup: {
							   from: 'questions',
							   localField: 'queId',
							   foreignField: '_id',
							   as: 'queData'
						   }
					   },
					   {
						   $unwind: '$queData'
					   },
					   {
						   $sort: {'queData.priorityNo':1}
					   },
					   {
						   $group: {
							   _id:'$userId',
							   queIds: {$push: '$queId'},
							   queData: {$push: '$queData'},
							   lastPriorityNo:{$last: '$queData.priorityNo'}
						   }
					   }
				   ]
				   let userAnswerData1 = await model.UserAnswer.aggregate(query);
				   if(userAnswerData1.length){
					   successMessage.data.reAnswerData = userAnswerData1;
				   }
				   
				   let queIds = [];
				   let lastPriorityNo = 0;
				   if (userAnswerData1 && userAnswerData1.length) {
					   queIds = userAnswerData1[0].queIds;
					   lastPriorityNo = userAnswerData1[0].lastPriorityNo;
				   }
				   let userAnswerNumber = queIds.length+1;
				   let primaryQueCount = await model.Questions.countDocuments({isDeleted: false, status: true, quesType: 'primary'});

				   let userAnswerData2 = await model.Questions.find({isDeleted: false, status: true, quesType: {$in:['primary','secondary']} , _id: {$nin: queIds} ,priorityNo: {$gte: lastPriorityNo}},{_id: 1, que: 1, ans:1}).sort({quesType:1, priorityNo:1}).limit(1).lean();
				   let userAnswerData3 = await model.Questions.find({isDeleted: false, status: true, quesType: {$in:['primary','secondary']} , _id: {$nin: queIds} ,priorityNo: {$gte: lastPriorityNo}},{_id: 1, que: 1, ans:1}).sort({quesType:1, priorityNo:1}).limit(10).lean();

				   let userAnswerData4 = await model.UserAnswer.find({'queId':queIds,'userId':userId});
				   if(userAnswerData4 && userAnswerData4.length){
						successMessage.data.reAnsCompareData = userAnswerData4;
						let ln = 0;
						for (var i = 0; i < userAnswerData4.length; i++) {
							if(userAnswerData4[i].isSkipped == true){
								ln++;
							}
						}
						successMessage.data.isSkipped = ln;
				   }
				   if(userAnswerData3 && userAnswerData3.length){	
					   successMessage.data.unAnswerData = userAnswerData3;
					   	let ln2 = userAnswerData3.length;
						successMessage.data.isPublic = ln2;
				   }	
				   if (userAnswerData1 && userAnswerData1.length || userAnswerData2 && userAnswerData2.length || userAnswerData3 && userAnswerData3.length || userAnswerData4 && userAnswerData4.length) {
						successMessage.message = "Question loaded successfully";
						if(userAnswerData2 && userAnswerData2.length){
							successMessage.data.queAnsData = userAnswerData2[0];
							successMessage.data.queAnsData.userAnswerNumber = userAnswerNumber;
							successMessage.data.queAnsData.primaryQueCount = primaryQueCount;
						}
				
						
						res.send(successMessage);
				   } else {
					   failedMessage.message = "More questions are coming soon";
					   res.send(failedMessage);
				   }
				} else {
					failedMessage.message = "User data not found";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User Id is invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('getQuestion:::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.getHighestPerc = async (req, res) => { // for web
		var successMessage = { status: 'success', message:"", data:{}};
	   	var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
		    var token = req.headers.token;
			
			if (userId) {
				var userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token, role: 'user'});
				if (userDetails) {
					if (!userDetails.isActive) {
					   failedMessage.message = "You have been blocked by admin";
					   return res.send(failedMessage);
				   	}
				   		
				   	let userAnswerData1 = await model.UserAnswer.find({userId: userDetails._id, isSkipped: false}).select(['queId', 'ans']);

				   	let tmpp = [];
				   	userAnswerData1.map(function(dt){
				   		tmpp.push(dt.queId);
				   	});

					let totalLenn = await model.UserAnswer.countDocuments({
						'queId': { $in : tmpp },
						'userId': { $ne: userId },
						'isSkipped': false
					});				   	
					let ownLen = 0;
					for (var i = 0; i < tmpp.length; i++) {
						let tmp32 = await model.UserAnswer.countDocuments({
							'queId': userAnswerData1[i].queId,
							'ans': userAnswerData1[i].ans
						});
						ownLen = Number(ownLen) + Number(tmp32);
					}

					let perce = ( Number(ownLen) * 100 ) / Number(totalLenn);
					perce = (isNaN(perce)) ? '' : perce;

					let userAnswerDataNew = await model.UserAnswer.find({userId: userDetails._id,"isDeleted" : false});

				   	let isPrivate = 0;
				   	let isSkipped = 0;
				   	let isPublic = 0;
				   	for(let i = 0; i < userAnswerDataNew.length; i++){
				   		if(userAnswerDataNew[i].isPrivate == false){
				   			isPublic++;
				   		}

				   		if(userAnswerDataNew[i].isPrivate == true){
				   			isPrivate++;
				   		}

						if(userAnswerDataNew[i].isSkipped == true){
				   			isSkipped++;
				   		}				   		
				   	}

				   	//isPrivate, isSkipped, isPublic
		    		let showCountOf = req.body.showCountOf;
				   	let countOf = 0;
				   	if(showCountOf == "isPrivate"){
				   		countOf = isPrivate;
				   	} else if(showCountOf == "isSkipped"){
				   		countOf = isSkipped;
				   	} else if(showCountOf == "isPublic"){
				   		countOf = isPublic;
				   	}
					
					successMessage.data = { 'perce': perce, 'countOf':countOf, 'isPrivate':isPrivate, 'isSkipped':isSkipped, 'isPublic':isPublic };
					res.send(successMessage);
				   
				} else {
					failedMessage.message = "User data not found";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User Id is invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('getQuestion:::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.compareAnswer = async function (req ,res) {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = mongoose.Types.ObjectId(req.body.userId);
			var token = req.headers.token;
			var oppId = mongoose.Types.ObjectId(req.body.oppId);

			var userDetails = await model.User.findOne({_id: userId, isDeleted: false, status: 'accept', isActive: true, loginToken: token, role: 'user'});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}
				var oppDetail = await model.User.findOne({_id: oppId, isDeleted: false, status: 'accept', isActive: true, role: 'user'});
				if (oppDetail) {
					var mainQuery = [
					    {
					        $match: {
					            userId: {$in : [userId, oppId]}, 
					            isDeleted: false, 
					            isSkipped: false
					        }
					    },
					    {
				            $lookup: {
			                    from :'questions',
			                    localField:'queId',
			                    foreignField: '_id',
			                    as:'queData'
				            }
					    },
					    {
					        $unwind: '$queData',
					     },
					     {
					        $match: {
					                'queData.isDeleted': false,
					                'queData.status': true
								}
							},
					    {
					        $group: {
				                _id: '$queId',
				                question: {$first: '$queData.que'},
				                options: {$first: '$queData.ans'},
				                priorityNo: {$first: '$queData.priorityNo'},
				                user: {$push: {$cond:[{$eq: ['$userId',userId]},{userId: '$userId', ans: '$ans', oppAns: '$oppAns',isPrivate: '$isPrivate'},null]}},
				                opp: {$push: {$cond:[{$eq: ['$userId',oppId]},{userId: '$userId', ans: '$ans', oppAns: '$oppAns',isPrivate: '$isPrivate'},null]}}
					        }
					    },
					    {
					        $project: {
				                _id: 1,
				                question: 1,
				                options:1,
				                priorityNo: 1,
				                user:{$arrayElemAt:[{$setDifference: ['$user',[null]]},0]},
				                opp:{$arrayElemAt:[{$setDifference: ['$opp',[null]]},0]}
				            }
				        },
						{
						    $sort: {priorityNo:1}
						}
					];

					let agreeData = [];
					let disagreeData = [];
					let findOutData = [];
					let answerData = await model.UserAnswer.aggregate(mainQuery);
					console.log("answerData::::",answerData);
					if (answerData && answerData.length) {
						for (let i = 0; i < answerData.length; i++) {
							let userAns = '';
							let userOppAns = [];
							let oppAns = '';
							let oppOppAns = [];

							if (answerData[i].user && answerData[i].opp) {
								userAns = answerData[i].user.ans;
								userOppAns = answerData[i].user.oppAns;
								oppAns = answerData[i].opp.ans;
								oppOppAns = answerData[i].opp.oppAns;

								if (oppOppAns.indexOf(userAns) != -1 && userOppAns.indexOf(oppAns) != -1) {
									agreeData.push(answerData[i]);
								} else {
									disagreeData.push(answerData[i]);
								}
							} else if (!answerData[i].user && answerData[i].opp){
								answerData[i].user = {
									userId: userId,
									ans: "",
									oppAns: [],
									isPrivate: false
								};
								findOutData.push(answerData[i]);
							}
						}
					}

					console.log("findOutData:::;",findOutData);
					let obj = {
						agreeData: agreeData,
						disagreeData: disagreeData,
						findOutData:findOutData
					};
					successMessage.message = "Answers loaded successfully";
					successMessage.data = obj;
					res.send(successMessage);
				} else {
					failedMessage.message = "Opposite user data not found";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User data not found";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('compareAnswer::::::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	return module;
}