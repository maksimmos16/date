module.exports = function(mongoose,schema){	
	var questionSchema = new schema({
		que        	   : { type : String, default : ''},
        ans        	   : { type : Array, default : []},
		quesType   	   : { type : String, enum:['primary','secondary', 'feedback'], default: 'secondary'},
		priorityNo 	   : { type : Number, default: 0},
		status     	   : { type : Boolean, default: false }, //is question active or not
		categoryName   : { type : String, default: ''},
		isDeleted  	   : { type : Boolean, default: false },
		createdAt  	   : { type : Date, default : new Date()},
		updatedAt  	   : { type : Date, default : new Date()}
	},{versionKey: false,collection: 'questions'});
	var Questions = mongoose.model('questions', questionSchema);
	return Questions;
}
