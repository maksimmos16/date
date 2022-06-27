module.exports = function(mongoose,schema){	
	var chatSchema = new schema({
        senderId         : { type:schema.Types.ObjectId, default: null},
		receiverId       : { type:schema.Types.ObjectId, default: null},
		message          : { type : String, default: '' },
		msgType          : { type : String, enum: ['text', 'photo', 'heart'], default: 'text' },
		isRead           : { type : Boolean, default : false},
		isDeleted        : { type : Boolean, default : false},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false});
	var Chat = mongoose.model('chat', chatSchema);
	return Chat;
}