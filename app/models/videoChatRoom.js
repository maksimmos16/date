module.exports = function(mongoose,schema){	
	var videoChatRoom = new schema({
        fromId			 : { type : schema.Types.ObjectId, default:null},
        toId			 : { type : schema.Types.ObjectId, default: null},
        status			 : { type : String, default: ''}, // in-progress, completed
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{collection:'videoChatRooms',versionKey: false});
	var VideoChatRoom = mongoose.model('videoChatRooms', videoChatRoom);
	return VideoChatRoom;
}