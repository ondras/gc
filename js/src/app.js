import * as nav from "nav.js";
import log from "panes/log.js";
import status from "panes/status.js";

window.addEventListener("error", e => {
	log.error(e.error.message);
});

log.log("app starting");
nav.go("map");
status.start();
