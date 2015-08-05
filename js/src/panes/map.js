import * as itemStorage from "itemStorage.js";
import detail from "panes/detail.js";
import log from "panes/log.js";

export default class Map {
	constructor() {
		/*
		sz: 	14.1596, 49.41298 15
		lipno: 14.16876, 48.66177 13 
		*/
		this._map = new SMap(document.querySelector("#map"), SMap.Coords.fromWGS84(14.16876, 48.66177), 14);
		this._map.addControl(new SMap.Control.Sync({bottomSpace:0}));
		this._map.addDefaultControls();
		this._map.addDefaultLayer(SMap.DEF_TURIST).enable();
		
		this._markers = new SMap.Layer.Marker();
		this._map.addLayer(this._markers).enable();

		let node = document.createElement("div");
		node.id = "gps";
		let opts = {
			url: node,
			anchor: {left: 10, top: 10}
		}
		this._positionMarker = new SMap.Marker(SMap.Coords.fromWGS84(0, 0), null, opts);
		this._positionLayer = new SMap.Layer.Marker();
		this._positionLayer.addMarker(this._positionMarker);
		this._map.addLayer(this._positionLayer);

		this._map.getSignals().addListener(this, "map-redraw", "_mapRedraw");
		this._map.getSignals().addListener(this, "marker-click", "_markerClick");
	}
	
	init() {
		this._mapRedraw();
	}

	activate() {
		this._map.syncPort();
	}

	deactivate() {}

	getCenter() { return this._map.getCenter(); }
	getProjection() { return this._map.getProjection(); }

	setPosition(position) {
		if (position) {
			this._positionMarker.setCoords(position);
			this._positionLayer.enable();
			this._map.setCenter(position);
		} else {
			this._positionLayer.disable();
		}
	}

	_mapRedraw() {
		let zoom = this._map.getZoom();
		if (zoom < 13) {
			this._markers.removeAll();
			return;
		}

		itemStorage.getInViewport(this._map).then(items => this._render(items));
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
		detail.show(e.target.getId());
	}
}

export default new Map();
