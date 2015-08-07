import * as nav from "nav.js";
import * as itemStorage from "itemStorage.js";
import * as pubsub from "pubsub.js";
import log from "panes/log.js";
import positionMarker from "positionmarker.js";

class Detail {
	constructor() {
		this._node = document.querySelector("#detail");
		this._distance = this._node.querySelector("#distance");
		this._compass = this._node.querySelector("#compass");

		this._angle = 0;
		this._coords = null;
		this._layers = {
			marker: new SMap.Layer.Marker(),
			tile: null
		}
		this._marker = null;

		this._arrow = this._compass.querySelector(".arrow");

		this._map = new SMap(this._compass.querySelector(".smap"), null, 18);
		this._map.addControl(new SMap.Control.Sync());
		this._layers.tile = this._map.addDefaultLayer(SMap.DEF_TURIST);

		this._map.addLayer(this._layers.marker);

		this._positionMarker = positionMarker();
		this._layers.marker.addMarker(this._positionMarker);

		pubsub.subscribe("orientation-change", this);
		pubsub.subscribe("position-change", this);
		pubsub.subscribe("network-change", this);
	}

	activate() {
		pubsub.subscribe("item-change", this);
	}

	deactivate() {
		pubsub.unsubscribe("item-change", this);
	}

	handleMessage(message, publisher, data) {
		switch (message) {
			case "item-change":
				if (publisher != this._item) { return; }
				this._build();
			break;

			case "orientation-change":
				this._angle = data.angle || 0;
				this._updateRotation();
			break;

			case "network-change":
				if (data.onLine) {
					this._layers.tile.enable();
				} else {
					this._layers.tile.disable();
				}
			break;

			case "position-change":
				this._coords = data.coords;

				this._updateDistance();
				this._updateRotation();

				if (this._coords) {
					this._map.setCenter(this._coords);
					this._positionMarker.setCoords(this._coords);
					this._layers.marker.enable();
				} else {
					this._layers.marker.disable();
				}

			break;
		}
	}

	show(id) {
		log.log("showing detail for", id);
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
		this._node.innerHTML = "";
		this._item.build(this._node);

		let heading = this._node.querySelector("h2");
		heading.parentNode.insertBefore(this._distance, heading.nextSibling);
		heading.parentNode.insertBefore(this._compass, heading.nextSibling);

		this._updateDistance();
		this._updateRotation();

		let l = this._layers.marker;
		if (this._marker) { l.removeMarker(this._marker); }
		this._marker = this._item.buildMarker();
		l.addMarker(this._marker);
	}

	_updateRotation() {
		/* rotate map */
		this._map.getContainer().style.transform = `rotate(${this._angle}deg)`;
		
		/* inverse rotate marker */
		if (this._marker) { 
			this._marker.getContainer()[SMap.LAYER_MARKER].style.transform = `rotate(${-this._angle}deg)`;
		}

		/* rotate arrow */
		let azimuth = 0;
		if (this._coords && this._item) {
			azimuth = this._coords.azimuth(this._item.getCoords());
		}
		/* this._angle CCW, azimuth CW, rotation transform CW */
		this._arrow.style.transform = `rotate(${azimuth + this._angle}deg)`;
	}

	_updateDistance() {
		if (!this._coords || !this._item) {
			this._distance.innerHTML = "";
			return;
		}

		let distance = this._coords.distance(this._item.getCoords());
		this._distance.innerHTML = `${distance.toFixed(2)}m`;
	}
}

export default new Detail();
