(function() {

	var socket,
		map,
		tweetMarker,
		body,
		$ui;

	document.addEventListener("DOMContentLoaded", function(event) { 
		init();
	});

	function init() {
		map = createMap(38.272689, 9.552734, 3);
		tweetMarker = L.icon({
			iconUrl: 'images/tweet-marker-2.svg',
			iconSize:     [35, 46], // size of the icon
			iconAnchor:   [17, 46], // point of the icon which will correspond to marker's location
			popupAnchor:  [0, -46] // point from which the popup should open relative to the iconAnchor
		});
		
		body = $("body");
		
		$ui = {
			keywords: body.find("#hud .keywords"),
			input: body.find("#keywords input"),
			submit: body.find("#keywords .submit")
		};
				
		$ui.submit.on("click", function() {
			var newKeywords = $ui.input.val();
			if(newKeywords !== "") {
				socket.emit("update-keywords", newKeywords);
				$ui.input.val("");
				updateHud(newKeywords);
			}
		});
		
		initSocketIO();
		
	}

	/*** Init socket.io ***/
	function initSocketIO() {   
		socket = io.connect("/");

		socket.on("connect", function () {
			console.log("connected");
		});

		socket.on("disconnect", function () {
			console.log("disconnected");
		});

		socket.on("new-tweet", function(tweet, coords) {
            console.log("new tweet");
			addTweetMarkerToMap(tweet, coords);
		});
        
        socket.on("client-registered", function(id, keywords) {
            console.log("id: " + id);
			updateHud(keywords);
        })
	}

	/*** Init OpenLayers map ***/
	function createMap(lat, lng, zoom) {
		var map = L.map('map', { zoomControl: false }).setView([lat, lng], 3);
		L.tileLayer('http://api.tiles.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGF6ODkiLCJhIjoiNzE4ZDViY2M0NWEwYjIxZWQxOGIwM2U5YzUwYmJkYTEifQ.Tr84K9p5dN8qhQ8Y6KkWoA', {
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
			maxZoom: 18,
		}).addTo(map);
        new L.Control.Zoom({ position: 'topright' }).addTo(map);
		return map;
	}

	function addTweetMarkerToMap(tweet, coords) {
		var marker = new L.marker([coords.lat, coords.lng], {icon: tweetMarker, bounceOnAdd: true}).addTo(map),
			popupContent = generatePopupContent(tweet);
		marker.bindPopup(popupContent);
	}
	
	function generatePopupContent(tweet) {
		return '<div class="tweet"> \
					<div class="profile-pic"><img src="' + tweet.user.profile_image_url + '"></img></div> \
					<span class="profile-name">@' + tweet.user.screen_name + '</span> \
					<div class="tweet-body">' + tweet.text + '</div> \
					<div class="tweet-location">' + tweet.user.location + '</div> \
				</div>';
	}
	
	function updateHud(keywords) {
		$ui.keywords.text(keywords);
	}
})();
