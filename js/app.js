System.register("pubsub.js", [], function (_export) {
	"use strict";

	var storage;

	_export("publish", publish);

	_export("subscribe", subscribe);

	_export("unsubscribe", unsubscribe);

	function publish(message, publisher, data) {
		var subscribers = storage[message] || [];
		subscribers.forEach(function (subscriber) {
			typeof subscriber == "function" ? subscriber(message, publisher, data) : subscriber.handleMessage(message, publisher, data);
		});
	}

	function subscribe(message, subscriber) {
		if (!(message in storage)) {
			storage[message] = [];
		}
		storage[message].push(subscriber);
	}

	function unsubscribe(message, subscriber) {
		var index = (storage[message] || []).indexOf(subscriber);
		if (index > -1) {
			storage[message].splice(index, 1);
		}
	}

	return {
		setters: [],
		execute: function () {
			storage = Object.create(null);
		}
	};
});

System.register("panes/log.js", [], function (_export) {
	"use strict";

	var Log;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [],
		execute: function () {
			Log = (function () {
				function Log() {
					_classCallCheck(this, Log);

					this._node = document.querySelector("#log");
					this._ts = Date.now();
				}

				_createClass(Log, [{
					key: "log",
					value: function log() {
						for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
							data[_key] = arguments[_key];
						}

						return this._log("log", data);
					}
				}, {
					key: "debug",
					value: function debug() {
						for (var _len2 = arguments.length, data = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
							data[_key2] = arguments[_key2];
						}

						return this._log("debug", data);
					}
				}, {
					key: "error",
					value: function error() {
						for (var _len3 = arguments.length, data = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
							data[_key3] = arguments[_key3];
						}

						return this._log("error", data);
					}
				}, {
					key: "activate",
					value: function activate() {}
				}, {
					key: "deactivate",
					value: function deactivate() {}
				}, {
					key: "_log",
					value: function _log(type, data) {
						var row = document.createElement("div");
						row.classList.add(type);
						data = data.map(function (item) {
							return typeof item == "object" ? JSON.stringify(item) : item;
						});

						var ts = Date.now();
						var diff = ((ts - this._ts) / 1000).toFixed(3);
						row.innerHTML = "[+" + diff + "] " + data.join(" ");
						this._node.insertBefore(row, this._node.firstChild);

						this._ts = ts;

						console.log.apply(console, _toConsumableArray(data));
					}
				}]);

				return Log;
			})();

			_export("default", new Log());
		}
	};
});

System.register("panes/list.js", [], function (_export) {
	"use strict";

	var List;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [],
		execute: function () {
			List = (function () {
				function List() {
					_classCallCheck(this, List);
				}

				_createClass(List, [{
					key: "activate",
					value: function activate() {}
				}, {
					key: "deactivate",
					value: function deactivate() {}
				}]);

				return List;
			})();

			_export("default", new List());
		}
	};
});

System.register("panes/status.js", ["panes/log.js"], function (_export) {
	"use strict";

	var log, Status;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_panesLogJs) {
			log = _panesLogJs["default"];
		}],
		execute: function () {
			Status = (function () {
				function Status() {
					_classCallCheck(this, Status);

					this._online = document.querySelector("#status #online");
					this._position = document.querySelector("#status #position");

					this._position.className = "waiting";

					window.addEventListener("online", this);
					window.addEventListener("offline", this);

					this._syncOnline();
				}

				_createClass(Status, [{
					key: "activate",
					value: function activate() {}
				}, {
					key: "deactivate",
					value: function deactivate() {}
				}, {
					key: "setPosition",
					value: function setPosition(position, error) {
						if (position) {
							this._position.className = "good";
							this._position.querySelector("span").innerHTML = position.toWGS84(2);
						} else {
							this._position.className = "bad";
							this._position.querySelector("span").innerHTML = error.message;
						}
					}
				}, {
					key: "handleEvent",
					value: function handleEvent(e) {
						log.debug("got", e.type, "event");
						this._syncOnline();
					}
				}, {
					key: "_syncOnline",
					value: function _syncOnline() {
						if (navigator.onLine) {
							log.log("we are online");
							this._online.className = "good";
						} else {
							log.log("we are offline");
							this._online.className = "goobadd";
						}
					}
				}]);

				return Status;
			})();

			_export("default", new Status());
		}
	};
});

