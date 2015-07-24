import * as items from "items.js";

export default class Layer {
	constructor(map) {
		this._map = map;
		this._layer = new SMap.Layer.Marker();
		map.addLayer(this._layer).enable();
		map.getSignals().addListener(this, "map-redraw", "_mapRedraw");

		this._mapRedraw();
	}

	_mapRedraw() {
		let zoom = this._map.getZoom();
		if (zoom < 13) {
			this._layer.removeAll();
			return;
		}

		items.getInViewport(this._map).then(items => this._render(items));
	}


	_render(items) {
		this._layer.removeAll();

		let markers = items.map(item => {
			let coords = item.getCoords();
			return new SMap.Marker(coords, null, {title:item.getName()});
		});

		this._layer.addMarker(markers);
	}
}
