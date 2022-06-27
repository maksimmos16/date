module.exports = function(mongoose, schema) {
	var dateAmenitiesSchema = new schema({
		dateId  		: { type: schema.Types.ObjectId, default: null},
		amenityId		: { type: schema.Types.ObjectId, default: null},
		createdAt  		: { type: Date, default: new Date()},
		updatedAt  		: { type: Date, default: new Date()}
	},{collection: 'dateAmenities', versionKey: false});
	var DateAmenities = mongoose.model('dateAmenities', dateAmenitiesSchema);
	return DateAmenities; 
}