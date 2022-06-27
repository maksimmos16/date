module.exports = function(mongoose,schema){	
	var reportSchema = new schema({
        senderId         : { type:schema.Types.ObjectId, default: null},
		receiverId       : { type:schema.Types.ObjectId, default: null},
		reportText       : { type: String, default: ''},
		isDeleted        : { type : Boolean, default : false},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false});
	var Report = mongoose.model('report', reportSchema);
	return Report;
}