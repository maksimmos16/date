module.exports = function(mongoose,schema){	
	var userNotificationSchema = new schema({
        senderId         : { type :schema.Types.ObjectId, default: null},
		receiverId       : { type :schema.Types.ObjectId, default: null},
		type             : { type : String, enum:['video', 'audio', 'date', 'offers', 'nearBy', 'feedback', 'remainder', 'onlineNotify', 'newMatches', 'superLike', 'like', 'message', 'newsUpdates', 'emoji' ], default: 'like' }, // [ Date, Offers, New Matches, SuperLike, Like, Message, News Updates, Emoji ]
		isRead           : { type : Boolean, default : false},
		text             : { type : String, default : null},
		contentId	     : { type : schema.Types.ObjectId , default : null}, //id for date: dateId, offer: offersId etc 
		matched          : { type : Boolean, default : false},
		isRequest		 : { type : Boolean, default: false },
		isDeleted        : { type : Boolean, default : false},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false, collection: 'userNotifications'});
	var userNotification = mongoose.model('userNotifications', userNotificationSchema);
	return userNotification;
}