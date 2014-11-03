'use strict'
const 
	express = require('express'),
    bodyParser = require('body-parser'),
	app = express();

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))

    // parse application/json
     app.use(bodyParser.json())

    // Static content
	app.use(express.static(__dirname + '/static'));
	app.use(express.static(__dirname + '/bower_components'));


// TODO: Move this config to a separate config.json file.
const
	config = {
		concur_api_url: 'http://www.concursolutions.com/api/',
		access_token: '4ujlb9b+NRAhMmLl5ZCAGuRpCSY=',
		concur_reports_url: 'v3.0/expense/reportdigests',
		concur_approvals_url: 'v3.0/expense/reportdigests?user=ALL&approvalStatusCode=A_PEND&approverLoginID=sprashanthadev%40gmail.com',
		concur_trips_url: 'travel/trip/v1.1/',
        use_mongoose: 'false',
        mongodb_url: 'mongodb://localhost:27017/Concur',
        redis_server: 'localhost',
        redis_port: '6379',
        logging_level: 'info'
	};

// Build application context

let context = {'config': config};

const redis = require('redis'),
      mongoClient = require('mongodb').MongoClient;

    context.redisClient = redis.createClient(config.redis_port, config.redis_server);
    context.redisClient.on('error', function (err) {
            logger.error('Error ' + err);
        });
    console.log("Connected to Redis");

    mongoClient.connect(config.mongodb_url, function(connErr, db) {
        if (connErr) {
            console.error("connErr:" + connErr);
            return;
        }
        console.log("Connected to Mongodb");
        context.db = db;

        // Start the server and listen on port 3000.
        app.listen(3000, function(){
            console.log("Server started. Listening on port 3000");
        })
    });


    // Routes
	require('./lib/concur_proxy.js')(context, app);
    require('./lib/concur_home.js')(context, app);
    require('./lib/concur_user.js')(context, app);
    require('./lib/concur_login.js')(context, app);


	