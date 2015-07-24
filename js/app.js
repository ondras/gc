System.register("items.js", ["net.js", "item.js"], function (_export) {
	"use strict";

	var net, Item, items, usedTiles;

	_export("getInViewport", getInViewport);

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

	function getInViewport(map) {
		var half = map.getSize().clone().scale(0.5);
		var w = half.x;
		var h = half.y;
		var ts = 256;

		var promises = [];

		for (var i = -w; i < w + ts; i += ts) {
			var _loop = function (j) {
				var tile = new SMap.Pixel(i, j).toTile(map, ts);
				if (!tile) {
					return "continue";
				}
				if (tile in usedTiles) {
					return "continue";
				}

				usedTiles[tile] = true;

				var promise = net.getTile(tile.x, tile.y, tile.zoom).then(function (data) {
					return parseTileData(data, tile);
				});
				promises.push(promise);
			};

			for (var j = -h; j < h + ts; j += ts) {
				var _ret = _loop(j);

				if (_ret === "continue") continue;
			}
		}

		return Promise.all(promises).then(function () {
			return computeCoords(map);
		}).then(function () {
			return filterByViewport(map);
		});
	}

	function parseTileData(data, tile) {
		if (!data) {
			return;
		}

		data = data.data;

		var _loop2 = function (key) {
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
			_loop2(key);
		}
	}

	function computeCoords(map) {
		var projection = map.getProjection();
		for (var id in items) {
			items[id].computeCoords(projection);
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
	return {
		setters: [function (_netJs) {
			net = _netJs;
		}, function (_itemJs) {
			Item = _itemJs["default"];
		}],
		execute: function () {
			items = {};
			usedTiles = Object.create(null);
		}
	};
});

System.register("list/layer.js", ["items.js"], function (_export) {
	"use strict";

	var items, Layer;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_itemsJs) {
			items = _itemsJs;
		}],
		execute: function () {
			Layer = (function () {
				function Layer(map) {
					_classCallCheck(this, Layer);

					this._map = map;
					this._layer = new SMap.Layer.Marker();
					map.addLayer(this._layer).enable();
					map.getSignals().addListener(this, "map-redraw", "_mapRedraw");

					this._mapRedraw();
				}

				_createClass(Layer, [{
					key: "_mapRedraw",
					value: function _mapRedraw() {
						var _this = this;

						var zoom = this._map.getZoom();
						if (zoom < 13) {
							this._layer.removeAll();
							return;
						}

						items.getInViewport(this._map).then(function (items) {
							return _this._render(items);
						});
					}
				}, {
					key: "_render",
					value: function _render(items) {
						this._layer.removeAll();

						var markers = items.map(function (item) {
							var coords = item.getCoords();
							return new SMap.Marker(coords, null, { title: item.getName() });
						});

						this._layer.addMarker(markers);
					}
				}]);

				return Layer;
			})();

			_export("default", Layer);
		}
	};
});

System.register("list/list.js", ["./layer.js"], function (_export) {
	"use strict";

	var Layer, List;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_layerJs) {
			Layer = _layerJs["default"];
		}],
		execute: function () {
			List = (function () {
				function List() {
					_classCallCheck(this, List);

					var map = new SMap(document.querySelector("#map"), SMap.Coords.fromWGS84(14.16876, 48.66177), 13);
					map.addDefaultControls();
					map.addDefaultLayer(SMap.DEF_TURIST).enable();

					var layer = new Layer(map);
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

System.register("net.js", [], function (_export) {
	"use strict";

	var tileServers, expando, nonce;

	_export("getTile", getTile);

	_export("getDetail", getDetail);

	function jsonp(url) {
		var cb = "jQuery" + expando + "_" + nonce++;
		var script = document.createElement("script");
		script.src = url + "&jsoncallback=" + cb + "&_=" + Date.now();
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

	function getTile(x, y, z) {
		var server = (x + y) % tileServers + 1;
		return jsonp("https://tiles0" + server + ".geocaching.com/map.info?x=" + x + "&y=" + y + "&z=" + z);
	}

	function getDetail(id) {
		return jsonp("https://tiles01.geocaching.com/map.details?i=" + id);
	}

	return {
		setters: [],
		execute: function () {
			tileServers = 4;
			expando = ("1.9.1" + Math.random()).replace(/\D/g, "");
			nonce = Date.now();
		}
	};
});

System.register("log/log.js", [], function (_export) {
	"use strict";

	var Log;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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
					}
				}]);

				return Log;
			})();

			_export("default", new Log());
		}
	};
});

