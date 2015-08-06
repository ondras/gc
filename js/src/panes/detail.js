import * as nav from "nav.js";
import * as itemStorage from "itemStorage.js";
import * as pubsub from "pubsub.js";

class Detail {
	constructor() {
		this._node = document.querySelector("#detail");

		this._compass = document.createElement("div");
		this._node.appendChild(this._compass);
		this._compass.id = "compass";
		this._compass.innerHTML = "&uArr;";

		this._alpha = 0;
		this._coords = null;

		pubsub.subscribe("orientation-change", this);
		pubsub.subscribe("position-change", this);
	}

	activate() {
		pubsub.subscribe("item-change", this);
	}

	deactivate() {
		pubsub.unsubscribe("item-change", this);
	}

	handleMessage(message, publisher, data) {
		switch (message) {
			case "item-change":
				if (publisher != this._item) { return; }
				this._build();
			break;

			case "orientation-change":
				this._alpha = data.alpha;
				this._updateCompass();
			break;

			case "position-change":
				this._coords = data.coords;
				this._updateCompass();
			break;
		}
	}

	show(id) {
		let item = itemStorage.getById(id);
		if (!item) { 
			log.error("item", id, "not in cache"); 
			return;
		}

		nav.go("detail");

		this._item = item;
		this._build();
	}

	_build() {
		this._node.innerHTML = "";
		this._item.build(this._node);

		this._node.appendChild(this._compass);
	}

	_updateCompass() {
		this._compass.style.transform = `rotate(${this._alpha}deg)`;
	}
}

export default new Detail();
