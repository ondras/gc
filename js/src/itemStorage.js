import * as net from "net.js";
import * as pubsub from "pubsub.js";

import Item from "item.js";
import Tile from "tile.js";
import log from "panes/log.js";

let items = Object.create(null);
let usedTiles = Object.create(null);
let emptyTiles = Object.create(null);
let onLine = false;
let timeout = null;

export function getById(id) {
	return items[id];
}

export function getInViewport(map) {
	log.debug("listing viewport");
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
			if (tileHasEmptyParent(tile)) { continue; }

			let promise = this.getTile(tile);
			promises.push(promise);
		}
	}

	return Promise.all(promises)
		.then(() => computeCoords(), () => {})
		.then(() => filterByViewport(map));
}

export function getTile(tile) {
	return net.getTile(tile).then(data => parseTileData(data, tile));
}

export function getNearby(center, limit) {
	let all = [];
	for (let id in items) { all.push(items[id]); }

	all.sort((a, b) => {
		return a.getCoords().distance(center) - b.getCoords().distance(center);
	});

	return all.slice(0, limit);
}

function parseTileData(data, tile) {
	usedTiles[tile] = true;

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
			item.addPosition(tile, ...pos);
		});
	}
}

function computeCoords() {
	for (let id in items) { items[id].computeCoords(); }
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

export function load() {
	let str = localStorage.getItem("gc-items");
	if (!str) { 
		log.debug("localStorage is empty");
		return; 
	}

	let limit = 1000*60*60*24*7; // 7 days
	let now = Date.now();

	try {
		let data = JSON.parse(str);
		for (let id in data) {
			let item = Item.fromData(data[id]);
			if (now - item.getTime() > limit) { 
				log.debug("discarding old", id);
				continue;
			}
			items[id] = item;
		}
	} catch (e) { log.error(e.message); return; }

	log.log("loaded", Object.keys(items).length, "stored items");
}

function save() {
	let obj = Object.create(null);
	for (let id in items) {
		obj[id] = items[id].toData();
	}
	localStorage.setItem("gc-items", JSON.stringify(obj));
	log.debug("saved", Object.keys(obj).length, "items to localStorage");
}

pubsub.subscribe("item-change", (message, publisher, data) => {
	if (timeout) { clearTimeout(timeout); }
	timeout = setTimeout(() => {
		timeout = null;
		save();
	}, 3000);
});
