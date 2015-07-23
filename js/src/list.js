import Layer from "layer.js";

export default class List {
	constructor() {
		let div = document.createElement("div");
		document.body.appendChild(div);
		div.id = "map";

		let map = new SMap(div, SMap.Coords.fromWGS84(14.16876, 48.66177), 13);
		map.addDefaultControls();
		map.addDefaultLayer(SMap.DEF_TURIST).enable();

		let layer = new Layer(map);
	}
}
