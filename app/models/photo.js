module.exports = function(mongoose, schema) {
	var photoSchema = new schema({
		path: { type: String, default: ''},
		userId: { type: schema.Types.ObjectId, default: null},
		type: {type: String, enum: ['document','photo','video'], default:'photo'},
		fileId: {type: String, default: ''}, // file id for stripe (for type = document only)
		status: { type: String, enum: ['pending','approved','rejected']},
		visibleInPrivacy: {type:Boolean, default: true}, //to show in privacy mode
		deletedBy: { type: String, enum: ['','user','admin'], default: ''},
		isDeleted: { type: Boolean, default: false},
		isLive: { type: Boolean, default: false}, // is live photo or not
		deleteReason: {type: String, default :''},
		sortOrder: { type: Number, default: 0},
		createdAt: { type: Date, default: new Date()},
		updatedAt: { type: Date, default: new Date()}
	},{collection: 'photos', versionKey: false});
	var Photo = mongoose.model('photos', photoSchema);
	return Photo; 
}