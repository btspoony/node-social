/*
 * Renren JavaScript SDK v1.0 http://dev.renren.com/
 *  
 * JavaScript SDK用以调用人人网开放API，目前实现了对Auth API和Dialog API的调用封装。
 * 本文件的部份代码由MooTools，FaceBook js sdk等修改而来。
 * 
 * Version: 1.0 
 * Date: 2011-06-01 14:24 
 * 
 */
(function(window) {
/**
 * 引入方式：<br/>
 * &lt;script type="text/javascript" src="url to this js file"&gt;&lt;/script&gt;<br/>
 * js sdk在加载解释阶段不会改变文档的内容，可加上defer等属性以加快加载速度：<br/>
 * &lt;script type="text/javascript" src="url to this js file" charset="utf-8" defer="defer"&gt;&lt;/script&gt;
 * @class 全局范围内可访问对象，各种公开接口的入口
 * @static
 */
var Renren = {
	
	options : {},

	/**
	 * 初始化sdk，建议在dom加载完成后调用，或在&lt;body&gt;下的&lt;script&gt;标签中调用。
	 * @param options {Object} 
	 * @param options.appId {number}
	 *            应用id，如此处设值，在其它需要app id值时，如用Renren.ui调用dialog时可不用设app_id参数
	 * @param options.originPath {String} (optional)
	 *            用于构成跨域的origin值，origin用以唯一标识当前加载的页面，默认情况下 origin =
	 *            location.protocol + '//' + location.host + '/' + 随机字符串;
	 *            一般不需要设置此值，此值存在则 origin = location.protocol + '//' +
	 *            location.host + '/' + options.originPath
	 * @example Renren.init({appId:29706});           
	 */
	init : function(options) {
		this.options = merge.apply(null, append([{}, this.options], arguments));
		XD.init(this.options);
	}
},

rrUrls = {
	widget : 'http://widget.renren.com/',
	rrstatic : 'http://s.xnimg.cn/',
	apps : 'http://apps.renren.com/',
	graph : 'http://graph.renren.com/',
	graph_https : 'https://graph.renren.com/',
	callback : 'http://widget.renren.com/xd_callback.html',
	widgetOrigin : 'http://widget.renren.com'
};
/**
 * #@+
 * 
 * @private
 */
var overloadSetter = function(fn) {
	return function(s, a, b) {
		if (a == null)
			return s;
		if (typeof a != 'string') {
			for (var k in a)
				fn.call(s, k, a[k]);
		} else {
			fn.call(s, a, b);
		}
		return s;
	};
},

typeOf = function(item) {
	if (item == null)
		return 'null';
	if (item instanceof String || typeof item == 'string')
		return 'string';
	if (item instanceof Array)
		return 'array';
	if (item.nodeName) {
		if (item.nodeType == 1)
			return 'element';
		if (item.nodeType == 3)
			return (/\S/).test(item.nodeValue) ? 'textnode' : 'whitespace';
	} else if (typeof item.length == 'number') {
		if (item.callee)
			return 'arguments';
		if ('item' in item)
			return 'collection';
	}
	return typeof item;
},

guid = function() {
	return (Math.random() * (1 << 30)).toString(36).replace('.', '');
},

extend = overloadSetter(function(key, value) {
			this[key] = value;
		}),

implement = overloadSetter(function(key, value) {
			this.prototype[key] = value;
		}),

bind = function(fn, thisobj, args) {
	return function() {
		if (!args && !arguments.length)
			return fn.call(thisobj);
		if (args && arguments.length)
			return fn.apply(thisobj, args.concat(Array.from(arguments)));
		return fn.apply(thisobj, args || arguments);
	};
},

cloneOf = function(item) {
	switch (typeOf(item)) {
		case 'array' :
		case 'object' :
			return clone(item);
		default :
			return item;
	}
},

clone = function(original) {
	if (typeOf(original) == 'array') {
		var i = original.length, clone = new Array(i);
		while (i--)
			clone[i] = cloneOf(original[i]);
		return clone;
	} else if (typeOf(original) == 'string') {
		return new String(original);
	}
	var clone = {};
	for (var key in original)
		clone[key] = cloneOf(original[key]);
	return clone;
},

forEach = function(object, fn, bind) {
	if (typeOf(object) == 'array') {
		for (var i = 0, l = object.length; i < l; i++) {
			if (i in object)
				fn.call(bind, object[i], i, object);
		}
	} else
		for (var key in object) {
			if (Object.prototype.hasOwnProperty.call(object, key))
				fn.call(bind, object[key], key, object);
		}
},

indexOf = function(array, item, from) {
	var len = array.length;
	for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++) {
		if (array[i] === item)
			return i;
	}
	return -1;
},

mergeOne = function(source, key, current) {
	switch (typeOf(current)) {
		case 'object' :
			if (typeOf(source[key]) == 'object')
				merge(source[key], current);
			else
				source[key] = clone(current);
			break;
		case 'array' :
			source[key] = clone(current);
			break;
		default :
			source[key] = current;
	}
	return source;
},

merge = function(source, k, v) {
	if (typeOf(k) == 'string')
		return mergeOne(source, k, v);
	for (var i = 1, l = arguments.length; i < l; i++) {
		var object = arguments[i];
		for (var key in object)
			mergeOne(source, key, object[key]);
	}
	return source;
},

combineOne = function(source, key, value) {
	var st = typeOf(source[key]);
	switch (typeOf(value)) {
		case 'object' :
		case 'array' :
			if (st == 'object')
				combine(source[key], value);
			else if (st == 'array') {
				var array = clone(value);
				for (var i = 0, l = array.length; i < l; i++) {
					if (indexOf(source[key], array[i]) == -1)
						source[key].push(array[i]);
				}
			} else if (st == 'null')
				source[key] = clone(value);
			break;
		default :
			if (st == 'null')
				source[key] = value;
	}
	return source;
},

combine = function(source, k, v) {
	if (typeOf(k) == 'string')
		return combineOne(source, k, v);
	for (var i = 1, l = arguments.length; i < l; i++) {
		var object = arguments[i];
		for (var key in object)
			combineOne(source, key, object[key]);
	}
	return source;
},

append = function(original) {
	for (var i = 1, l = arguments.length; i < l; i++) {
		if (typeOf(original) == 'array') {
			var atp = typeOf(arguments[i]);
			if (atp == 'array' || atp == 'arguments') {
				for (var j = 0, lg = arguments[i].length; j < lg; j++)
					original.push(arguments[i][j]);
			} else if (atp != 'null')
				original.push(arguments[i]);
		} else {
			var extended = arguments[i] || {};
			for (var key in extended)
				original[key] = extended[key];
		}
	}
	return original;
},

parsePiece = function(key, val, base) {
	var sliced = /([^\]]*)\[([^\]]*)\](.*)?/.exec(key);
	if (!sliced) {
		base[key] = val;
		return;
	}
	var prop = sliced[1], subp = sliced[2], others = sliced[3];
	if (!isNaN(subp)) {
		var numVal = +subp;
		if (subp === numVal.toString(10)) {
			subp = numVal;
		}
	}
	base[prop] = base[prop] || (typeof subp == 'number' ? [] : {});
	if (others == null)
		base[prop][subp] = val;
	else
		parsePiece('' + subp + others, val, base[prop]);
},

