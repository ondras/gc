import * as items from "items.js";
import detail from "detail/detail.js";
import log from "log/log.js";

export default class Map {
	constructor() {
		/*
		sz: 	14.1596, 49.41298 15
		lipno: 14.16876, 48.66177 13 
		*/
		this._map = new SMap(document.querySelector("#map"), SMap.Coords.fromWGS84(14.16876, 48.66177), 13);
		this._map.addControl(new SMap.Control.Sync({bottomSpace:0}));
		this._map.addDefaultControls();
		this._map.addDefaultLayer(SMap.DEF_TURIST).enable();

		this._markers = new SMap.Layer.Marker();
		this._map.addLayer(this._markers).enable();
		this._map.getSignals().addListener(this, "map-redraw", "_mapRedraw");
		this._map.getSignals().addListener(this, "marker-click", "_markerClick");

		this._mapRedraw();
	}

	activate() {}
	deactivate() {}

	setPosition(position) {
		/* FIXME */
	}

	_mapRedraw() {
		let zoom = this._map.getZoom();
		if (zoom < 13) {
			this._markers.removeAll();
			return;
		}

		items.getInViewport(this._map).then(items => this._render(items));
	}

	_render(items) {
		this._markers.removeAll();

		let markers = items.map(item => {
			let coords = item.getCoords();
			return new SMap.Marker(coords, item.getId(), {title:item.getName()});
		});

		this._markers.addMarker(markers);
	}

	_markerClick(e) {
		let id = e.target.getId();
		let item = items.getById(id);
		if (!item) { 
			log.error("item", id, "not in cache!"); 
			return;
		}
		detail.show(item);
	}
}

export default new Map();
