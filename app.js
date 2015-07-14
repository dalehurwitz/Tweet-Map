var http = require("http");
var host = "localhost";
var port = 8007;
var http_serv = http.createServer(handleHTTP).listen(port, host);

var fs = require("fs");
var io = require("socket.io").listen(http_serv);
var twitter = require("ntwitter");

io.on("connection", handleIO);
io.configure(function(){
	io.enable("browser client minification"); // send minified client
	io.set("log level", 1); // reduce logging
});

var twit = new twitter({
    consumer_key: 'SKKs1PSexqKHddYG5VAoz1Ekk',
    consumer_secret: 'VtPwqBZ2LFRH0yMxDIy6RzN5bAwFmSf3lsDeM95xO1nb0Rru53',
    access_token_key: '121646999-5XGNK3X5cwqiLocBEvCwKIkkvGtxRADnmWNPxTbX',
    access_token_secret: '9NVtIIu4yPbLek7YQkRhOTLoP69rEvGJ7uA9PqKZdIPNp'
});

twit.stream('statuses/filter', {track:'ufc'}, function(stream) {
    stream.on('data', function (tweet) {
        console.log(tweet);
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
    
    socket.on("disconnect", function() {
        console.log("disconnected");
    });
}
