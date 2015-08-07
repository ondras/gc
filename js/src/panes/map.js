import * as itemStorage from "itemStorage.js";
import * as pubsub from "pubsub.js";
import detail from "panes/detail.js";
import log from "panes/log.js";
import positionMarker from "positionmarker.js";
import followControl from "followcontrol.js";

export default class Map {
	constructor() {
		this._onLine = false;
		this._layers = {
			tile: null,
			markers: new SMap.Layer.Marker(),
			position: new SMap.Layer.Marker()
		}
		/*
		sz: 	14.1596, 49.41298 15
		lipno: 14.16876, 48.66177 13 
		*/
		let center = JSON.parse(localStorage.getItem("gc-center"));
		if (!center) { center = [14.164768872985832, 48.65760300916347]; }
		center = SMap.Coords.fromWGS84(center[0], center[1]);

		let zoom = Number(localStorage.getItem("gc-zoom"));
		if (!zoom) { zoom = 14; }

		this._map = new SMap(document.querySelector("#map"), center, zoom);
		this._map.addControl(new SMap.Control.Sync({bottomSpace:0}));
		this._map.addDefaultControls();

		this._map.addControl(followControl, {left:"10px", top:"10px"});

		this._layers.tile = this._map.addDefaultLayer(SMap.DEF_TURIST);
		
		this._map.addLayer(this._layers.markers).enable();

		this._positionMarker = positionMarker();
		this._layers.position.addMarker(this._positionMarker);
		this._map.addLayer(this._layers.position);

		this._map.getSignals().addListener(this, "map-redraw", "_mapRedraw");
		this._map.getSignals().addListener(this, "marker-click", "_markerClick");

		pubsub.subscribe("position-change", this);
		pubsub.subscribe("network-change", this);
		pubsub.subscribe("follow-change", this);
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
					this._layers.position.enable();

					if (followControl.isActive()) { this._map.setCenter(data.coords); }
				} else {
					this._layers.position.disable();
				}
			break;

			case "network-change":
				this._onLine = data.onLine;
				if (data.onLine) {
					this._layers.tile.enable();
					this._mapRedraw();
				} else {
					this._layers.tile.disable();
				}
			break;

			case "follow-change":
				if (data.follow) {
					this._map.setCenter(this._positionMarker.getCoords());
				}
			break;
		}
	}

	_mapRedraw() {
		localStorage.setItem("gc-center", JSON.stringify(this.getCenter().toWGS84()));
		localStorage.setItem("gc-zoom", this._map.getZoom());

		if (!this._onLine) { return; }

		let zoom = this._map.getZoom();
		if (zoom < 13) {
			this._layers.markers.removeAll();
			return;
		}

		itemStorage.getInViewport(this._map).then(items => this._render(items));
	}

	_render(items) {
		this._layers.markers.removeAll();

		let markers = items.map(item => item.buildMarker());
		this._layers.markers.addMarker(markers);
	}

	_markerClick(e) {
		if (e.target == this._positionMarker) { return; }
		detail.show(e.target.getId());
	}
}

export default new Map();
