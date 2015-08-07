import * as itemStorage from "itemStorage.js";
import * as pubsub from "pubsub.js";
import detail from "panes/detail.js";
import log from "panes/log.js";
import positionMarker from "positionmarker.js";

export default class Map {
	constructor() {
		/*
		sz: 	14.1596, 49.41298 15
		lipno: 14.16876, 48.66177 13 
		*/
		this._map = new SMap(document.querySelector("#map"), SMap.Coords.fromWGS84(14.164768872985832, 48.65760300916347), 14);
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
		this._positionMarker = positionMarker();
		this._positionLayer = new SMap.Layer.Marker();
		this._positionLayer.addMarker(this._positionMarker);
		this._map.addLayer(this._positionLayer);

		this._map.getSignals().addListener(this, "map-redraw", "_mapRedraw");
		this._map.getSignals().addListener(this, "marker-click", "_markerClick");

		pubsub.subscribe("position-change", this);
/*		
		setInterval(() => {
			pubsub.publish("position-change", this, {coords:this._map.getCenter()});
		}, 2000);
*/		
	}
	
	activate() {
		this._map.syncPort();
	}

	deactivate() {}

	getCenter() { return this._map.getCenter(); }
	getProjection() { return this._map.getProjection(); }

	handleMessage(message, publisher, data) {
		switch (message) {
			case "position-change":
				if (data.coords) {
					this._positionMarker.setCoords(data.coords);
					this._positionLayer.enable();
					this._map.setCenter(data.coords);
				} else {
					this._positionLayer.disable();
				}
			break;
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

		let markers = items.map(item => item.buildMarker());
		this._markers.addMarker(markers);
	}

	_markerClick(e) {
		if (e.target == this._positionMarker) { return; }
		detail.show(e.target.getId());
	}
}

export default new Map();
