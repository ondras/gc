import log from "panes/log.js";
import * as pubsub from "pubsub.js";

class Status {
	constructor() {
		this._network = document.querySelector("#status #network");
		this._position = document.querySelector("#status #position");
		this._orientation = document.querySelector("#status #orientation");

		this._position.className = "waiting";
		if ("ondeviceorientation" in window) { this._orientation.className = "waiting"; }
	}

	start() {
		window.addEventListener("online", this);
		window.addEventListener("offline", this);
		window.addEventListener("deviceorientation", this);

		this._syncOnline();

		let options = {
			enableHighAccuracy: true
		}

		let onPosition = function(position) {
			let coords = SMap.Coords.fromWGS84(position.coords.longitude, position.coords.latitude);
			log.debug("got position", coords.toWGS84());

			this._position.className = "good";
			this._position.querySelector("span").innerHTML = coords.toWGS84(2);
			pubsub.publish("position-change", this, {coords:coords});
		}.bind(this);

		let onError = function(error) {
			log.error("lost position", error.message);

			this._position.className = "bad";
			this._position.querySelector("span").innerHTML = error.message;

			pubsub.publish("position-change", this, {coords:null});
		}.bind(this);

		log.debug("requesting watchPosition");
		navigator.geolocation.watchPosition(onPosition, onError, options);
	}

	activate() {}
	deactivate() {}

	handleEvent(e) {
//		log.debug("got", e.type, "event");

		switch (e.type) {
			case "online":
			case "offline":
				this._syncOnline();
			break;

			case "deviceorientation":
//				log.debug("alpha", e.alpha);
				this._orientation.className = "good";
				this._orientation.querySelector("span").innerHTML = (e.alpha === null ? "null" : `${e.alpha.toFixed(2)}°`);

				pubsub.publish("orientation-change", this, {angle:e.alpha});
			break;
		}
	}

	_syncOnline() {
		if (navigator.onLine) {
			log.log("we are online");
			this._network.className = "good";
		} else {
			log.log("we are offline");
			this._network.className = "bad";
		}
		pubsub.publish("network-change", this, {onLine:navigator.onLine});
	}
}

export default new Status();
