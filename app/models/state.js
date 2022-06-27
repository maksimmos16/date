module.exports = function(mongoose, schema) {
	var stateSchema = new schema({
		name: { type: String, default: ''},
		countryId: { type: schema.Types.ObjectId, default: null},
		createdAt: { type: Date, default: new Date()},
		updatedAt: { type: Date, default: new Date()}
	},{collection:'states',versionKey: false});
	var State = mongoose.model('states', stateSchema);
	return State; 
}