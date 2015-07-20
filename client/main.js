(function() {
    
    var map,
        socket;
    
    document.addEventListener("DOMContentLoaded", function(event) { 
		init();
	});
    
    function init() {
        initMap(38.272689, 9.552734, 3);
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
    }
    
    /*** Init OpenLayers map ***/
    function initMap(lat, lng, zoom) {
        map = L.map('map').setView([lat, lng], 3);
        L.tileLayer('http://api.tiles.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGF6ODkiLCJhIjoiNzE4ZDViY2M0NWEwYjIxZWQxOGIwM2U5YzUwYmJkYTEifQ.Tr84K9p5dN8qhQ8Y6KkWoA', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'your.mapbox.project.id',
            accessToken: 'your.mapbox.public.access.token'
        }).addTo(map);
    }
})();
