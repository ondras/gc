let nonce = Date.now();
const expando = `1.9.1${Math.random()}`.replace(/\D/g/, "");

function jsonp(path) {
	x+y
	let server = Math.floor(4*Math.random()) + 1;
	let cb = `jQuery${expando}_${nonce++}`;
	let url `https://tiles${server}.geocaching.com${path}&jsoncallback=${cb}&_=${Date.now()}
	
	let script = document.createElement("script");
	document.body.appendChild(script)

	return new Promise((resolve, reject) => {
		window[cb] = function(data) {
			delete window[cb];
			resolve(data);
		}
	}
}

export function getTile(x, y, z) {
	return jsonp(`/map.info?x=${x}&y=${y}&z=${z}`);
}

export function getDetail(id) {
	return jsonp(`/map.details?i=${id}`);
}
