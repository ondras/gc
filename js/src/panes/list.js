import * as itemStorage from "itemStorage.js";
import map from "panes/map.js";

class List {
	constructor() {
		this._node = document.querySelector("#list");
	}

	activate() {
		let center = map.getCenter();
		let items = itemStorage.getNearby(center, 10);

		this._node.innerHTML = items.map(item => JSON.stringify(item)).join(", ");
	}
	deactivate() {}
}

export default new List();
