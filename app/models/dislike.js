module.exports = function(mongoose,schema){	
	var dislikeSchema = new schema({
        senderId         : { type:schema.Types.ObjectId, default: null},
		receiverId       : { type:schema.Types.ObjectId, default: null},
		type             : { type : String, default: 'dislike' },
		matched          : { type : Boolean, default : false},
		isDeleted        : { type : Boolean, default : false},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false});
	var DisLike = mongoose.model('dislike', dislikeSchema);
	return DisLike;
}