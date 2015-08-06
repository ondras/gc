export default function() {
	let node = document.createElement("div");
	node.className = "gps";
	let opts = {
		url: node,
		anchor: {left: 10, top: 10}
	}
	return new SMap.Marker(SMap.Coords.fromWGS84(0, 0), null, opts);	
}
