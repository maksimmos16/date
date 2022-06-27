module.exports = function(mongoose, schema) {
	var profileFieldsSchema = new schema({
		slug			: { type: String, default: ''},
		title			: { type: String, default: ''},
		options			: { type: Object, default: []},
		type			: { type: String, enum: ['basic','additional'], default: ''},
		isDeleted		: {type: Boolean, default: false},
		inIdealInfo		: { type: Boolean, default: false},
		createdAt		: { type : Date, default : new Date()},
		updatedAt		: { type : Date, default : new Date()}
	},{collection: 'profileFields', versionKey: false});
	var ProfileFields = mongoose.model('profileFields',profileFieldsSchema);
	return ProfileFields;
}