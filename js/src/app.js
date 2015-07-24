import * as nav from "nav.js";
import * as geolocation from "geolocation.js";
import log from "log/log.js";

log.log("app starting")
geolocation.init();

nav.go("map");