System.register("panes/detail.js", ["nav.js", "itemStorage.js", "pubsub.js"], function (_export) {
	"use strict";

	var nav, itemStorage, pubsub, Detail;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_navJs) {
			nav = _navJs;
		}, function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}],
		execute: function () {
			Detail = (function () {
				function Detail() {
					_classCallCheck(this, Detail);

					this._node = document.querySelector("#detail");
				}

				_createClass(Detail, [{
					key: "activate",
					value: function activate() {
						pubsub.subscribe("item-change", this);
					}
				}, {
					key: "deactivate",
					value: function deactivate() {
						pubsub.unsubscribe("item-change", this);
					}
				}, {
					key: "handleMessage",
					value: function handleMessage(message, publisher, data) {
						if (publisher != this._item) {
							return;
						}

						this._build();
					}
				}, {
					key: "show",
					value: function show(id) {
						var item = itemStorage.getById(id);
						if (!item) {
							log.error("item", id, "not in cache");
							return;
						}

						nav.go("detail");

						this._item = item;
						this._build();
					}
				}, {
					key: "_build",
					value: function _build() {
						this._node.innerHTML = "";
						this._item.build(this._node);
					}
				}]);

				return Detail;
			})();

			_export("default", new Detail());
		}
	};
});

System.register("panes/map.js", ["itemStorage.js", "panes/detail.js", "panes/log.js"], function (_export) {
	"use strict";

	var itemStorage, detail, log, Map;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_panesDetailJs) {
			detail = _panesDetailJs["default"];
		}, function (_panesLogJs) {
			log = _panesLogJs["default"];
		}],
		execute: function () {
			Map = (function () {
				function Map() {
					_classCallCheck(this, Map);

					/*
     sz: 	14.1596, 49.41298 15
     lipno: 14.16876, 48.66177 13 
     */
					this._map = new SMap(document.querySelector("#map"), SMap.Coords.fromWGS84(14.16876, 48.66177), 14);
					this._map.addControl(new SMap.Control.Sync({ bottomSpace: 0 }));
					this._map.addDefaultControls();
					this._map.addDefaultLayer(SMap.DEF_TURIST).enable();

					this._markers = new SMap.Layer.Marker();
					this._map.addLayer(this._markers).enable();

					var node = document.createElement("div");
					node.id = "gps";
					var opts = {
						url: node,
						anchor: { left: 10, top: 10 }
					};
					this._positionMarker = new SMap.Marker(SMap.Coords.fromWGS84(0, 0), null, opts);
					this._positionLayer = new SMap.Layer.Marker();
					this._positionLayer.addMarker(this._positionMarker);
					this._map.addLayer(this._positionLayer);

					this._map.getSignals().addListener(this, "map-redraw", "_mapRedraw");
					this._map.getSignals().addListener(this, "marker-click", "_markerClick");
				}

				_createClass(Map, [{
					key: "init",
					value: function init() {
						this._mapRedraw();
					}
				}, {
					key: "activate",
					value: function activate() {
						this._map.syncPort();
					}
				}, {
					key: "deactivate",
					value: function deactivate() {}
				}, {
					key: "getProjection",
					value: function getProjection() {
						return this._map.getProjection();
					}
				}, {
					key: "setPosition",
					value: function setPosition(position) {
						if (position) {
							this._positionMarker.setCoords(position);
							this._positionLayer.enable();
							this._map.setCenter(position);
						} else {
							this._positionLayer.disable();
						}
					}
				}, {
					key: "_mapRedraw",
					value: function _mapRedraw() {
						var _this = this;

						var zoom = this._map.getZoom();
						if (zoom < 13) {
							this._markers.removeAll();
							return;
						}

						itemStorage.getInViewport(this._map).then(function (items) {
							return _this._render(items);
						});
					}
				}, {
					key: "_render",
					value: function _render(items) {
						this._markers.removeAll();

						var markers = items.map(function (item) {
							var coords = item.getCoords();
							return new SMap.Marker(coords, item.getId(), { title: item.getName() });
						});

						this._markers.addMarker(markers);
					}
				}, {
					key: "_markerClick",
					value: function _markerClick(e) {
						detail.show(e.target.getId());
					}
				}]);

				return Map;
			})();

			_export("default", Map);

			_export("default", new Map());
		}
	};
});

