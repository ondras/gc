import map from "panes/map.js";
import list from "panes/list.js";
import detail from "panes/detail.js";
import status from "panes/status.js";
import log from "panes/log.js";

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

	if (current) { components[current].deactivate(); }
	current = what;
	components[current].activate();
}
