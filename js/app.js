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

System.register("layer.js", ["items.js"], function (_export) {
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

System.register("list.js", ["layer.js"], function (_export) {
	"use strict";

	var Layer, List;

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_layerJs) {
			Layer = _layerJs["default"];
		}],
		execute: function () {
			List = function List() {
				_classCallCheck(this, List);

				var div = document.createElement("div");
				document.body.appendChild(div);
				div.id = "map";

				var map = new SMap(div, SMap.Coords.fromWGS84(14.16876, 48.66177), 13);
				map.addDefaultControls();
				map.addDefaultLayer(SMap.DEF_TURIST).enable();

				var layer = new Layer(map);
			};

			_export("default", List);
		}
	};
});

System.register("app.js", ["net.js", "list.js"], function (_export) {
  "use strict";

  var net, List;
  return {
    setters: [function (_netJs) {
      net = _netJs;
    }, function (_listJs) {
      List = _listJs["default"];
    }],
    execute: function () {

      new List();
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

