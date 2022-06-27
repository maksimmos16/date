module.exports = function(model){
	var module = {};

	// [ Login Socket Store ]
	module.loginSocket = async function(data, client, callback){
		console.log('loginSocket------------>>>data: ',data);
		console.log('loginSocket------------>>>client.id: ',client.id);
		try{			
			var userId = mongoose.Types.ObjectId(data.userId);
			let upData = await model.User.update({
				_id: userId
			},{
				socketId: client.id
			});
			if(upData){
				if(typeof callback == 'function'){
					return callback({'status':'success','message':'Socket Successfully Stored.',data:upData});
				}
			} else {
				await model.Chat.delete({where:{'id':chatMasterId}});
				if(typeof(callback) == 'function'){
					return callback({'status':'fail','message':'Something Want Wrong.',data:''});
				}
			}
		}
		catch(error){
			console.log('error: ',error);
			if(typeof(callback) == 'function'){
				return callback({'status':'fail','message':'Something Want Wrong. PLease Try Again.'});
			}
		}
	}

	return module;
};