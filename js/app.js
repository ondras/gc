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

System.register("panes/list.js", ["itemStorage.js", "pubsub.js", "panes/map.js", "panes/detail.js"], function (_export) {
	"use strict";

	var itemStorage, pubsub, map, detail, List;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}, function (_panesMapJs) {
			map = _panesMapJs["default"];
		}, function (_panesDetailJs) {
			detail = _panesDetailJs["default"];
		}],
		execute: function () {
			List = (function () {
				function List() {
					_classCallCheck(this, List);

					this._node = document.querySelector("#list ul");
					this._node.addEventListener("click", this);
				}

				_createClass(List, [{
					key: "activate",
					value: function activate() {
						var _this = this;

						var center = map.getCenter(); /* FIXME *map* center? or geolocation? */
						var items = itemStorage.getNearby(center, 10);

						this._node.innerHTML = "";

						items.forEach(function (item) {
							return _this._buildItem(item);
						});
					}
				}, {
					key: "deactivate",
					value: function deactivate() {}
				}, {
					key: "handleEvent",
					value: function handleEvent(e) {
						var node = e.target;
						while (node && !node.dataset.id) {
							node = node.parentNode;
						}
						detail.show(node.dataset.id);
					}
				}, {
					key: "_buildItem",
					value: function _buildItem(item) {
						var li = document.createElement("li");
						this._node.appendChild(li);
						li.dataset.id = item.getId();

						var img = document.createElement("img");
						li.appendChild(img);
						img.src = item.getImage();

						var name = item.getName();
						li.appendChild(document.createTextNode(name));
					}
				}]);

				return List;
			})();

			_export("default", new List());
		}
	};
});

System.register("panes/status.js", ["panes/log.js", "pubsub.js"], function (_export) {
	"use strict";

	var log, pubsub, Status;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_panesLogJs) {
			log = _panesLogJs["default"];
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}],
		execute: function () {
			Status = (function () {
				function Status() {
					_classCallCheck(this, Status);

					this._online = document.querySelector("#status #online");
					this._position = document.querySelector("#status #position");
					this._orientation = document.querySelector("#status #orientation");

					this._position.className = "waiting";
					if ("ondeviceorientation" in window) {
						this._orientation.className = "waiting";
					}
				}

				_createClass(Status, [{
					key: "start",
					value: function start() {
						window.addEventListener("online", this);
						window.addEventListener("offline", this);
						window.addEventListener("deviceorientation", this);

						this._syncOnline();

						var options = {
							enableHighAccuracy: true
						};

						var onPosition = (function (position) {
							var coords = SMap.Coords.fromWGS84(position.coords.longitude, position.coords.latitude);
							log.debug("got position", coords.toWGS84());

							this._position.className = "good";
							this._position.querySelector("span").innerHTML = coords.toWGS84(2);
							pubsub.publish("position-change", this, { coords: coords });
						}).bind(this);

						var onError = (function (error) {
							log.error("lost position", error.message);

							this._position.className = "bad";
							this._position.querySelector("span").innerHTML = error.message;

							pubsub.publish("position-change", this, { coords: null });
						}).bind(this);

						log.debug("requesting watchPosition");
						navigator.geolocation.watchPosition(onPosition, onError, options);
					}
				}, {
					key: "activate",
					value: function activate() {}
				}, {
					key: "deactivate",
					value: function deactivate() {}
				}, {
					key: "handleEvent",
					value: function handleEvent(e) {
						//		log.debug("got", e.type, "event");

						switch (e.type) {
							case "online":
							case "offline":
								this._syncOnline();
								break;

							case "deviceorientation":
								//				log.debug("alpha", e.alpha);
								this._orientation.className = "good";
								this._orientation.querySelector("span").innerHTML = (e.alpha === null ? "null" : e.alpha.toFixed(2)) + "°";

								pubsub.publish("orientation-change", this, { angle: e.alpha });
								break;
						}
					}
				}, {
					key: "_syncOnline",
					value: function _syncOnline() {
						if (navigator.onLine) {
							log.log("we are online");
							this._online.className = "good";
						} else {
							log.log("we are offline");
							this._online.className = "bad";
						}
						pubsub.publish("network-change", this, { onLine: navigator.onLine });
					}
				}]);

				return Status;
			})();

			_export("default", new Status());
		}
	};
});