fromQueryString = function(qs) {
	var decode = function(s) {
		return decodeURIComponent(s.replace(/\+/g, ' '));
	}, params = {}, parts = qs.split('&'), pair, val;
	for (var i = 0; i < parts.length; i++) {
		pair = parts[i].split('=', 2);
		if (pair && pair.length == 2) {
			val = decode(pair[1]);
			if (typeOf(val) == 'string') {
				val = val.replace(/^\s+|\s+$/g, '');
				// convert numerals to numbers
				if (!isNaN(val)) {
					numVal = +val;
					if (val === numVal.toString(10)) {
						val = numVal;
					}
				}
			}
			parsePiece(decode(pair[0]), val, params);
		}
	}
	return params;
},

toQueryString = function(object, base) {
	var queryString = [];
	forEach(object, function(value, key) {
				if (base)
					key = base + '[' + key + ']';
				var result;
				switch (typeOf(value)) {
					case 'object' :
						result = toQueryString(value, key);
						break;
					case 'array' :
						var qs = {};
						forEach(value, function(val, i) {
									qs[i] = val;
								});
						result = toQueryString(qs, key);
						break;
					case 'string' :
					case 'number' :
						result = encodeURIComponent(key) + '='
								+ encodeURIComponent(value);
						break;
				}
				if (result && value != null)
					queryString.push(result);
			});
	return queryString.join('&');
},

special = {
	'\b' : '\\b',
	'\t' : '\\t',
	'\n' : '\\n',
	'\f' : '\\f',
	'\r' : '\\r',
	'"' : '\\"',
	'\\' : '\\\\'
},

escape = function(chr) {
	return special[chr] || '\\u'
			+ ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
},

validateJSON = function(string) {
	string = string
			.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
			.replace(
					/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
					']').replace(/(?:^|:|,)(?:\s*\[)+/g, '');
	return (/^[\],:{}\s]*$/).test(string);
},

parseJSON = function(string) {
	if (!string || typeOf(string) != 'string')
		return null;
	if (window.JSON && window.JSON.parse)
		return window.JSON.parse(string);
	if (!validateJSON(string))
		throw new Error("Invalid JSON: " + string);
	return eval('(' + string + ')');
},

toJSON = window.JSON && window.JSON.stringify ? function(obj) {
	return window.JSON.stringify(obj);
} : function(obj) {
	if (obj && obj.toJSON)
		obj = obj.toJSON();
	switch (typeOf(obj)) {
		case 'string' :
			return '"' + obj.replace(/[\x00-\x1f\\"]/g, escape) + '"';
		case 'array' :
			var string = [];
			forEach(obj, function(value, key) {
						var json = toJSON(value);
						if (json)
							string.push(json);
					});
			return '[' + string + ']';
		case 'object' :
			var string = [];
			forEach(obj, function(value, key) {
						var json = toJSON(value);
						if (json)
							string.push(toJSON(key) + ':' + json);
					});
			return '{' + string + '}';
		case 'number' :
		case 'boolean' :
			return '' + obj;
		case 'null' :
			return 'null';
	}
	return null;
};
/** #@- */
/**
 * #@+
 * 
 * @class 模拟面向对象中的“类”
 * @private
 */
var Class = function(params) {
	if (params instanceof Function)
		params = {
			initialize : params
		};

	var newClass = function() {
		reset(this);
		if (newClass.$prototyping)
			return this;
		this.$caller = null;
		var value = (this.initialize)
				? this.initialize.apply(this, arguments)
				: this;
		this.$caller = this.caller = null;
		return value;
	};
	Class.prototype.implement.call(newClass, params);

	newClass.constructor = Class;
	newClass.prototype.constructor = newClass;
	newClass.prototype.parent = parent;

	return newClass;
};
/**
 * 
 * 
 * @private
 */
var parent = function() {
	if (!this.$caller)
		throw new Error('The method "parent" cannot be called.');
	var name = this.$caller.$name, parent = this.$caller.$owner.parent, previous = (parent)
			? parent.prototype[name]
			: null;
	if (!previous)
		throw new Error('The method "' + name + '" has no parent.');
	return previous.apply(this, arguments);
};

var reset = function(object) {
	for (var key in object) {
		var value = object[key];
		switch (typeOf(value)) {
			case 'object' :
				var F = function() {
				};
				F.prototype = value;
				object[key] = reset(new F());
				break;
			case 'array' :
				object[key] = clone(value);
				break;
		}
	}
	return object;
};

var wrap = function(self, key, method) {
	if (method.$origin)
		method = method.$origin;
	var wrapper = function() {
		if (method.$protected && this.$caller == null)
			throw new Error('The method "' + key + '" cannot be called.');
		var caller = this.caller, current = this.$caller;
		this.caller = current;
		this.$caller = wrapper;
		var result = method.apply(this, arguments);
		this.$caller = current;
		this.caller = caller;
		return result;
	};
	extend(wrapper, {
				$owner : self,
				$origin : method,
				$name : key
			});
	return wrapper;
};

var implement = function(key, value, retain) {
	if (Class.Mutators.hasOwnProperty(key)) {
		value = Class.Mutators[key].call(this, value);
		if (value == null)
			return this;
	}

	if (typeof value == 'function') {
		this.prototype[key] = (retain) ? value : wrap(this, key, value);
	} else {
		merge(this.prototype, key, value);
	}

	return this;
};

var getInstance = function(klass) {
	klass.$prototyping = true;
	var proto = new klass;
	delete klass.$prototyping;
	return proto;
};

var removeOn = function(string) {
	return string.replace(/^on([A-Z])/, function(full, first) {
				return first.toLowerCase();
			});
};

Class.overloadSetter = function(fn) {
	return function(a, b) {
		if (a == null)
			return this;
		if (typeof a != 'string') {
			for (var k in a)
				fn.call(this, k, a[k]);
		} else {
			fn.call(this, a, b);
		}
		return this;
	};
};

Class.prototype.implement = Class.overloadSetter(implement);

Class.Mutators = {

	Extends : function(parent) {
		this.parent = parent;
		this.prototype = getInstance(parent);
	},

	Implements : function(items) {
		forEach(items, function(item) {
					var instance = new item;
					for (var key in instance)
						implement.call(this, key, instance[key], true);
				}, this);
	}
};
/** #@- */

var Events = new Class({
			$events : {},

			addEvent : function(type, fn, internal) {
				type = removeOn(type);
				this.$events[type] = (this.$events[type] || []);
				if (indexOf(this.$events[type], fn) == -1)
					this.$events[type].push(fn);
				if (internal)
					fn.internal = true;
				return this;
			},

			addEvents : function(events) {
				for (var type in events)
					this.addEvent(type, events[type]);
				return this;
			},

			fireEvent : function(type, args, delay) {
				type = removeOn(type);
				var events = this.$events[type];
				if (!events)
					return this;
				args = args || [];
				var t = typeOf(args);
				if (t != 'array' && t != 'arguments')
					args = [args];
				forEach(events, function(fn) {
							if (delay != null) {
								var self = this;
								window.setTimeout(function() {
											return fn.apply(self, args);
										}, delay);
							} else
								fn.apply(this, args);
						}, this);
				return this;
			},

			removeEvent : function(type, fn) {
				type = removeOn(type);
				var events = this.$events[type];
				if (events && !fn.internal) {
					var index = indexOf(events, fn);
					if (index != -1)
						delete events[index];
				}
				return this;
			},

			removeEvents : function(events) {
				var type;
				if (typeOf(events) == 'object') {
					for (type in events)
						this.removeEvent(type, events[type]);
					return this;
				}
				if (events)
					events = removeOn(events);
				for (type in this.$events) {
					if (events && events != type)
						continue;
					var fns = this.$events[type];
					for (var i = fns.length; i--;)
						if (i in fns) {
							this.removeEvent(type, fns[i]);
						}
				}
				return this;
			}

		});

var Options = new Class({
			setOptions : function() {
				var options = this.options = merge.apply(null, append([{},
										this.options], arguments));
				if (this.addEvent)
					for (var option in options) {
						if (typeof options[option] != 'function'
								|| !(/^on[A-Z]/).test(option))
							continue;
						this.addEvent(option, options[option]);
						delete options[option];
					}
				return this;
			}
		});
/**
 * @namespace 处理浏览器和flash插件识别
 * @private
 */
var Browser = {
	getBrowser : function() {
		if (!Browser.browser) {
			var ua = navigator.userAgent.toLowerCase(), platform = navigator.platform
					.toLowerCase(), UA = ua
					.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/)
					|| [null, 'unknown', 0], mode = UA[1] == 'ie'
					&& document.documentMode;

			Browser.browser = {
				name : (UA[1] == 'version') ? UA[3] : UA[1],

				version : mode
						|| parseFloat((UA[1] == 'opera' && UA[4])
								? UA[4]
								: UA[2]),

				platform : ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua
						.match(/(?:webos|android)/)
						|| platform.match(/mac|win|linux/) || ['other'])[0]
			}
		}
		return Browser.browser;
	},

	getFlash : function() {
		if (!Browser.flash) {
			var version = '0 r0';
			try {
				version = navigator.plugins['Shockwave Flash'].description;
			} catch (e) {
				try {
					version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
							.GetVariable('$version');
				} catch (ex) {
				}
			}
			version = version.match(/\d+/g);
			Browser.flash = {
				version : Number(version[0] || '0.' + version[1]) || 0,
				build : Number(version[2]) || 0
			};
		}
		return Browser.flash;
	}
};
/**
 * @namespace 对进行跨域通信用的flash swf文件的封装
 * @private
 */
