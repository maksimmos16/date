module.exports = function(mongoose,schema){	
	var feedbackSchema = new schema({
        dateId  		 : { type : schema.Types.ObjectId, default: null},
        userId			 : { type : schema.Types.ObjectId, default: null},
        queId			 : { type : schema.Types.ObjectId, default: null},
        ans				 : { type : String, default: ''},
        comment		     : { type : String, default: ''},
        isDeleted        : { type : Boolean, default: false},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false, collection: 'feedbacks'});
	var Feedback = mongoose.model('feedbacks', feedbackSchema);
	return Feedback;
}