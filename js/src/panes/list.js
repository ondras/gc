import * as itemStorage from "itemStorage.js";
import * as pubsub from "pubsub.js";
import map from "panes/map.js";
import detail from "panes/detail.js";
import log from "panes/log.js";

class List {
	constructor() {
		this._node = document.querySelector("#list ul");
		this._node.addEventListener("click", this);
	}

	activate() {
		let center = map.getCenter(); /* FIXME *map* center? or geolocation? */
		log.debug("listing around", center.toWGS84());
		let items = itemStorage.getNearby(center, 10);

		this._node.innerHTML = "";

		items.forEach(item => this._buildItem(item));
	}
	deactivate() {}

	handleEvent(e) {
		let node = e.target;
		while (node && !node.dataset.id) { node = node.parentNode; }
		detail.show(node.dataset.id);
	}

	_buildItem(item) {
		let li = document.createElement("li");
		this._node.appendChild(li);
		li.dataset.id = item.getId();

		let img = document.createElement("img");
		li.appendChild(img);
		img.src = item.getImage();

		let name = item.getName();
		li.appendChild(document.createTextNode(name));
	}
}

export default new List();
