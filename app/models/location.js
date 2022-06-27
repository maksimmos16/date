module.exports = function(mongoose,schema){	
	var locationSchema = new schema({
		location     : { type : { type: String }, coordinates: [] },
		name         : { type: String, default: ''},
		description  : { type: String, default: ''},
		status		 : { type: Boolean, default: true},
        price		 : { type: Number, default: 0},
        isDeleted    : {type:Boolean, default:false},
		createdAt    : { type: Date, default: new Date()},
		updatedAt    : { type: Date, default: new Date()},
	},{collection: 'locations', versionKey: false});
	locationSchema.index({ "location": "2dsphere"});
	var Location = mongoose.model('locations', locationSchema);
	return Location;
}