System.register("status/status.js", ["log/log.js"], function (_export) {
	"use strict";

	var log, Status;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_logLogJs) {
			log = _logLogJs["default"];
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

System.register("detail/detail.js", [], function (_export) {
	"use strict";

	var Detail;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [],
		execute: function () {
			Detail = (function () {
				function Detail() {
					_classCallCheck(this, Detail);
				}

				_createClass(Detail, [{
					key: "activate",
					value: function activate() {}
				}, {
					key: "deactivate",
					value: function deactivate() {}
				}]);

				return Detail;
			})();

			_export("default", new Detail());
		}
	};
});

System.register("app.js", ["nav.js", "geolocation.js", "log/log.js"], function (_export) {
  "use strict";

  var nav, geolocation, log;
  return {
    setters: [function (_navJs) {
      nav = _navJs;
    }, function (_geolocationJs) {
      geolocation = _geolocationJs;
    }, function (_logLogJs) {
      log = _logLogJs["default"];
    }],
    execute: function () {

      log.log("app starting");
      geolocation.init();

      nav.go("list");
    }
  };
});

System.register("geolocation.js", ["status/status.js", "log/log.js"], function (_export) {
	"use strict";

	var status, log, onPosition, onError;

	_export("init", init);

	function init() {
		var options = {
			enableHighAccuracy: true
		};
		log.debug("requesting watchPosition");
		navigator.geolocation.watchPosition(onPosition, onError, options);
	}

	return {
		setters: [function (_statusStatusJs) {
			status = _statusStatusJs["default"];
		}, function (_logLogJs) {
			log = _logLogJs["default"];
		}],
		execute: function () {
			onPosition = function onPosition(position) {
				var coords = SMap.Coords.fromWGS84(position.coords.longitude, position.coords.latitude);
				log.debug("got position", coords.toWGS84());
				status.setPosition(coords, null);
			};

			onError = function onError(error) {
				log.error("lost position", error.message);
				status.setPosition(null, error);
			};
		}
	};
});

System.register("nav.js", ["list/list.js", "detail/detail.js", "status/status.js", "log/log.js"], function (_export) {
	"use strict";

	var list, detail, status, log, current, components, links, ul;

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

		current = what;
	}

	return {
		setters: [function (_listListJs) {
			list = _listListJs["default"];
		}, function (_detailDetailJs) {
			detail = _detailDetailJs["default"];
		}, function (_statusStatusJs) {
			status = _statusStatusJs["default"];
		}, function (_logLogJs) {
			log = _logLogJs["default"];
		}],
		execute: function () {
			current = "";
			components = { list: list, detail: detail, status: status, log: log };
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

System.register("item.js", [], function (_export) {
	"use strict";

	var Item;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [],
		execute: function () {
			Item = (function () {
				function Item(id, name) {
					_classCallCheck(this, Item);

					this._id = id;
					this._name = name;
					this._bestZoom = 0;
					this._coords = null;
					this._positions = [];
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
					value: function computeCoords(projection) {
						var _this = this;

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
							var wgs = _this._positionToWGS84(position, projection);
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
					value: function _positionToWGS84(position, projection) {
						var resolution = 64; // units per tile size
						var tile = position.tile;
						var x = position.x;
						var y = position.y;

						var abs = new SMap.Pixel(tile.x, tile.y).scale(tile.tileSize);
						abs.x += (x + 0.5) * (tile.tileSize / resolution);
						abs.y += (y + 0.5) * (tile.tileSize / resolution);

						return projection.unproject(abs, tile.zoom);
					}
				}]);

				return Item;
			})();

			_export("default", Item);
		}
	};
});

