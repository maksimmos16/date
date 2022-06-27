module.exports = function(mongoose, schema) {
	var commentSchema = new schema({
		userId: { type: schema.Types.ObjectId, default: null},
		photoId: { type: schema.Types.ObjectId, default: null},
		msg: {type: String, default :''},
		isDeleted: { type: Boolean, default: false},
		createdAt: { type: Date, default: new Date()},
		updatedAt: { type: Date, default: new Date()}
	},{collection: 'comments', versionKey: false});
	var Comment = mongoose.model('comments', commentSchema);
	return Comment; 
}