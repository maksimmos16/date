module.exports = function(mongoose, schema) {
	var userDocumentsSchema = new schema({
		path: { type: String, default: ''},
		userId: { type: schema.Types.ObjectId, default: null},
		docType: { type: String, enum: ['passport','license'], default: 'license'},
		docId: {type: String, default: ''}, // for stripe
		status: { type: String, enum: ['pending','approved','rejected']},
		isDeleted: { type: Boolean, default: false},
		createdAt: { type: Date, default: new Date()},
		updatedAt: { type: Date, default: new Date()}
	}, {collection: 'userDocuments', versionKey: false});
	var Photo = mongoose.model('userDocuments', userDocumentsSchema);
	return Photo; 
}