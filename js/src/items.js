import * as net from "net.js";
import Item from "item.js";

let items = Object.create(null);
let usedTiles = Object.create(null);

export function getById(id) {
	return items[id];
}

export function getInViewport(map) {
	let half = map.getSize().clone().scale(0.5);
	let w = half.x;
	let h = half.y;
	let ts = 256;

	let promises = [];

	for (let i=-w; i<w+ts; i+=ts) {
		for (let j=-h; j<h+ts; j+=ts) {
			let tile = new SMap.Pixel(i, j).toTile(map, ts);
			if (!tile) { continue; }
			if (tile in usedTiles) { continue; }

			usedTiles[tile] = true;

			let promise = net.getTile(tile.x, tile.y, tile.zoom).then(data => parseTileData(data, tile));
			promises.push(promise);
		}
	}

	return Promise.all(promises)
		.then(() => computeCoords(map))
		.then(() => filterByViewport(map));
}

function parseTileData(data, tile) {
	if (!data) { return; }

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

function computeCoords(map) {
	let projection = map.getProjection();
	for (let id in items) { items[id].computeCoords(projection); }
}

function filterByViewport(map) {
	let results = [];

	for (let id in items) {
		let coords = items[id].getCoords();
		if (coords.inMap(map)) { results.push(items[id]); }
	}

	return results;
}
