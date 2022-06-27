module.exports = function(mongoose,schema){	
	var blockSchema = new schema({
        senderId         : { type:schema.Types.ObjectId, default: null},
		receiverId       : { type:schema.Types.ObjectId, default: null},
		isBlocked        : { type : Boolean, default : false},
		isDeleted        : { type : Boolean, default : false},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false});
	var Block = mongoose.model('block', blockSchema);
	return Block;
}