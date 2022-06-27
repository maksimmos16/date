module.exports = function(mongoose, schema) {
	var citySchema = new schema({
		name: { type: String, default: ''},
		stateId: { type: schema.Types.ObjectId, default: null},
		createdAt: { type: Date, default: new Date()},
		updatedAt: { type: Date, default: new Date()}
	}, {collection: 'cities', versionKey: false});
	var City = mongoose.model('cities', citySchema);
	return City; 
}