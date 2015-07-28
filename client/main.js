(function() {

	var map,
		tweetMarker;

	document.addEventListener("DOMContentLoaded", function(event) { 
		init();
	});

	function init() {
		map = createMap(38.272689, 9.552734, 3);
		tweetMarker = L.icon({
			iconUrl: 'images/tweet-marker.svg',
			iconSize:     [40, 33], // size of the icon
			iconAnchor:   [13, 33], // point of the icon which will correspond to marker's location
			popupAnchor:  [0, -33] // point from which the popup should open relative to the iconAnchor
		});
		initSocketIO();		
	}

	/*** Init socket.io ***/
	function initSocketIO() {   
		var socket = io.connect("/");

		socket.on("connect", function () {
			console.log("connected");
		});

		socket.on("disconnect", function () {
			console.log("disconnected");
		});

		socket.on("newtweet", function(tweet, coords) {
			addTweetMarkerToMap(tweet, coords);
		});
	}

	/*** Init OpenLayers map ***/
	function createMap(lat, lng, zoom) {
		var map = L.map('map').setView([lat, lng], 3);
		L.tileLayer('http://api.tiles.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGF6ODkiLCJhIjoiNzE4ZDViY2M0NWEwYjIxZWQxOGIwM2U5YzUwYmJkYTEifQ.Tr84K9p5dN8qhQ8Y6KkWoA', {
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
			maxZoom: 18,
			id: 'your.mapbox.project.id',
			accessToken: 'your.mapbox.public.access.token'
		}).addTo(map);
		return map;
	}

	function addTweetMarkerToMap(tweet, coords) {
		var marker = L.marker([coords.lat, coords.lng], {icon: tweetMarker}).addTo(map),
			popupContent = generateMarkerContent(tweet);
		marker.bindPopup(popupContent);
	}
	
	function generateMarkerContent(tweet) {
		var html = '<div class="tweet"> \
						<div class="profile-pic"><img src="' + tweet.user.profile_image_url + '"></img></div> \
				    	<span class="profile-name">@' + tweet.user.screen_name + '</span> \
						<div class="tweet-body">' + tweet.text + '</div> \
						<div class="tweet-location">' + tweet.user.location + '</div> \
					</div>'
		return html;		
	}
})();