System.register("panes/detail.js", ["nav.js", "itemStorage.js", "pubsub.js", "panes/log.js", "positionmarker.js"], function (_export) {
	"use strict";

	var nav, itemStorage, pubsub, log, positionMarker, Detail;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_navJs) {
			nav = _navJs;
		}, function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}, function (_panesLogJs) {
			log = _panesLogJs["default"];
		}, function (_positionmarkerJs) {
			positionMarker = _positionmarkerJs["default"];
		}],
		execute: function () {
			Detail = (function () {
				function Detail() {
					_classCallCheck(this, Detail);

					this._node = document.querySelector("#detail");
					this._distance = this._node.querySelector("#distance");
					this._compass = this._node.querySelector("#compass");

					this._angle = 0;
					this._coords = null;
					this._layers = {
						marker: new SMap.Layer.Marker(),
						tile: null
					};
					this._marker = null;

					this._arrow = this._compass.querySelector(".arrow");

					this._map = new SMap(this._compass.querySelector(".smap"), null, 20);
					this._map.addControl(new SMap.Control.Sync());
					this._layers.tile = this._map.addDefaultLayer(SMap.DEF_TURIST);

					this._map.addLayer(this._layers.marker);

					this._positionMarker = positionMarker();
					this._layers.marker.addMarker(this._positionMarker);

					pubsub.subscribe("orientation-change", this);
					pubsub.subscribe("position-change", this);
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
						switch (message) {
							case "item-change":
								if (publisher != this._item) {
									return;
								}
								this._build();
								break;

							case "orientation-change":
								this._angle = data.angle || 0;
								this._updateRotation();
								break;

							case "position-change":
								this._coords = data.coords;

								this._updateDistance();
								this._updateRotation();

								if (this._coords) {
									this._map.setCenter(this._coords);
									this._positionMarker.setCoords(this._coords);
									for (var p in this._layers) {
										this._layers[p].enable();
									}
								} else {
									for (var p in this._layers) {
										this._layers[p].disable();
									}
								}
								break;
						}
					}
				}, {
					key: "show",
					value: function show(id) {
						log.log("showing detail for", id);
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

						var heading = this._node.querySelector("h2");
						heading.parentNode.insertBefore(this._distance, heading.nextSibling);
						heading.parentNode.insertBefore(this._compass, heading.nextSibling);

						this._updateDistance();
						this._updateRotation();

						var l = this._layers.marker;
						if (this._marker) {
							l.removeMarker(this._marker);
						}
						this._marker = this._item.buildMarker();
						l.addMarker(this._marker);
					}
				}, {
					key: "_updateRotation",
					value: function _updateRotation() {
						/* rotate map */
						this._map.getContainer().style.transform = "rotate(" + this._angle + "deg)";

						/* inverse rotate marker */
						if (this._marker) {
							this._marker.getContainer()[SMap.LAYER_MARKER].style.transform = "rotate(" + -this._angle + "deg)";
						}

						/* rotate arrow */
						var azimuth = 0;
						if (this._coords && this._item) {
							azimuth = this._coords.azimuth(this._item.getCoords());
						}
						/* this._angle CCW, azimuth CW, rotation transform CW */
						this._arrow.style.transform = "rotate(" + (azimuth + this._angle) + "deg)";
					}
				}, {
					key: "_updateDistance",
					value: function _updateDistance() {
						if (!this._coords || !this._item) {
							this._distance.innerHTML = "";
							return;
						}

						var distance = this._coords.distance(this._item.getCoords());
						this._distance.innerHTML = distance.toFixed(2) + "m";
					}
				}]);

				return Detail;
			})();

			_export("default", new Detail());
		}
	};
});

