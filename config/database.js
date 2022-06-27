/* module.exports = function(){
	
	var database = 'mongodb://ais_bond2dating:YVEzFDHz@192.168.1.3:27143/ais_bond2dating';
	mongoose.set('debug', false);
	mongoose.connect(database, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false}).then(
	  ()=>{ 
	  	var ObjectId = mongoose.ObjectId;
	  	console.log("Database Connected Successfully...\n");
	  },
	  err =>{console.log("Database Connection err",err);}
	);

	return mongoose;
} */

const env = process.env.NODE_ENV || "localhost"
module.exports = function () {

    //Start: database connection+++++++++++++++++++++
    var url = '';
    if (env == "production") {
        var url = '';
    } else if (env == "development") {
        var url = 'mongodb://ais_easydate_dev:YVEzFDHz@192.168.1.3:27325/ais_easydate_dev';
    } else {
        var url = "mongodb://localhost:27017/easydate";        
    }

    console.log("............database url", url);

    mongoose.set('debug', false);
    let options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    }
    console.log(' url:---', url);
    mongoose.connect(url, options).then(() => {
        // var ObjectId = mongoose.ObjectId;
        console.log('Database connected successfully...\n');
    },
        err => { console.log('Database connection error: ', err); }
    );
    return mongoose;
    //End: database connection
}