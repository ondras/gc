/**
 dve optimalizace: 
   1) pokud se ptame na tile a existuje nejaky jeji pyramidovy rodic, co je prazdny, pak je take prazdna
   2) pokud je img 1x1, nemusime se ptat na tile
*/

const tileServers = 4;
const expando = `1.9.1${Math.random()}`.replace(/\D/g, "");
let nonce = Date.now();

function image(url) {
	return new Promise((resolve, reject) => {
		let node = new Image();
		node.onload = () => {
			node.onload = null;
			resolve();
		};
		node.src = url;
	});
}

function jsonp(url) {
	let cb = `jQuery${expando}_${nonce++}`;
	let script = document.createElement("script");
	script.src = `${url}&jsoncallback=${cb}&_=${Date.now()}`;
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

export function getTile(x, y, z) {
	let server = ((x+y) % tileServers) + 1;
	let base = `https://tiles0${server}.geocaching.com`;
	let imgUrl = `${base}/map.png?x=${x}&y=${y}&z=${z}&ts=1`;
	let jsonUrl = `${base}/map.info?x=${x}&y=${y}&z=${z}`;
	return image(imgUrl).then(() => jsonp(jsonUrl));
}

export function getDetail(id) {
	return jsonp(`https://tiles01.geocaching.com/map.details?i=${id}`);
}
