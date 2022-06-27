var request = require('request');
var JSONbig = require('json-bigint');
var request = require('request');

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

module.exports = function(model, config) {
	var module = {};

	module.authResp = async (req, res) => {

		console.log('authResp----------->>>>req.originalUrl: '+req.originalUrl+' req.query: ',req.query,' req.session.userData: ',req.session.userData,' req.body: ',req.body);

		let userId = req.session.userData ? req.session.userData.userId : null;
		let code = req.query.code;
		if (userId && code) {

			let options = {
				url: 'https://api.instagram.com/oauth/access_token',
				method: 'post',				
				formData: {
					client_id: config.instaClientId,
					client_secret: config.instaClientSecret,
					grant_type: 'authorization_code',
					redirect_uri: config.baseUrl+'instaCallback/',
					code: code
				}
			};
			console.log('authResp--------->>>>>options: ',options);			
			request(options, async function(err, resp, body) {
				console.log('authResp-----111------>>>>body: ',body);

				if (typeof body == 'string') {
					body = helper.IsJsonString(body) ? JSONbig.parse(body) : null;
				}
				console.log('authResp-----222------>>>>body: ',body);
				if (body) {
					let token = body.access_token; //short lived token
					let instaId = body.user_id.toString();
					console.log('authResp----------->>>instaId: ',instaId);
					let options1 = {
						url: 'https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret='+config.instaClientSecret+'&access_token='+token,
						method: 'get'
					}

					request(options1,async function(err1, resp1, body1){
						console.log('authResp----------->>>>>body1: ',body1);
						if (typeof body1 == 'string') {
							body1 = helper.IsJsonString(body1) ? JSON.parse(body1) : null;
						}
						if (body1) {
							token = body1.access_token; //long lived token
							var userDetails = await model.User.findOne({_id: userId, isDeleted: false});
							if (userDetails) {
								let check = await model.User.updateOne({_id: userDetails._id},{instaToken: token, instaId: instaId});
								if (check && check.nModified) {
									console.log('authResp----------->>>>>"user token updated"');
									helper.updateTrustScore(model, userDetails._id);
									res.send('<script>window.close();</script>');
								} else {
									console.log('authResp----------->>>>"token not updated" ');
									res.send('<script>window.close();</script>');
								}
							} else {
								console.log('authResp----------->>>>"user data not found" userId: ',userId);
								res.send('<script>window.close();</script>');
							}			
						} else {
							console.log('authResp----------->>>"body1 not found"');
						}
					});
				} else {
					console.log('authResp----------->>>"token not found"');
					res.send('<script>window.close();</script>');
				}
			});
		} else {
			console.log('authResp------------>>>>>"userId or code is invalid" userId: '+userId+' code: '+code);
			res.redirect('/');
		}
	}

	module.updateInstaTokenId = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try { 
			let userId = req.body.userId;
			let token = req.headers.token;
			let instaId = req.body.instaId;
			let instaToken = req.body.instaToken;

			let userDetails = await model.User.findOne({_id: userId, isDeleted: false, role: 'user'});
			if (userDetails) {
				if (!userDetails.isActive) {
					failedMessage.message = "You have been blocked by admin";
					return res.send(failedMessage);
				}	
				let check = await model.User.updateOne({_id: userDetails._id},{instaToken: instaToken, instaId: instaId});
				if (check && check.nModified) {
					successMessage.message = "User data updated successfully";
					res.send(successMessage);
				} else {
					console.log('updateInstaTokenId------------>>>>"user data not updated"');
					failedMessage.message = "user data not updated";
					res.send(failedMessage);
				}
				
			} else {
				console.log('updateInstaTokenId------------>>>>"user not found"');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('updateInstaTokenId::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.getAllInstaFeeds = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, role: 'user', isDeleted: false, loginToken: token});
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}	
					var query = [
					    {
					        $match: {
					            $or: [{senderId: userDetails._id},{receiverId: userDetails._id}],
					            matched: true,
					            isDeleted: false
					        }
					    },
					    {
					        $addFields: {oppId: {$cond: [{$eq: ['$senderId',userDetails._id]},'$receiverId','$senderId']}}
					    },
					    {
					        $lookup: {
					            from: 'users',
					            let: {oppId: '$oppId'},
					            pipeline: [
					                {
					                    $match: {
					                        $expr: {
					                            $and: [
				                                    {$eq: ['$_id','$$oppId']},
				                                    {$eq: ['$isDeleted',false]},
				                                    {$eq: ['$isActive',true]},
				                                    {$eq: ['$role','user']}
					                            ]
					                        }
					                    }
					                },
					                {
					                    $project:{
					                    	_id: 1,
						                    instaId: 1,
						                    country:1,
						                    state:1,
						                    city: 1,
						                    profilePic:1,
						                    username:1
					                    }
					                }
					            ],
					            as: 'oppData',
					        }
					    },
					    {
					        $unwind: '$oppData',
					    },
					    {
					        $lookup: {
					            from : 'instaFeeds',
					            let: {instaId: '$oppData.instaId'},
					            pipeline: [
					                {
					                    $match: {
					                        $expr: {
				                                $and: [
			                                        {$eq: ['$instaId','$$instaId']},
			                                        {$eq: ['$parentMediaId','']}
				                                ]
					                        }
					                    }
					                },
					                {
					                    $sort: {createdAt: -1},
					                },
					                {
					                    $limit: 1
					                },
					                {
					                    $project: {
					                        _id:0,
					                        mediaType:1,
					                        mediaUrl:1
					                    }
					                }
					            ],
					            as: 'instaData'
					        }
					    },
					    {
					        $unwind: '$instaData'
					    },
					    {
					        $project: {
				                userId: '$oppData._id',
				                userName: '$oppData.username',
				                profilePic: '$oppData.profilePic',
				                mediaType: '$instaData.mediaType',
				                mediaUrl: '$instaData.mediaUrl'
					        }
					    }
					];
					let instaFeeds = await model.Like.aggregate(query);
					successMessage.message = "Feeds loaded successfully";
					successMessage.data = {feeds: instaFeeds};
					res.send(successMessage);
				} else {
					console.log('getInstaFeeds---------->>>>"user data not found"');
					failedMessage.message = "User detail not found";
					res.send(failedMessage);
				}
			} else {
				console.log('getInstaFeeds---------->>>userId is invalid');
				failedMessage.message = "userId is invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('getInstaFeeds:::::::::::::>>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.getUserInstaFeeds = async (req, res) => {
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

				let oppDetails = await model.User.findOne({_id: oppId, isDeleted: false, role: 'user'},{instaId:1, username: 1, profilePic:1});
				if (oppDetails) {
					let instaId = oppDetails.instaId;
					let query = [
					    {
					        $match: {
					             instaId: instaId,
					             parentMediaId: ''
					        }
					    },
					    {
					        $lookup: {
					             from: 'instaFeeds',      
					             localField:'instaMediaId',
					             foreignField:'parentMediaId',
					             as: 'childMedia'
					        }
					    },
					    {
					        $sort: {createdAt:-1}
					    },
					    {
					        $project: {
				                createdAt:1,
				                mediaType: 1,
				                mediaUrl:1,
				                'childMedia.mediaType':1,
				                'childMedia.mediaUrl':1
					        }
					    }
					];
					let instaFeeds = await model.InstaFeed.aggregate(query);
					let obj = {
						_id: oppDetails._id,
						username: oppDetails.username,
						profilePic: oppDetails.profilePic,
						instaFeeds: instaFeeds
					}
					successMessage.message = "Feeds loaded successfully";
					successMessage.data = obj;
					res.send(successMessage);
				} else {
					console.log('getUserInstaFeeds-------->>>"Opp user not found"');
					failedMessage.message = "User not exists";
					res.send(failedMessage);
				}
			} else {
				console.log('getUserInstaFeeds------------>>>"user data not found"');
				failedMessage.message = "Something went wrong";
				res.send(failedMessage);
			}
		} catch (e) {
			console.log('getUserInstaFeeds:::::::::::>>>e: ',e);
			failedMessage.message = "Something went wrong";
			res.send(failedMessage);
		}
	}

	module.getSongs = async (req, res) => {
		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};
		try {
			let userId = req.body.userId;
			let token = req.headers.token;
			// console.log('body: ',req.body);
			if (userId) {
				let userDetails = await model.User.findOne({_id: userId, role: 'user', isDeleted: false, loginToken: token});
				// console.log('userData: ',userDetails);
				if (userDetails) {
					if (!userDetails.isActive) {
						failedMessage.message = "You have been blocked by admin";
						return res.send(failedMessage);
					}	

					spotifyApi.setAccessToken(userDetails.spotifyId);

					// [ Spotify ]
					let dt = spotifyApi.getNewReleases({ limit : 10, offset: 0, country: 'SE' })
					.then(async function(data) {
						let arr = [];
						
						console.log('data: ',data);

						let albmData = await spotifyHelper.getAlbum(model, data, spotifyApi, userDetails.spotifyId, userId);
						let tmpp = JSON.parse(albmData);
						console.log('tmpp: ',tmpp);
						console.log('tmpp.length: ',tmpp.length);

						console.log('\x1b[36m%s\x1b[0m','tmpp.tracks.items.length: ',tmpp.tracks.items.length);

						let tmpN = (tmpp.tracks.items.length > 10) ? 10 : tmpp.tracks.items.length;

						console.log('tmpN: ',tmpN);

						for (var i = 0; i < tmpN; i++) {

							let songData = await spotifyHelper.getSong(model, tmpp.tracks.items[i], spotifyApi, userDetails.spotifyId, userId);
							// console.log('\x1b[36m%s\x1b[0m','songData: ',songData);

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

						await model.User.updateOne({ _id: userId},{ spotifyTracks: arr });

						let songs = await model.User.findOne({_id: userId}).select(['spotifyTracks']);

						console.log('\x1b[36m%s\x1b[0m','songs: ',songs);

						successMessage.message = "Songs loaded successfully";
						successMessage.data = {songs: songs};
						res.send(successMessage);

					}).catch(function(err) {
						console.log("spotify Something went wrong!", err);
						failedMessage.message = "Unauthorized Token";
						res.send(failedMessage);
					});

				} else {
					console.log('getSongs---------->>>>"user data not found"');
					failedMessage.message = "User Detail Not Found";
					res.send(failedMessage);
				}
			} else {
				console.log('getInstaFeeds---------->>>userId is invalid');
				failedMessage.message = "UserId is Invalid";
				res.send(failedMessage);
			}
		} catch(e) {
			console.log('getSongs:::::::::::::>>>>e: ',e);
			failedMessage.message = "Something Went wrong";
			res.send(failedMessage);
		}
	}

	module.selectSong = async (req, res) => {

		var successMessage = { status: 'success', message:"", data:{}};
		var failedMessage = { status: 'fail', message:"", data:{}};

		let userId = req.body.userId;
		let songUrl = req.body.songUrl;
		if (userId && songUrl) {
			let ressData = await model.User.updateOne({_id: userId},{songUrl: songUrl});
			successMessage.message = "Song Selected Successfully";
			res.send(successMessage);

		} else {
			failedMessage.message = "UserId Or Song Url Not Passed";
			res.send(failedMessage);
		}
	}

	return module;
}