"use strict";

System.register("app.js", ["nav.js", "itemStorage.js", "panes/log.js", "panes/status.js"], function (_export, _context) {
	var nav, itemStorage, log, status;
	return {
		setters: [function (_navJs) {
			nav = _navJs;
		}, function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_panesLogJs) {
			log = _panesLogJs.default;
		}, function (_panesStatusJs) {
			status = _panesStatusJs.default;
		}],
		execute: function () {

			window.addEventListener("error", function (e) {
				log.error(e.error.message);
			});

			log.log("app starting");
			itemStorage.load();
			nav.go("map");
			status.start();
		}
	};
});

"use strict";

System.register("followcontrol.js", ["pubsub.js"], function (_export, _context) {
	var pubsub, FollowControl;
	return {
		setters: [function (_pubsubJs) {
			pubsub = _pubsubJs;
		}],
		execute: function () {
			FollowControl = JAK.ClassMaker.makeClass({
				NAME: "FollowControl",
				VERSION: "1.0",
				EXTEND: SMap.Control.Visible
			});

			FollowControl.prototype.$constructor = function () {
				SMap.Control.Visible.prototype.$constructor.call(this);
				this._build();

				pubsub.subscribe("position-change", this);
			};

			FollowControl.prototype.handleMessage = function (message, publisher, data) {
				this._checkbox.disabled = !data.coords;
			};

			FollowControl.prototype.handleEvent = function (e) {
				localStorage.setItem("gc-follow", this.isActive() ? "1" : "0");
				pubsub.publish("follow-change", this, { follow: this.isActive() });
			};

			FollowControl.prototype.isActive = function () {
				return this._checkbox.checked;
			};

			FollowControl.prototype._build = function () {
				this._dom.container = document.createElement("label");

				this._checkbox = document.createElement("input");
				this._dom.container.appendChild(this._checkbox);
				this._checkbox.type = "checkbox";
				this._checkbox.disabled = true;
				var stored = localStorage.getItem("gc-follow");
				this._checkbox.checked = stored ? Number(stored) : true;

				this._dom.container.appendChild(document.createTextNode("Follow me"));

				this._checkbox.addEventListener("click", this);
			};

			_export("default", new FollowControl());
		}
	};
});

"use strict";

System.register("item.js", ["panes/log.js", "panes/map.js", "tile.js", "itemStorage.js", "net.js", "pubsub.js"], function (_export, _context) {
	var log, map, Tile, itemStorage, net, pubsub, _createClass, Item;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_panesLogJs) {
			log = _panesLogJs.default;
		}, function (_panesMapJs) {
			map = _panesMapJs.default;
		}, function (_tileJs) {
			Tile = _tileJs.default;
		}, function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_netJs) {
			net = _netJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}],
		execute: function () {
			_createClass = (function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			})();

			Item = (function () {
				function Item(id, name) {
					_classCallCheck(this, Item);

					this._id = id;
					this._name = name;
					this._bestZoom = 0;
					this._coords = null;
					this._positions = [];
					this._detail = null;
					this._ts = Date.now();
				}

				_createClass(Item, [{
					key: "toData",
					value: function toData() {
						return {
							id: this._id,
							name: this._name,
							zoom: this._bestZoom,
							coords: this._coords.toWGS84(),
							detail: this._detail
						};
					}
				}, {
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
					key: "getTime",
					value: function getTime() {
						return this._ts;
					}
				}, {
					key: "getImage",
					value: function getImage(large) {
						if (this._detail) {
							return "img/" + (large ? "large" : "small") + "/" + this._detail.type.value + ".gif";
						} else {
							return "img/unknown.gif";
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
								_this._ts = Date.now();
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
						this._ts = Date.now();
						pubsub.publish("item-change", this);

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

						var d = this._detail;
						this._buildRow(table, "Type", d.type.text);
						this._buildRow(table, "Created", d.owner.text + ", " + d.hidden);
						this._buildRow(table, "Difficulty, Terrain", d.difficulty.text + "/5, " + d.difficulty.text + "/5");
						this._buildRow(table, "Size", d.container.text);
						this._buildRow(table, "Favorites", d.fp);

						var a = document.createElement("a");
						a.target = "_blank";
						a.href = "http://www.geocaching.com/geocache/" + this._id + "_" + encodeURIComponent(this._name);
						a.innerHTML = "geocaching.com";
						this._buildRow(table, "Detail", a);
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
						if (typeof second == "string") {
							td.appendChild(document.createTextNode(second));
						} else {
							td.appendChild(second);
						}
					}
				}], [{
					key: "fromData",
					value: function fromData(data) {
						var item = new this(data.id, data.name);
						item._ts = data.ts;
						item._bestZoom = data.zoom;
						item._coords = SMap.Coords.fromWGS84(data.coords[0], data.coords[1]);
						item._detail = data.detail;
						return item;
					}
				}]);

				return Item;
			})();

			_export("default", Item);
		}
	};
});

