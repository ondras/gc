!function(a){"use strict";function b(a,b){if("/"===a.charAt(0)&&(a=a.slice(1)),"."!==a.charAt(0))return a;for(var c=a.split("/");"."===c[0]||".."===c[0];)".."===c.shift()&&b.pop();return b.concat(c).join("/")}function c(a){var b=m[a];return b&&!l[a]&&(l[a]=!0,b.execute()),b&&b.proxy}function d(a,b){n[a]=b}function e(a){return n[a]||c(a)}function f(a){return!!n[a]||!!m[a]}function g(a,b){var c=document.createElement("script");c.async&&(c.async=!1),k?c.onreadystatechange=function(){/loaded|complete/.test(this.readyState)&&(this.onreadystatechange=null,b())}:c.onload=c.onerror=b,c.setAttribute("src",a),j.appendChild(c)}function h(a){return new Promise(function(b,c){g((o.baseURL||"/")+a+".js",function(){i&&(o.register(a,i[0],i[1]),i=void 0);var d=m[a];return d?void Promise.all(d.deps.map(function(a){return n[a]||m[a]?Promise.resolve():h(a)})).then(b,c):void c(new Error("Error loading module "+a))})})}var i,j=document.getElementsByTagName("head")[0],k=/MSIE/.test(navigator.userAgent),l=Object.create(null),m=Object.create(null),n=Object.create(null),o={set:d,get:e,has:f,"import":function(a){return new Promise(function(c){var d=b(a,[]),f=e(d);return f?c(f):h(a).then(function(){return e(d)})})},register:function(a,c,d){if(Array.isArray(a))return i=[],void i.push.apply(i,arguments);var f,g,h=Object.create(null),j=Object.create(null);m[a]=f={proxy:h,values:j,deps:c.map(function(c){return b(c,a.split("/").slice(0,-1))}),dependants:[],update:function(a,b){g.setters[f.deps.indexOf(a)](b)},execute:function(){f.deps.map(function(b){var c=n[b];c?f.update(b,c):(c=e(b)&&m[b].values,c&&(m[b].dependants.push(a),f.update(b,c)))}),g.execute()}},g=d(function(b,c){return j[b]=c,f.lock=!0,f.dependants.forEach(function(b){m[b]&&!m[b].lock&&m[b].update(a,j)}),f.lock=!1,Object.getOwnPropertyDescriptor(h,b)||Object.defineProperty(h,b,{enumerable:!0,get:function(){return j[b]}}),c})}};a.System=o}(window);// Production steps of ECMA-262, Edition 6, 22.1.2.1
// Reference: https://people.mozilla.org/~jorendorff/es6-draft.html#sec-array.from
if (!Array.from) {
  Array.from = (function () {
    var toStr = Object.prototype.toString;
    var isCallable = function (fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function (value) {
      var number = Number(value);
      if (isNaN(number)) { return 0; }
      if (number === 0 || !isFinite(number)) { return number; }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function (value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike/*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError("Array.from requires an array-like object - not null or undefined");
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== 'undefined') {
        // 5. else      
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  }());
}
