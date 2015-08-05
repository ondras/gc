import log from "panes/log.js";

class Status {
	constructor() {
		this._online = document.querySelector("#status #online");
		this._position = document.querySelector("#status #position");

		this._position.className = "waiting";

		window.addEventListener("online", this);
		window.addEventListener("offline", this);

		this._syncOnline();
	}

	activate() {}
	deactivate() {}

	setPosition(position, error) {
		if (position) {
			this._position.className = "good";
			this._position.querySelector("span").innerHTML = position.toWGS84(2);
		} else {
			this._position.className = "bad";
			this._position.querySelector("span").innerHTML = error.message;
		}
	}

	handleEvent(e) {
		log.debug("got", e.type, "event");
		this._syncOnline();
	}

	_syncOnline() {
		if (navigator.onLine) {
			log.log("we are online");
			this._online.className = "good";
		} else {
			log.log("we are offline");
			this._online.className = "goobadd";
		}
	}
}

export default new Status();