"use strict";

System.register("itemStorage.js", ["net.js", "pubsub.js", "item.js", "tile.js", "panes/log.js"], function (_export, _context) {
	var net, pubsub, Item, Tile, log, items, usedTiles, emptyTiles, onLine, timeout;

	function _toConsumableArray(arr) {
		if (Array.isArray(arr)) {
			for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
				arr2[i] = arr[i];
			}

			return arr2;
		} else {
			return Array.from(arr);
		}
	}

	function parseTileData(data, tile) {
		usedTiles[tile] = true;

		if (!data) {
			emptyTiles[tile] = tile;
			return;
		}

		data = data.data;

		var _loop = function _loop(key) {
			var pos = key.match(/\d+/g).map(Number);
			data[key].forEach(function (record) {
				var _item;

				var id = record.i;
				var item = undefined;
				if (id in items) {
					item = items[id];
				} else {
					item = new Item(id, record.n);
					items[id] = item;
				}
				(_item = item).addPosition.apply(_item, [tile].concat(_toConsumableArray(pos)));
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

	function save() {
		var obj = Object.create(null);
		for (var id in items) {
			obj[id] = items[id].toData();
		}
		localStorage.setItem("gc-items", JSON.stringify(obj));
		log.debug("saved", Object.keys(obj).length, "items to localStorage");
	}

	return {
		setters: [function (_netJs) {
			net = _netJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}, function (_itemJs) {
			Item = _itemJs.default;
		}, function (_tileJs) {
			Tile = _tileJs.default;
		}, function (_panesLogJs) {
			log = _panesLogJs.default;
		}],
		execute: function () {
			items = Object.create(null);
			usedTiles = Object.create(null);
			emptyTiles = Object.create(null);
			onLine = false;
			timeout = null;
			function getById(id) {
				return items[id];
			}

			_export("getById", getById);

			function getInViewport(map) {
				log.debug("listing viewport");
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
						if (tileHasEmptyParent(tile)) {
							continue;
						}

						var promise = this.getTile(tile);
						promises.push(promise);
					}
				}

				return Promise.all(promises).then(function () {
					return computeCoords();
				}, function () {}).then(function () {
					return filterByViewport(map);
				});
			}

			_export("getInViewport", getInViewport);

			function getTile(tile) {
				return net.getTile(tile).then(function (data) {
					return parseTileData(data, tile);
				});
			}

			_export("getTile", getTile);

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
			_export("getNearby", getNearby);

			function load() {
				var str = localStorage.getItem("gc-items");
				if (!str) {
					log.debug("localStorage is empty");
					return;
				}

				var limit = 1000 * 60 * 60 * 24 * 7; // 7 days
				var now = Date.now();

				try {
					var data = JSON.parse(str);
					for (var id in data) {
						var item = Item.fromData(data[id]);
						if (now - item.getTime() > limit) {
							log.debug("discarding old", id);
							continue;
						}
						items[id] = item;
					}
				} catch (e) {
					log.error(e.message);return;
				}

				log.log("loaded", Object.keys(items).length, "stored items");
			}
			_export("load", load);

			pubsub.subscribe("item-change", function (message, publisher, data) {
				if (timeout) {
					clearTimeout(timeout);
				}
				timeout = setTimeout(function () {
					timeout = null;
					save();
				}, 3000);
			});
		}
	};
});

"use strict";

System.register("nav.js", ["panes/map.js", "panes/list.js", "panes/detail.js", "panes/status.js", "panes/log.js"], function (_export, _context) {
	var map, list, detail, status, log, current, components, links, ul;
	return {
		setters: [function (_panesMapJs) {
			map = _panesMapJs.default;
		}, function (_panesListJs) {
			list = _panesListJs.default;
		}, function (_panesDetailJs) {
			detail = _panesDetailJs.default;
		}, function (_panesStatusJs) {
			status = _panesStatusJs.default;
		}, function (_panesLogJs) {
			log = _panesLogJs.default;
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
					var hash = location.hash.substring(2);
					if (hash in components) {
						go(hash);
					}
				}
			});

			function go(what) {
				if (current == what) {
					return;
				}

				location.hash = "!" + what;

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

			_export("go", go);
		}
	};
});

"use strict";

