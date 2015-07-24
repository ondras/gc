import Layer from "./layer.js";

class List {
	constructor() {
		let map = new SMap(document.querySelector("#map"), SMap.Coords.fromWGS84(14.16876, 48.66177), 13);
		map.addDefaultControls();
		map.addDefaultLayer(SMap.DEF_TURIST).enable();

		let layer = new Layer(map);
	}

	activate() {}
	deactivate() {}
}

export default new List();