System.register("net.js", ["panes/log.js"], function (_export) {
	"use strict";

	var log, tileServers, expando, nonce;

	_export("getTile", getTile);

	_export("getDetail", getDetail);

	function image(url) {
		return new Promise(function (resolve, reject) {
			var node = new Image();
			node.onload = function () {
				node.onload = null;
				resolve(node);
			};
			//		log.debug("requesting image", url);
			node.src = url;
		});
	}

	function jsonp(url) {
		var cb = "jQuery" + expando + "_" + nonce++;
		var script = document.createElement("script");
		script.src = url + "&jsoncallback=" + cb + "&_=" + Date.now();
		//	log.debug("requesting json", script.src);
		var response = null;
		window[cb] = function (data) {
			return response = data;
		};

		return new Promise(function (resolve, reject) {
			script.onload = function (e) {
				script.onload = null;
				delete window[cb];
				resolve(response);
			};
			document.body.appendChild(script);
		});
	}

	function getTile(tile) {
		var server = (tile.x + tile.y) % tileServers + 1;
		var base = "https://tiles0" + server + ".geocaching.com";
		var imgUrl = base + "/map.png?x=" + tile.x + "&y=" + tile.y + "&z=" + tile.zoom + "&ts=1";
		var jsonUrl = base + "/map.info?x=" + tile.x + "&y=" + tile.y + "&z=" + tile.zoom;

		return image(imgUrl).then(function (image) {
			//		log.debug("loaded image size", image.width, image.height);
			if (image.width == 1) {
				return null;
			}
			return jsonp(jsonUrl);
		});
	}

	function getDetail(id) {
		return jsonp("https://tiles01.geocaching.com/map.details?i=" + id);
	}

	return {
		setters: [function (_panesLogJs) {
			log = _panesLogJs["default"];
		}],
		execute: function () {
			tileServers = 4;
			expando = ("1.9.1" + Math.random()).replace(/\D/g, "");
			nonce = Date.now();
		}
	};
});

System.register("itemStorage.js", ["net.js", "item.js", "tile.js", "panes/log.js"], function (_export) {
	"use strict";

	var net, Item, Tile, log, items, usedTiles, emptyTiles;

	_export("getById", getById);

	_export("getInViewport", getInViewport);

	_export("getTile", getTile);

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

	function getById(id) {
		return items[id];
	}

	function getInViewport(map) {
		var half = map.getSize().clone().scale(0.5);
		var w = half.x;
		var h = half.y;

		var proj = map.getProjection();
		var zoom = map.getZoom();
		var center = proj.project(map.getCenter(), zoom);
		var ts = 256;

		var promises = [];

		for (var i = -w; i < w + ts; i += ts) {
			for (var j = -h; j < h + ts; j += ts) {
				var tile = Tile.fromPixel(center, i, j, zoom);

				if (tile in usedTiles) {
					continue;
				}
				usedTiles[tile] = true;
				if (tileHasEmptyParent(tile)) {
					continue;
				}

				var promise = this.getTile(tile);
				promises.push(promise);
			}
		}

		return Promise.all(promises).then(function () {
			return computeCoords();
		}).then(function () {
			return filterByViewport(map);
		});
	}

	function getTile(tile) {
		return net.getTile(tile).then(function (data) {
			return parseTileData(data, tile);
		});
	}

	function parseTileData(data, tile) {
		if (!data) {
			emptyTiles[tile] = tile;
			return;
		}

		data = data.data;

		var _loop = function (key) {
			var pos = key.match(/\d+/g).map(Number);
			data[key].forEach(function (record) {
				var id = record.i;
				var item = undefined;
				if (id in items) {
					item = items[id];
				} else {
					item = new Item(id, record.n);
					items[id] = item;
				}
				item.addPosition.apply(item, [tile].concat(_toConsumableArray(pos)));
			});
		};

		for (var key in data) {
			_loop(key);
		}
	}

	function computeCoords() {
		for (var id in items) {
			items[id].computeCoords();
		}
	}

	function filterByViewport(map) {
		var results = [];

		for (var id in items) {
			var coords = items[id].getCoords();
			if (coords.inMap(map)) {
				results.push(items[id]);
			}
		}

		return results;
	}

	function tileHasEmptyParent(tile) {
		while (tile.zoom) {
			tile = tile.getParent();
			if (tile in emptyTiles) {
				return true;
			}
		}
		return false;
	}
	return {
		setters: [function (_netJs) {
			net = _netJs;
		}, function (_itemJs) {
			Item = _itemJs["default"];
		}, function (_tileJs) {
			Tile = _tileJs["default"];
		}, function (_panesLogJs) {
			log = _panesLogJs["default"];
		}],
		execute: function () {
			items = Object.create(null);
			usedTiles = Object.create(null);
			emptyTiles = Object.create(null);
		}
	};
});

