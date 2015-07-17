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

function getLocationOfTweet(location) {
    getAutocompleteResult(location)
        .then(getResultCoords)
        .val(function (result) {
            console.log(result);
        })
        .or(function (err) {
            console.log("Error: " + err);
        });
}

function getAutocompleteResult(input) {
    var sq = ASQ();
    locations.autocomplete({
        input: input
    }, sq.errfcb());
    return sq;
}

function getResultCoords(done, result) {
    return locations.details({
        placeid: result.predictions[0].place_id
    }, function (err, data) {
        done(data.result.geometry.location);
    });
}

io.on("connection", handleIO);
io.configure(function () {
    io.enable("browser client minification"); // send minified client
    io.set("log level", 1); // reduce logging
});

var twit = new twitter({
    consumer_key: config.twitter.ck,
    consumer_secret: config.twitter.cs,
    access_token_key: config.twitter.ak,
    access_token_secret: config.twitter.as
});

var num = 0;
twit.stream('statuses/filter', {
    track: 'ufc'
}, function (stream) {
    stream.on('data', function (tweet) {
        if (typeof tweet.user !== "undefined" && tweet.user.location && num < 10) {
            num++;
            //getLocationOfTweet(tweet.user.location);
        }
    });
});

function handleHTTP(req, res) {
    if (req.method === "GET") {
		if(req.url === "/") {
			req.url = "/index.html";
			static_files.serve(req, res);
		} 
		else if(req.url === "/main.js" || req.url === "/main.css") {
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
    console.log("connected");

    socket.on("disconnect", function () {
        console.log("disconnected");
    });
}