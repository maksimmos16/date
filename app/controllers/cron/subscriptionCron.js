var request = require('request');
var CronJob = require('cron').CronJob;
var _ = require('underscore');
module.exports = function(model){

	new CronJob('0 * * * *', function() {
	    // every hour
		unsubscribe();	    
	}, null, true);
	async function unsubscribe() {
		console.log('cron >> unsubscribe----------->>>>'+new Date());
		try {	
			var mainQuery = [
			    {
		            $match: {
	                    isDeleted: false,
	                    isExpired: false
		            }
			    },
			    {
		            $group: {
	                    _id: '$userId',
	                    expireIds: {$push: {$cond: [{$lte: ['$expireAt',new Date()]},'$_id',null]}},
	                    active: {$push: {$cond: [{$gt: ['$expireAt',new Date()]},'$benefits',null]}}
		            }
			    },
			    {
		            $project: {
	                    _id:0,
	                    userId: '$_id',
	                    expireIds:{$setDifference: ['$expireIds',[null]]},
	                    active: {$setDifference: ['$active',[null]]}
	                }
			    }
			]

			let userSubData = await model.UserSubscription.aggregate(mainQuery);
			let expireIds = [];
			// console.log('unsubscribe--------------->>>>userSubData: ',userSubData);
			if (userSubData && userSubData.length) {
				for (let i = 0; i < userSubData.length; i++) {
					expireIds = expireIds.concat(userSubData[i].expireIds);
					let userId = userSubData[i].userId;
					let active = _.unique(_.flatten(userSubData[i].active));
					// console.log('unsubscribe------------>>>ative: ',active);
					let benefits = {};
					for (let j = 0; j < active.length; j++) {
						if (!benefits[active[j]]) {
							benefits[active[j]] = true;
						}
					}
					await model.User.updateOne({_id: userId}, {$set:{benefits: benefits}});
				}
				await model.UserSubscription.updateMany({_id: {$in: expireIds}},{$set:{isExpired:true}});
			}
		} catch(e){
			console.log('cron >> unsubscribe::::::::::::::>>>e: ',e);
		}
	}

	return module;
}