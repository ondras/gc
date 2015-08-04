import * as nav from "nav.js";
import * as itemStorage from "itemStorage.js";

class Detail {
	constructor() {
		this._node = document.querySelector("#detail");
	}

	activate() {}
	deactivate() {}

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
		this._item.build(this._node);
//		this._node.innerHTML = `<pre>${JSON.stringify(this._item, null, 2)}</pre>`;
	}
}

export default new Detail();
