module.exports = function(mongoose,schema){	
	var categorySchema = new schema({
		name		     : { type : String, default : ''},
		isDeleted        : { type : Boolean, default : false},
		createdAt		 : { type : Date, default : new Date()},
		updatedAt 	     : { type : Date, default : new Date()}
	},{versionKey: false, collection: 'category'});
	var Category = mongoose.model('category', categorySchema);
	return Category;
}