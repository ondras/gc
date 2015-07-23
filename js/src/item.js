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

	computeCoords(projection) {
		if (!this._positions.length) { return this; }

		let bbox = {
			left: Infinity,
			right: -Infinity,
			top: -Infinity,
			bottom: Infinity
		};

		this._positions.forEach(position => {
			let wgs = this._positionToWGS84(position, projection);
			bbox.left = Math.min(bbox.left, wgs.x);
			bbox.right = Math.max(bbox.right, wgs.x);
			bbox.bottom = Math.min(bbox.bottom, wgs.y);
			bbox.top = Math.max(bbox.top, wgs.y);
		});

		this._coords = SMap.Coords.fromWGS84((bbox.left+bbox.right)/2, (bbox.top+bbox.bottom)/2);
		this._positions = [];

		return this;
	}


	_positionToWGS84(position, projection) {
		let resolution = 64; // units per tile size
		let {tile, x, y} = position;
		let abs = new SMap.Pixel(tile.x, tile.y).scale(tile.tileSize);
		abs.x += (x+0.5) * (tile.tileSize / resolution);
		abs.y += (y+0.5) * (tile.tileSize / resolution);

		return projection.unproject(abs, tile.zoom);
	}
}
