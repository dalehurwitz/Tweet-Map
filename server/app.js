var http = require("http");
var host = "localhost";
var port = 8007;
var http_serv = http.createServer(handleHTTP).listen(port, host);

var fs = require("fs");
var io = require("socket.io").listen(http_serv);
var twitter = require("twitter");
var ASQ = require("asynquence");
require("asynquence-contrib");

var config = require("./config");

var node_static = require("node-static");
var static_files = new node_static.Server("../client");

var GoogleLocations = require('google-locations');
var locations = new GoogleLocations(config.google.key);

var numClientsConnected = 0;

/*** socket.io configuration ***/
io.on("connection", handleIO);
io.configure(function () {
	io.enable("browser client minification"); // send minified client
	io.set("log level", 1); // reduce logging
});


/*** Init twitter stream ***/
var twit = new twitter({
	consumer_key: config.twitter.ck,
	consumer_secret: config.twitter.cs,
	access_token_key: config.twitter.ak,
	access_token_secret: config.twitter.as
});

startTwitterStream("#lhhatl");

function startTwitterStream(keywords) {
	var num = 0;
	twit.stream('statuses/filter', {
		track: keywords
	}, function (stream) {
		stream.on('data', function (tweet) {
			if (typeof tweet.user !== "undefined" && tweet && num < 20) {
				num++;
				getLocationOfTweet(tweet);
			}
		});
	});
}

/* 
 *  Attempt to retrieve coordinates form a tweet location string
 */
function getLocationOfTweet(tweet) {
	getGoogleAutocompleteResult(tweet)
		.then(getResultCoords)
		.val(function (coords) {
			io.sockets.emit("newtweet", tweet, coords);
		})
		.or(function (err) {
			console.log("Error: " + err);
		});
}

/*
 *  Get a list of possible addresses based on a location string
 */
function getGoogleAutocompleteResult(tweet) {
	var sq = ASQ();
	locations.autocomplete({
		input: tweet.user.location
	}, sq.errfcb());
	return sq;
}

/*
 *  Get the coordinates of the first result in a list of possible addresses
 */
function getResultCoords(done, result) {
	if(typeof result.predictions[0] === "undefined") {
		console.log("No results available: " + result.status);
		done.abort();
		return;
	}
	return locations.details({
		placeid: result.predictions[0].place_id
	}, function (err, data) {
		done(data.result.geometry.location);
	});
}

function handleHTTP(req, res) {
	if (req.method === "GET") {
		if(req.url === "/") {
			req.url = "/index.html";
			static_files.serve(req, res);
		} 
		else if(req.url === "/main.js" || req.url === "/main.css" || req.url.split('/')[1] === "images") {
			static_files.serve(req, res);
		}  
		else {
			res.writeHead(404);
			res.end("Cannot retrieve file:" + req.url);
		}
	} 
	else {
		res.writeHead(403);
		res.end("Get outta here!");
	}
}

function handleIO(socket) {
	numClientsConnected++;
	console.log("connected");
	console.log("Num clients: " + numClientsConnected);

	socket.on("disconnect", function () {
		numClientsConnected--;
		console.log("disconnected");
		console.log("Num clients: " + numClientsConnected);
	});
}