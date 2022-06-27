module.exports = function(mongoose,schema){	
	var instaFeedsSchema = new schema({
        instaId: {type: String, default: ''},        
        instaUsername: { type: String, default:''},
        instaMediaId: {type: String, default: ''},
        parentMediaId: {type: String, default: ''},
        mediaType: {type: String, default: ''},
        mediaUrl: {type: String, default: ''},
        createdAt: {type: Date, default: new Date()},
        updatedAt: {type: Date, default: new Date()}
	},{versionKey: false, collection: 'instaFeeds'});
	var InstaFeeds = mongoose.model('instaFeeds', instaFeedsSchema);
	return InstaFeeds;
}