var Flash = {
	url : rrUrls.rrstatic + 'connect/swf/XdComm.swf',

	name : 'RenrenXdSwf',

	callbacks : [],

	init : function() {
		if (Flash.inited) {
			return;
		}
		Flash.inited = true;
		var html = ('<object type="application/x-shockwave-flash" id="'
				+ Flash.name
				+ '" data="'
				+ Flash.url
				+ '"'
				+ (!!document.attachEvent
						? ' name="'
								+ Flash.name
								+ '" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"'
						: '')
				+ ' width="0" height="0"><param name="movie" value="'
				+ Flash.url + '"></param><param name="allowScriptAccess" value="always"></param><param name="flashVars" value="onReady=Renren.onFlashReady"/></object>');
		Dom.appendHidden(html);
	},

	onFlashReady : function() {
		Flash.XdComm = document[Flash.name];
		for (var i = 0, l = Flash.callbacks.length; i < l; i++) {
			Flash.callbacks[i]();
		}
		Flash.callbacks = [];
	},

	hasMinVersion : function() {
		return Browser.getFlash().version >= 9; // doesn't check strictly
	},

	onReady : function(cb) {
		Flash.init();
		if (Flash.XdComm) {
			window.setTimeout(function() {
						cb()
					}, 0);
		} else {
			Flash.callbacks.push(cb);
		}
	},

	initPostMessage : function(cb, origin) {
		return Flash.XdComm.postMessage_init(cb, origin);
	},

	postMessage : function(message, targetOrigin) {
		return Flash.XdComm.postMessage_send(message, targetOrigin);
	},

	sendXdHttpRequest : function(method, url, params, headers, callback, reqId) {
		return Flash.XdComm.sendXdHttpRequest(method, url, params, headers,
				callback, reqId);
	}
}
/**
 * @namespace DOM操作封装
 * @private
 */