System.register("net.js", ["panes/log.js", "pubsub.js"], function (_export, _context) {
	var log, pubsub, tileServers, expando, nonce, onLine;

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

	function rejectOffline() {
		var error = new Error("Offline");
		return Promise.reject(error);
	}

	return {
		setters: [function (_panesLogJs) {
			log = _panesLogJs.default;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}],
		execute: function () {
			tileServers = 4;
			expando = ("1.9.1" + Math.random()).replace(/\D/g, "");
			nonce = Date.now();
			onLine = false;

			pubsub.subscribe("network-change", function (message, publisher, data) {
				onLine = data.onLine;
			});function getTile(tile) {
				if (!onLine) {
					return rejectOffline();
				}

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

			_export("getTile", getTile);

			function getDetail(id) {
				if (!onLine) {
					return rejectOffline();
				}
				return jsonp("https://tiles01.geocaching.com/map.details?i=" + id);
			}

			_export("getDetail", getDetail);
		}
	};
});

"use strict";

System.register("panes/detail.js", ["nav.js", "itemStorage.js", "pubsub.js", "panes/log.js", "positionmarker.js"], function (_export, _context) {
	var nav, itemStorage, pubsub, log, positionMarker, _createClass, Detail;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_navJs) {
			nav = _navJs;
		}, function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}, function (_panesLogJs) {
			log = _panesLogJs.default;
		}, function (_positionmarkerJs) {
			positionMarker = _positionmarkerJs.default;
		}],
		execute: function () {
			_createClass = (function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			})();

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

					this._map = new SMap(this._compass.querySelector(".smap"), null, 18);
					this._map.addControl(new SMap.Control.Sync());
					this._layers.tile = this._map.addDefaultLayer(SMap.DEF_TURIST);

					this._map.addLayer(this._layers.marker);

					this._positionMarker = positionMarker();
					this._layers.marker.addMarker(this._positionMarker);

					pubsub.subscribe("orientation-change", this);
					pubsub.subscribe("position-change", this);
					pubsub.subscribe("network-change", this);
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

							case "network-change":
								if (data.onLine) {
									this._layers.tile.enable();
								} else {
									this._layers.tile.disable();
								}
								break;

							case "position-change":
								this._coords = data.coords;

								this._updateDistance();
								this._updateRotation();

								if (this._coords) {
									this._map.setCenter(this._coords);
									this._positionMarker.setCoords(this._coords);
									this._layers.marker.enable();
								} else {
									this._layers.marker.disable();
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

"use strict";

System.register("panes/list.js", ["itemStorage.js", "pubsub.js", "panes/map.js", "panes/detail.js", "panes/log.js"], function (_export, _context) {
	var itemStorage, pubsub, map, detail, log, _createClass, List;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}, function (_panesMapJs) {
			map = _panesMapJs.default;
		}, function (_panesDetailJs) {
			detail = _panesDetailJs.default;
		}, function (_panesLogJs) {
			log = _panesLogJs.default;
		}],
		execute: function () {
			_createClass = (function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			})();

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

						var center = map.getCenter();
						log.debug("listing around", center.toWGS84());
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

"use strict";

System.register("panes/log.js", [], function (_export, _context) {
	var _createClass, Log;

	function _typeof(obj) {
		return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
	}

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [],
		execute: function () {
			_createClass = (function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			})();

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
							return (typeof item === "undefined" ? "undefined" : _typeof(item)) == "object" ? JSON.stringify(item) : item;
						});

						var ts = Date.now();
						var diff = ((ts - this._ts) / 1000).toFixed(3);
						row.innerHTML = "[+" + diff + "] " + data.join(" ");
						this._node.insertBefore(row, this._node.firstChild);

						this._ts = ts;

						//		console.log(...data);
					}
				}]);

				return Log;
			})();

			_export("default", new Log());
		}
	};
});

"use strict";

