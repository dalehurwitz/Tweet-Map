var socket = io.connect("/");

socket.on("connect", function () {
	console.log("connected");
});

socket.on("disconnect", function () {
	console.log("disconnected");
});

var map = new ol.Map({
	target: 'map',
	layers: [
		new ol.layer.Tile({
			source: new ol.source.MapQuest({layer: 'sat'})
		})
	],
	view: new ol.View({
		center: ol.proj.transform([37.41, 8.82], 'EPSG:4326', 'EPSG:3857'),
		zoom: 4
	})
});