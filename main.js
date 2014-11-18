'use strict'
const
    nconf = require('nconf'),
	express = require('express'),
    async = require('async'),
    bodyParser = require('body-parser'),
    logger = require('./lib/logger.js'),
	app = express();

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))

    // parse application/json
     app.use(bodyParser.json())

    // Static content
	app.use(express.static(__dirname + '/static'));
	app.use(express.static(__dirname + '/bower_components'));


let
	config = {
		concur_api_url: 'http://www.concursolutions.com/api/',
		concur_reports_url: 'v3.0/expense/reportdigests',
		concur_approvals_url: 'v3.0/expense/reportdigests?user=ALL&approvalStatusCode=A_PEND',
        concur_report_2_0_url: 'expense/expensereport/v2.0/report/',
		concur_trips_url: 'travel/trip/v1.1/',
        use_mongoose: 'false',
        mongodb_url: '',
        redis_server: '',
        redis_port: '',
        logging_level: ''
	};


    // Read Configuration Parameters
    nconf.argv().env();
    nconf.file({ file: 'config.json' });

    // Set the logging level in case it needs to be overridden.
    config.logging_level = nconf.get('logging_level')
    if (config.logging_level && config.logging_level != ''){
        logger.transports.console.level = config.logging_level;
    }

    // Redis connections
    config.redis_server = nconf.get('redis_server');
    config.redis_port = nconf.get('redis_port');
    console.log("config.redis_server " + config.redis_server);
    console.log("config.redis_port " + config.redis_port);
    console.log("auth_pass " + nconf.get('redis_password'));

    // Mongodb connections
    console.log("mongodb_server " + nconf.get('mongodb_server'));
    console.log("mongodb_port " + nconf.get('mongodb_port'));
    console.log("mongodb_database " + nconf.get('mongodb_database'));
    console.log("mongodb_user " + nconf.get('mongodb_user'));
    console.log("mongodb_password " + nconf.get('mongodb_password'));

    if (nconf.get('mongodb_user') != "" && nconf.get('mongodb_password') != ""){
        config.mongodb_url = "mongodb://" + nconf.get('mongodb_user') + ":" + nconf.get('mongodb_password') + "@"
         + nconf.get('mongodb_server') + ":" + nconf.get('mongodb_port') + "/" + nconf.get('mongodb_database');
    }else{
        config.mongodb_url = "mongodb://" + nconf.get('mongodb_server') + ":" +
            nconf.get('mongodb_port') + "/" + nconf.get('mongodb_database');
    }
    console.log("mongodb_url " + config.mongodb_url);

let context = {'config': config};

const redis = require('redis'),
      mongoClient = require('mongodb').MongoClient;

    async.parallel([
        function (callback) {
            setTimeout(function () {
                let redisClient = redis.createClient(config.redis_port, config.redis_server, {"auth_pass":nconf.get('redis_password')});
                redisClient.on('error', function (err) {
                    console.error('Error connecting to Redis ' + err);
                });
                redisClient.on('ready', function () {
                    console.log("Connected to Redis");
                    context.redisClient = redisClient;
                })
                callback(null, redisClient);
            }, 500);
        },
        function (callback) {
             setTimeout(function () {

                mongoClient.connect(config.mongodb_url, function(connErr, db) {
                    if (connErr) {
                        console.error("Error connecting to Mongodb " + connErr);
                    }
                    else
                    {
                        console.log("Connected to Mongodb");
                        context.db = db;
                    }
                    callback(null, mongoClient);
                })
             }, 500);
        }],
        function (err, results) {
            if (err) {
                console.error(err);
            }

            console.log("Attempting to start server on port " + (process.env.PORT || nconf.get('http:port')));

            // Start the server and listen on port set by the environment (example: 8081 in AWS) or 3000.
            app.listen((process.env.PORT || nconf.get('http:port')), function(){
                console.log("Server started. Listening on port " + (process.env.PORT || nconf.get('http:port')));

            })
        });


    let router = express.Router();
    app.use('/', router);

    // Routes
	require('./lib/concur_proxy.js')(context, app);
    require('./lib/concur_home.js')(context, app);
    require('./lib/concur_user.js')(context, app);
    require('./lib/concur_login.js')(context, app);
    require('./routes/concur_approvals.js')(context, app, router);


	