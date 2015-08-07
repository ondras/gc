import log from "panes/log.js";
import map from "panes/map.js";
import Tile from "tile.js";
import * as itemStorage from "itemStorage.js";
import * as net from "net.js";
import * as pubsub from "pubsub.js";

export default class Item {
	constructor(id, name) {
		this._id = id;
		this._name = name;
		this._bestZoom = 0;
		this._coords = null;
		this._positions = [];
		this._detail = null;
	}

	getId() { return this._id; }
	getName() { return this._name; }
	getCoords() { return this._coords; }
	getImage(large) {
		if (this._detail) {
			return `tmp/gif-${large ? "large" : "small"}/${this._detail.type.value}.gif`;
		} else {
			return "tmp/unknown.gif";
		}
	}

	buildMarker() {
		let options = {
			title: this._name,
			url: this.getImage(),
			anchor: {left:9, top:9}
		}
		return new SMap.Marker(this._coords, this._id, options);
	}

	build(parent) {
//		log.debug("building item", this._id);
		let heading = document.createElement("h2");
		parent.appendChild(heading);

		let img = document.createElement("img");
		heading.appendChild(img);
		img.src = this.getImage(true);

		heading.appendChild(document.createTextNode(this._name));

		this._checkBestPosition();

		if (this._detail) {
			this._buildDetail(parent);
			if (!this._detail.available) { heading.classList.add("unavailable"); }
		} else {
			net.getDetail(this._id).then((response) => {
				this._detail = response.data[0];
				pubsub.publish("item-change", this);
			});
		}
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
//			log.debug("already at best zoom");
			return; 
		}

//		log.debug("now at zoom", this._bestZoom, "going +1");

		let tile = Tile.fromCoords(this._coords, this._bestZoom+1);
		return itemStorage.getTile(tile).then(() => {
			this.computeCoords();
			pubsub.publish("item-change", this);
			return this._checkBestPosition();
		});
	}

	_buildDetail(parent) {
		let table = document.createElement("table");
		parent.appendChild(table);

		this._buildRow(table, "Type", this._detail.type.text);
		this._buildRow(table, "Date", this._detail.hidden);
		this._buildRow(table, "Created by", this._detail.owner.text);
		this._buildRow(table, "Difficulty", this._detail.difficulty.text);
		this._buildRow(table, "Terrain", this._detail.terrain.text);
		this._buildRow(table, "Size", this._detail.container.text);
		this._buildRow(table, "Favorites", this._detail.fp);
	}

	_buildRow(table, first, second) {
		let row = document.createElement("tr");
		table.appendChild(row);

		let td = document.createElement("td");
		row.appendChild(td);
		td.appendChild(document.createTextNode(first));

		td = document.createElement("td");
		row.appendChild(td);
		td.appendChild(document.createTextNode(second));
	}
}
