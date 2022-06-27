module.exports = function(mongoose,schema){	
	var likeSchema = new schema({
        senderId         : { type:schema.Types.ObjectId, default: null},
		receiverId       : { type:schema.Types.ObjectId, default: null},
		type             : { type : String, default: 'like' },
		matched          : { type : Boolean, default : false},
		adminStatus		 : { type : Boolean, default : false},
		deleteReason     : { type: String, default :''},
		isDeleted        : { type : Boolean, default : false},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false});
	var Like = mongoose.model('like', likeSchema);
	return Like;
}