var Dom = {
	root : null,
	hiddenRoot : null,
	callbacks : {},

	/**
	 * Append some content.
	 * 
	 * @param content
	 *            {String|Node} a DOM Node or HTML string
	 * @param root
	 *            {Node} (optional) a custom root node
	 * @return {Node} the node that was just appended
	 */
	append : function(content, root) {
		if (!root) {
			if (!Dom.root) {
				Dom.root = document.getElementById('renren-root');
				if (!Dom.root) {
					Dom.root = document.createElement('div');
					Dom.root.id = 'renren-root';
					(document.body || document.getElementsByTagName('body')[0])
							.appendChild(Dom.root);
				}
			}
			root = Dom.root;
		}

		if (typeof content == 'string') {
			var div = document.createElement('div');
			root.appendChild(div).innerHTML = content;
			return div;
		} else {
			return root.appendChild(content);
		}
	},

	/**
	 * Append some hidden content.
	 * 
	 * @param content
	 *            {String|Node} a DOM Node or HTML string
	 * @return {Node} the node that was just appended
	 */
	appendHidden : function(content) {
		if (!Dom.hiddenRoot) {
			var hiddenRoot = document.createElement('div'), style = hiddenRoot.style;
			style.positon = 'absolute';
			style.top = '-10000px';
			style.width = style.height = '0px';
			Dom.hiddenRoot = Dom.append(hiddenRoot);
		}
		return Dom.append(content, Dom.hiddenRoot);
	},

	onIframeReady : function(cbId) {
		var cb = Dom.callbacks[cbId];
		cb && cb();
	},

	/**
	 * Insert a new iframe. Unfortunately, its tricker than you imagine.
	 * 
	 * NOTE: These iframes have no border, overflow hidden and no scrollbars.
	 * 
	 * The opts can contain: root DOMElement required root node (must be empty)
	 * url String required iframe src attribute className String optional class
	 * attribute height Integer optional height in px id String optional id
	 * attribute name String optional name attribute onload Function optional
	 * onload handler width Integer optional width in px
	 * 
	 * @param opts
	 *            {Object} the options described above
	 */
	insertIframe : function(opts) {
		opts.id = opts.id || guid();
		opts.name = opts.name || guid();

		// Since we set the src _after_ inserting the iframe node into the
		// DOM,
		// some browsers will fire two onload events, once for the first
		// empty
		// iframe insertion and then again when we set the src. Here some
		// browsers are Webkit browsers which seem to be trying to do the
		// "right thing". So we toggle this boolean right before we expect
		// the
		// correct onload handler to get fired.
		var srcSet = false, onloadDone = false;
		Dom.callbacks[opts.id] = function() {
			if (srcSet && !onloadDone) {
				onloadDone = true;
				opts.onload && opts.onload(opts.root.firstChild);
				delete Dom.callbacks[opts.id];
			}
		};

		if (document.attachEvent) {
			var html = ('<iframe id="'
					+ opts.id
					+ '" name="'
					+ opts.name
					+ '"'
					+ (opts.className ? ' class="' + opts.className + '"' : '')
					+ ' style="border:none;'
					+ (opts.width ? 'width:' + opts.width + 'px;' : '')
					+ (opts.height ? 'height:' + opts.height + 'px;' : '')
					+ '" src="'
					+ opts.url
					+ '" frameborder="0" scrolling="no" allowtransparency="true"'
					+ ' onload="Renren.onIframeReady(\'' + opts.id + '\')"' + '></iframe>');

			// There is an IE bug with iframe caching that we have to work
			// around. We
			// need to load a dummy iframe to consume the initial cache
			// stream. The
			// setTimeout actually sets the content to the HTML we created
			// above, and
			// because its the second load, we no longer suffer from cache
			// sickness.
			// It must be javascript:false instead of about:blank, otherwise
			// IE6 will
			// complain in https.
			// Since javascript:false actually result in an iframe
			// containing the
			// string 'false', we set the iframe height to 1px so that it
			// gets loaded
			// but stays invisible.
			opts.root.innerHTML = '<iframe src="javascript:false" frameborder="0" scrolling="no" style="height:1px;"></iframe>';

			// Now we'll be setting the real src.
			srcSet = true;

			// You may wonder why this is a setTimeout. Read the IE source
			// if you can
			// somehow get your hands on it, and tell me if you figure it
			// out. This
			// is a continuation of the above trick which apparently does
			// not work if
			// the innerHTML is changed right away. We need to break apart
			// the two
			// with this setTimeout 0 which seems to fix the issue.
			window.setTimeout(function() {
						opts.root.innerHTML = html;
					}, 0);
		} else {
			// This block works for alls non IE browsers. But it's
			// specifically
			// designed for FF where we need to set the src after inserting
			// the
			// iframe node into the DOM to prevent cache issues.
			var node = document.createElement('iframe');
			node.id = opts.id;
			node.name = opts.name;
			node.onload = Dom.callbacks[opts.id];
			node.style.border = 'none';
			node.style.overflow = 'hidden';
			if (opts.className) {
				node.className = opts.className;
			}
			if (opts.height) {
				node.style.height = opts.height + 'px';
			}
			if (opts.width) {
				node.style.width = opts.width + 'px';
			}
			opts.root.appendChild(node);
			// Now we'll be setting the real src.
			srcSet = true;
			node.src = opts.url;
		}
	},

	/**
	 * Dynamically generate a &lt;form&gt; and POST it to the given target.
	 * 
	 * @protected
	 * @param options
	 *            {Object} the options
	 */
	postTarget : function(options) {
		var form = document.createElement('form');
		form.action = options.url;
		form.target = options.target;
		form.method = 'POST';
		form.acceptCharset = "utf-8";
		forEach(options.params, function(val, key) {
					if (val !== null && val !== undefined) {
						var input = document.createElement('input');
						input.name = key;
						input.value = val;
						form.appendChild(input);
					}
				});
		Dom.appendHidden(form);
		try {
			form.submit(); // popup block
		} finally {
			form.parentNode.removeChild(form);
		}
	},

	popupWindow : function(opts) {
		var screenX = typeof window.screenX != 'undefined'
				? window.screenX
				: window.screenLeft, screenY = typeof window.screenY != 'undefined'
				? window.screenY
				: window.screenTop, outerWidth = typeof window.outerWidth != 'undefined'
				? window.outerWidth
				: document.documentElement.clientWidth, outerHeight = typeof window.outerHeight != 'undefined'
				? window.outerHeight
				: (document.documentElement.clientHeight - 22), width = opts.width, height = opts.height, left = opts.left != null
				? opts.left
				: parseInt(screenX + ((outerWidth - width) / 2), 10), top = opts.top != null
				? opts.top
				: parseInt(screenY + ((outerHeight - height) / 2.5), 10), features = ('width='
				+ width + ',height=' + height + ',left=' + left + ',top=' + top), w = window
				.open(opts.url, opts.id, features);
		if (w && opts.onload)
			opts.onload(w, opts.id);
		return w
	},

	currentWindow : function(opts) {
		window.location.href = opts.url;
		if (opts.onload)
			opts.onload(window);
		return window;
	},

	createUI : function(opts) {
		if (opts.display === 'page') {
			return Dom.currentWindow(opts);
		}
		if (opts.display !== 'hidden' && opts.display !== 'iframe') {
			return Dom.popupWindow(opts);
		}
		var dialog = document.createElement('div'), dstyle = dialog.style;
		dstyle.position = 'absolute';
		dstyle.top = '-10000px';
		dstyle.zIndex = '10001';
		dstyle.height = opts.height + 'px';
		dstyle.width = opts.width + 'px';
		if (opts.display === 'hidden') {
			dialog.className = 'rr_ui_hidden';
			opts.root = dialog;
			Dom.insertIframe(opts);
			Dom.append(dialog);
			return dialog;
		}
		dialog.className = 'rr_ui_dialog';
		var bws = Browser.getBrowser();
		if (bws.name == 'ie' && bws.version < 9) {
			forEach(['top_left', 'top_right', 'bottom_left', 'bottom_right'],
					function(item) {
						var span = document.createElement('span'), style = span.style, p = item
								.split('_');
						span.className = 'rr_dialog_' + item;
						style.height = style.width = '10px';
						style.overflow = 'hidden';
						style.position = 'absolute';
						style.background = 'url(' + rrUrls.rrstatic
								+ 'connect/img/dialog/pop_dialog_' + item
								+ '.png) no-repeat 0 0';
						style[p[0]] = style[p[1]] = '-10px';
						dialog.appendChild(span);
					});
			forEach(['top', 'left', 'right', 'bottom'], function(item) {
						var span = document.createElement('span'), style = span.style;
						span.className = 'rr_dialog_border_' + item;
						style.position = 'absolute';
						style.backgroundColor = 'rgb(82, 82, 82)';
						style.overflow = 'hidden';
						style.filter = 'alpha(opacity=70)';
						style.opacity = '0.7';
						style[item] = '-10px';
						if (item == 'left' || item == 'right') {
							style.width = '10px';
							style.height = '100%';
						} else {
							style.height = '10px';
							style.width = '100%';
						}
						dialog.appendChild(span);
					});
		} else {
			dstyle.padding = '10px';
			dstyle.backgroundColor = 'rgba(82, 82, 82, 0.7)';
			dstyle.MozBorderRadius = '8px';
			dstyle.borderRadius = '8px';
		}

		var dialogContent = document.createElement('div'), cstyle = dialogContent.style;
		dialogContent.className = 'rr_dialog_content';
		cstyle.backgroundColor = '#fff';
		cstyle.height = opts.height + 'px';
		cstyle.width = opts.width + 'px';
		opts.root = dialogContent;
		Dom.insertIframe(opts);
		dialog.appendChild(dialogContent);
		Dom.append(dialog);

		var view = Dom.getViewportInfo(), left = opts.left != null ? opts.left
				+ (bws.name == 'ie' ? 10 : 0) : (view.scrollLeft + (view.width
				- opts.width - 20)
				/ 2), top = opts.top != null ? opts.top
				+ (bws.name == 'ie' ? 10 : 0) : (view.scrollTop + (view.height
				- opts.height - 20)
				/ 2.5);
		dstyle.left = (left > 0 ? left : 0) + 'px';
		dstyle.top = (top > 0 ? top : 0) + 'px';
		return dialog;
	},

	getViewportInfo : function() {
		var d = (document.documentElement && document.compatMode == 'CSS1Compat')
				? document.documentElement
				: document.body;
		return {
			scrollTop : d.scrollTop,
			scrollLeft : d.scrollLeft,
			width : self.innerWidth ? self.innerWidth : d.clientWidth,
			height : self.innerHeight ? self.innerHeight : d.clientHeight
		};
	}
}
/**
 * 
 * @namespace 跨域通信
 * @memberOf Renren
 * @see <a
 *      href="https://developer.mozilla.org/en/DOM/window.postMessage">window.postMessage</a>.
 * @see <a
 *      href="http://livedocs.adobe.com/flash/9.0/ActionScriptLangRefV3/flash/net/LocalConnection.html">flash
 *      LocalConnection</a>.
 */
