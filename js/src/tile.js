export default class Tile {
	constructor(x, y, zoom) {
		this.x = x;
		this.y = y;
		this.zoom = zoom;
	}

	static fromPixel(center, x, y, zoom) {
		x = Math.floor((center.x + x) / 256);
		y = Math.floor((center.y + y) / 256);
		return new this(x, y, zoom);
	}
	
	getParent() {
		return new this.constructor(Math.floor(this.x/2), Math.floor(this.y/2), this.zoom-1);
	}
	
	toPixel() {
		return new SMap.Pixel(this.x, this.y).scale(256);
	}
	
	toString() {
		return `${this.x},${this.y},${this.zoom}`;
	}
}
