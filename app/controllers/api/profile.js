module.exports = function(model,config){
	var module = {};

	module.getProfileFields = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var profileFields = await model.ProfileFields.find({isDeleted:false},{slug:1, options:1,type: 1});
			var obj = {
				gender: [],
				sexualOrientation: [],
				zodiacSign: [],
				relationshipStatus: [],
				income: [],
				occupation: [],
				haveChildren: [],
				wantChildren: [],
				connections: [],
				country: [],
				institute: [],
				bodyType: [],
				race: [],
				home: [],
				educationLevel: [],
				ethnicity: [],
				aboutMe: [],
				moments: [],
				traits: [],
				aspirations: [],
				needs: [],
				secrets: [],
				hobbies: [],
				whatYouSay: [],
				minAge: settings.minAge ? settings.minAge : 0,
				maxAge: settings.maxAge ? settings.maxAge : 0,
				minDistance: settings.minDistance ? settings.minDistance : 0,
				maxDistance: settings.maxDistance ? settings.maxDistance : 0,
				height: [],
				promoCode: [],
				showDistance: [],
				religion: []				
			};
			if (profileFields && profileFields.length) {
				for (let i = 0; i < profileFields.length; i++) {
					let slug = profileFields[i].slug;

					switch (profileFields[i].slug) {
						case 'sexual_orientation' : slug = 'sexualOrientation'; break;
						case 'zodiac_sign' : slug = 'zodiacSign'; break;
						case 'relationship_status': slug = 'relationshipStatus'; break;
						case 'have_children': slug = 'haveChildren'; break;
						case 'want_children': slug = 'wantChildren'; break;
						case 'body_type': slug = 'bodyType'; break;
						case 'education_level': slug = 'educationLevel'; break;
						case 'about_me': slug = 'aboutMe'; break;
						case 'what_you_say': slug = 'whatYouSay'; break;
						case 'show_distance': slug = 'showDistance'; break;
					}
					obj[slug] = profileFields[i].options;
				}

				let country = await model.Country.find({},{_id: 1, name:1, countryCode:1}).sort({name:1}).lean();

				if (country && country.length) {
					country = country.map(data => {
						data.countryCode  = '+'+data.countryCode;
						return data;
					});
					obj.country = country;
				}

				let institute = await model.Institute.find({},{_id:1, name:1}).sort({name:1});
				if (institute && institute.length) {

					institute = institute.map(data => data.name);
				} else {
					institute = [];
				}
				obj.institute = institute;

			}

			successMessage.message = "Successfully loaded profile reference";
			successMessage.data = obj;
			res.send(successMessage);
		} catch (e) {
			console.log('getProfileFields:::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.emailCheckPost = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try{
			let user = await model.User.findOne({
				loginToken: req.headers.token
			});
			successMessage.data = user;
			res.send(successMessage);
		}
		catch(e){
			console.log('Error: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.getStates = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var countryId = req.body.countryId;
			var statesList = [];
			if (countryId) {
				statesList = await model.State.find({countryId: countryId},{_id:1, name: 1}).sort({name: 1});
			}
			successMessage.message = "States loaded successfully";
			successMessage.data = {stateList: statesList};
			res.send(successMessage);
		} catch (e) {
			console.log('getStates:::::::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.getCities = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var stateId = req.body.stateId;
			var cityList = [];
			if (stateId) {
				cityList = await model.City.find({stateId: stateId}, {_id:1, name:1});
			}
			successMessage.message = "City loaded successfully";
			successMessage.data = {cityList: cityList};
			res.send(successMessage);
		} catch(e) {
			console.log('getCities:::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.viewProfile = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
			if (userId) {
				
				userId = mongoose.Types.ObjectId(userId);
		        var photoQuery = {      
		        	$and: [
		                {$ne: ['$photos.isDeleted',true]},
		                {$ne: ['$photos.status','rejected']},
		                {$ne: ['$photos.type','document']}
		        	]
		        };
				var docQuery = {        
					$and: [
		                {$eq: ['$photos.isDeleted',false]},
		                {$eq: ['$photos.type','document']}
		        	]
		        };
		        var query = [
				    {
				        $match: {
			            	_id: userId,
			            	isDeleted: false,
			            	role: 'user'
			            }
				    },
				    {
				        $lookup: {
			                from : 'photos',
			                localField: '_id',
			                foreignField: 'userId',
			                as: 'photos'
				        }
				    },
				    {
						$unwind: {
							path: '$photos',
							preserveNullAndEmptyArrays: true
						}
				    },
				    {
						$sort: {
						    'photos.sortOrder': 1
						}
				    },
				    {
						$group: {
						    _id: '$_id',
						    isActive: {$first: '$isActive'},
						    firstName: {$first: '$firstName'},
						    lastName: {$first: '$lastName'},
						    username: {$first: '$username'},
						    countryCode: {$first: '$countryCode'},
						    phno: {$first: '$phno'},
						    email: {$first:'$email'},
						    gender:{$first: '$gender'},
						    sexualOrientation: {$first: '$sexualOrientation'},
						    show: {$first: '$show'},
						    city: {$first: '$city'},
						    state: {$first: '$state'},
						    country: {$first: '$country'},
						    institute: {$first: '$institute'},
						    zodiacSign: {$first: '$zodiacSign'},
						    relationshipStatus: {$first: '$relationshipStatus'},
						    enableAgeInProfile: {$first: '$enableAgeInProfile'},
						    dob: {$first: {$dateToString:{format:'%Y-%m-%d', date: '$dob'}}},
						    additionalInfo: {$first: '$additionalInfo'},  
						    idealInfo: {$first: '$idealInfo'}, 
						    location: {$first: '$location'},    
						    instaId: {$first: '$instaId'},
						    spotifyId: {$first: '$spotifyId'},
						    snapchatId: {$first: '$snapchatId'},
						    trustScore: {$first: '$trustScore'},
						    showInSwipe: {$first: '$showInSwipe'},
						    'photos': {$push: {
                                $cond: [
                                    photoQuery,
                                    {_id: '$photos._id',path:'$photos.path',visibleInPrivacy: '$photos.visibleInPrivacy', type: '$photos.type',sortOrder : '$photos.sortOrder',isLive: '$photos.isLive'},
                                    null
                                ]
                            }},
                            'documents': {$push: {
                                $cond: [
                                    docQuery,
                                    '$photos.path',
                                    null
                                ]
                            }}    
						}  
				    },
                    {
                        $project: {
                            _id: 1,
                            isActive: 1,
                            firstName: 1,
                            lastName: 1,
                            username: 1,
                            phno:1,
                            countryCode:1,
                            email: 1,
                            gender:1,
                            sexualOrientation: 1,
                            show: 1,
                            city: 1,
                            state: 1,
                            country: 1,
                            institute: 1,
                            zodiacSign: 1,
                            relationshipStatus: 1,
                            dob: 1,
                            location: 1,
                            additionalInfo: 1,
                            idealInfo: 1,
                            enableAgeInProfile: 1,
                            privacyMode: 1,
                            instaId: 1,
                            spotifyId: 1,
                            snapchatId:1,
                            trustScore:1,
                            showInSwipe: 1,
                            photos: {$setDifference: ['$photos',[null]]},
                            userDocument: {$arrayElemAt:[{$setDifference: ['$documents',[null]]},0]}
                        }
                    }
				];

				let userDetails = await model.User.aggregate(query);
				if (userDetails && userDetails.length) {
					userDetails = userDetails[0];
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}

					userDetails.firstName = userDetails.firstName ? userDetails.firstName :'';
					userDetails.lastName = userDetails.lastName ? userDetails.lastName :'';
					userDetails.username = userDetails.username ? userDetails.username :'';
					userDetails.phno  = userDetails.phno ? userDetails.phno: '';
					userDetails.countryCode = userDetails.countryCode ? userDetails.countryCode: '',
					userDetails.email = userDetails.email ? userDetails.email :'';
					userDetails.gender = userDetails.gender ? userDetails.gender :'';
					userDetails.sexualOrientation = userDetails.sexualOrientation ? userDetails.sexualOrientation :'';
					userDetails.city = userDetails.city ? userDetails.city :'';
					userDetails.state = userDetails.state ? userDetails.state :'';
					userDetails.country = userDetails.country ? userDetails.country :'';
					userDetails.zodiacSign = userDetails.zodiacSign ? userDetails.zodiacSign :'';
					userDetails.relationshipStatus = userDetails.relationshipStatus ? userDetails.relationshipStatus :'';
					userDetails.dob = userDetails.dob ? userDetails.dob :'';
					userDetails.age = userDetails.dob ?  helper.getAge(new Date(userDetails.dob)) : 0;
					userDetails.photos = userDetails.photos ? userDetails.photos :[];
					userDetails.userDocument = userDetails.userDocument ? userDetails.userDocument :'';
					userDetails.institute = userDetails.institute ? userDetails.institute :'';
					userDetails.enableAgeInProfile = userDetails.enableAgeInProfile ? userDetails.enableAgeInProfile: false;
					userDetails.privacyMode = userDetails.privacyMode ? userDetails.privacyMode : false;
					userDetails.instaId = userDetails.instaId ? userDetails.instaId : '';
					userDetails.spotifyId = userDetails.spotifyId ? userDetails.spotifyId : '';
					userDetails.snapchatId = userDetails.snapchatId ? userDetails.snapchatId : '';
					userDetails.trustScore = userDetails.trustScore ? userDetails.trustScore: 0;
					userDetails.showInSwipe = userDetails.showInSwipe ? userDetails.showInSwipe: false;

					userDetails.additionalInfo.ethnicity = userDetails.additionalInfo.ethnicity ? userDetails.additionalInfo.ethnicity : '';
					userDetails.additionalInfo.height = userDetails.additionalInfo.height ? userDetails.additionalInfo.height: ''; 
					userDetails.additionalInfo.home = userDetails.additionalInfo.home ? userDetails.additionalInfo.home: '';
					userDetails.additionalInfo.religion = userDetails.additionalInfo.religion ? userDetails.additionalInfo.religion: '';
					userDetails.additionalInfo.bodyType = userDetails.additionalInfo.bodyType ? userDetails.additionalInfo.bodyType: '';
					userDetails.additionalInfo.race = userDetails.additionalInfo.race ? userDetails.additionalInfo.race: '';
					userDetails.additionalInfo.educationLevel = userDetails.additionalInfo.educationLevel ? userDetails.additionalInfo.educationLevel :'';
					userDetails.additionalInfo.income = userDetails.additionalInfo.income ? userDetails.additionalInfo.income :'';
					userDetails.additionalInfo.occupation = userDetails.additionalInfo.occupation ? userDetails.additionalInfo.occupation :'';
					userDetails.additionalInfo.haveChildren = userDetails.additionalInfo.haveChildren ? userDetails.additionalInfo.haveChildren :'';
					userDetails.additionalInfo.wantChildren = userDetails.additionalInfo.wantChildren ? userDetails.additionalInfo.wantChildren :'';
					userDetails.additionalInfo.connections = userDetails.additionalInfo.connections ? userDetails.additionalInfo.connections :[];
					userDetails.additionalInfo.showDistance = userDetails.additionalInfo.showDistance ? userDetails.additionalInfo.showDistance : '';

					userDetails.additionalInfo.aboutMe = userDetails.additionalInfo.aboutMe ? userDetails.additionalInfo.aboutMe :{title: '',ans: ''};
					userDetails.additionalInfo.moments = userDetails.additionalInfo.moments ? userDetails.additionalInfo.moments :{title: '',ans: ''};
					userDetails.additionalInfo.traits = userDetails.additionalInfo.traits ? userDetails.additionalInfo.traits :{title: '',ans: ''};
					userDetails.additionalInfo.aspirations = userDetails.additionalInfo.aspirations ? userDetails.additionalInfo.aspirations :{title: '',ans: ''};
					userDetails.additionalInfo.needs = userDetails.additionalInfo.needs ? userDetails.additionalInfo.needs :{title: '',ans: ''};
					userDetails.additionalInfo.secrets = userDetails.additionalInfo.secrets ? userDetails.additionalInfo.secrets :{title: '',ans: ''};
					userDetails.additionalInfo.hobbies = userDetails.additionalInfo.hobbies ? userDetails.additionalInfo.hobbies :{title: '',ans: ''};
					userDetails.additionalInfo.whatYouSay = userDetails.additionalInfo.whatYouSay ? userDetails.additionalInfo.whatYouSay :{title: '',ans: ''};


					userDetails.idealInfo.ethnicity = userDetails.idealInfo.ethnicity ? userDetails.idealInfo.ethnicity : '';
					userDetails.idealInfo.connections = userDetails.idealInfo.connections ? userDetails.idealInfo.connections: [];
					userDetails.idealInfo.relationshipStatus = userDetails.idealInfo.relationshipStatus ? userDetails.idealInfo.relationshipStatus: '';
					userDetails.idealInfo.gender = userDetails.idealInfo.gender ? userDetails.idealInfo.gender: '';
					userDetails.idealInfo.minAge = userDetails.idealInfo.minAge ? userDetails.idealInfo.minAge: settings.minAge;
					userDetails.idealInfo.maxAge = userDetails.idealInfo.maxAge ? userDetails.idealInfo.maxAge: settings.maxAge;
					userDetails.idealInfo.maxDistance = userDetails.idealInfo.maxDistance ? userDetails.idealInfo.maxDistance: settings.maxDistance;
					userDetails.idealInfo.race = userDetails.idealInfo.race ? userDetails.idealInfo.race: '';
					userDetails.idealInfo.sexualOrientation = userDetails.idealInfo.sexualOrientation ? userDetails.idealInfo.sexualOrientation: '';
					userDetails.idealInfo.religion = userDetails.idealInfo.religion ? userDetails.idealInfo.religion: '';
					userDetails.idealInfo.bodyType = userDetails.idealInfo.bodyType ? userDetails.idealInfo.bodyType: '';
					userDetails.idealInfo.occupation = userDetails.idealInfo.occupation ? userDetails.idealInfo.occupation: '';
					userDetails.idealInfo.haveChildren = userDetails.idealInfo.haveChildren ? userDetails.idealInfo.haveChildren: '';
					userDetails.idealInfo.wantChildren = userDetails.idealInfo.wantChildren ? userDetails.idealInfo.wantChildren: '';
					userDetails.idealInfo.educationLevel = userDetails.idealInfo.educationLevel ? userDetails.idealInfo.educationLevel: '';
					userDetails.idealInfo.home = userDetails.idealInfo.home ? userDetails.idealInfo.home: '';

					if(userDetails.location){
						userDetails.location = {
							latitude: userDetails.location.coordinates[1].toString(),
							longitude: userDetails.location.coordinates[0].toString()
						}
					}

					successMessage.message = "User profile loaded sucessfully";
					successMessage.data = userDetails;
					res.send(successMessage);
				} else {
					failedMessage.message = "User data not found";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "UserId is invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('viewProfile:::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.editProfile = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
			var token = req.headers.token;
			
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token}).lean();
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}

					if (!userDetails.isVerified) {
						failedMessage.message = "Please verify your account";
						return res.send(failedMessage);
					}

					let firstName = req.body.firstName;
					let lastName = req.body.lastName;
					let username = req.body.username;
					let email = req.body.email;
					let phno = req.body.phno;
					let countryCode = req.body.countryCode;
					let gender = req.body.gender;
					let sexualOrientation = req.body.sexualOrientation;
					let city = req.body.city;
					let state = req.body.state;
					let country = req.body.country;
					let institute = req.body.institute;
					let zodiacSign = req.body.zodiacSign;
					let relationshipStatus = req.body.relationshipStatus;
					let dob = req.body.dob;
					let income = req.body.income;
					let occupation = req.body.occupation;
					let haveChildren = req.body.haveChildren;
					let howManyChls = req.body.howManyChls;
					let wantChildren = req.body.wantChildren;
					let connections = req.body.connections;
					let race = req.body.race;
					let bodyType = req.body.bodyType;
					let religion = req.body.religion;
					let educationLevel = req.body.educationLevel;
					let home = req.body.home;
					let ethnicity = req.body.ethnicity;
					let lat = parseFloat(req.body.lat);
					let long = parseFloat(req.body.long);					
					let enableAgeInProfile = req.body.enableAgeInProfile; 
					let privacyMode = req.body.privacyMode; 
					let instaId = req.body.instaId;
					let instaToken = req.body.instaToken;
					let spotifyId = req.body.spotifyId;
					let snapchatId = req.body.snapchatId;
					let showInSwipe = req.body.showInSwipe;

					let height = req.body.height;
					let showDistance = req.body.showDistance;
					let aboutMeTitle = req.body.aboutMeTitle;
					let aboutMeAns = req.body.aboutMeAns;
					let momentsTitle = req.body.momentsTitle;
					let momentsAns = req.body.momentsAns;
					let traitsTitle = req.body.traitsTitle;
					let traitsAns = req.body.traitsAns;
					let aspirationsTitle = req.body.aspirationsTitle;
					let aspirationsAns = req.body.aspirationsAns;
					let needsTitle = req.body.needsTitle;
					let needsAns = req.body.needsAns;
					let secretsTitle = req.body.secretsTitle;
					let secretsAns = req.body.secretsAns;
					let hobbiesTitle = req.body.hobbiesTitle;
					let hobbiesAns = req.body.hobbiesAns;
					let whatYouSayTitle = req.body.whatYouSayTitle;
					let whatYouSayAns = req.body.whatYouSayAns;
					
					let idealConnections = req.body.idealConnections;
					let idealRelationshipStatus = req.body.idealRelationshipStatus;
					let idealGender = req.body.idealGender;
					let idealMinAge = req.body.idealMinAge;
					let idealMaxAge = req.body.idealMaxAge;
					let idealMaxDistance = req.body.idealMaxDistance;
					let idealRace = req.body.idealRace;
					let idealSexualOrientation = req.body.idealSexualOrientation;
					let idealReligion = req.body.idealReligion;
					let idealBodyType = req.body.idealBodyType;
					let idealOccupation = req.body.idealOccupation;
					let idealHaveChildren = req.body.idealHaveChildren;
					let idealWantChildren = req.body.idealWantChildren;
					let idealEducationLevel = req.body.idealEducationLevel;
					let idealHome = req.body.idealHome;
					let idealEthnicity = req.body.idealEthnicity;

					let upData = {updatedAt: new Date()};
					if (firstName) {
						upData.firstName = firstName
					}
					if (lastName) {
						upData.lastName = lastName;
					}
					if (username) { 
						let isExist = await model.User.countDocuments({_id: {$ne: userDetails._id},username: username, isDeleted: false});
						if (isExist) {
							failedMessage.message = "Username already used! Please use another one";
							return res.send(failedMessage);
						}
						upData.username = username;
						if (req.session.userData) {
							req.session.userData.username = username;
						}
					}
					if (email) { 
						let isExist = await model.User.countDocuments({_id: {$ne: userDetails._id},email: email, isDeleted: false});
						if (isExist) {
							failedMessage.message = "Email already used! Please use another one";
							return res.send(failedMessage);
						}
						upData.email = email;
					}

					if (phno && countryCode) {
						let isExist = await model.User.countDocuments({_id: {$ne: userDetails._id}, phno: phno, countryCode: countryCode, isDeleted: false});
						if (isExist) {
							failedMessage.message = "Phone already used! Please use another one";
							return res.send(failedMessage);
						}
						upData.phno = phno;
						upData.countryCode = countryCode;
					}

					if (gender) {
						upData.gender = gender;
					}
					if (sexualOrientation) {
						upData.sexualOrientation = sexualOrientation;
					}
					if (city) {
						upData.city = city;
					}
					if (state) {
						upData.state = state;
					}
					if (country) {
						upData.country = country;
					}
					if (institute) {
						upData.institute = institute;
					}
					if (zodiacSign) {
						upData.zodiacSign = zodiacSign;
					}
					if (relationshipStatus) {
						upData.relationshipStatus = relationshipStatus;
					}

					if (enableAgeInProfile == 1 || enableAgeInProfile == 0) {
						upData.enableAgeInProfile = enableAgeInProfile == 1 ? true : false;
					}

					if (privacyMode  == 1 || privacyMode == 0) {
						upData.privacyMode = privacyMode == 1 ? true : false;
					}

					if (showInSwipe == 1 || showInSwipe == 0) {
						upData.showInSwipe = showInSwipe == 1 ? true : false;
					}

					if (dob) { // YYYY-MM-DD
						let tmp = dob.split('-');
						if (tmp.length == 3) {
							let dt = new Date();
							dt.setFullYear(tmp[0]);
							dt.setMonth(tmp[1]-1);
							dt.setDate(tmp[2]);
							upData.dob = dt;
						}
					}

					if (!isNaN(lat) && !isNaN(long)) {
						let location = {
							type: 'Point',
							coordinates: [long,lat]
						}
						upData.location = location;
					}

					if (instaId && instaToken) {
						upData.instaId = instaId;
						upData.instaToken = instaToken;
					}

					if (spotifyId) {
						upData.spotifyId = spotifyId;
					}

					if (snapchatId) {
						upData.snapchatId = snapchatId;
					}

					let additionalInfo = userDetails.additionalInfo ? userDetails.additionalInfo: {};
					if (height) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.height = height;
					}

					if (showDistance) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.showDistance = showDistance;
					}

					if (income) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.income = income;
					}
					if (occupation) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.occupation = occupation;
					}
					if (haveChildren) { 
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.haveChildren = haveChildren;
					}
					
					if (howManyChls) { 
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.howManyChls = howManyChls;
					}
					
					if (wantChildren) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.wantChildren = wantChildren;
					}
					if (connections) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}

						if (typeof connections == 'string') {
							connections = connections.split(',');
							if (connections.length) {
								connections = connections.map(data => data.trim());
							}
						}

						upData.additionalInfo.connections = connections;
					}

					if (race) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.race = race;
					}

					if (bodyType) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.bodyType = bodyType;
					}

					if (religion) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.religion = religion;
					}

					if (educationLevel) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.educationLevel = educationLevel;
					}
					if (home) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.home = home;
					}

					if (ethnicity) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.ethnicity = ethnicity;
					}

					if (aboutMeTitle && aboutMeAns) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.aboutMe = {
							title: aboutMeTitle,
							ans: aboutMeAns
						};
					}

					if (momentsTitle && momentsAns) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.moments = {
							title: momentsTitle,
							ans: momentsAns
						};
					}

					if (traitsTitle && traitsAns) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.traits = {
							title: traitsTitle,
							ans: traitsAns
						};
					}

					if (aspirationsTitle && aspirationsAns) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.aspirations = {
							title: aspirationsTitle,
							ans: aspirationsAns
						};
					}

					if (needsTitle && needsAns) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.needs = {
							title: needsTitle,
							ans: needsAns
						};
					}

					if (secretsTitle && secretsAns) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.secrets = {
							title: secretsTitle,
							ans: secretsAns
						};
					}

					if (hobbiesTitle && hobbiesAns) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.hobbies = {
							title: hobbiesTitle,
							ans: hobbiesAns
						};
					}

					if (whatYouSayTitle && whatYouSayAns) {
						if (!upData.additionalInfo) {
							upData.additionalInfo = additionalInfo;
						}
						upData.additionalInfo.whatYouSay = {
							title: whatYouSayTitle,
							ans: whatYouSayAns
						};
					}

					// [ New ]
					if(!upData.additionalInfo && !userDetails.additionalInfo ){
						upData.additionalInfo = {};
					}

					let idealInfo = userDetails.idealInfo ? userDetails.idealInfo : {};

					if (idealConnections) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						if (typeof idealConnections == 'string') {
							idealConnections = idealConnections.split(',');
							if (idealConnections.length) {
								idealConnections = idealConnections.map(data => data.trim());
							}
						}
						upData.idealInfo.connections = (idealConnections.length) ?  idealConnections: [];
					}

					if (idealRelationshipStatus) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.relationshipStatus = idealRelationshipStatus;
					}
					if (idealGender) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.gender = idealGender;
					}
					if (idealMinAge) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.minAge = idealMinAge ? parseInt(idealMinAge) : 0;
					}
					if (idealMaxAge) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.maxAge = idealMaxAge ? parseInt(idealMaxAge) : 0;
					}
					if (idealMaxDistance) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.maxDistance = idealMaxDistance ? parseFloat(idealMaxDistance) : parseFloat(settings.maxDistance);
					}
					if (idealRace) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.race = idealRace;
					}
					if (idealSexualOrientation) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.sexualOrientation = idealSexualOrientation;
					}
					if (idealReligion) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.religion = idealReligion;
					}
					if (idealBodyType) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.bodyType = idealBodyType;
					}
					if (idealOccupation) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}						
						upData.idealInfo.occupation = idealOccupation;
					}
					if (idealHaveChildren) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.haveChildren = idealHaveChildren;
					}
					
					if (idealWantChildren) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.wantChildren = idealWantChildren;
					}

					if (idealEducationLevel) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.educationLevel = idealEducationLevel;
					}
					if (idealHome) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.home = idealHome;
					}	
					if (idealEthnicity) {
						if (!upData.idealInfo) {
							upData.idealInfo = idealInfo;
						}
						upData.idealInfo.ethnicity = idealEthnicity;
					}
					
					// [ New ]
					if(!upData.idealInfo && !userDetails.idealInfo ){
						upData.idealInfo = {};
					}
					
					let check = await model.User.updateOne({_id: userId},upData);
					helper.updateTrustScore(model, userDetails._id);
					let userDetails1 = await model.User.findOne({_id: userId});
					if (userDetails1) {
						successMessage.message = "Profile updated successfully";
						successMessage.data = userDetails1;
						res.send(successMessage);
					} else {
						failedMessage.message = "Something went wrong";
						res.send(failedMessage);
					}
				} else {
					failedMessage.message = "User not exists";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "UserId is invalid";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('editProfile::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went Wrong";
			res.send(failedMessage);
		}
	}

	// module.uploadMedia = async (req, res) => {
	// 	var successMessage = { status: 'success', message:"", data:{}};
	// 	var failedMessage = { status: 'fail', message:"", data:{}};
	// 	try {			
	// 		console.log('uploadMedia---------------->>>>>>req.files: ',req.files,' req.body: ',req.body);
	// 		if (req.files && req.files.media) {
	// 			var userId = req.body.userId;
	// 			var token = req.headers.token;
	// 			var type = req.body.type;
	// 			var isLive = req.body.isLive;
	// 			var isProfile = req.body.isProfile;
	// 			var userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user',loginToken: token});
	// 			if (userDetails) {
	// 				if (!userDetails.isActive) {
	// 					failedMessage.message = "You have been blocked by admin";
	// 					return res.send(failedMessage);
	// 				}

					
	// 				let image = req.files.media;

	// 				if (image) {
	// 					if (!Array.isArray(image)) {
	//  						image = [image];
	// 					} else {
	// 						if (image.length == 0) {
	// 							failedMessage.message = "Please upload media";
	// 							return res.send(failedMessage);
	// 						}
	// 					}
	// 				} else {
	// 					failedMessage.message = "Please upload media";
	// 					return res.send(failedMessage);
	// 				}

	// 				if (image.length > 6) {
	// 					failedMessage.message = "You cannot upload more than 6 media at a time";
	// 					return res.send(failedMessage);
	// 				}

					
	// 				if (type == 'document') {
	// 					let tmpNum = helper.randomNumber(4);
	// 					let datetime = dateFormat(new Date(), 'yyyymmddHHMMss');
	// 					let mediaName = datetime+tmpNum+'.jpg';
	// 					let mediaPath = '';
	// 					let upData = {updatedAt: new Date(), visibleInPrivacy: false, deletedBy: "", deleteReason: ''};

	// 					if (image && image.length > 1) {
	// 						failedMessage.message = "You must upload only one image for document";
	// 						return res.send(failedMessage);
	// 					}

	// 					upData.status = 'pending';
	// 					upData.isLive = false;
	// 					upData.sortOrder = 0;
	// 					mediaPath = 'upload/documents/'+mediaName;
	// 					successMessage.message = "Documents uploaded successfully";

	// 					var dob = userDetails.dob;
	// 					var stripeData = {
	// 		                userId: userId,
	// 		                email: userDetails.email,
	// 		                individual: {
	// 		                    first_name: userDetails.username,
	// 		                    // address: {
	// 		                    //     country: "GB",
	// 		                    // },
	// 		                    "dob": {
	// 		                        "day": dob.getDate(),
	// 		                        "month": dob.getMonth()+1,
	// 		                        "year": dob.getFullYear()
	// 		                    },
	// 		                },
	// 		                remoteAddress: req.connection.remoteAddress
	// 		            }
	// 		            if (userDetails.phno) {
	// 		            	stripeData.individual.phone = userDetails.phno;
	// 		            }
			            
	// 		            var stripeError = false ;
	// 	            	var stripeMsg = "" ;
	// 	            	console.log('uploadMedia---------------->>>userDetails.stripeAccountId: ',userDetails.stripeAccountId);
	// 	            	if (userDetails.stripeAccountId) {	                
	// 		                stripeData.stripeAccountId = userDetails.stripeAccountId;
			                
	// 		                let response = await stripeHelper.updateAccount(stripeData);

	// 	                    console.log("uploadMedia--------11111--------->>>>> response", response);
	// 	                    if (response.status == 'fail') {
	// 	                        stripeError = true;
	// 	                        stripeMsg = response.message;
	// 	                    }
	// 		            } else {
	// 		                let response = await stripeHelper.createAccount(model,stripeData);
	// 	                	console.log('uploadMedia---------->>>response: ',response);
	// 	                    if (response.status == 'fail') {
	// 	                        stripeError = true;
	// 	                        stripeMsg = response.message;
	// 	                    }
	// 		            }

	// 		            if (stripeError) {
	// 		            	failedMessage.message = stripeMsg;
	// 		            	return res.send(failedMessage);
	// 		            }

	// 		            let mediaFullPath = './public/'+mediaPath;
	// 					let uploadResp = await image[0].mv(mediaFullPath);

	// 					upData.path = mediaPath;
	// 					upData.type = type;

	// 					let response2 = await stripeHelper.uploadDoc({path:mediaFullPath,"name":mediaName});
 
	// 					if(response2.status == 'success'){
 //                            upData.fileId = response2.data.id;
 //                        } else {
 //                        	stripeError = true;
 //                        	stripeMsg = response2.message;
 //                        }
 //                        if (stripeError) {
	// 		            	failedMessage.message = stripeMsg;
	// 		            	return res.send(failedMessage);
	// 		            }

	// 		            let oldPath = '';
	// 		            let userMedia = await model.Photo.findOne({userId: userDetails._id, isDeleted: false, type: 'document'});
	// 		            if (userMedia) {
	// 		            	oldPath = userMedia.path;
	// 		            }


	// 		            if (oldPath != '') {
	// 						fs.unlink('./public/'+oldPath, function(err) {
	// 							if (err) {
	// 								console.log('uploadMedia::::::>>>>Error: ',err);
	// 							}
	// 						});
	// 					}
	// 					upData.$setOnInsert = {createdAt: new Date(), userId: userDetails._id};
	// 					await model.Photo.findOneAndUpdate({userId: userDetails._id, isDeleted: false, type:'document'},upData, {upsert: true,new: true});

	// 					// userMedia = await model.Photo.findOne({userId: userDetails._id, isDeleted: false, type: 'document'});
	// 				} else if (type != 'document' && isProfile == 1) {
	// 					let tmpNum = helper.randomNumber(4);
	// 					let datetime = dateFormat(new Date(), 'yyyymmddHHMMss');
	// 					let mediaName = datetime+tmpNum+'.jpg';
	// 					let mediaPath = '';
	// 					let upData = {updatedAt: new Date(), visibleInPrivacy: true, deletedBy: '', deleteReason: ''};

	// 					upData.status = 'approved';
	// 					upData.isLive = (isLive == '1' && isLive == 1) ? true : false;
	// 					let sortOrder = 1;

	// 					if (image && image.length > 1) {
	// 						failedMessage.message = "You must only upload one profile image";
	// 						return res.send(failedMessage);
	// 					}

	// 					let fileType = image[0].mimetype.split('/')[0];

	// 					type = fileType == 'image' ? 'photo' : fileType;


	// 					upData.sortOrder = sortOrder;
	// 					if (type == 'photo') {
	// 						successMessage.message = "Photo uploaded successfully";
	// 					} else if (type == 'video'){
	// 						mediaName = datetime+tmpNum+'.mp4';
	// 						successMessage.message = "Video uploaded successfully";
	// 					} else {
	// 						failedMessage.message = "Media format not supported";
	// 						return res.send(failedMessage);
	// 					}
	// 					mediaPath = 'upload/photos/'+mediaName;

	// 					let mediaFullPath = './public/'+mediaPath;
	// 					let uploadResp = await image[0].mv(mediaFullPath);

	// 					upData.path = mediaPath;
	// 					upData.type = type;


	// 					console.log('uploadMedia------if----->>>> ');
	// 					let userMedia = await model.Photo.find({userId: userDetails._id, isDeleted: false, type: {$ne: 'document'}, status: {$ne: 'rejected'}}).sort({sortOrder:1}).limit(1);
	// 					console.log('uploadMedia------if----->>>> userMedia: ',userMedia);
	// 					let upPhoto = null;
	// 					if (userMedia && userMedia.length) {
	// 						userMedia = userMedia[0];
	// 						if (userMedia.path != 'upload/photos/defaultUser.png') {
	// 							fs.unlink('./public/'+userMedia.path, function(err) {
	// 								if (err) {
	// 									console.log('uploadMedia::::::>>>>Error: ',err);
	// 								}
	// 							});
	// 						}
							
	// 						upPhoto = await model.Photo.findOneAndUpdate({_id: userMedia._id},upData, {new: true});
	// 					} else {
	// 						upData.userId = userDetails._id;
	// 						upPhoto = await model.Photo.create(upData);
	// 					}
	// 					if (upPhoto) {
	// 						await model.User.updateOne({_id: userDetails._id},{profilePic: upPhoto.path});
	// 						if (req.session.userData) {
	// 							req.session.userData.profilePic = upPhoto.path;
	// 						}
	// 					}
	// 				} else {
	// 					console.log('uploadMedia------else----->>>> ');
						
	// 					let sortOrder = 1;

	// 					if (isProfile != 1) {

	// 						let mediaCount = await model.Photo.countDocuments({userId: userDetails._id, type: {$in: ['photo','video']}, status: {$ne: 'rejected'}, isDeleted: false});
	// 						if (mediaCount) {
	// 							sortOrder = mediaCount + 1;
	// 						}
	// 					}

	// 					let tmp = [];
	// 					for (let i = 0; i < image.length; i++) {
	// 						let upData = {updatedAt: new Date()};
	// 						upData.status = 'approved';
	// 						upData.isLive = (isLive == '1' && isLive == 1) ? true : false;

	// 						let tmpNum = helper.randomNumber(4);
	// 						let datetime = dateFormat(new Date(), 'yyyymmddHHMMss');
	// 						let mediaName = datetime+tmpNum+'.jpg';
	// 						let mediaPath = '';

	// 						let fileType = image[i].mimetype.split('/')[0];
	// 						type = fileType == 'image' ? 'photo': fileType;

	// 						upData.sortOrder = sortOrder;
	// 						if (type == 'photo') {
	// 							successMessage.message = "Photo uploaded successfully";
	// 						} else if (type == 'video'){
	// 							mediaName = datetime+tmpNum+'.mp4';
	// 							successMessage.message = "Video uploaded successfully";
	// 						} else {
	// 							failedMessage.message = "Media format not supported";
	// 							return res.send(failedMessage);
	// 						}
	// 						mediaPath = 'upload/photos/'+mediaName;

	// 						let mediaFullPath = './public/'+mediaPath;
	// 						let uploadResp = await image[i].mv(mediaFullPath);

	// 						upData.path = mediaPath;
	// 						upData.type = type;

	// 						upData.userId = userDetails._id;
	// 						tmp.push(upData);
	// 						sortOrder++;
	// 					}
	// 					console.log('uploadMedia---------->>>>tmp: ',tmp);
	// 					await model.Photo.insertMany(tmp);
	// 					let profilePic = await model.Photo.find({userId: userDetails._id, type: {$in:['photo','video']}, isDeleted: false, status: {$ne:'rejected'}},{path:1}).sort({sortOrder:1}).limit(1);
	// 					if (profilePic && profilePic.length && isProfile == 1) {
	// 						await model.User.updateOne({_id: userDetails._id},{profilePic: profilePic[0].path});

	// 						if (req.session.userData) {
	// 							req.session.userData.profilePic = profilePic[0].path;
	// 						}
	// 					}
	// 				}
					
					
	// 				helper.updateTrustScore(model, userDetails._id);
	// 				res.send(successMessage);
	// 			} else {
	// 				failedMessage.message = "User data not found";
	// 				res.status(401).send(failedMessage);
	// 			}
	// 		} else {
	// 			failedMessage.message = "Please upload media file";
	// 			return res.send(failedMessage);
	// 		}
	// 	} catch(e) {
	// 		console.log('uploadMedia:::::::::::::>>>e: ',e);
	// 		failedMessage.message = "Something went wrong";
	// 		res.send(failedMessage);
	// 	}
	// }

	module.uploadMedia = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {			
			console.log('uploadMedia---------------->>>>>>req.files: ',req.files,' req.body: ',req.body);
			if (req.files && req.files.media) {
				var userId = req.body.userId;
				var token = req.headers.token;
				var type = req.body.type;
				var isLive = req.body.isLive;
				var isProfile = req.body.isProfile;
				var userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user',loginToken: token});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}

					
					let image = req.files.media;

					if (image) {
						if (!Array.isArray(image)) {
	 						image = [image];
						} else {
							if (image.length == 0) {
								failedMessage.message = "Please upload media";
								return res.send(failedMessage);
							}
						}
					} else {
						failedMessage.message = "Please upload media";
						return res.send(failedMessage);
					}

					if (image.length > 6) {
						failedMessage.message = "You cannot upload more than 6 media at a time";
						return res.send(failedMessage);
					}

					
					if (type == 'document') {
						let tmpNum = helper.randomNumber(4);
						let datetime = dateFormat(new Date(), 'yyyymmddHHMMss');
						let mediaName = datetime+tmpNum+'.jpg';
						let mediaPath = '';
						let upData = {updatedAt: new Date(), visibleInPrivacy: false, deletedBy: "", deleteReason: ''};

						if (image && image.length > 1) {
							failedMessage.message = "You must upload only one image for document";
							return res.send(failedMessage);
						}

						upData.status = 'pending';
						upData.isLive = false;
						upData.sortOrder = 0;
						mediaPath = 'upload/documents/'+mediaName;
						successMessage.message = "Documents uploaded successfully";

						var dob = userDetails.dob;
						/* var stripeData = {
			                userId: userId,
			                email: userDetails.email,
			                individual: {
			                    first_name: userDetails.username,
			                    // address: {
			                    //     country: "GB",
			                    // },
			                    "dob": {
			                        "day": dob.getDate(),
			                        "month": dob.getMonth()+1,
			                        "year": dob.getFullYear()
			                    },
			                },
			                remoteAddress: req.connection.remoteAddress
			            }
			            if (userDetails.phno) {
			            	stripeData.individual.phone = userDetails.phno;
			            }
			            
			            var stripeError = false ;
		            	var stripeMsg = "" ;
		            	console.log('uploadMedia---------------->>>userDetails.stripeAccountId: ',userDetails.stripeAccountId);
		            	if (userDetails.stripeAccountId) {	                
			                stripeData.stripeAccountId = userDetails.stripeAccountId;
			                
			                let response = await stripeHelper.updateAccount(stripeData);

		                    console.log("uploadMedia--------11111--------->>>>> response", response);
		                    if (response.status == 'fail') {
		                        stripeError = true;
		                        stripeMsg = response.message;
		                    }
			            } else {
			                let response = await stripeHelper.createAccount(model,stripeData);
		                	console.log('uploadMedia---------->>>response: ',response);
		                    if (response.status == 'fail') {
		                        stripeError = true;
		                        stripeMsg = response.message;
		                    }
			            }

			            if (stripeError) {
			            	failedMessage.message = stripeMsg;
			            	return res.send(failedMessage);
			            } */

			            let mediaFullPath = './public/'+mediaPath;
						let uploadResp = await image[0].mv(mediaFullPath);

						upData.path = mediaPath;
						upData.type = type;

						/* let response2 = await stripeHelper.uploadDoc({path:mediaFullPath,"name":mediaName});
 
						if(response2.status == 'success'){
                            upData.fileId = response2.data.id;
                        } else {
                        	stripeError = true;
                        	stripeMsg = response2.message;
                        }
                        if (stripeError) {
			            	failedMessage.message = stripeMsg;
			            	return res.send(failedMessage);
			            } */

			            let oldPath = '';
			            let userMedia = await model.Photo.findOne({userId: userDetails._id, isDeleted: false, type: 'document'});
			            if (userMedia) {
			            	oldPath = userMedia.path;
			            }


			            if (oldPath != '') {
							fs.unlink('./public/'+oldPath, function(err) {
								if (err) {
									console.log('uploadMedia::::::>>>>Error: ',err);
								}
							});
						}
						upData.$setOnInsert = {createdAt: new Date(), userId: userDetails._id};
						await model.Photo.findOneAndUpdate({userId: userDetails._id, isDeleted: false, type:'document'},upData, {upsert: true,new: true});

						// userMedia = await model.Photo.findOne({userId: userDetails._id, isDeleted: false, type: 'document'});
					} else if (type != 'document' && isProfile == 1) {
						let tmpNum = helper.randomNumber(4);
						let datetime = dateFormat(new Date(), 'yyyymmddHHMMss');
						let mediaName = datetime+tmpNum+'.jpg';
						let mediaPath = '';
						let upData = {updatedAt: new Date(), visibleInPrivacy: true, deletedBy: '', deleteReason: ''};

						upData.status = 'approved';
						upData.isLive = (isLive == '1' && isLive == 1) ? true : false;
						let sortOrder = 1;

						if (image && image.length > 1) {
							failedMessage.message = "You must only upload one profile image";
							return res.send(failedMessage);
						}

						let fileType = image[0].mimetype.split('/')[0];

						type = fileType == 'image' ? 'photo' : fileType;


						upData.sortOrder = sortOrder;
						if (type == 'photo') {
							successMessage.message = "Photo uploaded successfully";
						} else if (type == 'video'){
							mediaName = datetime+tmpNum+'.mp4';
							successMessage.message = "Video uploaded successfully";
						} else {
							failedMessage.message = "Media format not supported";
							return res.send(failedMessage);
						}
						mediaPath = 'upload/photos/'+mediaName;

						let mediaFullPath = './public/'+mediaPath;
						let uploadResp = await image[0].mv(mediaFullPath);

						upData.path = mediaPath;
						upData.type = type;


						console.log('uploadMedia------if----->>>> ');
						let userMedia = await model.Photo.find({userId: userDetails._id, isDeleted: false, type: {$ne: 'document'}, status: {$ne: 'rejected'}}).sort({sortOrder:1}).limit(1);
						console.log('uploadMedia------if----->>>> userMedia: ',userMedia);
						let upPhoto = null;
						if (userMedia && userMedia.length) {
							userMedia = userMedia[0];
							if (userMedia.path != 'upload/photos/defaultUser.png') {
								fs.unlink('./public/'+userMedia.path, function(err) {
									if (err) {
										console.log('uploadMedia::::::>>>>Error: ',err);
									}
								});
							}
							
							upPhoto = await model.Photo.findOneAndUpdate({_id: userMedia._id},upData, {new: true});
						} else {
							upData.userId = userDetails._id;
							upPhoto = await model.Photo.create(upData);
						}
						if (upPhoto) {
							await model.User.updateOne({_id: userDetails._id},{profilePic: upPhoto.path});
							if (req.session.userData) {
								req.session.userData.profilePic = upPhoto.path;
							}
						}
					} else {
						console.log('uploadMedia------else----->>>> ');
						
						let sortOrder = 1;

						if (isProfile != 1) {

							let mediaCount = await model.Photo.countDocuments({userId: userDetails._id, type: {$in: ['photo','video']}, status: {$ne: 'rejected'}, isDeleted: false});
							if (mediaCount) {
								sortOrder = mediaCount + 1;
							}
						}

						let tmp = [];
						for (let i = 0; i < image.length; i++) {
							let upData = {updatedAt: new Date()};
							upData.status = 'approved';
							upData.isLive = (isLive == '1' && isLive == 1) ? true : false;

							let tmpNum = helper.randomNumber(4);
							let datetime = dateFormat(new Date(), 'yyyymmddHHMMss');
							let mediaName = datetime+tmpNum+'.jpg';
							let mediaPath = '';

							let fileType = image[i].mimetype.split('/')[0];
							type = fileType == 'image' ? 'photo': fileType;

							upData.sortOrder = sortOrder;
							if (type == 'photo') {
								successMessage.message = "Photo uploaded successfully";
							} else if (type == 'video'){
								mediaName = datetime+tmpNum+'.mp4';
								successMessage.message = "Video uploaded successfully";
							} else {
								failedMessage.message = "Media format not supported";
								return res.send(failedMessage);
							}
							mediaPath = 'upload/photos/'+mediaName;

							let mediaFullPath = './public/'+mediaPath;
							let uploadResp = await image[i].mv(mediaFullPath);

							upData.path = mediaPath;
							upData.type = type;

							upData.userId = userDetails._id;
							tmp.push(upData);
							sortOrder++;
						}
						console.log('uploadMedia---------->>>>tmp: ',tmp);
						await model.Photo.insertMany(tmp);
						
						let profilePic = await model.Photo.find({userId: userDetails._id, type: {$in:['photo','video']}, isDeleted: false, status: {$ne:'rejected'}},{path:1}).sort({sortOrder:1}).limit(1);
						
						console.log('profilePic---------->>>>tmp: ',profilePic);
						
						if (profilePic && profilePic.length && isProfile == 1) {
							await model.User.updateOne({_id: userDetails._id},{profilePic: profilePic[0].path});

							if (req.session.userData) {
								req.session.userData.profilePic = profilePic[0].path;
							}
						}
					}
					
					
					helper.updateTrustScore(model, userDetails._id);
					res.send(successMessage);
				} else {
					failedMessage.message = "User data not found";
					res.status(401).send(failedMessage);
				}
			} else {
				failedMessage.message = "Please upload media file";
				return res.send(failedMessage);
			}
		} catch(e) {
			console.log('uploadMedia:::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}


	module.deleteMedia = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
			var mediaId = req.body.mediaId;
			var token = req.headers.token;
			
			var userDetails = await model.User.findOne({_id: userId, loginToken: token, role: 'user', isDeleted: false});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				let upData = {updatedAt: new Date()};
				let mediaData = await model.Photo.findOne({_id: mediaId, isDeleted: false, status: {$ne: 'rejected'}});
				if (mediaData) {
					let type = mediaData.type;
					let sortOrder = mediaData.sortOrder;
					upData.isDeleted = true;
					upData.deletedBy = 'user';
					await model.Photo.updateOne({_id: mediaData._id},upData);

					if (type == 'photo' || type == 'video') {
						await model.Photo.updateMany({userId: userDetails._id, isDeleted: false, type: {$in:['photo','video']}, sortOrder:{$gt: sortOrder},status: {$ne: 'rejected'}},{$inc:{sortOrder:-1}});
					}
					let imgPath = 'upload/photos/defaultUser.png';
					let profilePic = await model.Photo.find({userId: userDetails._id, type: {$in:['photo','video']}, isDeleted: false, status: {$ne:'rejected'}},{path:1}).sort({sortOrder:1}).limit(1);
					if (profilePic && profilePic.length) {
						imgPath = profilePic[0].path;
					}

					if (type == 'photo' || type == 'video') {
						await model.User.updateOne({_id: userDetails._id},{profilePic: imgPath});
						if (req.session.userData) {
							req.session.userData.profilePic = imgPath;
						}
					}

					helper.updateTrustScore(model, userDetails._id);
					successMessage.message = "Media deleted successfully";
					res.send(successMessage);
				} else {
					failedMessage.message = "File not exists";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User data not found";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('deleteMedia::::::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong! Please try again later";
			res.send(failedMessage);
		}
	}

	module.sortMedia = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var userId = req.body.userId;
			var mediaIds = req.body.mediaIds;
			var token = req.headers.token;
			var userDetails = await model.User.findOne({_id: userId, isDeleted: false, loginToken: token});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				if (typeof mediaIds == 'string') {
					mediaIds = mediaIds.split(',');
					if (mediaIds && mediaIds.length) {
						mediaIds = mediaIds.map(data => {
							if (data && data != '') {
								mongoose.Types.ObjectId(data.trim());
							}
							return data;
						});
					}
				}

				if (mediaIds && mediaIds.length) {

					let mediaCount1 = await model.Photo.countDocuments({userId: userId, isDeleted: false, type: {$in:['photo','video']}, status: {$ne: 'rejected'}});
					let mediaCount2 = await model.Photo.countDocuments({_id: {$in:mediaIds},userId: userId, isDeleted: false, type: {$in:['photo','video']}, status: {$ne: 'rejected'}})
					if (mediaCount1 != mediaCount2) {
						failedMessage.message = "Media length not matched with existing media length";
						return res.send(failedMessage);
					}
					let k = 1;
 					for(let i = 0; i < mediaIds.length; i++) {
 						let check = await model.Photo.updateOne({_id: mediaIds[i], type: {$in: ['photo','video']}, isDeleted: false },{sortOrder: k, updatedAt: new Date()});
 						if (check && (check.nModified || check.nModified)) {
 							k++;
 						}
 					}
 					let profilePic = await model.Photo.find({userId: userDetails._id, type: {$in:['photo','video']}, isDeleted: false, status: {$ne:'rejected'}},{path:1}).sort({sortOrder:1}).limit(1);
					if (profilePic && profilePic.length) {
						await model.User.updateOne({_id: userDetails._id},{profilePic: profilePic[0].path});
					}
 					successMessage.message = "Media sorted successfully";
 					res.send(successMessage);
				} else {
					failedMessage.message = "No media data found";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User data not found";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('sortMedia:::::::::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.commentPhoto = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			let photoId = req.body.photoId;
			let msg = req.body.msg;

			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user'});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				let photoDetails = await model.Photo.findOne({_id: photoId, isDeleted: false});
				if (photoDetails) {
					let newEntry = {
						userId: userDetails._id,
						photoId: photoDetails._id,
						msg: msg
					}
					await model.Comment.create(newEntry);
					successMessage.message = "Photo commented successfully";
					res.send(successMessage);
				} else {
					failedMessage.message = "Photo details not found";
					res.send(failedMessage);
				}
			} else {
				failedMessage.message = "User data not found";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('comment::::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong please try again later";
			res.send(failedMessage);
		}
	}

	// [ Email Checker ]
	module.emailChecker = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			var email = req.body.email;
			var userId = req.body.userId;
			var emailData = [];
			if (email) {
				emailData = await model.User.find({email: email, _id: { $ne: userId }});
			}
			if(emailData.length > 0){
				failedMessage.message = "This Email Already Used";
				failedMessage.data = {emailData: emailData};
				res.send(failedMessage);
			}
			else {
				successMessage.message = "Email Available";
				successMessage.data = {emailData: emailData};
				res.send(successMessage);
			}
		} catch (e) {
			console.log('emailChecker:::::::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	// module.getTestimonials = async (req, res) => {
	// 	var successMessage = { status: 'success', message:"", data:{}};
	// 	var failedMessage = { status: 'fail', message:"", data:{}};
	// 	try {
	// 		let userId = req.body.userId;
	// 		let token = req.headers.token;
	// 		let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role : 'user', loginToken: token},{isActive: 1});
	// 		if (userDetails) {
	// 			if (!userDetails.isActive) {
	// 				failedMessage.message = "You have been blocked by admin";
	// 				return res.send(failedMessage);
	// 			}

	// 			let dateIds = await model.Dates.distinct('_id',{$or: [{initUserId: userDetails._id},{initOppId: userDetails._id}]});
	// 			console.log("dateIds::::::",dateIds);

	// 			var query = [
	// 			    {
	// 		            $match: {
	// 			           	userId: {
	// 			           		$ne: userDetails._id
	// 			           	}, 
	// 			           	isDeleted: false, 
	// 			           	$or: [
	// 			           		{
	// 			           			type: 'website'
	// 			           		},{
	// 			           			type: 'date', 
	// 			           			dateId: {$in: dateIds}
	// 			           		}
	// 			           	]
	// 		        	}
	// 			    },
	// 			    {
	// 			        $lookup: {
	// 		                from: 'users',
	// 		                let: {userId: '$userId'},
	// 		                pipeline: [
	// 		                    {
	// 		                        $match: {
	// 	                                $expr: {
	// 	                                    $and: [
	// 	                                        {$eq: ['$_id','$$userId']},
	// 	                                        {$eq: ['$isDeleted',false]},
	// 	                                        {$eq: ['$isActive',true]},
	// 	                                        {$eq: ['$role','user']}
	// 	                                    ]
	// 	                                }
	// 		                        }
	// 		                    },
	// 		                    {
	// 	                            $project: {
	//                                     username: 1,
	//                                     profilePic:1
	// 	                            }
	// 		                    }
	// 		                ],
	// 		                as: 'userData'
	// 			        }
	// 			    },
	// 			    {$unwind: '$userData'},
	// 			    {
	// 		            $project: {
	// 		                username: '$userData.username',
	// 		                profilePic: '$userData.profilePic',
	// 		                text:1,
	// 		                type: 1,
	// 		                createdAt: 1
	// 		            }
	// 			    },
	// 			    {
	// 			        $sort: {
	// 			            createdAt: -1
	// 			        }
	// 			    }
	// 			]

	// 			let testimonialsData = await model.Testimonial.aggregate(query);
	// 			console.log("testimonialsData:::::",testimonialsData);
	// 			let obj = {
	// 				testimonials: testimonialsData
	// 			}

	// 			successMessage.message = "Testimonials loaded sucessfully";
	// 			successMessage.data = obj;
	// 			res.send(successMessage);
	// 		} else {
	// 			console.log('getTestimonials------>>>"user data not found"');
	// 			failedMessage.message = "Something went wrong";
	// 			res.send(failedMessage);
	// 		}
	// 	} catch (e) {
	// 		console.log('getTestimonials:::::::::::>>>e: ',e);
	// 		failedMessage.message = "Something went wrong";
	// 		res.send(failedMessage);
	// 	} 
	// }
	module.getTestimonials = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role : 'user', loginToken: token},{isActive: 1});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				let dateIds = await model.Dates.distinct('_id',{$or: [{initUserId: userDetails._id},{initOppId: userDetails._id}]});
				console.log("dateIds::::::",dateIds);

				// var query = [
				//     {
			 //            $match: {
				//            	userId: {
				//            		$ne: userDetails._id
				//            	}, 
				//            	isDeleted: false, 
				//            	$or: [
				//            		{
				//            			type: 'website'
				//            		},{
				//            			type: 'date', 
				//            			dateId: {$in: dateIds}
				//            		}
				//            	]
			 //        	}
				//     },
				//     {
				//         $lookup: {
			 //                from: 'users',
			 //                let: {userId: '$userId'},
			 //                pipeline: [
			 //                    {
			 //                        $match: {
		  //                               $expr: {
		  //                                   $and: [
		  //                                       {$eq: ['$_id','$$userId']},
		  //                                       {$eq: ['$isDeleted',false]},
		  //                                       {$eq: ['$isActive',true]},
		  //                                       {$eq: ['$role','user']}
		  //                                   ]
		  //                               }
			 //                        }
			 //                    },
			 //                    {
		  //                           $project: {
	   //                                  username: 1,
	   //                                  profilePic:1
		  //                           }
			 //                    }
			 //                ],
			 //                as: 'userData'
				//         }
				//     },
				//     {$unwind: '$userData'},
				//     {
			 //            $project: {
			 //                username: '$userData.username',
			 //                profilePic: '$userData.profilePic',
			 //                text:1,
			 //                type: 1,
			 //                createdAt: 1
			 //            }
				//     },
				//     {
				//         $sort: {
				//             createdAt: -1
				//         }
				//     }
				// ]

				//let testimonialsData = await model.Testimonial.aggregate(query);

				// var query = [{

				// 	 $lookup: {
			 //                from: 'users',
			 //                let: {userId: '$userId'},
			 //                pipeline: [
			 //                    {
			 //                        $match: {
		                                
		  //                                   $and: [
		  //                                       {$eq: ['$_id','$$userId']},
		  //                                       {$eq: ['$isDeleted',false]},
		  //                                       {$eq: ['$isActive',true]},
		  //                                       {$eq: ['$role','user']}
		  //                                   ]
		  //                               }
			                        
			 //                    }]
			 //                }

				// }]

				// var query = [{
				// 		$lookup:{
				// 			from :user,
				// 			let: {userId: '$userId'},

				// 	  }
					

				// }]



				// aggregate([

				// 	      {
				// 	      	$lookup:{ 
				// 	      		from: 'user', localField:'userId', 
				// 	        foreignField:'_id',as:'userData'}},
				// 	]).exec((err, result)=>{
				// 	      if (err) {
				// 	          console.log("error" ,err)
				// 	      }
				// 	      if (result) {
				// 	          console.log(result);
				// 	      }
				// 	});

				let testimonialsData = await model.Testimonial.aggregate([

					      {
					      	$lookup:{ 
					      		from: 'users', 
					      		localField:'userId', 
					            foreignField:'_id',as:'userData'

					        	// $pipeline : [{

					        	// 	$match:[{
					        	// 		$and:[
					        	// 		"$in":{
					        	// 			'isDeleted':'false'
					        	// 		}

					        	// 		]
					        	// 	}]
					        	// }]


					        }},
					]);

				console.log("testimonialsData:::::",testimonialsData);

				let countDocuments = await model.Testimonial.countDocuments(testimonialsData)
				console.log("countDocuments:::::",countDocuments);
				let obj = {
					testimonials: testimonialsData
				}

				successMessage.message = "Testimonials loaded sucessfully";
				successMessage.data = obj;
				res.send(successMessage);
			} else {
				console.log('getTestimonials------>>>"user data not found"');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('getTestimonials:::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		} 
	}


	module.setPrivacyMode = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let photoId = req.body.photoId;
			let token = req.headers.token;
			let isActive = req.body.isActive;

			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role : 'user', loginToken: token},{benefits:1,isActive: 1});
			console.log("setPrivacyMode userDetails:::",userDetails);
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}

				if(userDetails.benefits){
					if(userDetails.benefits.privacyMode == true){

						let photoDetails = await model.Photo.findOne({_id: photoId, isDeleted: false});
						if (photoDetails) {
							if(isActive == 'true'){
								isActive = true;
								successMessage.message = "Media updated to private.";
							} else {
								isActive = false;
								successMessage.message = "Media updated to visible.";
							}
							let entry = {
								visibleInPrivacy: isActive
							}
							await model.Photo.updateOne({_id: photoId},entry);
							res.send(successMessage);
						}  else {
							failedMessage.message = "Photo details not found";
							res.send(failedMessage);
						}
					} else {
						failedMessage.message = "Purchase a Plan with Privacy Mode";
						res.send(failedMessage);
					}
				} else {
					failedMessage.message = "Purchase a Plan with Privacy Mode";
					res.send(failedMessage);
				}

			} else {
				console.log('setPrivacyMode------>>>"user data not found"');
				failedMessage.message = "User data not found";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('setPrivacyMode:::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		} 
	}

	return module;
};