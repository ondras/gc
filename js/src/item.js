import log from "log/log.js";
import map from "map/map.js";
import Tile from "tile.js";
import * as itemStorage from "itemStorage.js";

export default class Item {
	constructor(id, name) {
		this._id = id;
		this._name = name;
		this._bestZoom = 0;
		this._coords = null;
		this._positions = [];
	}

	getId() { return this._id; }
	getName() { return this._name; }
	getCoords() { return this._coords; }

	build(parent) {
		log.debug("building item", this._id);
		parent.innerHTML = this._name;

		this._checkBestPosition();
	}

	addPosition(tile, x, y) {
		if (tile.zoom < this._bestZoom) { return; } /* worse */

		if (tile.zoom > this._bestZoom) { /* better, reset */
			this._positions = [];
			this._bestZoom = tile.zoom;
		}

		/* better or same => push */
		this._positions.push({tile, x, y});

		return this;
	}

	computeCoords() {
		if (!this._positions.length) { return this; }

		let bbox = {
			left: Infinity,
			right: -Infinity,
			top: -Infinity,
			bottom: Infinity
		};

		this._positions.forEach(position => {
			let wgs = this._positionToWGS84(position);
			bbox.left = Math.min(bbox.left, wgs.x);
			bbox.right = Math.max(bbox.right, wgs.x);
			bbox.bottom = Math.min(bbox.bottom, wgs.y);
			bbox.top = Math.max(bbox.top, wgs.y);
		});

		this._coords = SMap.Coords.fromWGS84((bbox.left+bbox.right)/2, (bbox.top+bbox.bottom)/2);
		this._positions = [];

		return this;
	}

	_positionToWGS84(position) {
		let projection = map.getProjection();

		let resolution = 4; // tile pixels per json char
		let {tile, x, y} = position;
		let abs = tile.toPixel();
		abs.x += (x+0.5) * resolution;
		abs.y += (y+0.5) * resolution;

		return projection.unproject(abs, tile.zoom);
	}

	_checkBestPosition() {
		if (this._bestZoom == 18) { 
			log.debug("already at best zoom");
			return; 
		}

		log.debug("now at zoom", this._bestZoom, "going deeper");

		let tile = Tile.fromCoords(this._coords, this._bestZoom+1);
		return itemStorage.getTile(tile).then(() => {
			this.computeCoords();
			return this._checkBestPosition();
		});
	}
}