System.register("panes/map.js", ["itemStorage.js", "pubsub.js", "panes/detail.js", "panes/log.js", "positionmarker.js"], function (_export) {
	"use strict";

	var itemStorage, pubsub, detail, log, positionMarker, Map;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}, function (_panesDetailJs) {
			detail = _panesDetailJs["default"];
		}, function (_panesLogJs) {
			log = _panesLogJs["default"];
		}, function (_positionmarkerJs) {
			positionMarker = _positionmarkerJs["default"];
		}],
		execute: function () {
			Map = (function () {
				function Map() {
					_classCallCheck(this, Map);

					/*
     sz: 	14.1596, 49.41298 15
     lipno: 14.16876, 48.66177 13 
     */
					this._map = new SMap(document.querySelector("#map"), SMap.Coords.fromWGS84(14.164768872985832, 48.65760300916347), 14);
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
					this._positionMarker = positionMarker();
					this._positionLayer = new SMap.Layer.Marker();
					this._positionLayer.addMarker(this._positionMarker);
					this._map.addLayer(this._positionLayer);

					this._map.getSignals().addListener(this, "map-redraw", "_mapRedraw");
					this._map.getSignals().addListener(this, "marker-click", "_markerClick");

					pubsub.subscribe("position-change", this);
				}

				_createClass(Map, [{
					key: "activate",
					value: function activate() {
						this._map.syncPort();
					}
				}, {
					key: "deactivate",
					value: function deactivate() {}
				}, {
					key: "getCenter",
					value: function getCenter() {
						return this._map.getCenter();
					}
				}, {
					key: "getProjection",
					value: function getProjection() {
						return this._map.getProjection();
					}
				}, {
					key: "handleMessage",
					value: function handleMessage(message, publisher, data) {
						switch (message) {
							case "position-change":
								if (data.coords) {
									this._positionMarker.setCoords(data.coords);
									this._positionLayer.enable();
									this._map.setCenter(data.coords);
								} else {
									this._positionLayer.disable();
								}
								break;
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
							return item.buildMarker();
						});
						this._markers.addMarker(markers);
					}
				}, {
					key: "_markerClick",
					value: function _markerClick(e) {
						if (e.target == this._positionMarker) {
							return;
						}
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

	_export("getNearby", getNearby);

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

	function getNearby(center, limit) {
		var all = [];
		for (var id in items) {
			all.push(items[id]);
		}

		all.sort(function (a, b) {
			return a.getCoords().distance(center) - b.getCoords().distance(center);
		});

		return all.slice(0, limit);
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

System.register("positionmarker.js", [], function (_export) {
	"use strict";

	return {
		setters: [],
		execute: function () {
			_export("default", function () {
				var node = document.createElement("div");
				node.className = "gps";
				var opts = {
					url: node,
					anchor: { left: 10, top: 10 }
				};
				return new SMap.Marker(SMap.Coords.fromWGS84(0, 0), null, opts);
			});
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

System.register("app.js", ["nav.js", "panes/log.js", "panes/status.js"], function (_export) {
	"use strict";

	var nav, log, status;
	return {
		setters: [function (_navJs) {
			nav = _navJs;
		}, function (_panesLogJs) {
			log = _panesLogJs["default"];
		}, function (_panesStatusJs) {
			status = _panesStatusJs["default"];
		}],
		execute: function () {

			window.addEventListener("error", function (e) {
				log.error(e.error.message);
			});

			log.log("app starting");
			nav.go("map");
			status.start();
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

		location.hash = what;

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

			window.addEventListener("hashchange", {
				handleEvent: function handleEvent(e) {
					var hash = location.hash.substring(1);
					if (hash in components) {
						go(hash);
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
					key: "getImage",
					value: function getImage(large) {
						if (this._detail) {
							return "tmp/gif-" + (large ? "large" : "small") + "/" + this._detail.type.value + ".gif";
						} else {
							return "tmp/unknown.gif";
						}
					}
				}, {
					key: "buildMarker",
					value: function buildMarker() {
						var options = {
							title: this._name,
							url: this.getImage(),
							anchor: { left: 9, top: 9 }
						};
						return new SMap.Marker(this._coords, this._id, options);
					}
				}, {
					key: "build",
					value: function build(parent) {
						var _this = this;

						//		log.debug("building item", this._id);
						var heading = document.createElement("h2");
						parent.appendChild(heading);

						var img = document.createElement("img");
						heading.appendChild(img);
						img.src = this.getImage(true);

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
						this._buildRow(table, "Terrain", this._detail.terrain.text);
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

