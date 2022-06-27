module.exports = function(mongoose, schema) {
	var countrySchema = new schema({
		name: { type: String, default: ''},
		countryCode: {type: String, default: ''},
		isoCode: { type: String, default: ''},
		createdAt: { type: Date, default: new Date()},
		updatedAt: { type: Date, default: new Date()}
	},{collection: 'countries', versionKey: false});
	var Country = mongoose.model('countries', countrySchema);
	return Country; 
}