import log from "panes/log.js";
import * as pubsub from "pubsub.js";

const tileServers = 4;
const expando = `1.9.1${Math.random()}`.replace(/\D/g, "");
let nonce = Date.now();

let onLine = false;
pubsub.subscribe("network-change", (message, publisher, data) => {onLine = data.onLine});

function image(url) {
	return new Promise((resolve, reject) => {
		let node = new Image();
		node.onload = () => {
			node.onload = null;
			resolve(node);
		};
//		log.debug("requesting image", url);
		node.src = url;
	});
}

function jsonp(url) {
	let cb = `jQuery${expando}_${nonce++}`;
	let script = document.createElement("script");
	script.src = `${url}&jsoncallback=${cb}&_=${Date.now()}`;
//	log.debug("requesting json", script.src);
	let response = null;
	window[cb] = (data) => response = data;

	return new Promise((resolve, reject) => {
		script.onload = (e) => {
			script.onload = null;
			delete window[cb];
			resolve(response); 
		}
		document.body.appendChild(script);
	});
}

function rejectOffline() {
	let error = new Error("Offline");
	return Promise.reject(error);
}

export function getTile(tile) {
	if (!onLine) { return rejectOffline(); }

	let server = ((tile.x+tile.y) % tileServers) + 1;
	let base = `https://tiles0${server}.geocaching.com`;
	let imgUrl = `${base}/map.png?x=${tile.x}&y=${tile.y}&z=${tile.zoom}&ts=1`;
	let jsonUrl = `${base}/map.info?x=${tile.x}&y=${tile.y}&z=${tile.zoom}`;

	return image(imgUrl).then((image) => {
//		log.debug("loaded image size", image.width, image.height);
		if (image.width == 1) { return null; }
		return jsonp(jsonUrl);
	});
}

export function getDetail(id) {
	if (!onLine) { return rejectOffline(); }
	return jsonp(`https://tiles01.geocaching.com/map.details?i=${id}`);
}
