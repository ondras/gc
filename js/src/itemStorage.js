import * as net from "net.js";
import Item from "item.js";
import Tile from "tile.js";
import log from "log/log.js";

let items = Object.create(null);
let usedTiles = Object.create(null);
let emptyTiles = Object.create(null);

export function getById(id) {
	return items[id];
}

export function getInViewport(map) {
	let half = map.getSize().clone().scale(0.5);
	let w = half.x;
	let h = half.y;

	let proj = map.getProjection();
	let zoom = map.getZoom();
	let center = proj.project(map.getCenter(), zoom);
	let ts = 256;

	let promises = [];

	for (let i=-w; i<w+ts; i+=ts) {
		for (let j=-h; j<h+ts; j+=ts) {
			let tile = Tile.fromPixel(center, i, j, zoom);

			if (tile in usedTiles) { continue; }
			usedTiles[tile] = true;
			if (tileHasEmptyParent(tile)) { continue; }

			let promise = net.getTile(tile).then(data => parseTileData(data, tile));
			promises.push(promise);
		}
	}

	return Promise.all(promises)
		.then(() => computeCoords(proj))
		.then(() => filterByViewport(map));
}

function parseTileData(data, tile) {
	if (!data) { 
		emptyTiles[tile] = tile;
		return;
	}

	data = data.data;
	for (let key in data) {
		let pos = key.match(/\d+/g).map(Number);
		data[key].forEach(record => {
			let id = record.i;
			let item;
			if (id in items) {
				item = items[id];
			} else {
				item = new Item(id, record.n);
				items[id] = item;
			}
			item.addPosition(tile, ...pos)
		});
	}
}

function computeCoords(proj) {
	for (let id in items) { items[id].computeCoords(proj); }
}

function filterByViewport(map) {
	let results = [];

	for (let id in items) {
		let coords = items[id].getCoords();
		if (coords.inMap(map)) { results.push(items[id]); }
	}

	return results;
}

function tileHasEmptyParent(tile) {
	while (tile.zoom) {
		tile = tile.getParent();
		if (tile in emptyTiles) { return true; }
	}
	return false;
}