var XD =
/**
 * @lends Renren.XD
 */
{

	/**
	 * {String} 在跨域通信中标识当前页面，可参见<a
	 * href="https://developer.mozilla.org/en/DOM/window.postMessage">window.postMessage</a>中所定义的origin
	 */
	origin : (location.protocol + '//' + location.host + '/' + guid()),

	/**
	 * {Object} 浏览器支持的跨域通信方式
	 */
	transports : {
		fragment : 'fragment',
		postMessage : window.postMessage ? undefined : false
	},

	/**
	 * 初始化方法，在Renren.init中被调用，根椐浏览器支持情况建立对跨域消息的监听。
	 * 当收到跨域消息时将产生名为receivedXDMessage的事件，可调用Renren.XD.addEvent注册事件处理函数。
	 * @example Renren.XD.addEvent('receivedXDMessage', onReceivedXDMessage);
	 * @param options
	 *            {Object}
	 * @param options.originPath
	 *            {String} (optional) 用于构成跨域的origin值，origin用以唯一标识当前本次加载的页面
	 */
	init : function(options) {
		if (options && options.originPath != undefined)
			XD.origin = location.protocol + '//' + location.host + '/'
					+ options.originPath;
		if (XD.transports.postMessage == undefined) {
			var bws = Browser.getBrowser();
			// window.opener can't work in IE8
			if (bws.name == 'ie' && bws.version == 8)
				XD.transports.postMessage = false;
			else
				XD.PostMessage.init();
		}
		if (!XD.transports.postMessage && XD.transports.flash == undefined) {
			XD.transports.flash = Flash.hasMinVersion() ? 0 : false;
			XD.transports.flash === 0 && XD.Flash.init();
		}
	},

	/**
	 * @private
	 */
	resolveRelation : function(relation) {
		var pt, matches, parts = relation.split('.'), node = window;
		for (var i = 0, l = parts.length; i < l; i++) {
			pt = parts[i];
			if (pt == 'opener' || pt == 'parent' || pt == 'top') {
				node = node[pt];
			} else if (matches = /^frames\[['"]?([a-zA-Z0-9-_]+)['"]?\]$/
					.exec(pt)) {
				node = node.frames[matches[1]];
			} else {
				throw new SyntaxError('Malformed value to resolve: ' + relation);
			}
		}
		return node;
	},

	/**
	 * @namespace 使用window.postMessage实现跨域通信
	 * @private
	 */
	PostMessage : {
		init : function() {
			window.addEventListener ? window.addEventListener('message',
					XD.PostMessage.receiveMessage, false) : window.attachEvent(
					'onmessage', XD.PostMessage.receiveMessage);
			XD.transports.postMessage = 'postMessage';
		},

		receiveMessage : function(event) {
			XD.receiveMessage({
						data : event.data,
						origin : event.origin,
						source : event.source,
						transport : 'postMessage'
					});
		},

		sendMessage : function(message, targetOrigin, targetWin) {
			if (typeOf(message) != 'string')
				message = toQueryString(message);
			targetWin.postMessage(message, targetOrigin);
		}
	},

	/**
	 * @namespace 使用flash实现跨域通
	 * @private
	 */
	Flash : {
		init : function() {
			Flash.onReady(function() {
						XD.transports.flash = Flash.initPostMessage(
								'Renren.XD.Flash.receiveMessage', XD.origin)
								? 'flash'
								: false;
					});
		},

		receiveMessage : function(message) {
			XD.receiveMessage(message);
		},

		sendMessage : function(message, targetOrigin) {
			return Flash.postMessage(message, targetOrigin);
		}
	},

	/**
	 * @namespace 用同域页面实现跨域通信
	 * @private
	 */
	Fragment : {
		magic : 'rr_xd_fragment',

		sendMessage : function(message, targetOrigin, targetWin) {
			if (targetOrigin
					&& targetOrigin.indexOf(targetWin.location.protocol + '//'
							+ targetWin.location.host + '/') == 0)
				targetWin.Renren.XD.receiveMessage({
							data : message
						});
		}
	},

	/**
	 * @private
	 */
	receiveMessage : function(msg) {
		if (typeOf(msg.data) == 'string') {
			msg.data = fromQueryString(msg.data);
		}
		XD.fireEvent("receivedXDMessage", msg);
	},

	/**
	 * 发送跨域消息，将根据浏览器支持情况选择跨域方式
	 * @param message
	 *            {Object | String } 发送信息
	 * @param targetOrigin
	 *            {String} 接收窗体的页面标识
	 * @param transport
	 *            {String} 跨域通信方式
	 * @param targetRelWin
	 *            {String | Window} 接收窗体的window对象或和本窗体的关系
	 */
	sendMessage : function(message, targetOrigin, transport, targetRelWin) {
		if (targetOrigin && transport && transport.length > 0) {
			transport = transport.substr(0, 1).toUpperCase()
					+ transport.substr(1);
			try {
				if (typeof targetRelWin == 'string') {
					targetRelWin = XD.resolveRelation(targetRelWin);
				}
				XD[transport]
						&& XD[transport].sendMessage(message, targetOrigin,
								targetRelWin);
			} catch (e) {
			}
		}
	},

	/**
	 * @private
	 */
	dispatchLocationFragment : function(loc) {
		loc = loc || location.toString();
		if (loc.indexOf('#') == -1)
			return;
		var fragment = loc.substr(loc.indexOf('#') + 1), magicIndex = fragment
				.indexOf(XD.Fragment.magic), params = fromQueryString(fragment);
		if (magicIndex > 0) {
			document.documentElement.style.display = 'none';
		}
		params.origin
				&& XD.sendMessage(params, params.origin, params.transport,
						params.relation);
	}
};

XD.dispatchLocationFragment();

extend(XD, new Events());
var Request = new Class(
/**
 * @lends Renren.Request.prototype
 */
		{
	Implements : [Events, Options],

	options : {
		url : '',
		params : {},
		headers : {
			'Accept' : 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		method : 'POST',
		urlEncoded : true,
		encoding : 'utf-8',
		noCache : false
	},
	/**
	 * @class 跨域请求的抽象类
	 * @constructs
	 */
	initialize : function(options) {
		this.setOptions(options);
		this.id = guid();
	},

	check : function() {
		if (!this.running)
			return true;
		return false;
	},

	abort : function(response) {
		if (!this.running)
			return this;
		this.running = false;
		this.response = response || {
			error : 'request_abort',
			error_description : 'unknown reason.'
		};
		this.failure(this.response);
	},

	success : function(response) {
		this.onSuccess(response);
	},

	onSuccess : function() {
		this.fireEvent('complete', arguments, 0).fireEvent('success',
				arguments, 0);
	},

	failure : function(response) {
		this.onFailure(response);
	},

	onFailure : function() {
		this.fireEvent('complete', arguments, 0).fireEvent('failure',
				arguments, 0);
	}
});

/**
 * @namespace 请求响应跨域传回的处理
 * @private
 */
var XDResponse = {
	requests : {},

	handleXDMessages : function(msg) {
		if (msg.data && msg.data.rqid) {
			var req = XDResponse.requests[msg.data.rqid];
			if (req && req.xd) {
				if (req.xd.transport != 'fragment'
						&& (!msg.origin || msg.origin
								.indexOf(rrUrls.widgetOrigin) != 0))
					return;
				req.handleResponse(msg.data);
			}
		}
	},

	addXDRequest : function(req) {
		if (!XDResponse.requests[req.id])
			XDResponse.requests[req.id] = req;
	},

	removeXDRequest : function(req) {
		if (XDResponse.requests[req.id])
			delete XDResponse.requests[req.id];
	}
};

XD.addEvent('receivedXDMessage', XDResponse.handleXDMessages);

Request.Page = new Class(
/**
 * @lends Renren.Request.Page.prototype
 */
		{
	Extends : Request,

	options : {
		method : 'GET',
		params : {
			display : 'page'
		}
	},

	/**
	 * @class 使用当前窗口进行跨域请求
	 * @extends Renren.Request
	 * @constructs
	 */
	initialize : function(options) {
		this.parent(options);
		this.options.params.display = this.constructor.prototype.options.params.display;
	},

	/**
	 * 发送请求
	 */
	send : function() {
		if (!this.check())
			return this;
		this.running = true;
		var params = this.options.params;
		if (!params['redirect_uri']) {
			params['redirect_uri'] = this.getRedirectUri();
		}
		this.fireEvent('request');
		this.ui = this.createUI();
		if (!this.ui) {
			var err = new Error("can't create request UI.");
			err.name = 'UICreateError';
			throw err;
		}
		return this;
	},

	/**
	 * @private
	 */
	createUI : function() {
		var opts = this.options, method = opts.method, url = (method === 'GET'
				? opts.url + (opts.url.indexOf('?') < 0 ? '?' : '&')
						+ toQueryString(opts.params)
				: 'about:blank');
		if (method === 'GET') {
			var bn = Browser.getBrowser().name, maxLgh = (bn == 'ie'
					? 2050
					: 7600);
			if (url.length > maxLgh) {
				var err = new Error('The length of request url maybe too long, use POST method instend.');
				err.name = 'UrlTooLongError';
				throw err;
			}
		}
		var uiOpts = merge({
					url : url,
					id : this.id,
					display : this.constructor.prototype.options.params.display,
					onload : function(node, nodeName) {
						if (method === 'POST') {
							Dom.postTarget({
										url : opts.url,
										target : nodeName || node.name,
										params : opts.params
									});
						}
					}
				}, opts.style);
		ui = Dom.createUI(uiOpts);
		return ui;
	},

	/**
	 * @private
	 */
	getRedirectUri : function() {
		var uri = location.toString(), poundIndex = uri.indexOf('#');
		if (poundIndex > 0) {
			uri = uri.substr(0, poundIndex);
		}
		return uri;
	}
});

Request.Iframe = new Class(
/**
 * @lends Renren.Request.Iframe.prototype
 */
		{
	Extends : Request.Page,

	options : {
		params : {
			display : 'iframe'
		}
	},

	/**
	 * @class 使用iframe进行跨域请求
	 * @extends Renren.Request.Page
	 * @constructs
	 */
	initialize : function(options) {
		this.parent(options);
		var ts = XD.transports, self = this;
		this.xd = {
			relation : 'parent',
			transport : ts.postMessage || ts.flash || 'fragment',
			origin : XD.origin
		};
		this.addEvents({
					'request' : function() {
						XDResponse.addXDRequest(self);
					},
					'complete' : function() {
						XDResponse.removeXDRequest(self);
					}
				});
	},

	/**
	 * @private
	 */
	handleResponse : function(data) {
		this.closeUI();
		this.response = data;
		this.running = false;
		if (!data.error)
			this.success(this.response);
		else
			this.failure(this.response);
	},

	/**
	 * @private
	 */
	getRedirectUri : function() {
		var opts = merge(this.xd, 'rqid', this.id), trans = this.xd.transport, uri;
		if (trans == 'postMessage' || trans == 'flash') {
			uri = rrUrls.callback + '#';
		} else {
			uri = location.toString();
			var poundIndex = uri.indexOf('#');
			if (poundIndex > 0) {
				uri = uri.substr(0, poundIndex);
			}
			uri += '#' + XD.Fragment.magic + "&";
		}
		return uri + toQueryString(opts);
	},

	/**
	 * 关闭使用的iframe
	 */
	closeUI : function() {
		if (this.ui) {
			this.ui.parentNode.removeChild(this.ui);
			this.ui = null;
		}
	}
});

/**
 * @class 使用隐藏iframe进行跨域请求
 * @memberOf Renren
 * @extends Renren.Request.Iframe
 */
Request.Hidden = new Class({
			Extends : Request.Iframe,

			options : {
				params : {
					display : 'hidden'
				}
			}
		});

Request.Popup = new Class(
/**
 * @lends Renren.Request.Popup.prototype
 */
		{
	Extends : Request.Iframe,

	options : {
		params : {
			display : 'popup'
		}
	},

	/**
	 * @class 使用弹出窗口进行跨域请求
	 * @extends Renren.Request.Iframe
	 * @constructs
	 */
	initialize : function(options) {
		this.parent(options);
		var ts = XD.transports;
		this.xd = {
			relation : 'opener',
			transport : ts.postMessage || ts.flash || 'fragment',
			origin : XD.origin
		};
	},

	send : function() {
		var r = this.parent(), params = this.options.params;
		if (this.ui && params['redirect_uri']
				&& params['redirect_uri'].indexOf(rrUrls.callback) == 0) {
			this.constructor.popupReqs[this.id] = this;
			this.constructor.popupMonitor();
		}
		return r;
	},

	/**
	 * @private
	 */
	handleResponse : function(data) {
		this.closeUI();
		this.response = data;
		this.running = false;
		if (!data.error)
			this.success(this.response);
		else
			this.failure(this.response);
	},

	/**
	 * 关闭弹出的窗口
	 */
	closeUI : function() {
		if (this.ui) {
			this.ui.close();
			this.ui = null;
		}
	}
});

/**
 * 处理弹出窗口被直接关闭的情况
 */
extend(Request.Popup, {
	popupReqs : {},

	popupMonitor : function() {
		var monitor;
		for (var id in this.popupReqs) {
			if (this.popupReqs.hasOwnProperty(id)
					&& this.popupReqs[id] instanceof this) {
				try {
					var request = this.popupReqs[id];
					if (!request.ui) {
						delete this.popupReqs[id];
					} else if (request.ui.closed) {
						window.setTimeout(function() {
							request.abort({
								error : 'request_abort',
								error_description : 'user close the popup window.'
							});
						}, 10);
						request.ui = null;
						delete this.popupReqs[id];
					} else {
						monitor = true;
					}
				} catch (e) {
					// probably a permission error
				}
			}
		}
		if (monitor && !this.monitorInterval) {
			this.monitorInterval = window.setInterval(bind(arguments.callee,
							this), 500);
		} else if (!monitor && this.monitorInterval) {
			window.clearInterval(this.monitorInterval);
			this.monitorInterval = null;
		}
	}
});
/**
 * 本方法是对调用dialog的封装，用以弹出各种对话界面，如发送新鲜事，授权，邀请。对dialog的详细信息可见： <a
 * href="http://wiki.dev.renren.com/wiki/%E4%BA%BA%E4%BA%BA%E7%BD%91%E5%BC%80%E6%94%BE%E5%B9%B3%E5%8F%B0%E6%8A%80%E6%9C%AF%E6%9E%B6%E6%9E%84#Widget_API">Widget
 * API - Dialog</a>
 * 
 * @methodOf Renren
 * @param options
 *            {Object}
 * @param options.url
 *            {String} 请求dialog url或oauth
 *            url，非http、https开头的值将视为相对于http://widget.renren.com/dialog/的路径
 * @param options.method
 *            {String} (optional) http请求方法，可选值：GET、POST，默认为GET，只在必要时使用POST，因在经过登录流程时会被改为GET请求
 * @param options.display
 *            {String} 页面在何处显示，可选值：popup（新窗口）、iframe（类似dialog的效果）、page（当前窗口）
 * @param options.style
 *            {Object} (optional) ui的样式如：{top : 100, left : 300, width : 450,
 *            height : 350}，相应值没设置时会根据窗口大小在合适位置显示
 * @param options.params
 *            {Object} 请求所需参数值，因调用dialog而不同，相关所需参数可见各dialog的文档
 * @param options.fallback
 *            {boolean} (optional)
 *            默认为true，做些容错处理，如当请求参数过长超过浏览器限制，将转化http请求方法为POST;若用popup显示时被浏览器
 *            阻止弹窗时将用当前窗口显示，完成后再跳转回当前页，即同options.display =
 *            page。若需自己处理这些情况时可设值为false。
 * @param options.onSuccess
 *            {Function} (optional) 请求成功后的回调函数，请求结果做为回调函数的参数传入
 * @param options.onFailure
 *            {Function} (optional) 请求失败后的回调函数，请求结果做为回调函数的参数传入
 * @param options.onComplete
 *            {Function} (optional) 请求完成后的回调函数，不论请求成功或失败都会被调用，请求结果做为回调函数的参数传入
 * @param cb
 *            {Function} (optional)
 *            作用同options.onComplete，若options.onComplete已设值则此值无效
 *            @example
 * Renren.ui({
 *	url : 'feed',
 *	display : 'popup',
 *	style : {
 *		top : 50
 *	},
 *	params : {
 *		url:'http://www.swimmingacross.com',
 *		name: '新鲜事测试',
 *		description:'测试',
 *		image:'http://at-img4.tdimg.com/board/2011/5/46465.jpg'
 *	},
 *	onComplete: function(r){if(window.console) console.log("complete");},
 *	onFailure: function(r){if(window.console) console.log("failure:" + r.error + ' ' + r.error_description);} 
 * });
 */
var ui = function(options, cb) {
	if (!options.url) {
		throw new Error('The url argument must not be null.');
	}
	var url = options.url, url = (url.indexOf('http://') == 0 || url
			.indexOf('https://') == 0)
			? url
			: (rrUrls.widget + 'dialog/' + url);
	var p = /^(https?:\/\/[^\/]*\/)([^\/\?#]*\/)*([^\/\?#]*)/.exec(url);
	if (p == null
			|| (rrUrls.widget != p[1] && rrUrls.graph != p[1] && rrUrls.graph_https != p[1])) {
		return;
	}
	var reqOptns = combine({
				url : url,
				method : (options.method
						&& options.method.toUpperCase() === 'POST'
						? 'POST'
						: 'GET')
			}, options, defaults[(p[3] || '').toLowerCase()], {
				display : 'popup',
				style : {
					width : 475,
					height : 340
				},
				params : {
					app_id : rrUrls.widget == p[1]
							? Renren.options.appId
							: null,
					client_id : (rrUrls.graph == p[1] || rrUrls.graph_https == p[1])
							? Renren.options.appId
							: null
				},
				onComplete : cb
			});

	return (function(reqOpts) {
		var display = reqOpts.display, request;
		if (display.length > 0) {
			display = display.substr(0, 1).toUpperCase() + display.substr(1);
		}
		if (Request[display]) {
			request = new Request[display](reqOpts);
		}
		if (!request) {
			throw new Error("Fail to start an ui request, the display argument may be invalid.");
		}
		try {
			return request.send();
		} catch (e) {
			if (options.fallback !== false) {
				if (e.name == 'UrlTooLongError') {
					// change http method to POST
					reqOpts.method = 'POST';
					return arguments.callee(reqOpts);
				} else if (e.name == 'UICreateError'
						&& request instanceof Request.Popup) {
					// popup window may be blocked, fall back to use current
					// window
					reqOpts.display = 'page';
					return arguments.callee(reqOpts);
				}
			}
			throw e;
		}
	})(reqOptns);
};

var defaults = {
	'authorize' : {
		display : 'page',
		style : {
			width : 570,
			height : 340
		}
	},
	'request' : {
		style : {
			width : 600,
			height : 550
		}
	}
};
var XDPC = {
	Server : new Class(
			/**
			 * @lends Renren.XDPC.Server.prototype
			 */
			{
		methods : {},

		/**
		 * @class 模似rpc实现异域窗口间方法的调用，此类是提供可被跨域调用方法的服务端
		 * @constructs
		 * @param methods
		 *            {Array} 提供可被跨域调用的方法
		 * @param clientOrigins
		 *            {String | Array} (optional)
		 *            允许调用的页面来源，如允许来自'http://www.example.com/'下的页面的调用
		 *            @example
		 *            new Renren.XDPC.Server({'size': setSize, 'trace': trace}, ['http://www.example.com/']);
		 */
		initialize : function(methods, clientOrigins) {
			XD.addEvent('receivedXDMessage', bind(this.handleXDMessages, this));
			if (methods) {
				this.addMethods(methods, clientOrigins);
			}
		},

		/**
		 * 公开单个跨域方法
		 * 
		 * @param name
		 *            {String} 公开的跨域方法名
		 * @param fn
		 *            {Function} 公开的跨域方法
		 * @param orgns
		 *            {Array} (optional) 允许调用的页面来源
		 */
		addMethod : function(name, fn, orgns) {
			if (!this.methods[name]) {
				this.methods[name] = XDPC.proxy(name, fn, orgns
								&& typeOf(orgns) != 'array' ? [orgns] : orgns);
			}
		},

		/**
		 * 公开多个跨域方法
		 * 
		 * @param name
		 *            {Object} 公开的多个跨域方法，方法名为key，方法体为value
		 * @param clientOrgns
		 *            (optional) {String | Array} 允许调用的页面来源
		 */
		addMethods : function(methods, clientOrgns) {
			if (clientOrgns && typeOf(clientOrgns) != 'array') {
				clientOrgns = [clientOrgns];
			}
			var orgns = append([], clientOrgns);
			for (var name in methods) {
				this.addMethod(name, methods[name], orgns);
			}
		},

		/**
		 * 移除一个跨域方法
		 * 
		 * @param name
		 *            {String} 跨域方法名
		 */
		removeMethod : function(name) {
			if (this.methods[name])
				delete this.methods[name];
		},

		/**
		 * @private
		 */
		handleXDMessages : function(msg) {
			if (msg.data && msg.data.method) {
				var proxyMethod = this.methods[msg.data.method];
				if (proxyMethod) {
					proxyMethod(msg);
				}
			}
		}
	}),

	proxy : function(name, fn, origins) {
		return function(msg) {
			if (origins && origins.length > 0
					&& !XDPC.checkOrigin(msg.origin, origins))
				return;
			var r = fn.apply(null, fn.internal ? msg : msg.data.args);
			if (msg.data.cbid)
				XD.sendMessage({
							result : r,
							cbid : msg.data.cbid
						}, msg.origin, msg.transport, msg.source);
		}
	},

	checkOrigin : function(orgn, origins) {
		if (!orgn)
			return false;
		for (var i = 0, l = origins.length; i < l; i++) {
			if (origins[i].indexOf(orgn) == 0 || orgn.indexOf(origins[i]) == 0)
				return true;
		}
		return false;
	},

	Client : new Class(
			/**
			 * @lends Renren.XDPC.Client.prototype
			 */
			{

		callbacks : {},

		/**
		 * @class 跨域调用的客户端，发起对服务端所提供方法的调用
		 * @constructs
		 * @param server
		 *            {Object} 要调用的服务端窗口的跨域信息
		 *            @example
		 *            new Renren.XDPC.Client({relation:'parent', origin: 'http://apps.renren.com/'});
		 */
		initialize : function(server) {
			XD.addEvent('receivedXDMessage', bind(this.handleXDMessages, this));
			this.server = merge({}, server);
		},

		/**
		 * @private
		 */
		handleXDMessages : function(msg) {
			if (msg.data && msg.data.cbid) {
				var cb = this.callbacks[msg.data.cbid];
				if (cb && this.checkOrigin(msg.origin)) {
					delete this.callbacks[msg.data.cbid];
					cb(msg.data.result);
				}
			}
		},

		/**
		 * @private
		 */
		checkOrigin : function(origin) {
			return XDPC.checkOrigin(origin, [this.server.origin])
		},

		/**
		 * @param name
		 *            {String} 跨域方法名
		 * @param args
		 *            {Array} 跨域方法参数
		 * @param callback
		 *            {Function} (optional) 跨域方法执行完后再跨域回调，为空时将不进行回调
		 */
		call : function(name, args, callback) {
			var ts = XD.transports, trans = ts.postMessage || ts.flash, tp = typeOf(args), cbid;
			if (!trans)
				return;
			if (callback) {
				cbid = guid();
				this.callbacks[cbid] = callback;
			}
			if (tp != 'array' && tp != 'arguments')
				args = [args];
			XD.sendMessage({
						method : name,
						args : args,
						cbid : cbid
					}, this.server.origin, trans, this.server.relation);
		}
	})
};

XDPC.EventsReceiver = new Class({

			Extends : XDPC.Server,

			Implements : [Events],

			initialize : function(senderOrigins) {
				this.parent({
							fireXDEvent : bind(this.fireEvent, this)
						}, senderOrigins);
			}
		});

XDPC.EventsSender = new Class({
			Extends : XDPC.Client,

			fireXDEvent : function(type, args, delay) {
				this.call('fireXDEvent', [type, args, delay]);
			}
		});

/**
 * @class canvas应用调用外层app.renren.com下提供的方法
 * @extends Renren.XDPC.Client
 * @memberOf Renren
 */
XDPC.CanvasClient = new Class({

			Extends : XDPC.Client,

			initialize : function() {
				var s = location.search, params = (s == ''
						? {}
						: fromQueryString(s.substr(1)));
				this.parent({
							origin : rrUrls.apps + (params['xn_sig'] || ''),
							relation : 'parent'
						});
			}
		});
window.Renren = extend(Renren, {
			onFlashReady : Flash.onFlashReady,
			onIframeReady : Dom.onIframeReady,
			XD : XD,
			Request : Request,
			XDPC : XDPC,
			ui : ui
		});
})(window);
