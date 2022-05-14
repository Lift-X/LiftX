
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
        return context;
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* client/Nav.svelte generated by Svelte v3.48.0 */

    const file = "client/Nav.svelte";

    function create_fragment(ctx) {
    	let nav;
    	let div3;
    	let div1;
    	let div0;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let ul;
    	let li0;
    	let a1;
    	let t2;
    	let li1;
    	let a2;
    	let t4;
    	let li2;
    	let a3;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t2 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "Svelte";
    			t4 = space();
    			li2 = element("li");
    			a3 = element("a");
    			a3.textContent = "Common";
    			if (!src_url_equal(img.src, img_src_value = "/public/logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "WLRS Logo");
    			attr_dev(img, "class", "svelte-unmiwn");
    			add_location(img, file, 5, 20, 208);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-unmiwn");
    			add_location(a0, file, 4, 16, 175);
    			attr_dev(div0, "class", "nav-logo svelte-unmiwn");
    			add_location(div0, file, 3, 12, 136);
    			attr_dev(div1, "class", "navbar-brand");
    			add_location(div1, file, 2, 8, 97);
    			attr_dev(a1, "class", "navbar-item svelte-unmiwn");
    			attr_dev(a1, "href", "/");
    			add_location(a1, file, 11, 20, 399);
    			attr_dev(li0, "class", "svelte-unmiwn");
    			add_location(li0, file, 11, 16, 395);
    			attr_dev(a2, "class", "navbar-item svelte-unmiwn");
    			attr_dev(a2, "href", "#about");
    			add_location(a2, file, 12, 20, 465);
    			attr_dev(li1, "class", "svelte-unmiwn");
    			add_location(li1, file, 12, 16, 461);
    			attr_dev(a3, "class", "navbar-item svelte-unmiwn");
    			attr_dev(a3, "href", "#app/common");
    			add_location(a3, file, 13, 20, 538);
    			attr_dev(li2, "class", "svelte-unmiwn");
    			add_location(li2, file, 13, 16, 534);
    			attr_dev(ul, "class", "nav-links svelte-unmiwn");
    			add_location(ul, file, 10, 12, 356);
    			attr_dev(div2, "class", "navbar-menu");
    			add_location(div2, file, 9, 8, 318);
    			attr_dev(div3, "class", "svelte-unmiwn");
    			add_location(div3, file, 1, 4, 83);
    			attr_dev(nav, "class", "navbar is-primary svelte-unmiwn");
    			attr_dev(nav, "role", "navigation");
    			attr_dev(nav, "aria-label", "main navigation");
    			add_location(nav, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(ul, t4);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Nav', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var strictUriEncode = str => encodeURIComponent(str).replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

    var token = '%[a-f0-9]{2}';
    var singleMatcher = new RegExp(token, 'gi');
    var multiMatcher = new RegExp('(' + token + ')+', 'gi');

    function decodeComponents(components, split) {
    	try {
    		// Try to decode the entire string first
    		return decodeURIComponent(components.join(''));
    	} catch (err) {
    		// Do nothing
    	}

    	if (components.length === 1) {
    		return components;
    	}

    	split = split || 1;

    	// Split the array in 2 parts
    	var left = components.slice(0, split);
    	var right = components.slice(split);

    	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
    }

    function decode(input) {
    	try {
    		return decodeURIComponent(input);
    	} catch (err) {
    		var tokens = input.match(singleMatcher);

    		for (var i = 1; i < tokens.length; i++) {
    			input = decodeComponents(tokens, i).join('');

    			tokens = input.match(singleMatcher);
    		}

    		return input;
    	}
    }

    function customDecodeURIComponent(input) {
    	// Keep track of all the replacements and prefill the map with the `BOM`
    	var replaceMap = {
    		'%FE%FF': '\uFFFD\uFFFD',
    		'%FF%FE': '\uFFFD\uFFFD'
    	};

    	var match = multiMatcher.exec(input);
    	while (match) {
    		try {
    			// Decode as big chunks as possible
    			replaceMap[match[0]] = decodeURIComponent(match[0]);
    		} catch (err) {
    			var result = decode(match[0]);

    			if (result !== match[0]) {
    				replaceMap[match[0]] = result;
    			}
    		}

    		match = multiMatcher.exec(input);
    	}

    	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
    	replaceMap['%C2'] = '\uFFFD';

    	var entries = Object.keys(replaceMap);

    	for (var i = 0; i < entries.length; i++) {
    		// Replace all decoded components
    		var key = entries[i];
    		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
    	}

    	return input;
    }

    var decodeUriComponent = function (encodedURI) {
    	if (typeof encodedURI !== 'string') {
    		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
    	}

    	try {
    		encodedURI = encodedURI.replace(/\+/g, ' ');

    		// Try the built in decoder first
    		return decodeURIComponent(encodedURI);
    	} catch (err) {
    		// Fallback to a more advanced decoder
    		return customDecodeURIComponent(encodedURI);
    	}
    };

    var splitOnFirst = (string, separator) => {
    	if (!(typeof string === 'string' && typeof separator === 'string')) {
    		throw new TypeError('Expected the arguments to be of type `string`');
    	}

    	if (separator === '') {
    		return [string];
    	}

    	const separatorIndex = string.indexOf(separator);

    	if (separatorIndex === -1) {
    		return [string];
    	}

    	return [
    		string.slice(0, separatorIndex),
    		string.slice(separatorIndex + separator.length)
    	];
    };

    var filterObj = function (obj, predicate) {
    	var ret = {};
    	var keys = Object.keys(obj);
    	var isArr = Array.isArray(predicate);

    	for (var i = 0; i < keys.length; i++) {
    		var key = keys[i];
    		var val = obj[key];

    		if (isArr ? predicate.indexOf(key) !== -1 : predicate(key, val, obj)) {
    			ret[key] = val;
    		}
    	}

    	return ret;
    };

    var queryString = createCommonjsModule(function (module, exports) {





    const isNullOrUndefined = value => value === null || value === undefined;

    function encoderForArrayFormat(options) {
    	switch (options.arrayFormat) {
    		case 'index':
    			return key => (result, value) => {
    				const index = result.length;

    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				if (value === null) {
    					return [...result, [encode(key, options), '[', index, ']'].join('')];
    				}

    				return [
    					...result,
    					[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')
    				];
    			};

    		case 'bracket':
    			return key => (result, value) => {
    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				if (value === null) {
    					return [...result, [encode(key, options), '[]'].join('')];
    				}

    				return [...result, [encode(key, options), '[]=', encode(value, options)].join('')];
    			};

    		case 'comma':
    		case 'separator':
    			return key => (result, value) => {
    				if (value === null || value === undefined || value.length === 0) {
    					return result;
    				}

    				if (result.length === 0) {
    					return [[encode(key, options), '=', encode(value, options)].join('')];
    				}

    				return [[result, encode(value, options)].join(options.arrayFormatSeparator)];
    			};

    		default:
    			return key => (result, value) => {
    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				if (value === null) {
    					return [...result, encode(key, options)];
    				}

    				return [...result, [encode(key, options), '=', encode(value, options)].join('')];
    			};
    	}
    }

    function parserForArrayFormat(options) {
    	let result;

    	switch (options.arrayFormat) {
    		case 'index':
    			return (key, value, accumulator) => {
    				result = /\[(\d*)\]$/.exec(key);

    				key = key.replace(/\[\d*\]$/, '');

    				if (!result) {
    					accumulator[key] = value;
    					return;
    				}

    				if (accumulator[key] === undefined) {
    					accumulator[key] = {};
    				}

    				accumulator[key][result[1]] = value;
    			};

    		case 'bracket':
    			return (key, value, accumulator) => {
    				result = /(\[\])$/.exec(key);
    				key = key.replace(/\[\]$/, '');

    				if (!result) {
    					accumulator[key] = value;
    					return;
    				}

    				if (accumulator[key] === undefined) {
    					accumulator[key] = [value];
    					return;
    				}

    				accumulator[key] = [].concat(accumulator[key], value);
    			};

    		case 'comma':
    		case 'separator':
    			return (key, value, accumulator) => {
    				const isArray = typeof value === 'string' && value.includes(options.arrayFormatSeparator);
    				const isEncodedArray = (typeof value === 'string' && !isArray && decode(value, options).includes(options.arrayFormatSeparator));
    				value = isEncodedArray ? decode(value, options) : value;
    				const newValue = isArray || isEncodedArray ? value.split(options.arrayFormatSeparator).map(item => decode(item, options)) : value === null ? value : decode(value, options);
    				accumulator[key] = newValue;
    			};

    		default:
    			return (key, value, accumulator) => {
    				if (accumulator[key] === undefined) {
    					accumulator[key] = value;
    					return;
    				}

    				accumulator[key] = [].concat(accumulator[key], value);
    			};
    	}
    }

    function validateArrayFormatSeparator(value) {
    	if (typeof value !== 'string' || value.length !== 1) {
    		throw new TypeError('arrayFormatSeparator must be single character string');
    	}
    }

    function encode(value, options) {
    	if (options.encode) {
    		return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
    	}

    	return value;
    }

    function decode(value, options) {
    	if (options.decode) {
    		return decodeUriComponent(value);
    	}

    	return value;
    }

    function keysSorter(input) {
    	if (Array.isArray(input)) {
    		return input.sort();
    	}

    	if (typeof input === 'object') {
    		return keysSorter(Object.keys(input))
    			.sort((a, b) => Number(a) - Number(b))
    			.map(key => input[key]);
    	}

    	return input;
    }

    function removeHash(input) {
    	const hashStart = input.indexOf('#');
    	if (hashStart !== -1) {
    		input = input.slice(0, hashStart);
    	}

    	return input;
    }

    function getHash(url) {
    	let hash = '';
    	const hashStart = url.indexOf('#');
    	if (hashStart !== -1) {
    		hash = url.slice(hashStart);
    	}

    	return hash;
    }

    function extract(input) {
    	input = removeHash(input);
    	const queryStart = input.indexOf('?');
    	if (queryStart === -1) {
    		return '';
    	}

    	return input.slice(queryStart + 1);
    }

    function parseValue(value, options) {
    	if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
    		value = Number(value);
    	} else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
    		value = value.toLowerCase() === 'true';
    	}

    	return value;
    }

    function parse(query, options) {
    	options = Object.assign({
    		decode: true,
    		sort: true,
    		arrayFormat: 'none',
    		arrayFormatSeparator: ',',
    		parseNumbers: false,
    		parseBooleans: false
    	}, options);

    	validateArrayFormatSeparator(options.arrayFormatSeparator);

    	const formatter = parserForArrayFormat(options);

    	// Create an object with no prototype
    	const ret = Object.create(null);

    	if (typeof query !== 'string') {
    		return ret;
    	}

    	query = query.trim().replace(/^[?#&]/, '');

    	if (!query) {
    		return ret;
    	}

    	for (const param of query.split('&')) {
    		if (param === '') {
    			continue;
    		}

    		let [key, value] = splitOnFirst(options.decode ? param.replace(/\+/g, ' ') : param, '=');

    		// Missing `=` should be `null`:
    		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    		value = value === undefined ? null : ['comma', 'separator'].includes(options.arrayFormat) ? value : decode(value, options);
    		formatter(decode(key, options), value, ret);
    	}

    	for (const key of Object.keys(ret)) {
    		const value = ret[key];
    		if (typeof value === 'object' && value !== null) {
    			for (const k of Object.keys(value)) {
    				value[k] = parseValue(value[k], options);
    			}
    		} else {
    			ret[key] = parseValue(value, options);
    		}
    	}

    	if (options.sort === false) {
    		return ret;
    	}

    	return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce((result, key) => {
    		const value = ret[key];
    		if (Boolean(value) && typeof value === 'object' && !Array.isArray(value)) {
    			// Sort object keys, not values
    			result[key] = keysSorter(value);
    		} else {
    			result[key] = value;
    		}

    		return result;
    	}, Object.create(null));
    }

    exports.extract = extract;
    exports.parse = parse;

    exports.stringify = (object, options) => {
    	if (!object) {
    		return '';
    	}

    	options = Object.assign({
    		encode: true,
    		strict: true,
    		arrayFormat: 'none',
    		arrayFormatSeparator: ','
    	}, options);

    	validateArrayFormatSeparator(options.arrayFormatSeparator);

    	const shouldFilter = key => (
    		(options.skipNull && isNullOrUndefined(object[key])) ||
    		(options.skipEmptyString && object[key] === '')
    	);

    	const formatter = encoderForArrayFormat(options);

    	const objectCopy = {};

    	for (const key of Object.keys(object)) {
    		if (!shouldFilter(key)) {
    			objectCopy[key] = object[key];
    		}
    	}

    	const keys = Object.keys(objectCopy);

    	if (options.sort !== false) {
    		keys.sort(options.sort);
    	}

    	return keys.map(key => {
    		const value = object[key];

    		if (value === undefined) {
    			return '';
    		}

    		if (value === null) {
    			return encode(key, options);
    		}

    		if (Array.isArray(value)) {
    			return value
    				.reduce(formatter(key), [])
    				.join('&');
    		}

    		return encode(key, options) + '=' + encode(value, options);
    	}).filter(x => x.length > 0).join('&');
    };

    exports.parseUrl = (url, options) => {
    	options = Object.assign({
    		decode: true
    	}, options);

    	const [url_, hash] = splitOnFirst(url, '#');

    	return Object.assign(
    		{
    			url: url_.split('?')[0] || '',
    			query: parse(extract(url), options)
    		},
    		options && options.parseFragmentIdentifier && hash ? {fragmentIdentifier: decode(hash, options)} : {}
    	);
    };

    exports.stringifyUrl = (object, options) => {
    	options = Object.assign({
    		encode: true,
    		strict: true
    	}, options);

    	const url = removeHash(object.url).split('?')[0] || '';
    	const queryFromUrl = exports.extract(object.url);
    	const parsedQueryFromUrl = exports.parse(queryFromUrl, {sort: false});

    	const query = Object.assign(parsedQueryFromUrl, object.query);
    	let queryString = exports.stringify(query, options);
    	if (queryString) {
    		queryString = `?${queryString}`;
    	}

    	let hash = getHash(object.url);
    	if (object.fragmentIdentifier) {
    		hash = `#${encode(object.fragmentIdentifier, options)}`;
    	}

    	return `${url}${queryString}${hash}`;
    };

    exports.pick = (input, filter, options) => {
    	options = Object.assign({
    		parseFragmentIdentifier: true
    	}, options);

    	const {url, query, fragmentIdentifier} = exports.parseUrl(input, options);
    	return exports.stringifyUrl({
    		url,
    		query: filterObj(query, filter),
    		fragmentIdentifier
    	}, options);
    };

    exports.exclude = (input, filter, options) => {
    	const exclusionFilter = Array.isArray(filter) ? key => !filter.includes(key) : (key, value) => !filter(key, value);

    	return exports.pick(input, exclusionFilter, options);
    };
    });
    var queryString_1 = queryString.extract;
    var queryString_2 = queryString.parse;
    var queryString_3 = queryString.stringify;
    var queryString_4 = queryString.parseUrl;
    var queryString_5 = queryString.stringifyUrl;
    var queryString_6 = queryString.pick;
    var queryString_7 = queryString.exclude;

    var index_umd = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, (function () {
      var defaultExport = /*@__PURE__*/(function (Error) {
        function defaultExport(route, path) {
          var message = "Unreachable '" + (route !== '/' ? route.replace(/\/$/, '') : route) + "', segment '" + path + "' is not defined";
          Error.call(this, message);
          this.message = message;
          this.route = route;
          this.path = path;
        }

        if ( Error ) defaultExport.__proto__ = Error;
        defaultExport.prototype = Object.create( Error && Error.prototype );
        defaultExport.prototype.constructor = defaultExport;

        return defaultExport;
      }(Error));

      function buildMatcher(path, parent) {
        var regex;

        var _isSplat;

        var _priority = -100;

        var keys = [];
        regex = path.replace(/[-$.]/g, '\\$&').replace(/\(/g, '(?:').replace(/\)/g, ')?').replace(/([:*]\w+)(?:<([^<>]+?)>)?/g, function (_, key, expr) {
          keys.push(key.substr(1));

          if (key.charAt() === ':') {
            _priority += 100;
            return ("((?!#)" + (expr || '[^#/]+?') + ")");
          }

          _isSplat = true;
          _priority += 500;
          return ("((?!#)" + (expr || '[^#]+?') + ")");
        });

        try {
          regex = new RegExp(("^" + regex + "$"));
        } catch (e) {
          throw new TypeError(("Invalid route expression, given '" + parent + "'"));
        }

        var _hashed = path.includes('#') ? 0.5 : 1;

        var _depth = path.length * _priority * _hashed;

        return {
          keys: keys,
          regex: regex,
          _depth: _depth,
          _isSplat: _isSplat
        };
      }
      var PathMatcher = function PathMatcher(path, parent) {
        var ref = buildMatcher(path, parent);
        var keys = ref.keys;
        var regex = ref.regex;
        var _depth = ref._depth;
        var _isSplat = ref._isSplat;
        return {
          _isSplat: _isSplat,
          _depth: _depth,
          match: function (value) {
            var matches = value.match(regex);

            if (matches) {
              return keys.reduce(function (prev, cur, i) {
                prev[cur] = typeof matches[i + 1] === 'string' ? decodeURIComponent(matches[i + 1]) : null;
                return prev;
              }, {});
            }
          }
        };
      };

      PathMatcher.push = function push (key, prev, leaf, parent) {
        var root = prev[key] || (prev[key] = {});

        if (!root.pattern) {
          root.pattern = new PathMatcher(key, parent);
          root.route = (leaf || '').replace(/\/$/, '') || '/';
        }

        prev.keys = prev.keys || [];

        if (!prev.keys.includes(key)) {
          prev.keys.push(key);
          PathMatcher.sort(prev);
        }

        return root;
      };

      PathMatcher.sort = function sort (root) {
        root.keys.sort(function (a, b) {
          return root[a].pattern._depth - root[b].pattern._depth;
        });
      };

      function merge(path, parent) {
        return ("" + (parent && parent !== '/' ? parent : '') + (path || ''));
      }
      function walk(path, cb) {
        var matches = path.match(/<[^<>]*\/[^<>]*>/);

        if (matches) {
          throw new TypeError(("RegExp cannot contain slashes, given '" + matches + "'"));
        }

        var parts = path.split(/(?=\/|#)/);
        var root = [];

        if (parts[0] !== '/') {
          parts.unshift('/');
        }

        parts.some(function (x, i) {
          var parent = root.slice(1).concat(x).join('') || null;
          var segment = parts.slice(i + 1).join('') || null;
          var retval = cb(x, parent, segment ? ("" + (x !== '/' ? x : '') + segment) : null);
          root.push(x);
          return retval;
        });
      }
      function reduce(key, root, _seen) {
        var params = {};
        var out = [];
        var splat;
        walk(key, function (x, leaf, extra) {
          var found;

          if (!root.keys) {
            throw new defaultExport(key, x);
          }

          root.keys.some(function (k) {
            if (_seen.includes(k)) { return false; }
            var ref = root[k].pattern;
            var match = ref.match;
            var _isSplat = ref._isSplat;
            var matches = match(_isSplat ? extra || x : x);

            if (matches) {
              Object.assign(params, matches);

              if (root[k].route) {
                var routeInfo = Object.assign({}, root[k].info); // properly handle exact-routes!

                var hasMatch = false;

                if (routeInfo.exact) {
                  hasMatch = extra === null;
                } else {
                  hasMatch = !(x && leaf === null) || x === leaf || _isSplat || !extra;
                }

                routeInfo.matches = hasMatch;
                routeInfo.params = Object.assign({}, params);
                routeInfo.route = root[k].route;
                routeInfo.path = _isSplat && extra || leaf || x;
                out.push(routeInfo);
              }

              if (extra === null && !root[k].keys) {
                return true;
              }

              if (k !== '/') { _seen.push(k); }
              splat = _isSplat;
              root = root[k];
              found = true;
              return true;
            }

            return false;
          });

          if (!(found || root.keys.some(function (k) { return root[k].pattern.match(x); }))) {
            throw new defaultExport(key, x);
          }

          return splat || !found;
        });
        return out;
      }
      function find(path, routes, retries) {
        var get = reduce.bind(null, path, routes);
        var set = [];

        while (retries > 0) {
          retries -= 1;

          try {
            return get(set);
          } catch (e) {
            if (retries > 0) {
              return get(set);
            }

            throw e;
          }
        }
      }
      function add(path, routes, parent, routeInfo) {
        var fullpath = merge(path, parent);
        var root = routes;
        var key;

        if (routeInfo && routeInfo.nested !== true) {
          key = routeInfo.key;
          delete routeInfo.key;
        }

        walk(fullpath, function (x, leaf) {
          root = PathMatcher.push(x, root, leaf, fullpath);

          if (x !== '/') {
            root.info = root.info || Object.assign({}, routeInfo);
          }
        });
        root.info = root.info || Object.assign({}, routeInfo);

        if (key) {
          root.info.key = key;
        }

        return fullpath;
      }
      function rm(path, routes, parent) {
        var fullpath = merge(path, parent);
        var root = routes;
        var leaf = null;
        var key = null;
        walk(fullpath, function (x) {
          if (!root) {
            leaf = null;
            return true;
          }

          if (!root.keys) {
            throw new defaultExport(path, x);
          }

          key = x;
          leaf = root;
          root = root[key];
        });

        if (!(leaf && key)) {
          throw new defaultExport(path, key);
        }

        if (leaf === routes) {
          leaf = routes['/'];
        }

        if (leaf.route !== key) {
          var offset = leaf.keys.indexOf(key);

          if (offset === -1) {
            throw new defaultExport(path, key);
          }

          leaf.keys.splice(offset, 1);
          PathMatcher.sort(leaf);
          delete leaf[key];
        } // nested routes are upgradeable, so keep original info...


        if (root.route === leaf.route && (!root.info || root.info.key === leaf.info.key)) { delete leaf.info; }
      }

      var Router = function Router() {
        var routes = {};
        var stack = [];
        return {
          resolve: function (path, cb) {
            var url = path.split('?')[0];
            var seen = [];
            walk(url, function (x, leaf, extra) {
              try {
                cb(null, find(leaf, routes, 1).filter(function (r) {
                  if (!seen.includes(r.path)) {
                    seen.push(r.path);
                    return true;
                  }

                  return false;
                }));
              } catch (e) {
                cb(e, []);
              }
            });
          },
          mount: function (path, cb) {
            if (path !== '/') {
              stack.push(path);
            }

            cb();
            stack.pop();
          },
          find: function (path, retries) { return find(path, routes, retries === true ? 2 : retries || 1); },
          add: function (path, routeInfo) { return add(path, routes, stack.join(''), routeInfo); },
          rm: function (path) { return rm(path, routes, stack.join('')); }
        };
      };

      Router.matches = function matches (uri, path) {
        return buildMatcher(uri, path).regex.test(path);
      };

      return Router;

    })));
    });

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const cache = {};
    const baseTag = document.getElementsByTagName('base');
    const basePrefix = (baseTag[0] && baseTag[0].href.replace(/\/$/, '')) || '/';

    const ROOT_URL = basePrefix.replace(window.location.origin, '');

    const router = writable({
      path: '/',
      query: {},
      params: {},
    });

    const CTX_ROUTER = {};
    const CTX_ROUTE = {};

    // use location.hash on embedded pages, e.g. Svelte REPL
    let HASHCHANGE = window.location.origin === 'null';

    function hashchangeEnable(value) {
      if (typeof value === 'boolean') {
        HASHCHANGE = !!value;
      }

      return HASHCHANGE;
    }

    function fixedLocation(path, callback) {
      const baseUri = hashchangeEnable() ? window.location.hash.replace('#', '') : window.location.pathname;

      // this will rebase anchors to avoid location changes
      if (path.charAt() !== '/') {
        path = baseUri + path;
      }

      const currentURL = baseUri + window.location.hash + window.location.search;

      // do not change location et all...
      if (currentURL !== path) {
        callback(path);
      }
    }

    function navigateTo(path, options) {
      const {
        reload, replace,
        params, queryParams,
      } = options || {};

      // If path empty or no string, throws error
      if (!path || typeof path !== 'string' || (path[0] !== '/' && path[0] !== '#')) {
        throw new Error(`Expecting '/${path}' or '#${path}', given '${path}'`);
      }

      if (params) {
        path = path.replace(/:([a-zA-Z][a-zA-Z0-9_-]*)/g, (_, key) => params[key]);
      }

      // rebase active URL
      if (ROOT_URL !== '/' && path.indexOf(ROOT_URL) !== 0) {
        path = ROOT_URL + path;
      }

      if (queryParams) {
        const qs = queryString.stringify(queryParams);

        if (qs) {
          path += `?${qs}`;
        }
      }

      if (hashchangeEnable()) {
        window.location.hash = path.replace(/^#/, '');
        return;
      }

      // If no History API support, fallbacks to URL redirect
      if (reload || !window.history.pushState || !window.dispatchEvent) {
        window.location.href = path;
        return;
      }

      // If has History API support, uses it
      fixedLocation(path, nextURL => {
        window.history[replace ? 'replaceState' : 'pushState'](null, '', nextURL);
        window.dispatchEvent(new Event('popstate'));
      });
    }

    function isActive(uri, path, exact) {
      if (!cache[[uri, path, exact]]) {
        if (exact !== true && path.indexOf(uri) === 0) {
          cache[[uri, path, exact]] = /^[#/?]?$/.test(path.substr(uri.length, 1));
        } else if (uri.includes('*') || uri.includes(':')) {
          cache[[uri, path, exact]] = index_umd.matches(uri, path);
        } else {
          cache[[uri, path, exact]] = path === uri;
        }
      }

      return cache[[uri, path, exact]];
    }

    const baseRouter = new index_umd();
    const routeInfo = writable({});

    // private registries
    const onError = {};
    const shared = {};

    let routers = 0;
    let interval;

    // take snapshot from current state...
    router.subscribe(value => { shared.router = value; });
    routeInfo.subscribe(value => { shared.routeInfo = value; });

    function doFallback(failure, fallback) {
      routeInfo.update(defaults => ({
        ...defaults,
        [fallback]: {
          ...shared.router,
          failure,
        },
      }));
    }

    function handleRoutes(map, params) {
      const keys = [];

      map.some(x => {
        if (x.key && x.matches && !x.fallback && !shared.routeInfo[x.key]) {
          if (x.redirect && (x.condition === null || x.condition(shared.router) !== true)) {
            if (x.exact && shared.router.path !== x.path) return false;
            navigateTo(x.redirect);
            return true;
          }

          if (x.exact) {
            keys.push(x.key);
          }

          // extend shared params...
          Object.assign(params, x.params);

          // upgrade matching routes!
          routeInfo.update(defaults => ({
            ...defaults,
            [x.key]: {
              ...shared.router,
              ...x,
            },
          }));
        }

        return false;
      });

      return keys;
    }

    function evtHandler() {
      let baseUri = !hashchangeEnable() ? window.location.href.replace(window.location.origin, '') : window.location.hash || '/';
      let failure;

      // unprefix active URL
      if (ROOT_URL !== '/') {
        baseUri = baseUri.replace(ROOT_URL, '');
      }

      const [fullpath, qs] = baseUri.replace('/#', '#').replace(/^#\//, '/').split('?');
      const query = queryString.parse(qs);
      const params = {};
      const keys = [];

      // reset current state
      routeInfo.set({});
      router.set({
        query,
        params,
        path: fullpath,
      });

      // load all matching routes...
      baseRouter.resolve(fullpath, (err, result) => {
        if (err) {
          failure = err;
          return;
        }

        // save exact-keys for deletion after failures!
        keys.push(...handleRoutes(result, params));
      });

      const toDelete = {};

      if (failure) {
        keys.reduce((prev, cur) => {
          prev[cur] = null;
          return prev;
        }, toDelete);
      }

      try {
        // clear routes that not longer matches!
        baseRouter.find(fullpath).forEach(sub => {
          if (sub.exact && !sub.matches) {
            toDelete[sub.key] = null;
          }
        });
      } catch (e) {
        // this is fine
      }

      // drop unwanted routes...
      routeInfo.update(defaults => ({
        ...defaults,
        ...toDelete,
      }));

      let fallback;

      // invoke error-handlers to clear out previous state!
      Object.keys(onError).forEach(root => {
        if (isActive(root, fullpath, false)) {
          onError[root].callback(failure);
        }

        if (onError[root].fallback) {
          fallback = onError[root].fallback;
        }
      });

      // handle unmatched fallbacks
      if (failure && fallback) {
        doFallback(failure, fallback);
      }
    }

    function findRoutes() {
      clearTimeout(interval);
      interval = setTimeout(evtHandler);
    }

    function addRouter(root, fallback, callback) {
      if (!routers) {
        window.addEventListener('popstate', findRoutes, false);
      }

      // register error-handlers
      onError[root] = { fallback, callback };
      routers += 1;

      return () => {
        delete onError[root];
        routers -= 1;

        if (!routers) {
          window.removeEventListener('popstate', findRoutes, false);
        }
      };
    }

    /* node_modules/yrv/src/Router.svelte generated by Svelte v3.48.0 */
    const file$1 = "node_modules/yrv/src/Router.svelte";

    // (99:0) {#if !disabled}
    function create_if_block_1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[8],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(99:0) {#if !disabled}",
    		ctx
    	});

    	return block;
    }

    // (103:0) {#if failure && !fallback && !nofallback}
    function create_if_block(ctx) {
    	let fieldset;
    	let legend;
    	let t0;
    	let t1;
    	let t2;
    	let pre;
    	let t3;

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			legend = element("legend");
    			t0 = text("Router failure: ");
    			t1 = text(/*path*/ ctx[1]);
    			t2 = space();
    			pre = element("pre");
    			t3 = text(/*failure*/ ctx[3]);
    			add_location(legend, file$1, 104, 4, 2236);
    			add_location(pre, file$1, 105, 4, 2280);
    			attr_dev(fieldset, "data-failure", "");
    			attr_dev(fieldset, "class", "svelte-kx2cky");
    			add_location(fieldset, file$1, 103, 2, 2208);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, fieldset, anchor);
    			append_dev(fieldset, legend);
    			append_dev(legend, t0);
    			append_dev(legend, t1);
    			append_dev(fieldset, t2);
    			append_dev(fieldset, pre);
    			append_dev(pre, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*path*/ 2) set_data_dev(t1, /*path*/ ctx[1]);
    			if (dirty & /*failure*/ 8) set_data_dev(t3, /*failure*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(fieldset);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(103:0) {#if failure && !fallback && !nofallback}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = !/*disabled*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = /*failure*/ ctx[3] && !/*fallback*/ ctx[4] && !/*nofallback*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*disabled*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*disabled*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*failure*/ ctx[3] && !/*fallback*/ ctx[4] && !/*nofallback*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function unassignRoute(route) {
    	baseRouter.rm(route);
    	findRoutes();
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $router;
    	let $basePath;
    	validate_store(router, 'router');
    	component_subscribe($$self, router, $$value => $$invalidate(7, $router = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, ['default']);
    	let cleanup;
    	let failure;
    	let fallback;
    	let { path = '/' } = $$props;
    	let { disabled = false } = $$props;
    	let { condition = null } = $$props;
    	let { nofallback = false } = $$props;
    	const routerContext = getContext(CTX_ROUTER);
    	const basePath = routerContext ? routerContext.basePath : writable(path);
    	validate_store(basePath, 'basePath');
    	component_subscribe($$self, basePath, value => $$invalidate(11, $basePath = value));

    	const fixedRoot = $basePath !== path && $basePath !== '/'
    	? `${$basePath}${path !== '/' ? path : ''}`
    	: path;

    	try {
    		if (condition !== null && typeof condition !== 'function') {
    			throw new TypeError(`Expecting condition to be a function, given '${condition}'`);
    		}

    		if (path.charAt() !== '#' && path.charAt() !== '/') {
    			throw new TypeError(`Expecting a leading slash or hash, given '${path}'`);
    		}
    	} catch(e) {
    		failure = e;
    	}

    	function assignRoute(key, route, detail) {
    		key = key || Math.random().toString(36).substr(2);

    		// consider as nested routes if they does not have any segment
    		const nested = !route.substr(1).includes('/');

    		const handler = { key, nested, ...detail };
    		let fullpath;

    		baseRouter.mount(fixedRoot, () => {
    			fullpath = baseRouter.add(route, handler);
    			$$invalidate(4, fallback = handler.fallback && key || fallback);
    		});

    		findRoutes();
    		return [key, fullpath];
    	}

    	function onError(err) {
    		$$invalidate(3, failure = err);

    		if (failure && fallback) {
    			doFallback(failure, fallback);
    		}
    	}

    	onMount(() => {
    		cleanup = addRouter(fixedRoot, fallback, onError);
    	});

    	onDestroy(() => {
    		if (cleanup) cleanup();
    	});

    	setContext(CTX_ROUTER, { basePath, assignRoute, unassignRoute });
    	const writable_props = ['path', 'disabled', 'condition', 'nofallback'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('path' in $$props) $$invalidate(1, path = $$props.path);
    		if ('disabled' in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ('condition' in $$props) $$invalidate(6, condition = $$props.condition);
    		if ('nofallback' in $$props) $$invalidate(2, nofallback = $$props.nofallback);
    		if ('$$scope' in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		CTX_ROUTER,
    		router,
    		baseRouter,
    		addRouter,
    		findRoutes,
    		doFallback,
    		onMount,
    		onDestroy,
    		getContext,
    		setContext,
    		cleanup,
    		failure,
    		fallback,
    		path,
    		disabled,
    		condition,
    		nofallback,
    		routerContext,
    		basePath,
    		fixedRoot,
    		assignRoute,
    		unassignRoute,
    		onError,
    		$router,
    		$basePath
    	});

    	$$self.$inject_state = $$props => {
    		if ('cleanup' in $$props) cleanup = $$props.cleanup;
    		if ('failure' in $$props) $$invalidate(3, failure = $$props.failure);
    		if ('fallback' in $$props) $$invalidate(4, fallback = $$props.fallback);
    		if ('path' in $$props) $$invalidate(1, path = $$props.path);
    		if ('disabled' in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ('condition' in $$props) $$invalidate(6, condition = $$props.condition);
    		if ('nofallback' in $$props) $$invalidate(2, nofallback = $$props.nofallback);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*condition, $router*/ 192) {
    			 if (condition) {
    				$$invalidate(0, disabled = !condition($router));
    			}
    		}
    	};

    	return [
    		disabled,
    		path,
    		nofallback,
    		failure,
    		fallback,
    		basePath,
    		condition,
    		$router,
    		$$scope,
    		slots
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			path: 1,
    			disabled: 0,
    			condition: 6,
    			nofallback: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get path() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get condition() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set condition(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nofallback() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nofallback(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/yrv/src/Route.svelte generated by Svelte v3.48.0 */
    const file$2 = "node_modules/yrv/src/Route.svelte";

    const get_default_slot_changes = dirty => ({
    	router: dirty & /*activeRouter*/ 2,
    	props: dirty & /*activeProps*/ 4
    });

    const get_default_slot_context = ctx => ({
    	router: /*activeRouter*/ ctx[1],
    	props: /*activeProps*/ ctx[2]
    });

    // (100:0) {#if failure}
    function create_if_block_2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*failure*/ ctx[3]);
    			attr_dev(p, "data-failure", "");
    			attr_dev(p, "class", "svelte-7lze0z");
    			add_location(p, file$2, 100, 2, 2360);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*failure*/ 8) set_data_dev(t, /*failure*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(100:0) {#if failure}",
    		ctx
    	});

    	return block;
    }

    // (104:0) {#if activeRouter}
    function create_if_block$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(104:0) {#if activeRouter}",
    		ctx
    	});

    	return block;
    }

    // (107:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, activeRouter, activeProps*/ 8198)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[13],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[13])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[13], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(107:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (105:2) {#if component}
    function create_if_block_1$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ router: /*activeRouter*/ ctx[1] }, /*activeProps*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*activeRouter, activeProps*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*activeRouter*/ 2 && { router: /*activeRouter*/ ctx[1] },
    					dirty & /*activeProps*/ 4 && get_spread_object(/*activeProps*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(105:2) {#if component}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*failure*/ ctx[3] && create_if_block_2(ctx);
    	let if_block1 = /*activeRouter*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*failure*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*activeRouter*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*activeRouter*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getProps(given, required) {
    	const { props: sub, ...others } = given;

    	// prune all declared props from this component
    	required = !Array.isArray(required)
    	? Object.keys(required)
    	: required;

    	required.forEach(k => {
    		delete others[k];
    	});

    	return { ...sub, ...others };
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $routeInfo;
    	let $routePath;
    	validate_store(routeInfo, 'routeInfo');
    	component_subscribe($$self, routeInfo, $$value => $$invalidate(12, $routeInfo = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Route', slots, ['default']);
    	let { key = null } = $$props;
    	let { path = '/' } = $$props;
    	let { exact = null } = $$props;
    	let { disabled = false } = $$props;
    	let { fallback = null } = $$props;
    	let { component = null } = $$props;
    	let { condition = null } = $$props;
    	let { redirect = null } = $$props;
    	const routeContext = getContext(CTX_ROUTE);
    	const routerContext = getContext(CTX_ROUTER);
    	const { assignRoute, unassignRoute } = routerContext || {};
    	const routePath = routeContext ? routeContext.routePath : writable(path);
    	validate_store(routePath, 'routePath');
    	component_subscribe($$self, routePath, value => $$invalidate(16, $routePath = value));
    	let activeRouter = null;
    	let activeProps = {};
    	let fullpath;
    	let failure;

    	const fixedRoot = $routePath !== path && $routePath !== '/'
    	? `${$routePath}${path !== '/' ? path : ''}`
    	: path;

    	try {
    		if (redirect !== null && !(/^(?:\w+:\/\/|\/)/).test(redirect)) {
    			throw new TypeError(`Expecting valid URL to redirect, given '${redirect}'`);
    		}

    		if (condition !== null && typeof condition !== 'function') {
    			throw new TypeError(`Expecting condition to be a function, given '${condition}'`);
    		}

    		if (path.charAt() !== '#' && path.charAt() !== '/') {
    			throw new TypeError(`Expecting a leading slash or hash, given '${path}'`);
    		}

    		if (!assignRoute) {
    			throw new TypeError(`Missing top-level <Router>, given route: ${path}`);
    		}

    		[key, fullpath] = assignRoute(key, fixedRoot, { condition, redirect, fallback, exact });
    	} catch(e) {
    		failure = e;
    	}

    	onDestroy(() => {
    		if (unassignRoute) {
    			unassignRoute(fullpath);
    		}
    	});

    	setContext(CTX_ROUTE, { routePath });

    	$$self.$$set = $$new_props => {
    		$$invalidate(22, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('key' in $$new_props) $$invalidate(5, key = $$new_props.key);
    		if ('path' in $$new_props) $$invalidate(6, path = $$new_props.path);
    		if ('exact' in $$new_props) $$invalidate(7, exact = $$new_props.exact);
    		if ('disabled' in $$new_props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ('fallback' in $$new_props) $$invalidate(9, fallback = $$new_props.fallback);
    		if ('component' in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ('condition' in $$new_props) $$invalidate(10, condition = $$new_props.condition);
    		if ('redirect' in $$new_props) $$invalidate(11, redirect = $$new_props.redirect);
    		if ('$$scope' in $$new_props) $$invalidate(13, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		routeInfo,
    		CTX_ROUTER,
    		CTX_ROUTE,
    		getProps,
    		onDestroy,
    		getContext,
    		setContext,
    		key,
    		path,
    		exact,
    		disabled,
    		fallback,
    		component,
    		condition,
    		redirect,
    		routeContext,
    		routerContext,
    		assignRoute,
    		unassignRoute,
    		routePath,
    		activeRouter,
    		activeProps,
    		fullpath,
    		failure,
    		fixedRoot,
    		$routeInfo,
    		$routePath
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(22, $$props = assign(assign({}, $$props), $$new_props));
    		if ('key' in $$props) $$invalidate(5, key = $$new_props.key);
    		if ('path' in $$props) $$invalidate(6, path = $$new_props.path);
    		if ('exact' in $$props) $$invalidate(7, exact = $$new_props.exact);
    		if ('disabled' in $$props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ('fallback' in $$props) $$invalidate(9, fallback = $$new_props.fallback);
    		if ('component' in $$props) $$invalidate(0, component = $$new_props.component);
    		if ('condition' in $$props) $$invalidate(10, condition = $$new_props.condition);
    		if ('redirect' in $$props) $$invalidate(11, redirect = $$new_props.redirect);
    		if ('activeRouter' in $$props) $$invalidate(1, activeRouter = $$new_props.activeRouter);
    		if ('activeProps' in $$props) $$invalidate(2, activeProps = $$new_props.activeProps);
    		if ('fullpath' in $$props) fullpath = $$new_props.fullpath;
    		if ('failure' in $$props) $$invalidate(3, failure = $$new_props.failure);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 if (key) {
    			/* global arguments */
    			$$invalidate(1, activeRouter = !disabled && $routeInfo[key]);

    			$$invalidate(2, activeProps = getProps($$props, arguments[0].$$.props));
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		activeRouter,
    		activeProps,
    		failure,
    		routePath,
    		key,
    		path,
    		exact,
    		disabled,
    		fallback,
    		condition,
    		redirect,
    		$routeInfo,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			key: 5,
    			path: 6,
    			exact: 7,
    			disabled: 8,
    			fallback: 9,
    			component: 0,
    			condition: 10,
    			redirect: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get key() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get exact() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set exact(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fallback() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fallback(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get condition() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set condition(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get redirect() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set redirect(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    Object.defineProperty(Router, 'hashchange', {
      set: value => hashchangeEnable(value),
      get: () => hashchangeEnable(),
      configurable: false,
      enumerable: false,
    });

    /* client/Footer.svelte generated by Svelte v3.48.0 */
    const file$3 = "client/Footer.svelte";

    function create_fragment$3(ctx) {
    	let hr;
    	let t0;
    	let pre0;
    	let t2;
    	let pre1;
    	let t3;
    	let t4_value = JSON.stringify(/*$router*/ ctx[0], null, 2) + "";
    	let t4;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			pre0 = element("pre");
    			pre0.textContent = "Your Footer markup goes here ";
    			t2 = space();
    			pre1 = element("pre");
    			t3 = text("Router Info from svelte store: ");
    			t4 = text(t4_value);
    			add_location(hr, file$3, 4, 0, 54);
    			add_location(pre0, file$3, 5, 0, 59);
    			add_location(pre1, file$3, 6, 0, 100);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, pre0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, pre1, anchor);
    			append_dev(pre1, t3);
    			append_dev(pre1, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$router*/ 1 && t4_value !== (t4_value = JSON.stringify(/*$router*/ ctx[0], null, 2) + "")) set_data_dev(t4, t4_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(pre0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(pre1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $router;
    	validate_store(router, 'router');
    	component_subscribe($$self, router, $$value => $$invalidate(0, $router = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ router, $router });
    	return [$router];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* client/pages/Home.svelte generated by Svelte v3.48.0 */

    const file$4 = "client/pages/Home.svelte";

    function create_fragment$4(ctx) {
    	let center;
    	let h1;
    	let t1;
    	let h4;
    	let t3;
    	let ul;
    	let li0;
    	let a0;
    	let t5;
    	let t6;
    	let li1;
    	let a1;
    	let t8;
    	let t9;
    	let li2;
    	let a2;
    	let t11;
    	let t12;
    	let li3;
    	let a3;
    	let t14;

    	const block = {
    		c: function create() {
    			center = element("center");
    			h1 = element("h1");
    			h1.textContent = "Svelte On Rust";
    			t1 = space();
    			h4 = element("h4");
    			h4.textContent = "A compiled frontend, deserves a compiled backend";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Svelte JS";
    			t5 = text(" - Cybernetically enhanced web apps");
    			t6 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Rocket.rs";
    			t8 = text(" - A web framework for Rust");
    			t9 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "YRV Router";
    			t11 = text(" - Your routing bro!");
    			t12 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Bulma CSS ";
    			t14 = text("- Modern CSS framework based on Flexbox");
    			attr_dev(h1, "class", "title is-primary is-1");
    			add_location(h1, file$4, 1, 0, 9);
    			attr_dev(h4, "class", "subtitle is-4");
    			add_location(h4, file$4, 2, 0, 65);
    			attr_dev(a0, "href", "https://svelte.dev/");
    			add_location(a0, file$4, 4, 5, 156);
    			add_location(li0, file$4, 4, 1, 152);
    			attr_dev(a1, "href", "https://rocket.rs/");
    			add_location(a1, file$4, 5, 5, 246);
    			add_location(li1, file$4, 5, 1, 242);
    			attr_dev(a2, "href", "https://github.com/pateketrueke/yrv");
    			add_location(a2, file$4, 6, 5, 328);
    			add_location(li2, file$4, 6, 1, 324);
    			attr_dev(a3, "href", "https://bulma.io");
    			add_location(a3, file$4, 7, 5, 422);
    			add_location(li3, file$4, 7, 1, 418);
    			add_location(ul, file$4, 3, 0, 146);
    			add_location(center, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, center, anchor);
    			append_dev(center, h1);
    			append_dev(center, t1);
    			append_dev(center, h4);
    			append_dev(center, t3);
    			append_dev(center, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(li0, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(li1, t8);
    			append_dev(ul, t9);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(li2, t11);
    			append_dev(ul, t12);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(li3, t14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(center);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* client/pages/About.svelte generated by Svelte v3.48.0 */

    const file$5 = "client/pages/About.svelte";

    function create_fragment$5(ctx) {
    	let h1;
    	let t1;
    	let h4;
    	let p;
    	let t2;
    	let br;
    	let t3;
    	let t4;
    	let a0;
    	let t6;
    	let a1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Svelte On Rust";
    			t1 = space();
    			h4 = element("h4");
    			p = element("p");
    			t2 = text("This component was servered by YRV svelte routing...\n    ");
    			br = element("br");
    			t3 = text("\n    Use svelte routes with # instead of / for browser history and refresh buttons to work correctly");
    			t4 = space();
    			a0 = element("a");
    			a0.textContent = "YRV Github |";
    			t6 = space();
    			a1 = element("a");
    			a1.textContent = "YRV REPL";
    			add_location(h1, file$5, 0, 0, 0);
    			add_location(br, file$5, 4, 4, 96);
    			add_location(p, file$5, 2, 4, 31);
    			add_location(h4, file$5, 2, 0, 27);
    			attr_dev(a0, "href", "https://github.com/pateketrueke/yrv");
    			add_location(a0, file$5, 8, 0, 212);
    			attr_dev(a1, "href", "https://svelte.dev/repl/0f07c6134b16432591a9a3a0095a80de?version=3.14.1");
    			add_location(a1, file$5, 9, 0, 277);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h4, anchor);
    			append_dev(h4, p);
    			append_dev(p, t2);
    			append_dev(p, br);
    			append_dev(p, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, a1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h4);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(a1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* client/pages/Common.svelte generated by Svelte v3.48.0 */
    const file$6 = "client/pages/Common.svelte";

    function create_fragment$6(ctx) {
    	let h1;
    	let t1;
    	let h3;
    	let t3;
    	let ul;
    	let li0;
    	let t4;
    	let t5_value = /*contents*/ ctx[0].app + "";
    	let t5;
    	let t6;
    	let li1;
    	let t7;
    	let t8_value = /*contents*/ ctx[0].version + "";
    	let t8;
    	let t9;
    	let li2;
    	let t10;
    	let t11_value = /*contents*/ ctx[0].status + "";
    	let t11;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Common Route on client and server";
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "Data recieved from server on mount:";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			t4 = text("App : ");
    			t5 = text(t5_value);
    			t6 = space();
    			li1 = element("li");
    			t7 = text("Version : ");
    			t8 = text(t8_value);
    			t9 = space();
    			li2 = element("li");
    			t10 = text("Status: ");
    			t11 = text(t11_value);
    			add_location(h1, file$6, 13, 0, 324);
    			add_location(h3, file$6, 14, 0, 369);
    			add_location(li0, file$6, 16, 4, 425);
    			add_location(li1, file$6, 17, 4, 461);
    			add_location(li2, file$6, 18, 4, 505);
    			add_location(ul, file$6, 15, 0, 416);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, t4);
    			append_dev(li0, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, t7);
    			append_dev(li1, t8);
    			append_dev(ul, t9);
    			append_dev(ul, li2);
    			append_dev(li2, t10);
    			append_dev(li2, t11);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*contents*/ 1 && t5_value !== (t5_value = /*contents*/ ctx[0].app + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*contents*/ 1 && t8_value !== (t8_value = /*contents*/ ctx[0].version + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*contents*/ 1 && t11_value !== (t11_value = /*contents*/ ctx[0].status + "")) set_data_dev(t11, t11_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $router;
    	validate_store(router, 'router');
    	component_subscribe($$self, router, $$value => $$invalidate(1, $router = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Common', slots, []);
    	let { contents = "" } = $$props;
    	onMount(() => getContext());

    	async function getContext() {
    		let api_path = $router.path.replace('#', '/');
    		const res = await fetch(api_path);
    		$$invalidate(0, contents = await res.json());
    	}

    	const writable_props = ['contents'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Common> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('contents' in $$props) $$invalidate(0, contents = $$props.contents);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		router,
    		contents,
    		getContext,
    		$router
    	});

    	$$self.$inject_state = $$props => {
    		if ('contents' in $$props) $$invalidate(0, contents = $$props.contents);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [contents];
    }

    class Common extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { contents: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Common",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get contents() {
    		throw new Error("<Common>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set contents(value) {
    		throw new Error("<Common>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/pages/Catcher.svelte generated by Svelte v3.48.0 */
    const file$7 = "client/pages/Catcher.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let h1;
    	let t0;
    	let t1_value = /*$router*/ ctx[0].params.name + "";
    	let t1;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text("Caught Path: ");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			p.textContent = "This component is served for all routes like '#blahblah'";
    			add_location(h1, file$7, 5, 0, 76);
    			add_location(p, file$7, 6, 4, 124);
    			attr_dev(div, "class", "content");
    			add_location(div, file$7, 3, 0, 53);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(div, t2);
    			append_dev(div, p);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$router*/ 1 && t1_value !== (t1_value = /*$router*/ ctx[0].params.name + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $router;
    	validate_store(router, 'router');
    	component_subscribe($$self, router, $$value => $$invalidate(0, $router = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Catcher', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Catcher> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ router, $router });
    	return [$router];
    }

    class Catcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Catcher",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* client/pages/WorkoutView.svelte generated by Svelte v3.48.0 */

    function create_fragment$8(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WorkoutView', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WorkoutView> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class WorkoutView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WorkoutView",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* client/App.svelte generated by Svelte v3.48.0 */
    const file$8 = "client/App.svelte";

    // (16:4) <Route exact path="/">
    function create_default_slot_5(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(16:4) <Route exact path=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:4) <Route path="#about">
    function create_default_slot_4(ctx) {
    	let about;
    	let current;
    	about = new About({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(about.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(about, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(about, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(17:4) <Route path=\\\"#about\\\">",
    		ctx
    	});

    	return block;
    }

    // (18:1) <Route path="#app/common" let:router>
    function create_default_slot_3(ctx) {
    	let common;
    	let current;
    	common = new Common({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(common.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(common, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(common.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(common.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(common, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(18:1) <Route path=\\\"#app/common\\\" let:router>",
    		ctx
    	});

    	return block;
    }

    // (19:1) <Route path="#:name" let:router>
    function create_default_slot_2(ctx) {
    	let catcher;
    	let current;
    	catcher = new Catcher({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(catcher.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(catcher, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(catcher.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(catcher.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(catcher, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(19:1) <Route path=\\\"#:name\\\" let:router>",
    		ctx
    	});

    	return block;
    }

    // (20:1) <Route exact path="#bruh">
    function create_default_slot_1(ctx) {
    	let workoutview;
    	let current;
    	workoutview = new WorkoutView({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(workoutview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(workoutview, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(workoutview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(workoutview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(workoutview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(20:1) <Route exact path=\\\"#bruh\\\">",
    		ctx
    	});

    	return block;
    }

    // (15:2) <Router>
    function create_default_slot(ctx) {
    	let route0;
    	let t0;
    	let route1;
    	let t1;
    	let route2;
    	let t2;
    	let route3;
    	let t3;
    	let route4;
    	let current;

    	route0 = new Route({
    			props: {
    				exact: true,
    				path: "/",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route1 = new Route({
    			props: {
    				path: "#about",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route2 = new Route({
    			props: {
    				path: "#app/common",
    				$$slots: {
    					default: [
    						create_default_slot_3,
    						({ router }) => ({ 0: router }),
    						({ router }) => router ? 1 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route3 = new Route({
    			props: {
    				path: "#:name",
    				$$slots: {
    					default: [
    						create_default_slot_2,
    						({ router }) => ({ 0: router }),
    						({ router }) => router ? 1 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route4 = new Route({
    			props: {
    				exact: true,
    				path: "#bruh",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route0.$$.fragment);
    			t0 = space();
    			create_component(route1.$$.fragment);
    			t1 = space();
    			create_component(route2.$$.fragment);
    			t2 = space();
    			create_component(route3.$$.fragment);
    			t3 = space();
    			create_component(route4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(route1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(route2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(route3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(route4, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route0_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route0_changes.$$scope = { dirty, ctx };
    			}

    			route0.$set(route0_changes);
    			const route1_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route1_changes.$$scope = { dirty, ctx };
    			}

    			route1.$set(route1_changes);
    			const route2_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route2_changes.$$scope = { dirty, ctx };
    			}

    			route2.$set(route2_changes);
    			const route3_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route3_changes.$$scope = { dirty, ctx };
    			}

    			route3.$set(route3_changes);
    			const route4_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				route4_changes.$$scope = { dirty, ctx };
    			}

    			route4.$set(route4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			transition_in(route4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			transition_out(route4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(route1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(route2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(route3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(route4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(15:2) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let main;
    	let nav;
    	let t0;
    	let router;
    	let t1;
    	let footer;
    	let current;
    	nav = new Nav({ $$inline: true });

    	router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t0 = space();
    			create_component(router.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    			add_location(main, file$8, 12, 0, 380);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t0);
    			mount_component(router, main, null);
    			append_dev(main, t1);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			destroy_component(router);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Nav,
    		Footer,
    		Router,
    		Route,
    		Home,
    		About,
    		Common,
    		Catcher,
    		WorkoutView
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'from Svelte'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
