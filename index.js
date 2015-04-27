var express = require('express'),
	fs = require('fs'),
	format = require('./lib/format_response'),
	mysql = require('mysql'),
	_ = require("underscore");

var app = express();

var config = require("./config.js");
_.extend({
	port: 3000,
	host: "127.0.0.1"
}, config);

// set mysql/format as global variable 
global.mysql = mysql.createPool(config.mysql);
global.format = format;
global.subway = {
	config :config
};

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.query());
app.use(express.static(__dirname + "/statics"));

// Load middleware first 
_.each(config.middleware, function (name) {
	// load middleware that from express

	if (fs.existsSync("./middleware/" + name + ".js")) {
		var middleware = require("./middleware/" + name + ".js");
		app.use(middleware());
	}
	else {
		try {
			var middleware = require(name);
			app.use(middleware());
		}
		catch(e) {
			//ignore
		}
	}
});

app.use(app.router);

// Load router
fs.readdir("./router", function (err, files) {
	// We only support GET/POST method for now
	_.each(files, function (file) {
		var router = require("./router/" + file);
		// GET
		_.each(router.get(), function (cb, path) {
			app.get(path, cb);
		});
		// POST
		_.each(router.post(), function (cb, path) {
			app.post(path, cb);
		});
	});
});

// 404/403 router handler
app.use(function (req, res, next) {
	res.status(404);
	res.json(format("not found router", 404));
});

// we set front page as app level
app.get("/", function (req, res) {
	res.json(format("welcome subway"));
});

// Start our node server.
app.listen(config.port, config.host);

console.log('App listen at ' + config.host + ":" + config.port);

// Listen SIGINT signal to exit from outsite.
process.on("SIGINT", function () {
	console.log('Exit');
	process.exit(0);
});

// Write pid number into .pid
// So that we can use outside moniter and keep it alive
fs.open(".pid", "w+", function (err, fd) {
	fs.write(fd, process.pid);
});