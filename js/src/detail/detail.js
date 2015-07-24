import * as nav from "nav.js";

class Detail {
	constructor() {
		this._node = document.querySelector("#detail");
	}

	activate() {}
	deactivate() {}

	show(item) {
		nav.go("detail");

		this._item = item;
		this._build();
	}

	_build() {
		this._node.innerHTML = `<pre>${JSON.stringify(this._item, null, 2)}</pre>`;
	}
}

export default new Detail();