System.register("tile.js", ["panes/map.js"], function (_export) {
	"use strict";

	var map, Tile;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_panesMapJs) {
			map = _panesMapJs["default"];
		}],
		execute: function () {
			Tile = (function () {
				function Tile(x, y, zoom) {
					_classCallCheck(this, Tile);

					this.x = x;
					this.y = y;
					this.zoom = zoom;
				}

				_createClass(Tile, [{
					key: "getParent",
					value: function getParent() {
						return new this.constructor(Math.floor(this.x / 2), Math.floor(this.y / 2), this.zoom - 1);
					}
				}, {
					key: "toPixel",
					value: function toPixel() {
						return new SMap.Pixel(this.x, this.y).scale(256);
					}
				}, {
					key: "toString",
					value: function toString() {
						return this.x + "," + this.y + "," + this.zoom;
					}
				}], [{
					key: "fromPixel",
					value: function fromPixel(center, x, y, zoom) {
						x = Math.floor((center.x + x) / 256);
						y = Math.floor((center.y + y) / 256);
						return new this(x, y, zoom);
					}
				}, {
					key: "fromCoords",
					value: function fromCoords(coords, zoom) {
						var projection = map.getProjection();
						var abs = projection.project(coords, zoom);
						return this.fromPixel(abs, 0, 0, zoom);
					}
				}]);

				return Tile;
			})();

			_export("default", Tile);
		}
	};
});

System.register("app.js", ["nav.js", "geolocation.js", "panes/log.js", "panes/map.js"], function (_export) {
  "use strict";

  var nav, geolocation, log, map;
  return {
    setters: [function (_navJs) {
      nav = _navJs;
    }, function (_geolocationJs) {
      geolocation = _geolocationJs;
    }, function (_panesLogJs) {
      log = _panesLogJs["default"];
    }, function (_panesMapJs) {
      map = _panesMapJs["default"];
    }],
    execute: function () {

      log.log("app starting");
      geolocation.init();
      map.init();

      nav.go("map");
    }
  };
});

System.register("geolocation.js", ["panes/status.js", "panes/map.js", "panes/log.js"], function (_export) {
	"use strict";

	var status, map, log, onPosition, onError;

	_export("init", init);

	function init() {
		var options = {
			enableHighAccuracy: true
		};
		log.debug("requesting watchPosition");
		navigator.geolocation.watchPosition(onPosition, onError, options);
	}

	return {
		setters: [function (_panesStatusJs) {
			status = _panesStatusJs["default"];
		}, function (_panesMapJs) {
			map = _panesMapJs["default"];
		}, function (_panesLogJs) {
			log = _panesLogJs["default"];
		}],
		execute: function () {
			onPosition = function onPosition(position) {
				var coords = SMap.Coords.fromWGS84(position.coords.longitude, position.coords.latitude);
				log.debug("got position", coords.toWGS84());
				status.setPosition(coords, null);
				map.setPosition(coords);
			};

			onError = function onError(error) {
				log.error("lost position", error.message);
				status.setPosition(null, error);
				map.setPosition(null);
			};
		}
	};
});

System.register("nav.js", ["panes/map.js", "panes/list.js", "panes/detail.js", "panes/status.js", "panes/log.js"], function (_export) {
	"use strict";

	var map, list, detail, status, log, current, components, links, ul;

	_export("go", go);

	function go(what) {
		if (current == what) {
			return;
		}

		for (var id in components) {
			var section = document.querySelector("#" + id);
			if (id == what) {
				links[id].classList.add("active");
				section.style.display = "";
			} else {
				links[id].classList.remove("active");
				section.style.display = "none";
			}
		}

		if (current) {
			components[current].deactivate();
		}
		current = what;
		components[current].activate();
	}

	return {
		setters: [function (_panesMapJs) {
			map = _panesMapJs["default"];
		}, function (_panesListJs) {
			list = _panesListJs["default"];
		}, function (_panesDetailJs) {
			detail = _panesDetailJs["default"];
		}, function (_panesStatusJs) {
			status = _panesStatusJs["default"];
		}, function (_panesLogJs) {
			log = _panesLogJs["default"];
		}],
		execute: function () {
			current = "";
			components = { map: map, list: list, detail: detail, status: status, log: log };
			links = {};
			ul = document.querySelector("nav ul");

			Array.from(ul.querySelectorAll("a")).forEach(function (link) {
				links[link.getAttribute("data-section")] = link;
			});

			ul.addEventListener("click", {
				handleEvent: function handleEvent(e) {
					e.preventDefault();
					for (var id in links) {
						if (links[id] == e.target) {
							go(id);
						}
					}
				}
			});
		}
	};
});

