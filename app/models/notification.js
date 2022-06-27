module.exports = function(mongoose,schema){	
	var notificationSchema = new schema({
		fieldName        : { type : String, default : ''},
        description      : { type : String, default : ''},
        slug 	         : { type : String, default : ''},
        isActive	     : { type : Boolean, default: true },
		byDefault        : { type : Boolean, default: true },
		createdAt		 : { type : Date, default: new Date()},
		updatedAt		 : { type : Date, default : new Date()}
	},{versionKey: false, collection: 'notifications'});
	var Notification = mongoose.model('notifications', notificationSchema);
	return Notification;
}