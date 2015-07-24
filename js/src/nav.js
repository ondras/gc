import map from "map/map.js";
import list from "list/list.js";
import detail from "detail/detail.js";
import status from "status/status.js";
import log from "log/log.js";

let current = "";
let components = {map, list, detail, status, log};

let links = {};
let ul = document.querySelector("nav ul");
Array.from(ul.querySelectorAll("a")).forEach(link => {
	links[link.getAttribute("data-section")] = link;
});

ul.addEventListener("click", {
	handleEvent(e) {
		e.preventDefault();
		for (let id in links) {
			if (links[id] == e.target) { go(id); }
		}
	}
});


export function go(what) {
	if (current == what) { return; }

	for (let id in components) {
		let section = document.querySelector(`#${id}`);
		if (id == what) {
			links[id].classList.add("active");
			section.style.display = "";
		} else {
			links[id].classList.remove("active");
			section.style.display = "none";
		}
	}

	current = what;
}