System.register("item.js", ["panes/log.js", "panes/map.js", "tile.js", "itemStorage.js", "net.js", "pubsub.js"], function (_export) {
	"use strict";

	var log, map, Tile, itemStorage, net, pubsub, Item;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_panesLogJs) {
			log = _panesLogJs["default"];
		}, function (_panesMapJs) {
			map = _panesMapJs["default"];
		}, function (_tileJs) {
			Tile = _tileJs["default"];
		}, function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_netJs) {
			net = _netJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}],
		execute: function () {
			Item = (function () {
				function Item(id, name) {
					_classCallCheck(this, Item);

					this._id = id;
					this._name = name;
					this._bestZoom = 0;
					this._coords = null;
					this._positions = [];
					this._detail = null;
				}

				_createClass(Item, [{
					key: "getId",
					value: function getId() {
						return this._id;
					}
				}, {
					key: "getName",
					value: function getName() {
						return this._name;
					}
				}, {
					key: "getCoords",
					value: function getCoords() {
						return this._coords;
					}
				}, {
					key: "build",
					value: function build(parent) {
						var _this = this;

						//		log.debug("building item", this._id);
						var heading = document.createElement("h2");
						parent.appendChild(heading);
						heading.appendChild(document.createTextNode(this._name));

						this._checkBestPosition();

						if (this._detail) {
							this._buildDetail(parent);

							if (!this._detail.available) {
								heading.classList.add("unavailable");
							}
						} else {
							net.getDetail(this._id).then(function (response) {
								_this._detail = response.data[0];
								pubsub.publish("item-change", _this);
							});
						}
					}
				}, {
					key: "addPosition",
					value: function addPosition(tile, x, y) {
						if (tile.zoom < this._bestZoom) {
							return;
						} /* worse */

						if (tile.zoom > this._bestZoom) {
							/* better, reset */
							this._positions = [];
							this._bestZoom = tile.zoom;
						}

						/* better or same => push */
						this._positions.push({ tile: tile, x: x, y: y });

						return this;
					}
				}, {
					key: "computeCoords",
					value: function computeCoords() {
						var _this2 = this;

						if (!this._positions.length) {
							return this;
						}

						var bbox = {
							left: Infinity,
							right: -Infinity,
							top: -Infinity,
							bottom: Infinity
						};

						this._positions.forEach(function (position) {
							var wgs = _this2._positionToWGS84(position);
							bbox.left = Math.min(bbox.left, wgs.x);
							bbox.right = Math.max(bbox.right, wgs.x);
							bbox.bottom = Math.min(bbox.bottom, wgs.y);
							bbox.top = Math.max(bbox.top, wgs.y);
						});

						this._coords = SMap.Coords.fromWGS84((bbox.left + bbox.right) / 2, (bbox.top + bbox.bottom) / 2);
						this._positions = [];

						return this;
					}
				}, {
					key: "_positionToWGS84",
					value: function _positionToWGS84(position) {
						var projection = map.getProjection();

						var resolution = 4; // tile pixels per json char
						var tile = position.tile;
						var x = position.x;
						var y = position.y;

						var abs = tile.toPixel();
						abs.x += (x + 0.5) * resolution;
						abs.y += (y + 0.5) * resolution;

						return projection.unproject(abs, tile.zoom);
					}
				}, {
					key: "_checkBestPosition",
					value: function _checkBestPosition() {
						var _this3 = this;

						if (this._bestZoom == 18) {
							//			log.debug("already at best zoom");
							return;
						}

						//		log.debug("now at zoom", this._bestZoom, "going +1");

						var tile = Tile.fromCoords(this._coords, this._bestZoom + 1);
						return itemStorage.getTile(tile).then(function () {
							_this3.computeCoords();
							pubsub.publish("item-change", _this3);
							return _this3._checkBestPosition();
						});
					}
				}, {
					key: "_buildDetail",
					value: function _buildDetail(parent) {
						var table = document.createElement("table");
						parent.appendChild(table);

						this._buildRow(table, "Type", this._detail.type.text);
						this._buildRow(table, "Date", this._detail.hidden);
						this._buildRow(table, "Created by", this._detail.owner.text);
						this._buildRow(table, "Difficulty", this._detail.difficulty.text);
						this._buildRow(table, "Size", this._detail.container.text);
						this._buildRow(table, "Favorites", this._detail.fp);
					}
				}, {
					key: "_buildRow",
					value: function _buildRow(table, first, second) {
						var row = document.createElement("tr");
						table.appendChild(row);

						var td = document.createElement("td");
						row.appendChild(td);
						td.appendChild(document.createTextNode(first));

						td = document.createElement("td");
						row.appendChild(td);
						td.appendChild(document.createTextNode(second));
					}
				}]);

				return Item;
			})();

			_export("default", Item);
		}
	};
});

