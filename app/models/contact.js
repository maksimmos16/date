module.exports = function(mongoose,schema){
	var contactSchema = new schema({
                comId: { type: String, default: ''},
                userId : {type:schema.Types.ObjectId, ref:'user'},
                title: {type:String, default: ''},
                msg: {type:String, default: ''},
                username: {type: String, default:''},
                contactDetails: {type: String, default: ''}, //email mobile both
                reply: {type:String, default: ''},
                status : {type:String,enum:['pending','resolve'], default: 'pending'},
                is_deleted : {type: String, default:"0"}, //1 means deleted and 0 means not deleted  
                created_at: {type: Date, default: new Date()},
                updated_at: {type: Date, default: new Date()},
                userType : { type: String, default:''},
        	},{versionKey: false}
	);
	var contact = mongoose.model('contact', contactSchema);
	return contact;
};