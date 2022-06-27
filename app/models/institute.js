module.exports = function(mongoose, schema) {
	var instituteSchema = new schema({
		name: { type: String, default: ''},	
		instituteType: { type: String, enum: ['school','college','university','other'], default: 'other'},
		createdAt: { type: Date, default: new Date()},
		updatedAt: { type: Date, default: new Date()}
	},{collection:'institutes', versionKey: false});
	var Institute = mongoose.model('institutes',instituteSchema);
	return Institute; 
}