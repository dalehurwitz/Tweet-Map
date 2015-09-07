var http = require("http");
var host = "localhost";
var port = 8989;
var http_serv = http.createServer(handleHTTP).listen(port, host);

var fs = require("fs");
var io = require("socket.io").listen(http_serv);
var twitter = require("twitter");
var ASQ = require("asynquence");
require("asynquence-contrib");

var config = require("./server/config");

var node_static = require("node-static");
var static_files = new node_static.Server("./client");

var GoogleLocations = require('google-locations');
var locations = new GoogleLocations(config.google.key);

var clients = [];

var keywords = "#NASCARthrowback";

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

function createTwitterStream(keywords, id) {
    return ASQ(function(done) {
        twit.stream('statuses/filter', { track: keywords }, function(stream) {
            done(stream);
            stream.on('data', function (tweet) {
                if (typeof tweet.user !== "undefined" && tweet) {
					getLocationOfTweet(tweet, id, tweet.coordinates);
				}
            });
        });
    });
}

function setupTwitterStream(id, keywords) {
    createTwitterStream(keywords, id)
        .val(function(stream) {
            var clientIndex = getClientIndexById(id);
            clients[clientIndex].stream = stream;
        })
        .or(function(err) {
            console.log("error: " + err);
        });
}

/*
 * Destroy a live stream
 * Accepts either a client id or clients array index
 */
function destroyTwitterStream(id) {
    if(typeof id === "string") {
        id = getClientIndexById(id);
    }
    if(clients[id].stream !== null) {
        clients[id].stream.destroy();
    }
}

/* 
 *  Attempt to retrieve coordinates form a tweet location string
 */
function getLocationOfTweet(tweet, id, coords) {
	if(coords !== null) {
		coords = { lat: coords.coordinates[1], lng: coords.coordinates[0] };
		io.sockets.socket(id).emit("new-tweet", tweet, coords);
		return;
	}
	
	getGoogleAutocompleteResult(tweet)
		.then(getResultCoords)
		.val(function (coords) {
			io.sockets.socket(id).emit("new-tweet", tweet, coords);
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

/* Setup routing */
function handleHTTP(req, res) {
	if (req.method === "GET") {
		if(req.url === "/") {
			req.url = "/index.html";
			static_files.serve(req, res);
		} 
		else if(req.url === "/main.js" || req.url === "/main.css" || req.url.split('/')[1] === "images" || req.url.split('/')[1] === "vendor") {
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
    addClient(socket.id);
    console.log("Clients connected: " + clients.length);
	
	socket.on("disconnect", function () {
		console.log("disconnected");
        removeClient(socket.id);
        console.log("Clients connected: " + clients.length);
	});
    
    socket.on("update-keywords", function(keywords) {
        updateKeywords(socket.id, keywords);
    })
}

function addClient(id) {
    clients.push({ id: id, stream: null });
    //Send the client it's client ID
    io.sockets.socket(id).emit("client-registered", id, keywords);
    setupTwitterStream(id, keywords);
}

function removeClient(id) {
    var indexToRemove = getClientIndexById(id);
    destroyTwitterStream(indexToRemove);
    clients.splice(indexToRemove, 1);
}

function updateKeywords(id, keywords) {
    destroyTwitterStream(id);
    setupTwitterStream(id, keywords);
}

function getClientIndexById(id) {
    return clients.map(function(client) { return client.id; }).indexOf(id);
}
