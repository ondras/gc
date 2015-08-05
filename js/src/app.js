import * as nav from "nav.js";
import * as geolocation from "geolocation.js";
import log from "panes/log.js";
import map from "panes/map.js";

log.log("app starting")
geolocation.init();
map.init();

nav.go("map");
