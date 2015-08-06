import * as nav from "nav.js";
import log from "panes/log.js";
import status from "panes/status.js";

log.log("app starting");
nav.go("map");
status.start();
