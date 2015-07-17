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
            getLocationOfTweet(tweet.user.location);
        }
    });
});

function handleHTTP(req, res) {
    fs.readFile(__dirname + "/index.html",
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end("Error loading index.html");
            }
            res.writeHead(200);
            res.end(data);
        });
}

function handleIO(socket) {
    console.log("connected");

    socket.on("disconnect", function () {
        console.log("disconnected");
    });
}