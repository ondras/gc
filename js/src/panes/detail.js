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

		this._arrow = this._compass.querySelector(".arrow");

		this._map = new SMap(this._compass.querySelector(".smap"), null, 20);
		this._map.addDefaultLayer(SMap.DEF_TURIST).enable();

		this._layer = new SMap.Layer.Marker();
		this._map.addLayer(this._layer);

		this._positionMarker = positionMarker();
		this._layer.addMarker(this._positionMarker);

		this._marker = new SMap.Marker(SMap.Coords.fromWGS84(0, 0), null, {anchor: {left:9,top:9}});
		this._layer.addMarker(this._marker);
		
		pubsub.subscribe("orientation-change", this);
		pubsub.subscribe("position-change", this);
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
				this._angle = data.angle;
				this._updateCompass();
			break;

			case "position-change":
				this._coords = data.coords;
				this._updateDistance();
				this._updateCompass();

				if (this._coords) {
					this._map.setCenter(this._coords);
					this._positionMarker.setCoords(this._coords);
				}
			break;
		}
	}

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
		this._node.innerHTML = "";
		this._item.build(this._node);

		this._node.appendChild(this._distance);
		this._node.appendChild(this._compass);

		this._updateDistance();
		this._updateCompass();

		this._layer.enable();
		this._marker.setCoords(this._item.getCoords());
		this._marker.setURL(this._item.getImage());
	}

	_updateCompass() {
		/* rotate map */
		this._map.getContainer().style.transform = `rotate(${this._angle}deg)`;
		
		/* inverse rotate marker */
		this._marker.getContainer()[SMap.LAYER_MARKER].style.transform = `rotate(${-this._angle}deg)`;

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
