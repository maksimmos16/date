module.exports = function(mongoose,schema){	
	var cmsPages = new schema({
		title            : { type : String, default : ''},
        description      : { type : String, default : ''},
        image		     : { type : String, default : ''},
        slug 	         : { type : String, default : ''},
        otherApp         : { type : Array, 	default : []},
		createdAt		 : { type : Date, default: new Date()},
		updatedAt		 : { type : Date, default : new Date()}
	},{versionKey: false, collection: 'cmsPages'});
	var CMSPages = mongoose.model('cmsPages', cmsPages);
	return CMSPages;
}