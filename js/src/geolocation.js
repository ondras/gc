import status from "panes/status.js";
import map from "panes/map.js";
import log from "panes/log.js";

let onPosition = function(position) {
	let coords = SMap.Coords.fromWGS84(position.coords.longitude, position.coords.latitude);
	log.debug("got position", coords.toWGS84());
	status.setPosition(coords, null);
	map.setPosition(coords);
}

let onError = function(error) {
	log.error("lost position", error.message);
	status.setPosition(null, error);
	map.setPosition(null);
}

export function init() {
	let options = {
		enableHighAccuracy: true
	}
	log.debug("requesting watchPosition");
	navigator.geolocation.watchPosition(onPosition, onError, options);
}
