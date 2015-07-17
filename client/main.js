(function() {
    
    var map,
        socket;
    
    document.addEventListener("DOMContentLoaded", function(event) { 
		init();
	});
    
    function init() {
        initMap(-11.6015625, 18.646245142670608, 3);
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
    function initMap(lng, lat, zoom) {
        map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.MapQuest({layer: 'osm'})
                })
            ],
            view: new ol.View({
                center: ol.proj.transform([lng, lat], 'EPSG:4326', 'EPSG:3857'),
                zoom: zoom
            })
        });
    }
})();
