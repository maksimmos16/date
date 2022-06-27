module.exports = function(mongoose, schema) {
	var userLogEventSchema = new schema({
        
        userId       : { type: schema.Types.ObjectId, default: null },
        isLogin      : { type : Boolean, default: true },
        
	},{versionKey: false, collection:'userLogEvent',strict: false, timestamps : { createdAt: 'created_at', updatedAt: 'updated_at' }});

	var userLogEvent = mongoose.model('userLogEvent', userLogEventSchema);

	return userLogEvent;
}