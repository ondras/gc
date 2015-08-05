import * as nav from "nav.js";
import * as itemStorage from "itemStorage.js";
import * as pubsub from "pubsub.js";

class Detail {
	constructor() {
		this._node = document.querySelector("#detail");
	}

	activate() {
		pubsub.subscribe("item-change", this);
	}

	deactivate() {
		pubsub.unsubscribe("item-change", this);
	}

	handleMessage(message, publisher, data) {
		if (publisher != this._item) { return; }

		this._build();
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
	}
}

export default new Detail();