System.register("panes/map.js", ["itemStorage.js", "pubsub.js", "panes/detail.js", "panes/log.js", "positionmarker.js", "followcontrol.js"], function (_export, _context) {
	var itemStorage, pubsub, detail, log, positionMarker, followControl, _createClass, Map;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_itemStorageJs) {
			itemStorage = _itemStorageJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}, function (_panesDetailJs) {
			detail = _panesDetailJs.default;
		}, function (_panesLogJs) {
			log = _panesLogJs.default;
		}, function (_positionmarkerJs) {
			positionMarker = _positionmarkerJs.default;
		}, function (_followcontrolJs) {
			followControl = _followcontrolJs.default;
		}],
		execute: function () {
			_createClass = (function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			})();

			Map = (function () {
				function Map() {
					_classCallCheck(this, Map);

					this._layers = {
						tile: null,
						markers: new SMap.Layer.Marker(),
						position: new SMap.Layer.Marker()
					};
					/*
     sz: 	14.1596, 49.41298 15
     lipno: 14.16876, 48.66177 13 
     */
					var center = JSON.parse(localStorage.getItem("gc-center"));
					if (!center) {
						center = [14.164768872985832, 48.65760300916347];
					}
					center = SMap.Coords.fromWGS84(center[0], center[1]);

					var zoom = Number(localStorage.getItem("gc-zoom"));
					if (!zoom) {
						zoom = 14;
					}

					this._map = new SMap(document.querySelector("#map"), center, zoom);
					this._map.addControl(new SMap.Control.Sync({ bottomSpace: 0 }));
					this._map.addDefaultControls();

					this._map.addControl(followControl, { left: "10px", top: "10px" });

					this._layers.tile = this._map.addDefaultLayer(SMap.DEF_TURIST);

					this._map.addLayer(this._layers.markers).enable();

					this._positionMarker = positionMarker();
					this._layers.position.addMarker(this._positionMarker);
					this._map.addLayer(this._layers.position);

					this._map.getSignals().addListener(this, "map-redraw", "_mapRedraw");
					this._map.getSignals().addListener(this, "marker-click", "_markerClick");

					pubsub.subscribe("position-change", this);
					pubsub.subscribe("network-change", this);
					pubsub.subscribe("follow-change", this);
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
									this._layers.position.enable();

									if (followControl.isActive()) {
										this._map.setCenter(data.coords);
									}
								} else {
									this._layers.position.disable();
								}
								break;

							case "network-change":
								if (data.onLine) {
									this._layers.tile.enable();
									this._mapRedraw();
								} else {
									this._layers.tile.disable();
								}
								break;

							case "follow-change":
								if (data.follow) {
									this._map.setCenter(this._positionMarker.getCoords());
								}
								break;
						}
					}
				}, {
					key: "_mapRedraw",
					value: function _mapRedraw() {
						var _this = this;

						localStorage.setItem("gc-center", JSON.stringify(this.getCenter().toWGS84()));
						localStorage.setItem("gc-zoom", this._map.getZoom());

						var zoom = this._map.getZoom();
						if (zoom < 13) {
							this._layers.markers.removeAll();
							return;
						}

						itemStorage.getInViewport(this._map).then(function (items) {
							return _this._render(items);
						});
					}
				}, {
					key: "_render",
					value: function _render(items) {
						this._layers.markers.removeAll();

						var markers = items.map(function (item) {
							return item.buildMarker();
						});
						this._layers.markers.addMarker(markers);
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

"use strict";

System.register("panes/status.js", ["panes/log.js", "pubsub.js"], function (_export, _context) {
	var log, pubsub, _createClass, Status;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_panesLogJs) {
			log = _panesLogJs.default;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}],
		execute: function () {
			_createClass = (function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			})();

			Status = (function () {
				function Status() {
					_classCallCheck(this, Status);

					this._network = document.querySelector("#status #network");
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
								this._orientation.querySelector("span").innerHTML = e.alpha === null ? "null" : e.alpha.toFixed(2) + "°";

								pubsub.publish("orientation-change", this, { angle: e.alpha });
								break;
						}
					}
				}, {
					key: "_syncOnline",
					value: function _syncOnline() {
						if (navigator.onLine) {
							log.log("we are online");
							this._network.className = "good";
						} else {
							log.log("we are offline");
							this._network.className = "bad";
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

"use strict";

System.register("persistentStorage.js", [], function (_export, _context) {
  return {
    setters: [],
    execute: function () {}
  };
});

"use strict";

System.register("positionmarker.js", [], function (_export, _context) {
	_export("default", function () {
		var node = document.createElement("div");
		node.className = "gps";
		var opts = {
			url: node,
			anchor: { left: 10, top: 10 }
		};
		return new SMap.Marker(SMap.Coords.fromWGS84(0, 0), null, opts);
	});

	return {
		setters: [],
		execute: function () {}
	};
});

"use strict";

System.register("pubsub.js", [], function (_export, _context) {
	var storage;
	return {
		setters: [],
		execute: function () {
			storage = Object.create(null);
			function publish(message, publisher, data) {
				var subscribers = storage[message] || [];
				subscribers.forEach(function (subscriber) {
					typeof subscriber == "function" ? subscriber(message, publisher, data) : subscriber.handleMessage(message, publisher, data);
				});
			}

			_export("publish", publish);

			function subscribe(message, subscriber) {
				if (!(message in storage)) {
					storage[message] = [];
				}
				storage[message].push(subscriber);
			}

			_export("subscribe", subscribe);

			function unsubscribe(message, subscriber) {
				var index = (storage[message] || []).indexOf(subscriber);
				if (index > -1) {
					storage[message].splice(index, 1);
				}
			}

			_export("unsubscribe", unsubscribe);
		}
	};
});

"use strict";

System.register("tile.js", ["panes/map.js"], function (_export, _context) {
	var map, _createClass, Tile;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_panesMapJs) {
			map = _panesMapJs.default;
		}],
		execute: function () {
			_createClass = (function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			})();

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

