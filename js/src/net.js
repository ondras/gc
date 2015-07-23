const tileServers = 4;
const expando = `1.9.1${Math.random()}`.replace(/\D/g, "");
let nonce = Date.now();

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
	return jsonp(`https://tiles0${server}.geocaching.com/map.info?x=${x}&y=${y}&z=${z}`);
}

export function getDetail(id) {
	return jsonp(`https://tiles01.geocaching.com/map.details?i=${id}`);
}
