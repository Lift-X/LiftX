
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
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
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

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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
    			attr_dev(img, "class", "svelte-371q1a");
    			add_location(img, file, 5, 20, 190);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-371q1a");
    			add_location(a0, file, 4, 16, 157);
    			attr_dev(div0, "class", "nav-logo svelte-371q1a");
    			add_location(div0, file, 3, 12, 118);
    			attr_dev(div1, "class", "navbar-brand");
    			add_location(div1, file, 2, 8, 79);
    			attr_dev(a1, "class", "navbar-item svelte-371q1a");
    			attr_dev(a1, "href", "/");
    			add_location(a1, file, 11, 20, 381);
    			attr_dev(li0, "class", "svelte-371q1a");
    			add_location(li0, file, 11, 16, 377);
    			attr_dev(a2, "class", "navbar-item svelte-371q1a");
    			attr_dev(a2, "href", "#about");
    			add_location(a2, file, 12, 20, 447);
    			attr_dev(li1, "class", "svelte-371q1a");
    			add_location(li1, file, 12, 16, 443);
    			attr_dev(a3, "class", "navbar-item svelte-371q1a");
    			attr_dev(a3, "href", "#app/common");
    			add_location(a3, file, 13, 20, 520);
    			attr_dev(li2, "class", "svelte-371q1a");
    			add_location(li2, file, 13, 16, 516);
    			attr_dev(ul, "class", "nav-links svelte-371q1a");
    			add_location(ul, file, 10, 12, 338);
    			attr_dev(div2, "class", "navbar-menu");
    			add_location(div2, file, 9, 8, 300);
    			attr_dev(div3, "class", "svelte-371q1a");
    			add_location(div3, file, 1, 4, 65);
    			attr_dev(nav, "class", "navbar is-primary svelte-371q1a");
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

    var W=Object.create;var S=Object.defineProperty;var X=Object.getOwnPropertyDescriptor;var Y=Object.getOwnPropertyNames;var Z=Object.getPrototypeOf,rr=Object.prototype.hasOwnProperty;var er=r=>S(r,"__esModule",{value:!0});var y=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports);var tr=(r,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of Y(e))!rr.call(r,a)&&(t||a!=="default")&&S(r,a,{get:()=>e[a],enumerable:!(n=X(e,a))||n.enumerable});return r},nr=(r,e)=>tr(er(S(r!=null?W(Z(r)):{},"default",!e&&r&&r.__esModule?{get:()=>r.default,enumerable:!0}:{value:r,enumerable:!0})),r);var A=y((Fr,_)=>{_.exports=r=>encodeURIComponent(r).replace(/[!'()*]/g,e=>`%${e.charCodeAt(0).toString(16).toUpperCase()}`);});var U=y((wr,N)=>{var E="%[a-f0-9]{2}",C=new RegExp(E,"gi"),$=new RegExp("("+E+")+","gi");function x(r,e){try{return decodeURIComponent(r.join(""))}catch{}if(r.length===1)return r;e=e||1;var t=r.slice(0,e),n=r.slice(e);return Array.prototype.concat.call([],x(t),x(n))}function ar(r){try{return decodeURIComponent(r)}catch{for(var e=r.match(C),t=1;t<e.length;t++)r=x(e,t).join(""),e=r.match(C);return r}}function cr(r){for(var e={"%FE%FF":"\uFFFD\uFFFD","%FF%FE":"\uFFFD\uFFFD"},t=$.exec(r);t;){try{e[t[0]]=decodeURIComponent(t[0]);}catch{var n=ar(t[0]);n!==t[0]&&(e[t[0]]=n);}t=$.exec(r);}e["%C2"]="\uFFFD";for(var a=Object.keys(e),c=0;c<a.length;c++){var i=a[c];r=r.replace(new RegExp(i,"g"),e[i]);}return r}N.exports=function(r){if(typeof r!="string")throw new TypeError("Expected `encodedURI` to be of type `string`, got `"+typeof r+"`");try{return r=r.replace(/\+/g," "),decodeURIComponent(r)}catch{return cr(r)}};});var k=y((Or,R)=>{R.exports=(r,e)=>{if(!(typeof r=="string"&&typeof e=="string"))throw new TypeError("Expected the arguments to be of type `string`");if(e==="")return [r];let t=r.indexOf(e);return t===-1?[r]:[r.slice(0,t),r.slice(t+e.length)]};});var D=y((br,q)=>{q.exports=function(r,e){for(var t={},n=Object.keys(r),a=Array.isArray(e),c=0;c<n.length;c++){var i=n[c],s=r[i];(a?e.indexOf(i)!==-1:e(i,s,r))&&(t[i]=s);}return t};});var V=y(o=>{var ir=A(),sr=U(),T=k(),fr=D(),ur=r=>r==null;function lr(r){switch(r.arrayFormat){case"index":return e=>(t,n)=>{let a=t.length;return n===void 0||r.skipNull&&n===null||r.skipEmptyString&&n===""?t:n===null?[...t,[l(e,r),"[",a,"]"].join("")]:[...t,[l(e,r),"[",l(a,r),"]=",l(n,r)].join("")]};case"bracket":return e=>(t,n)=>n===void 0||r.skipNull&&n===null||r.skipEmptyString&&n===""?t:n===null?[...t,[l(e,r),"[]"].join("")]:[...t,[l(e,r),"[]=",l(n,r)].join("")];case"comma":case"separator":return e=>(t,n)=>n==null||n.length===0?t:t.length===0?[[l(e,r),"=",l(n,r)].join("")]:[[t,l(n,r)].join(r.arrayFormatSeparator)];default:return e=>(t,n)=>n===void 0||r.skipNull&&n===null||r.skipEmptyString&&n===""?t:n===null?[...t,l(e,r)]:[...t,[l(e,r),"=",l(n,r)].join("")]}}function or(r){let e;switch(r.arrayFormat){case"index":return (t,n,a)=>{if(e=/\[(\d*)\]$/.exec(t),t=t.replace(/\[\d*\]$/,""),!e){a[t]=n;return}a[t]===void 0&&(a[t]={}),a[t][e[1]]=n;};case"bracket":return (t,n,a)=>{if(e=/(\[\])$/.exec(t),t=t.replace(/\[\]$/,""),!e){a[t]=n;return}if(a[t]===void 0){a[t]=[n];return}a[t]=[].concat(a[t],n);};case"comma":case"separator":return (t,n,a)=>{let c=typeof n=="string"&&n.includes(r.arrayFormatSeparator),i=typeof n=="string"&&!c&&h(n,r).includes(r.arrayFormatSeparator);n=i?h(n,r):n;let s=c||i?n.split(r.arrayFormatSeparator).map(u=>h(u,r)):n===null?n:h(n,r);a[t]=s;};default:return (t,n,a)=>{if(a[t]===void 0){a[t]=n;return}a[t]=[].concat(a[t],n);}}}function M(r){if(typeof r!="string"||r.length!==1)throw new TypeError("arrayFormatSeparator must be single character string")}function l(r,e){return e.encode?e.strict?ir(r):encodeURIComponent(r):r}function h(r,e){return e.decode?sr(r):r}function B(r){return Array.isArray(r)?r.sort():typeof r=="object"?B(Object.keys(r)).sort((e,t)=>Number(e)-Number(t)).map(e=>r[e]):r}function L(r){let e=r.indexOf("#");return e!==-1&&(r=r.slice(0,e)),r}function dr(r){let e="",t=r.indexOf("#");return t!==-1&&(e=r.slice(t)),e}function H(r){r=L(r);let e=r.indexOf("?");return e===-1?"":r.slice(e+1)}function I(r,e){return e.parseNumbers&&!Number.isNaN(Number(r))&&typeof r=="string"&&r.trim()!==""?r=Number(r):e.parseBooleans&&r!==null&&(r.toLowerCase()==="true"||r.toLowerCase()==="false")&&(r=r.toLowerCase()==="true"),r}function P(r,e){e=Object.assign({decode:!0,sort:!0,arrayFormat:"none",arrayFormatSeparator:",",parseNumbers:!1,parseBooleans:!1},e),M(e.arrayFormatSeparator);let t=or(e),n=Object.create(null);if(typeof r!="string"||(r=r.trim().replace(/^[?#&]/,""),!r))return n;for(let a of r.split("&")){if(a==="")continue;let[c,i]=T(e.decode?a.replace(/\+/g," "):a,"=");i=i===void 0?null:["comma","separator"].includes(e.arrayFormat)?i:h(i,e),t(h(c,e),i,n);}for(let a of Object.keys(n)){let c=n[a];if(typeof c=="object"&&c!==null)for(let i of Object.keys(c))c[i]=I(c[i],e);else n[a]=I(c,e);}return e.sort===!1?n:(e.sort===!0?Object.keys(n).sort():Object.keys(n).sort(e.sort)).reduce((a,c)=>{let i=n[c];return Boolean(i)&&typeof i=="object"&&!Array.isArray(i)?a[c]=B(i):a[c]=i,a},Object.create(null))}o.extract=H;o.parse=P;o.stringify=(r,e)=>{if(!r)return "";e=Object.assign({encode:!0,strict:!0,arrayFormat:"none",arrayFormatSeparator:","},e),M(e.arrayFormatSeparator);let t=i=>e.skipNull&&ur(r[i])||e.skipEmptyString&&r[i]==="",n=lr(e),a={};for(let i of Object.keys(r))t(i)||(a[i]=r[i]);let c=Object.keys(a);return e.sort!==!1&&c.sort(e.sort),c.map(i=>{let s=r[i];return s===void 0?"":s===null?l(i,e):Array.isArray(s)?s.reduce(n(i),[]).join("&"):l(i,e)+"="+l(s,e)}).filter(i=>i.length>0).join("&")};o.parseUrl=(r,e)=>{e=Object.assign({decode:!0},e);let[t,n]=T(r,"#");return Object.assign({url:t.split("?")[0]||"",query:P(H(r),e)},e&&e.parseFragmentIdentifier&&n?{fragmentIdentifier:h(n,e)}:{})};o.stringifyUrl=(r,e)=>{e=Object.assign({encode:!0,strict:!0},e);let t=L(r.url).split("?")[0]||"",n=o.extract(r.url),a=o.parse(n,{sort:!1}),c=Object.assign(a,r.query),i=o.stringify(c,e);i&&(i=`?${i}`);let s=dr(r.url);return r.fragmentIdentifier&&(s=`#${l(r.fragmentIdentifier,e)}`),`${t}${i}${s}`};o.pick=(r,e,t)=>{t=Object.assign({parseFragmentIdentifier:!0},t);let{url:n,query:a,fragmentIdentifier:c}=o.parseUrl(r,t);return o.stringifyUrl({url:n,query:fr(a,e),fragmentIdentifier:c},t)};o.exclude=(r,e,t)=>{let n=Array.isArray(e)?a=>!e.includes(a):(a,c)=>!e(a,c);return o.pick(r,n,t)};});var K=nr(V());var p=function(r){function e(t,n){var a="Unreachable '"+(t!=="/"?t.replace(/\/$/,""):t)+"', segment '"+n+"' is not defined";r.call(this,a),this.message=a,this.route=t,this.path=n;}return r&&(e.__proto__=r),e.prototype=Object.create(r&&r.prototype),e.prototype.constructor=e,e}(Error);function Q(r,e){var t,n,a=-100,c=[];t=r.replace(/[-$.]/g,"\\$&").replace(/\(/g,"(?:").replace(/\)/g,")?").replace(/([:*]\w+)(?:<([^<>]+?)>)?/g,function(u,d,f){return c.push(d.substr(1)),d.charAt()===":"?(a+=100,"((?!#)"+(f||"[^#/]+?")+")"):(n=!0,a+=500,"((?!#)"+(f||"[^#]+?")+")")});try{t=new RegExp("^"+t+"$");}catch{throw new TypeError("Invalid route expression, given '"+e+"'")}var i=r.includes("#")?.5:1,s=r.length*a*i;return {keys:c,regex:t,_depth:s,_isSplat:n}}var m=function(e,t){var n=Q(e,t),a=n.keys,c=n.regex,i=n._depth,s=n._isSplat;return {_isSplat:s,_depth:i,match:function(u){var d=u.match(c);if(d)return a.reduce(function(f,F,w){return f[F]=typeof d[w+1]=="string"?decodeURIComponent(d[w+1]):null,f},{})}}};m.push=function(e,t,n,a){var c=t[e]||(t[e]={});return c.pattern||(c.pattern=new m(e,a),c.route=(n||"").replace(/\/$/,"")||"/"),t.keys=t.keys||[],t.keys.includes(e)||(t.keys.push(e),m.sort(t)),c};m.sort=function(e){e.keys.sort(function(t,n){return e[t].pattern._depth-e[n].pattern._depth});};function z(r,e){return ""+(e&&e!=="/"?e:"")+(r||"")}function b(r,e){var t=r.match(/<[^<>]*\/[^<>]*>/);if(t)throw new TypeError("RegExp cannot contain slashes, given '"+t+"'");var n=r.split(/(?=\/|#)/),a=[];n[0]!=="/"&&n.unshift("/"),n.some(function(c,i){var s=a.slice(1).concat(c).join("")||null,u=n.slice(i+1).join("")||null,d=e(c,s,u?""+(c!=="/"?c:"")+u:null);return a.push(c),d});}function hr(r,e,t){var n={},a=[],c;return b(r,function(i,s,u){var d;if(!e.keys)throw new p(r,i);if(e.keys.some(function(f){if(t.includes(f))return !1;var F=e[f].pattern,w=F.match,O=F._isSplat,v=w(O&&u||i);if(v){if(Object.assign(n,v),e[f].route){var g=Object.assign({},e[f].info),j=!1;g.exact?j=u===null:j=!(i&&s===null)||i===s||O||!u,g.matches=j,g.params=Object.assign({},n),g.route=e[f].route,g.path=O&&u||s||i,a.push(g);}return u===null&&!e[f].keys||(f!=="/"&&t.push(f),c=O,e=e[f],d=!0),!0}return !1}),!(d||e.keys.some(function(f){return e[f].pattern.match(i)})))throw new p(r,i);return c||!d}),a}function G(r,e,t){for(var n=hr.bind(null,r,e),a=[];t>0;){t-=1;try{return n(a)}catch(c){if(t>0)return n(a);throw c}}}function gr(r,e,t,n){var a=z(r,t),c=e,i;return n&&n.nested!==!0&&(i=n.key,delete n.key),b(a,function(s,u){c=m.push(s,c,u,a),s!=="/"&&(c.info=c.info||Object.assign({},n));}),c.info=c.info||Object.assign({},n),i&&(c.info.key=i),a}function mr(r,e,t){var n=z(r,t),a=e,c=null,i=null;if(b(n,function(u){if(!a)return c=null,!0;if(!a.keys)throw new p(r,u);i=u,c=a,a=a[i];}),!(c&&i))throw new p(r,i);if(c===e&&(c=e["/"]),c.route!==i){var s=c.keys.indexOf(i);if(s===-1)throw new p(r,i);c.keys.splice(s,1),m.sort(c),delete c[i];}a.route===c.route&&(!a.info||a.info.key===c.info.key)&&delete c.info;}var J=function(){var e={},t=[];return {resolve:function(n,a){var c=n.split("?")[0],i=[];b(c,function(s,u,d){try{a(null,G(u,e,1).filter(function(f){return i.includes(f.path)?!1:(i.push(f.path),!0)}));}catch(f){a(f,[]);}});},mount:function(n,a){n!=="/"&&t.push(n),a(),t.pop();},find:function(n,a){return G(n,e,a===!0?2:a||1)},add:function(n,a){return gr(n,e,t.join(""),a)},rm:function(n){return mr(n,e,t.join(""))}}};J.matches=function(e,t){return Q(e,t).regex.test(t)};var yr=J;var export_parse=K.parse;var export_stringify=K.stringify;

    const cache = {};
    const baseTag = document.getElementsByTagName('base');
    const basePrefix = (baseTag[0] && baseTag[0].href) || '/';

    const ROOT_URL = basePrefix.replace(window.location.origin, '');

    const router = writable({
      path: '/',
      query: {},
      params: {},
      initial: true,
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

    Object.defineProperty(router, 'hashchange', {
      set: value => hashchangeEnable(value),
      get: () => hashchangeEnable(),
      configurable: false,
      enumerable: false,
    });

    function fixedLocation(path, callback, doFinally) {
      const baseUri = router.hashchange ? window.location.hash.replace('#', '') : window.location.pathname;

      // this will rebase anchors to avoid location changes
      if (path.charAt() !== '/') {
        path = baseUri + path;
      }

      const currentURL = baseUri + window.location.hash + window.location.search;

      // do not change location et all...
      if (currentURL !== path) {
        callback(path);
      }

      // invoke final guard regardless of previous result
      if (typeof doFinally === 'function') {
        doFinally();
      }
    }

    function cleanPath(uri, fix) {
      return uri !== '/' || fix ? uri.replace(/\/$/, '') : uri;
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

      if (queryParams) {
        const qs = export_stringify(queryParams);

        if (qs) {
          path += `?${qs}`;
        }
      }

      if (router.hashchange) {
        let fixedURL = path.replace(/^#|#$/g, '');

        if (ROOT_URL !== '/') {
          fixedURL = fixedURL.replace(cleanPath(ROOT_URL), '');
        }

        window.location.hash = fixedURL !== '/' ? fixedURL : '';
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

    function getProps(given, required) {
      const { props: sub, ...others } = given;

      // prune all declared props from this component
      required.forEach(k => {
        delete others[k];
      });

      return {
        ...sub,
        ...others,
      };
    }

    function isActive(uri, path, exact) {
      if (!cache[[uri, path, exact]]) {
        if (exact !== true && path.indexOf(uri) === 0) {
          cache[[uri, path, exact]] = /^[#/?]?$/.test(path.substr(uri.length, 1));
        } else if (uri.includes('*') || uri.includes(':')) {
          cache[[uri, path, exact]] = yr.matches(uri, path);
        } else {
          cache[[uri, path, exact]] = cleanPath(path) === uri;
        }
      }

      return cache[[uri, path, exact]];
    }

    function isPromise(object) {
      return object && typeof object.then === 'function';
    }

    function isSvelteComponent(object) {
      return object && object.prototype;
    }

    const baseRouter = new yr();
    const routeInfo = writable({});

    // private registries
    const onError = {};
    const shared = {};

    let errors = [];
    let routers = 0;
    let interval;
    let currentURL;

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
        if (x.key && x.matches && !shared.routeInfo[x.key]) {
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
      let baseUri = !router.hashchange ? window.location.href.replace(window.location.origin, '') : window.location.hash || '/';
      let failure;

      // unprefix active URL
      if (ROOT_URL !== '/') {
        baseUri = baseUri.replace(cleanPath(ROOT_URL), '');
      }

      // skip given anchors if already exists on document, see #43
      if (
        /^#[\w-]+$/.test(window.location.hash)
        && document.querySelector(window.location.hash)
        && currentURL === baseUri.split('#')[0]
      ) return;

      // trailing slash is required to keep route-info on nested routes!
      // see: https://github.com/pateketrueke/abstract-nested-router/commit/0f338384bddcfbaee30f3ea2c4eb0c24cf5174cd
      const [fixedUri, qs] = baseUri.replace('/#', '#').replace(/^#\//, '/').split('?');
      const fullpath = fixedUri.replace(/\/?$/, '/');
      const query = export_parse(qs);
      const params = {};
      const keys = [];

      // reset current state
      routeInfo.set({});

      if (currentURL !== baseUri) {
        currentURL = baseUri;
        router.set({
          path: cleanPath(fullpath),
          query,
          params,
        });
      }

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

      // it's fine to omit failures for '/' paths
      if (failure && failure.path !== '/') {
        keys.reduce((prev, cur) => {
          prev[cur] = null;
          return prev;
        }, toDelete);
      } else {
        failure = null;
      }

      // clear previously failed handlers
      errors.forEach(cb => cb());
      errors = [];

      try {
        // clear routes that not longer matches!
        baseRouter.find(cleanPath(fullpath))
          .forEach(sub => {
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
          const fn = onError[root].callback;

          fn(failure);
          errors.push(fn);
        }

        if (!fallback && onError[root].fallback) {
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
      if (!onError[root] || fallback) {
        onError[root] = { fallback, callback };
      }

      routers += 1;

      return () => {
        routers -= 1;

        if (!routers) {
          window.removeEventListener('popstate', findRoutes, false);
        }
      };
    }

    /* node_modules/yrv/build/dist/lib/Router.svelte generated by Svelte v3.48.0 */

    // (104:0) {#if !disabled}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

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
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[6],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(104:0) {#if !disabled}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = !/*disabled*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*disabled*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*disabled*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	try {
    		baseRouter.rm(route);
    	} catch(e) {
    		
    	} // 🔥 this is fine...

    	findRoutes();
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $router;
    	let $basePath;
    	validate_store(router, 'router');
    	component_subscribe($$self, router, $$value => $$invalidate(5, $router = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, ['default']);
    	let cleanup;
    	let failure;
    	let fallback;
    	let { path = '/' } = $$props;
    	let { pending = null } = $$props;
    	let { disabled = false } = $$props;
    	let { condition = null } = $$props;
    	const routerContext = getContext(CTX_ROUTER);
    	const basePath = routerContext ? routerContext.basePath : writable(path);
    	validate_store(basePath, 'basePath');
    	component_subscribe($$self, basePath, value => $$invalidate(11, $basePath = value));

    	const fixedRoot = $basePath !== path && $basePath !== '/'
    	? `${$basePath}${path !== '/' ? path : ''}`
    	: path;

    	function assignRoute(key, route, detail) {
    		key = key || Math.random().toString(36).substr(2);

    		// consider as nested routes if they does not have any segment
    		const nested = !route.substr(1).includes('/');

    		const handler = { key, nested, ...detail };
    		let fullpath;

    		baseRouter.mount(fixedRoot, () => {
    			fullpath = baseRouter.add(route, handler);
    			fallback = handler.fallback && key || fallback;
    		});

    		findRoutes();
    		return [key, fullpath];
    	}

    	function onError(err) {
    		failure = err;

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

    	setContext(CTX_ROUTER, {
    		basePath,
    		assignRoute,
    		unassignRoute,
    		pendingComponent: pending
    	});

    	const writable_props = ['path', 'pending', 'disabled', 'condition'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('path' in $$props) $$invalidate(2, path = $$props.path);
    		if ('pending' in $$props) $$invalidate(3, pending = $$props.pending);
    		if ('disabled' in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ('condition' in $$props) $$invalidate(4, condition = $$props.condition);
    		if ('$$scope' in $$props) $$invalidate(6, $$scope = $$props.$$scope);
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
    		pending,
    		disabled,
    		condition,
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
    		if ('failure' in $$props) failure = $$props.failure;
    		if ('fallback' in $$props) fallback = $$props.fallback;
    		if ('path' in $$props) $$invalidate(2, path = $$props.path);
    		if ('pending' in $$props) $$invalidate(3, pending = $$props.pending);
    		if ('disabled' in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ('condition' in $$props) $$invalidate(4, condition = $$props.condition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*condition, $router*/ 48) {
    			 if (condition) {
    				$$invalidate(0, disabled = !condition($router));
    			}
    		}
    	};

    	return [disabled, basePath, path, pending, condition, $router, $$scope, slots];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			path: 2,
    			pending: 3,
    			disabled: 0,
    			condition: 4
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

    	get pending() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pending(value) {
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
    }

    /* node_modules/yrv/build/dist/lib/Route.svelte generated by Svelte v3.48.0 */
    const get_default_slot_spread_changes = dirty => dirty & /*activeProps*/ 8;
    const get_default_slot_changes = dirty => ({});
    const get_default_slot_context = ctx => ({ .../*activeProps*/ ctx[3] });

    // (127:0) {#if activeRouter}
    function create_if_block$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_if_block_5, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*hasLoaded*/ ctx[4]) return 0;
    		if (/*component*/ ctx[0]) return 1;
    		return 2;
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
    		source: "(127:0) {#if activeRouter}",
    		ctx
    	});

    	return block;
    }

    // (141:4) {:else}
    function create_else_block_1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], get_default_slot_context);

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
    				if (default_slot.p && (!current || dirty & /*$$scope, activeProps*/ 32776)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[15],
    						get_default_slot_spread_changes(dirty) || !current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, get_default_slot_changes),
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(141:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (139:4) {#if component}
    function create_if_block_5(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*activeProps*/ ctx[3]];
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
    			const switch_instance_changes = (dirty & /*activeProps*/ 8)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*activeProps*/ ctx[3])])
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(139:4) {#if component}",
    		ctx
    	});

    	return block;
    }

    // (128:2) {#if !hasLoaded}
    function create_if_block_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*pending*/ ctx[1] || /*pendingComponent*/ ctx[5]) && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*pending*/ ctx[1] || /*pendingComponent*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*pending*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(128:2) {#if !hasLoaded}",
    		ctx
    	});

    	return block;
    }

    // (129:4) {#if pending || pendingComponent}
    function create_if_block_2(ctx) {
    	let show_if;
    	let show_if_1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_3, create_if_block_4, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (dirty & /*pending*/ 2) show_if = null;
    		if (show_if == null) show_if = !!isSvelteComponent(/*pending*/ ctx[1]);
    		if (show_if) return 0;
    		if (show_if_1 == null) show_if_1 = !!isSvelteComponent(/*pendingComponent*/ ctx[5]);
    		if (show_if_1) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_1(ctx, -1);
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
    			current_block_type_index = select_block_type_1(ctx, dirty);

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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(129:4) {#if pending || pendingComponent}",
    		ctx
    	});

    	return block;
    }

    // (134:6) {:else}
    function create_else_block(ctx) {
    	let t_value = (/*pending*/ ctx[1] || /*pendingComponent*/ ctx[5]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pending*/ 2 && t_value !== (t_value = (/*pending*/ ctx[1] || /*pendingComponent*/ ctx[5]) + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(134:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (132:52) 
    function create_if_block_4(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*activeProps*/ ctx[3]];
    	var switch_value = /*pendingComponent*/ ctx[5];

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
    			const switch_instance_changes = (dirty & /*activeProps*/ 8)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*activeProps*/ ctx[3])])
    			: {};

    			if (switch_value !== (switch_value = /*pendingComponent*/ ctx[5])) {
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(132:52) ",
    		ctx
    	});

    	return block;
    }

    // (130:6) {#if isSvelteComponent(pending)}
    function create_if_block_3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*activeProps*/ ctx[3]];
    	var switch_value = /*pending*/ ctx[1];

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
    			const switch_instance_changes = (dirty & /*activeProps*/ 8)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*activeProps*/ ctx[3])])
    			: {};

    			if (switch_value !== (switch_value = /*pending*/ ctx[1])) {
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(130:6) {#if isSvelteComponent(pending)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*activeRouter*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*activeRouter*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*activeRouter*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let $routeInfo;
    	let $routePath;
    	validate_store(routeInfo, 'routeInfo');
    	component_subscribe($$self, routeInfo, $$value => $$invalidate(14, $routeInfo = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Route', slots, ['default']);
    	let { key = null } = $$props;
    	let { path = '/' } = $$props;
    	let { exact = null } = $$props;
    	let { pending = null } = $$props;
    	let { disabled = false } = $$props;
    	let { fallback = null } = $$props;
    	let { component = null } = $$props;
    	let { condition = null } = $$props;
    	let { redirect = null } = $$props;

    	// replacement for `Object.keys(arguments[0].$$.props)`
    	const thisProps = [
    		'key',
    		'path',
    		'exact',
    		'pending',
    		'disabled',
    		'fallback',
    		'component',
    		'condition',
    		'redirect'
    	];

    	const routeContext = getContext(CTX_ROUTE);
    	const routerContext = getContext(CTX_ROUTER);
    	const { assignRoute, unassignRoute, pendingComponent } = routerContext || {};
    	const routePath = routeContext ? routeContext.routePath : writable(path);
    	validate_store(routePath, 'routePath');
    	component_subscribe($$self, routePath, value => $$invalidate(18, $routePath = value));
    	let activeRouter = null;
    	let activeProps = {};
    	let fullpath;
    	let hasLoaded;

    	const fixedRoot = $routePath !== path && $routePath !== '/'
    	? `${$routePath}${path !== '/' ? path : ''}`
    	: path;

    	function resolve() {
    		const fixedRoute = path !== fixedRoot && fixedRoot.substr(-1) !== '/'
    		? `${fixedRoot}/`
    		: fixedRoot;

    		$$invalidate(7, [key, fullpath] = assignRoute(key, fixedRoute, { condition, redirect, fallback, exact }), key);
    	}

    	resolve();

    	onDestroy(() => {
    		if (unassignRoute) {
    			unassignRoute(fullpath);
    		}
    	});

    	setContext(CTX_ROUTE, { routePath });

    	$$self.$$set = $$new_props => {
    		$$invalidate(26, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ('key' in $$new_props) $$invalidate(7, key = $$new_props.key);
    		if ('path' in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ('exact' in $$new_props) $$invalidate(9, exact = $$new_props.exact);
    		if ('pending' in $$new_props) $$invalidate(1, pending = $$new_props.pending);
    		if ('disabled' in $$new_props) $$invalidate(10, disabled = $$new_props.disabled);
    		if ('fallback' in $$new_props) $$invalidate(11, fallback = $$new_props.fallback);
    		if ('component' in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ('condition' in $$new_props) $$invalidate(12, condition = $$new_props.condition);
    		if ('redirect' in $$new_props) $$invalidate(13, redirect = $$new_props.redirect);
    		if ('$$scope' in $$new_props) $$invalidate(15, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		routeInfo,
    		CTX_ROUTER,
    		CTX_ROUTE,
    		getProps,
    		isPromise,
    		isSvelteComponent,
    		onDestroy,
    		getContext,
    		setContext,
    		key,
    		path,
    		exact,
    		pending,
    		disabled,
    		fallback,
    		component,
    		condition,
    		redirect,
    		thisProps,
    		routeContext,
    		routerContext,
    		assignRoute,
    		unassignRoute,
    		pendingComponent,
    		routePath,
    		activeRouter,
    		activeProps,
    		fullpath,
    		hasLoaded,
    		fixedRoot,
    		resolve,
    		$routeInfo,
    		$routePath
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(26, $$props = assign(assign({}, $$props), $$new_props));
    		if ('key' in $$props) $$invalidate(7, key = $$new_props.key);
    		if ('path' in $$props) $$invalidate(8, path = $$new_props.path);
    		if ('exact' in $$props) $$invalidate(9, exact = $$new_props.exact);
    		if ('pending' in $$props) $$invalidate(1, pending = $$new_props.pending);
    		if ('disabled' in $$props) $$invalidate(10, disabled = $$new_props.disabled);
    		if ('fallback' in $$props) $$invalidate(11, fallback = $$new_props.fallback);
    		if ('component' in $$props) $$invalidate(0, component = $$new_props.component);
    		if ('condition' in $$props) $$invalidate(12, condition = $$new_props.condition);
    		if ('redirect' in $$props) $$invalidate(13, redirect = $$new_props.redirect);
    		if ('activeRouter' in $$props) $$invalidate(2, activeRouter = $$new_props.activeRouter);
    		if ('activeProps' in $$props) $$invalidate(3, activeProps = $$new_props.activeProps);
    		if ('fullpath' in $$props) fullpath = $$new_props.fullpath;
    		if ('hasLoaded' in $$props) $$invalidate(4, hasLoaded = $$new_props.hasLoaded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 if (key) {
    			$$invalidate(2, activeRouter = !disabled && $routeInfo[key]);
    			$$invalidate(3, activeProps = getProps($$props, thisProps));
    			$$invalidate(3, activeProps.router = activeRouter, activeProps);
    		}

    		if ($$self.$$.dirty & /*activeRouter, component*/ 5) {
    			 if (activeRouter) {
    				if (!component) {
    					// component passed as slot
    					$$invalidate(4, hasLoaded = true);
    				} else if (isSvelteComponent(component)) {
    					// component passed as Svelte component
    					$$invalidate(4, hasLoaded = true);
    				} else if (isPromise(component)) {
    					// component passed as import()
    					component.then(module => {
    						$$invalidate(0, component = module.default);
    						$$invalidate(4, hasLoaded = true);
    					});
    				} else {
    					// component passed as () => import()
    					component().then(module => {
    						$$invalidate(0, component = module.default);
    						$$invalidate(4, hasLoaded = true);
    					});
    				}
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		pending,
    		activeRouter,
    		activeProps,
    		hasLoaded,
    		pendingComponent,
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
    			key: 7,
    			path: 8,
    			exact: 9,
    			pending: 1,
    			disabled: 10,
    			fallback: 11,
    			component: 0,
    			condition: 12,
    			redirect: 13
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

    	get pending() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pending(value) {
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

    /* client/Footer.svelte generated by Svelte v3.48.0 */
    const file$1 = "client/Footer.svelte";

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
    			add_location(hr, file$1, 4, 0, 54);
    			add_location(pre0, file$1, 5, 0, 59);
    			add_location(pre1, file$1, 6, 0, 100);
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

    const file$2 = "client/pages/Home.svelte";

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
    			add_location(h1, file$2, 1, 0, 9);
    			attr_dev(h4, "class", "subtitle is-4");
    			add_location(h4, file$2, 2, 0, 65);
    			attr_dev(a0, "href", "https://svelte.dev/");
    			add_location(a0, file$2, 4, 5, 156);
    			add_location(li0, file$2, 4, 1, 152);
    			attr_dev(a1, "href", "https://rocket.rs/");
    			add_location(a1, file$2, 5, 5, 246);
    			add_location(li1, file$2, 5, 1, 242);
    			attr_dev(a2, "href", "https://github.com/pateketrueke/yrv");
    			add_location(a2, file$2, 6, 5, 328);
    			add_location(li2, file$2, 6, 1, 324);
    			attr_dev(a3, "href", "https://bulma.io");
    			add_location(a3, file$2, 7, 5, 422);
    			add_location(li3, file$2, 7, 1, 418);
    			add_location(ul, file$2, 3, 0, 146);
    			add_location(center, file$2, 0, 0, 0);
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

    const file$3 = "client/pages/About.svelte";

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
    			add_location(h1, file$3, 0, 0, 0);
    			add_location(br, file$3, 4, 4, 96);
    			add_location(p, file$3, 2, 4, 31);
    			add_location(h4, file$3, 2, 0, 27);
    			attr_dev(a0, "href", "https://github.com/pateketrueke/yrv");
    			add_location(a0, file$3, 8, 0, 212);
    			attr_dev(a1, "href", "https://svelte.dev/repl/0f07c6134b16432591a9a3a0095a80de?version=3.14.1");
    			add_location(a1, file$3, 9, 0, 277);
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

    function duration_from_secs(time) {
            let hours = Math.floor(time / 3600);
            let minutes = Math.floor((time - hours * 3600) / 60);
            let seconds = time - hours * 3600 - minutes * 60;
            return hours + "h " + minutes + "m " + seconds + "s";
    }

    var SECONDS_A_MINUTE = 60;
    var SECONDS_A_HOUR = SECONDS_A_MINUTE * 60;
    var SECONDS_A_DAY = SECONDS_A_HOUR * 24;
    var SECONDS_A_WEEK = SECONDS_A_DAY * 7;
    var MILLISECONDS_A_SECOND = 1e3;
    var MILLISECONDS_A_MINUTE = SECONDS_A_MINUTE * MILLISECONDS_A_SECOND;
    var MILLISECONDS_A_HOUR = SECONDS_A_HOUR * MILLISECONDS_A_SECOND;
    var MILLISECONDS_A_DAY = SECONDS_A_DAY * MILLISECONDS_A_SECOND;
    var MILLISECONDS_A_WEEK = SECONDS_A_WEEK * MILLISECONDS_A_SECOND; // English locales

    var MS = 'millisecond';
    var S$1 = 'second';
    var MIN = 'minute';
    var H = 'hour';
    var D$1 = 'day';
    var W$1 = 'week';
    var M = 'month';
    var Q$1 = 'quarter';
    var Y$1 = 'year';
    var DATE = 'date';
    var FORMAT_DEFAULT = 'YYYY-MM-DDTHH:mm:ssZ';
    var INVALID_DATE_STRING = 'Invalid Date'; // regex

    var REGEX_PARSE = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/;
    var REGEX_FORMAT = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g;

    // English [en]
    // We don't need weekdaysShort, weekdaysMin, monthsShort in en.js locale
    var en = {
      name: 'en',
      weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
      months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_')
    };

    var padStart = function padStart(string, length, pad) {
      var s = String(string);
      if (!s || s.length >= length) return string;
      return "" + Array(length + 1 - s.length).join(pad) + string;
    };

    var padZoneStr = function padZoneStr(instance) {
      var negMinutes = -instance.utcOffset();
      var minutes = Math.abs(negMinutes);
      var hourOffset = Math.floor(minutes / 60);
      var minuteOffset = minutes % 60;
      return "" + (negMinutes <= 0 ? '+' : '-') + padStart(hourOffset, 2, '0') + ":" + padStart(minuteOffset, 2, '0');
    };

    var monthDiff = function monthDiff(a, b) {
      // function from moment.js in order to keep the same result
      if (a.date() < b.date()) return -monthDiff(b, a);
      var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month());
      var anchor = a.clone().add(wholeMonthDiff, M);
      var c = b - anchor < 0;
      var anchor2 = a.clone().add(wholeMonthDiff + (c ? -1 : 1), M);
      return +(-(wholeMonthDiff + (b - anchor) / (c ? anchor - anchor2 : anchor2 - anchor)) || 0);
    };

    var absFloor = function absFloor(n) {
      return n < 0 ? Math.ceil(n) || 0 : Math.floor(n);
    };

    var prettyUnit = function prettyUnit(u) {
      var special = {
        M: M,
        y: Y$1,
        w: W$1,
        d: D$1,
        D: DATE,
        h: H,
        m: MIN,
        s: S$1,
        ms: MS,
        Q: Q$1
      };
      return special[u] || String(u || '').toLowerCase().replace(/s$/, '');
    };

    var isUndefined = function isUndefined(s) {
      return s === undefined;
    };

    var U$1 = {
      s: padStart,
      z: padZoneStr,
      m: monthDiff,
      a: absFloor,
      p: prettyUnit,
      u: isUndefined
    };

    var L = 'en'; // global locale

    var Ls = {}; // global loaded locale

    Ls[L] = en;

    var isDayjs = function isDayjs(d) {
      return d instanceof Dayjs;
    }; // eslint-disable-line no-use-before-define


    var parseLocale = function parseLocale(preset, object, isLocal) {
      var l;
      if (!preset) return L;

      if (typeof preset === 'string') {
        var presetLower = preset.toLowerCase();

        if (Ls[presetLower]) {
          l = presetLower;
        }

        if (object) {
          Ls[presetLower] = object;
          l = presetLower;
        }

        var presetSplit = preset.split('-');

        if (!l && presetSplit.length > 1) {
          return parseLocale(presetSplit[0]);
        }
      } else {
        var name = preset.name;
        Ls[name] = preset;
        l = name;
      }

      if (!isLocal && l) L = l;
      return l || !isLocal && L;
    };

    var dayjs = function dayjs(date, c) {
      if (isDayjs(date)) {
        return date.clone();
      } // eslint-disable-next-line no-nested-ternary


      var cfg = typeof c === 'object' ? c : {};
      cfg.date = date;
      cfg.args = arguments; // eslint-disable-line prefer-rest-params

      return new Dayjs(cfg); // eslint-disable-line no-use-before-define
    };

    var wrapper = function wrapper(date, instance) {
      return dayjs(date, {
        locale: instance.$L,
        utc: instance.$u,
        x: instance.$x,
        $offset: instance.$offset // todo: refactor; do not use this.$offset in you code

      });
    };

    var Utils = U$1; // for plugin use

    Utils.l = parseLocale;
    Utils.i = isDayjs;
    Utils.w = wrapper;

    var parseDate = function parseDate(cfg) {
      var date = cfg.date,
          utc = cfg.utc;
      if (date === null) return new Date(NaN); // null is invalid

      if (Utils.u(date)) return new Date(); // today

      if (date instanceof Date) return new Date(date);

      if (typeof date === 'string' && !/Z$/i.test(date)) {
        var d = date.match(REGEX_PARSE);

        if (d) {
          var m = d[2] - 1 || 0;
          var ms = (d[7] || '0').substring(0, 3);

          if (utc) {
            return new Date(Date.UTC(d[1], m, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, ms));
          }

          return new Date(d[1], m, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, ms);
        }
      }

      return new Date(date); // everything else
    };

    var Dayjs = /*#__PURE__*/function () {
      function Dayjs(cfg) {
        this.$L = parseLocale(cfg.locale, null, true);
        this.parse(cfg); // for plugin
      }

      var _proto = Dayjs.prototype;

      _proto.parse = function parse(cfg) {
        this.$d = parseDate(cfg);
        this.$x = cfg.x || {};
        this.init();
      };

      _proto.init = function init() {
        var $d = this.$d;
        this.$y = $d.getFullYear();
        this.$M = $d.getMonth();
        this.$D = $d.getDate();
        this.$W = $d.getDay();
        this.$H = $d.getHours();
        this.$m = $d.getMinutes();
        this.$s = $d.getSeconds();
        this.$ms = $d.getMilliseconds();
      } // eslint-disable-next-line class-methods-use-this
      ;

      _proto.$utils = function $utils() {
        return Utils;
      };

      _proto.isValid = function isValid() {
        return !(this.$d.toString() === INVALID_DATE_STRING);
      };

      _proto.isSame = function isSame(that, units) {
        var other = dayjs(that);
        return this.startOf(units) <= other && other <= this.endOf(units);
      };

      _proto.isAfter = function isAfter(that, units) {
        return dayjs(that) < this.startOf(units);
      };

      _proto.isBefore = function isBefore(that, units) {
        return this.endOf(units) < dayjs(that);
      };

      _proto.$g = function $g(input, get, set) {
        if (Utils.u(input)) return this[get];
        return this.set(set, input);
      };

      _proto.unix = function unix() {
        return Math.floor(this.valueOf() / 1000);
      };

      _proto.valueOf = function valueOf() {
        // timezone(hour) * 60 * 60 * 1000 => ms
        return this.$d.getTime();
      };

      _proto.startOf = function startOf(units, _startOf) {
        var _this = this;

        // startOf -> endOf
        var isStartOf = !Utils.u(_startOf) ? _startOf : true;
        var unit = Utils.p(units);

        var instanceFactory = function instanceFactory(d, m) {
          var ins = Utils.w(_this.$u ? Date.UTC(_this.$y, m, d) : new Date(_this.$y, m, d), _this);
          return isStartOf ? ins : ins.endOf(D$1);
        };

        var instanceFactorySet = function instanceFactorySet(method, slice) {
          var argumentStart = [0, 0, 0, 0];
          var argumentEnd = [23, 59, 59, 999];
          return Utils.w(_this.toDate()[method].apply( // eslint-disable-line prefer-spread
          _this.toDate('s'), (isStartOf ? argumentStart : argumentEnd).slice(slice)), _this);
        };

        var $W = this.$W,
            $M = this.$M,
            $D = this.$D;
        var utcPad = "set" + (this.$u ? 'UTC' : '');

        switch (unit) {
          case Y$1:
            return isStartOf ? instanceFactory(1, 0) : instanceFactory(31, 11);

          case M:
            return isStartOf ? instanceFactory(1, $M) : instanceFactory(0, $M + 1);

          case W$1:
            {
              var weekStart = this.$locale().weekStart || 0;
              var gap = ($W < weekStart ? $W + 7 : $W) - weekStart;
              return instanceFactory(isStartOf ? $D - gap : $D + (6 - gap), $M);
            }

          case D$1:
          case DATE:
            return instanceFactorySet(utcPad + "Hours", 0);

          case H:
            return instanceFactorySet(utcPad + "Minutes", 1);

          case MIN:
            return instanceFactorySet(utcPad + "Seconds", 2);

          case S$1:
            return instanceFactorySet(utcPad + "Milliseconds", 3);

          default:
            return this.clone();
        }
      };

      _proto.endOf = function endOf(arg) {
        return this.startOf(arg, false);
      };

      _proto.$set = function $set(units, _int) {
        var _C$D$C$DATE$C$M$C$Y$C;

        // private set
        var unit = Utils.p(units);
        var utcPad = "set" + (this.$u ? 'UTC' : '');
        var name = (_C$D$C$DATE$C$M$C$Y$C = {}, _C$D$C$DATE$C$M$C$Y$C[D$1] = utcPad + "Date", _C$D$C$DATE$C$M$C$Y$C[DATE] = utcPad + "Date", _C$D$C$DATE$C$M$C$Y$C[M] = utcPad + "Month", _C$D$C$DATE$C$M$C$Y$C[Y$1] = utcPad + "FullYear", _C$D$C$DATE$C$M$C$Y$C[H] = utcPad + "Hours", _C$D$C$DATE$C$M$C$Y$C[MIN] = utcPad + "Minutes", _C$D$C$DATE$C$M$C$Y$C[S$1] = utcPad + "Seconds", _C$D$C$DATE$C$M$C$Y$C[MS] = utcPad + "Milliseconds", _C$D$C$DATE$C$M$C$Y$C)[unit];
        var arg = unit === D$1 ? this.$D + (_int - this.$W) : _int;

        if (unit === M || unit === Y$1) {
          // clone is for badMutable plugin
          var date = this.clone().set(DATE, 1);
          date.$d[name](arg);
          date.init();
          this.$d = date.set(DATE, Math.min(this.$D, date.daysInMonth())).$d;
        } else if (name) this.$d[name](arg);

        this.init();
        return this;
      };

      _proto.set = function set(string, _int2) {
        return this.clone().$set(string, _int2);
      };

      _proto.get = function get(unit) {
        return this[Utils.p(unit)]();
      };

      _proto.add = function add(number, units) {
        var _this2 = this,
            _C$MIN$C$H$C$S$unit;

        number = Number(number); // eslint-disable-line no-param-reassign

        var unit = Utils.p(units);

        var instanceFactorySet = function instanceFactorySet(n) {
          var d = dayjs(_this2);
          return Utils.w(d.date(d.date() + Math.round(n * number)), _this2);
        };

        if (unit === M) {
          return this.set(M, this.$M + number);
        }

        if (unit === Y$1) {
          return this.set(Y$1, this.$y + number);
        }

        if (unit === D$1) {
          return instanceFactorySet(1);
        }

        if (unit === W$1) {
          return instanceFactorySet(7);
        }

        var step = (_C$MIN$C$H$C$S$unit = {}, _C$MIN$C$H$C$S$unit[MIN] = MILLISECONDS_A_MINUTE, _C$MIN$C$H$C$S$unit[H] = MILLISECONDS_A_HOUR, _C$MIN$C$H$C$S$unit[S$1] = MILLISECONDS_A_SECOND, _C$MIN$C$H$C$S$unit)[unit] || 1; // ms

        var nextTimeStamp = this.$d.getTime() + number * step;
        return Utils.w(nextTimeStamp, this);
      };

      _proto.subtract = function subtract(number, string) {
        return this.add(number * -1, string);
      };

      _proto.format = function format(formatStr) {
        var _this3 = this;

        var locale = this.$locale();
        if (!this.isValid()) return locale.invalidDate || INVALID_DATE_STRING;
        var str = formatStr || FORMAT_DEFAULT;
        var zoneStr = Utils.z(this);
        var $H = this.$H,
            $m = this.$m,
            $M = this.$M;
        var weekdays = locale.weekdays,
            months = locale.months,
            meridiem = locale.meridiem;

        var getShort = function getShort(arr, index, full, length) {
          return arr && (arr[index] || arr(_this3, str)) || full[index].slice(0, length);
        };

        var get$H = function get$H(num) {
          return Utils.s($H % 12 || 12, num, '0');
        };

        var meridiemFunc = meridiem || function (hour, minute, isLowercase) {
          var m = hour < 12 ? 'AM' : 'PM';
          return isLowercase ? m.toLowerCase() : m;
        };

        var matches = {
          YY: String(this.$y).slice(-2),
          YYYY: this.$y,
          M: $M + 1,
          MM: Utils.s($M + 1, 2, '0'),
          MMM: getShort(locale.monthsShort, $M, months, 3),
          MMMM: getShort(months, $M),
          D: this.$D,
          DD: Utils.s(this.$D, 2, '0'),
          d: String(this.$W),
          dd: getShort(locale.weekdaysMin, this.$W, weekdays, 2),
          ddd: getShort(locale.weekdaysShort, this.$W, weekdays, 3),
          dddd: weekdays[this.$W],
          H: String($H),
          HH: Utils.s($H, 2, '0'),
          h: get$H(1),
          hh: get$H(2),
          a: meridiemFunc($H, $m, true),
          A: meridiemFunc($H, $m, false),
          m: String($m),
          mm: Utils.s($m, 2, '0'),
          s: String(this.$s),
          ss: Utils.s(this.$s, 2, '0'),
          SSS: Utils.s(this.$ms, 3, '0'),
          Z: zoneStr // 'ZZ' logic below

        };
        return str.replace(REGEX_FORMAT, function (match, $1) {
          return $1 || matches[match] || zoneStr.replace(':', '');
        }); // 'ZZ'
      };

      _proto.utcOffset = function utcOffset() {
        // Because a bug at FF24, we're rounding the timezone offset around 15 minutes
        // https://github.com/moment/moment/pull/1871
        return -Math.round(this.$d.getTimezoneOffset() / 15) * 15;
      };

      _proto.diff = function diff(input, units, _float) {
        var _C$Y$C$M$C$Q$C$W$C$D$;

        var unit = Utils.p(units);
        var that = dayjs(input);
        var zoneDelta = (that.utcOffset() - this.utcOffset()) * MILLISECONDS_A_MINUTE;
        var diff = this - that;
        var result = Utils.m(this, that);
        result = (_C$Y$C$M$C$Q$C$W$C$D$ = {}, _C$Y$C$M$C$Q$C$W$C$D$[Y$1] = result / 12, _C$Y$C$M$C$Q$C$W$C$D$[M] = result, _C$Y$C$M$C$Q$C$W$C$D$[Q$1] = result / 3, _C$Y$C$M$C$Q$C$W$C$D$[W$1] = (diff - zoneDelta) / MILLISECONDS_A_WEEK, _C$Y$C$M$C$Q$C$W$C$D$[D$1] = (diff - zoneDelta) / MILLISECONDS_A_DAY, _C$Y$C$M$C$Q$C$W$C$D$[H] = diff / MILLISECONDS_A_HOUR, _C$Y$C$M$C$Q$C$W$C$D$[MIN] = diff / MILLISECONDS_A_MINUTE, _C$Y$C$M$C$Q$C$W$C$D$[S$1] = diff / MILLISECONDS_A_SECOND, _C$Y$C$M$C$Q$C$W$C$D$)[unit] || diff; // milliseconds

        return _float ? result : Utils.a(result);
      };

      _proto.daysInMonth = function daysInMonth() {
        return this.endOf(M).$D;
      };

      _proto.$locale = function $locale() {
        // get locale object
        return Ls[this.$L];
      };

      _proto.locale = function locale(preset, object) {
        if (!preset) return this.$L;
        var that = this.clone();
        var nextLocaleName = parseLocale(preset, object, true);
        if (nextLocaleName) that.$L = nextLocaleName;
        return that;
      };

      _proto.clone = function clone() {
        return Utils.w(this.$d, this);
      };

      _proto.toDate = function toDate() {
        return new Date(this.valueOf());
      };

      _proto.toJSON = function toJSON() {
        return this.isValid() ? this.toISOString() : null;
      };

      _proto.toISOString = function toISOString() {
        // ie 8 return
        // new Dayjs(this.valueOf() + this.$d.getTimezoneOffset() * 60000)
        // .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
        return this.$d.toISOString();
      };

      _proto.toString = function toString() {
        return this.$d.toUTCString();
      };

      return Dayjs;
    }();

    var proto = Dayjs.prototype;
    dayjs.prototype = proto;
    [['$ms', MS], ['$s', S$1], ['$m', MIN], ['$H', H], ['$W', D$1], ['$M', M], ['$y', Y$1], ['$D', DATE]].forEach(function (g) {
      proto[g[1]] = function (input) {
        return this.$g(input, g[0], g[1]);
      };
    });

    dayjs.extend = function (plugin, option) {
      if (!plugin.$i) {
        // install plugin only once
        plugin(option, Dayjs, dayjs);
        plugin.$i = true;
      }

      return dayjs;
    };

    dayjs.locale = parseLocale;
    dayjs.isDayjs = isDayjs;

    dayjs.unix = function (timestamp) {
      return dayjs(timestamp * 1e3);
    };

    dayjs.en = Ls[L];
    dayjs.Ls = Ls;
    dayjs.p = {};

    var relativeTime = (function (o, c, d) {
      o = o || {};
      var proto = c.prototype;
      var relObj = {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years'
      };
      d.en.relativeTime = relObj;

      proto.fromToBase = function (input, withoutSuffix, instance, isFrom, postFormat) {
        var loc = instance.$locale().relativeTime || relObj;
        var T = o.thresholds || [{
          l: 's',
          r: 44,
          d: S$1
        }, {
          l: 'm',
          r: 89
        }, {
          l: 'mm',
          r: 44,
          d: MIN
        }, {
          l: 'h',
          r: 89
        }, {
          l: 'hh',
          r: 21,
          d: H
        }, {
          l: 'd',
          r: 35
        }, {
          l: 'dd',
          r: 25,
          d: D$1
        }, {
          l: 'M',
          r: 45
        }, {
          l: 'MM',
          r: 10,
          d: M
        }, {
          l: 'y',
          r: 17
        }, {
          l: 'yy',
          d: Y$1
        }];
        var Tl = T.length;
        var result;
        var out;
        var isFuture;

        for (var i = 0; i < Tl; i += 1) {
          var t = T[i];

          if (t.d) {
            result = isFrom ? d(input).diff(instance, t.d, true) : instance.diff(input, t.d, true);
          }

          var abs = (o.rounding || Math.round)(Math.abs(result));
          isFuture = result > 0;

          if (abs <= t.r || !t.r) {
            if (abs <= 1 && i > 0) t = T[i - 1]; // 1 minutes -> a minute, 0 seconds -> 0 second

            var format = loc[t.l];

            if (postFormat) {
              abs = postFormat("" + abs);
            }

            if (typeof format === 'string') {
              out = format.replace('%d', abs);
            } else {
              out = format(abs, withoutSuffix, t.l, isFuture);
            }

            break;
          }
        }

        if (withoutSuffix) return out;
        var pastOrFuture = isFuture ? loc.future : loc.past;

        if (typeof pastOrFuture === 'function') {
          return pastOrFuture(out);
        }

        return pastOrFuture.replace('%s', out);
      };

      function fromTo(input, withoutSuffix, instance, isFrom) {
        return proto.fromToBase(input, withoutSuffix, instance, isFrom);
      }

      proto.to = function (input, withoutSuffix) {
        return fromTo(input, withoutSuffix, this, true);
      };

      proto.from = function (input, withoutSuffix) {
        return fromTo(input, withoutSuffix, this);
      };

      var makeNow = function makeNow(thisDay) {
        return thisDay.$u ? d.utc() : d();
      };

      proto.toNow = function (withoutSuffix) {
        return this.to(makeNow(this), withoutSuffix);
      };

      proto.fromNow = function (withoutSuffix) {
        return this.from(makeNow(this), withoutSuffix);
      };
    });

    dayjs.extend(relativeTime);

    /* node_modules/svelte-time/src/Time.svelte generated by Svelte v3.48.0 */
    const file$4 = "node_modules/svelte-time/src/Time.svelte";

    function create_fragment$6(ctx) {
    	let time;
    	let t;

    	let time_levels = [
    		/*$$restProps*/ ctx[3],
    		{ title: /*title*/ ctx[2] },
    		{ datetime: /*timestamp*/ ctx[1] }
    	];

    	let time_data = {};

    	for (let i = 0; i < time_levels.length; i += 1) {
    		time_data = assign(time_data, time_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			time = element("time");
    			t = text(/*formatted*/ ctx[0]);
    			set_attributes(time, time_data);
    			add_location(time, file$4, 60, 0, 1479);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, time, anchor);
    			append_dev(time, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*formatted*/ 1) set_data_dev(t, /*formatted*/ ctx[0]);

    			set_attributes(time, time_data = get_spread_update(time_levels, [
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				dirty & /*title*/ 4 && { title: /*title*/ ctx[2] },
    				dirty & /*timestamp*/ 2 && { datetime: /*timestamp*/ ctx[1] }
    			]));
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(time);
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
    	let title;
    	const omit_props_names = ["timestamp","format","relative","live","formatted"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Time', slots, []);
    	let { timestamp = new Date().toISOString() } = $$props;
    	let { format = "MMM DD, YYYY" } = $$props;
    	let { relative = false } = $$props;
    	let { live = false } = $$props;
    	let { formatted = "" } = $$props;
    	let interval = undefined;
    	const DEFAULT_INTERVAL = 60 * 1000;

    	onMount(() => {
    		if (relative && live !== false) {
    			interval = setInterval(
    				() => {
    					$$invalidate(0, formatted = dayjs(timestamp).from());
    				},
    				Math.abs(typeof live === "number" ? live : DEFAULT_INTERVAL)
    			);
    		}

    		return () => {
    			if (typeof interval === "number") {
    				clearInterval(interval);
    			}
    		};
    	});

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('timestamp' in $$new_props) $$invalidate(1, timestamp = $$new_props.timestamp);
    		if ('format' in $$new_props) $$invalidate(4, format = $$new_props.format);
    		if ('relative' in $$new_props) $$invalidate(5, relative = $$new_props.relative);
    		if ('live' in $$new_props) $$invalidate(6, live = $$new_props.live);
    		if ('formatted' in $$new_props) $$invalidate(0, formatted = $$new_props.formatted);
    	};

    	$$self.$capture_state = () => ({
    		timestamp,
    		format,
    		relative,
    		live,
    		formatted,
    		dayjs,
    		onMount,
    		interval,
    		DEFAULT_INTERVAL,
    		title
    	});

    	$$self.$inject_state = $$new_props => {
    		if ('timestamp' in $$props) $$invalidate(1, timestamp = $$new_props.timestamp);
    		if ('format' in $$props) $$invalidate(4, format = $$new_props.format);
    		if ('relative' in $$props) $$invalidate(5, relative = $$new_props.relative);
    		if ('live' in $$props) $$invalidate(6, live = $$new_props.live);
    		if ('formatted' in $$props) $$invalidate(0, formatted = $$new_props.formatted);
    		if ('interval' in $$props) interval = $$new_props.interval;
    		if ('title' in $$props) $$invalidate(2, title = $$new_props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*relative, timestamp, format*/ 50) {
    			 $$invalidate(0, formatted = relative
    			? dayjs(timestamp).from()
    			: dayjs(timestamp).format(format));
    		}

    		if ($$self.$$.dirty & /*relative, timestamp*/ 34) {
    			 $$invalidate(2, title = relative ? timestamp : undefined);
    		}
    	};

    	return [formatted, timestamp, title, $$restProps, format, relative, live];
    }

    class Time extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			timestamp: 1,
    			format: 4,
    			relative: 5,
    			live: 6,
    			formatted: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Time",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get timestamp() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timestamp(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get format() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set format(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get relative() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set relative(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get live() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set live(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get formatted() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formatted(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * @param {HTMLElement} node
     * @param {{ timestamp?: import("dayjs").ConfigType; format?: import("dayjs").OptionType; relative?: boolean; live?: boolean | number; }} [options]
     */
    function svelteTime(node, options = {}) {
      const DEFAULT_INTERVAL = 60 * 1000;

      let interval = undefined;

      function setTime(node, options = {}) {
        const timestamp = options.timestamp || new Date().toISOString();
        const format = options.format || "MMM DD, YYYY";
        const relative = options.relative === true;
        const live = options.live === true;
        const formatted = relative ? dayjs(timestamp).from() : dayjs(timestamp).format(format);

        if (relative) {
          node.setAttribute("title", timestamp);

          if (live !== false) {
            interval = setInterval(() => {
              node.innerText = dayjs(timestamp).from();
            }, Math.abs(typeof live === "number" ? live : DEFAULT_INTERVAL));
          }
        }

        node.innerText = formatted;
      }

      setTime(node, options);

      return {
        update(options = {}) {
          setTime(node, options);
        },
        destroy() {
          if (typeof interval === "number") {
            clearInterval(interval);
          }
        },
      };
    }

    /* client/pages/WorkoutView.svelte generated by Svelte v3.48.0 */
    const file$5 = "client/pages/WorkoutView.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>     import Nav from "../Nav.svelte";     import { duration_from_secs}
    function create_catch_block_1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(1:0) <script>     import Nav from \\\"../Nav.svelte\\\";     import { duration_from_secs}",
    		ctx
    	});

    	return block;
    }

    // (18:4) {:then json}
    function create_then_block_1(ctx) {
    	let h1;
    	let t0;
    	let time;
    	let t1;
    	let hr;
    	let t2;
    	let p0;
    	let t3;
    	let t4_value = duration_from_secs(/*json*/ ctx[4].end_time - /*json*/ ctx[4].start_time) + "";
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let t7_value = /*json*/ ctx[4].user + "";
    	let t7;
    	let current;

    	time = new Time({
    			props: {
    				timestamp: /*json*/ ctx[4].start_time * 1000,
    				format: "dddd @ h:mm A · MMMM D, YYYY"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Workout: ");
    			create_component(time.$$.fragment);
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			p0 = element("p");
    			t3 = text("Duration: ");
    			t4 = text(t4_value);
    			t5 = space();
    			p1 = element("p");
    			t6 = text("By: ");
    			t7 = text(t7_value);
    			add_location(h1, file$5, 18, 8, 562);
    			add_location(hr, file$5, 19, 8, 675);
    			add_location(p0, file$5, 20, 8, 688);
    			add_location(p1, file$5, 21, 8, 770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			mount_component(time, h1, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const time_changes = {};
    			if (dirty & /*data*/ 1) time_changes.timestamp = /*json*/ ctx[4].start_time * 1000;
    			time.$set(time_changes);
    			if ((!current || dirty & /*data*/ 1) && t4_value !== (t4_value = duration_from_secs(/*json*/ ctx[4].end_time - /*json*/ ctx[4].start_time) + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*data*/ 1) && t7_value !== (t7_value = /*json*/ ctx[4].user + "")) set_data_dev(t7, t7_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(time.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(time.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			destroy_component(time);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(18:4) {:then json}",
    		ctx
    	});

    	return block;
    }

    // (16:17)          <p>Loading... please wait</p>     {:then json}
    function create_pending_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading... please wait";
    			add_location(p, file$5, 16, 8, 507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(16:17)          <p>Loading... please wait</p>     {:then json}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import Nav from "../Nav.svelte";     import { duration_from_secs}
    function create_catch_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>     import Nav from \\\"../Nav.svelte\\\";     import { duration_from_secs}",
    		ctx
    	});

    	return block;
    }

    // (29:4) {:then json}
    function create_then_block(ctx) {
    	let h1;
    	let t1;
    	let hr;
    	let t2;
    	let each_1_anchor;
    	let each_value = /*json*/ ctx[4].exercises;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Exercises";
    			t1 = space();
    			hr = element("hr");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h1, file$5, 29, 8, 932);
    			add_location(hr, file$5, 30, 8, 959);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				each_value = /*json*/ ctx[4].exercises;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(29:4) {:then json}",
    		ctx
    	});

    	return block;
    }

    // (35:16) {#if exercise.comments != ""}
    function create_if_block$2(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*exercise*/ ctx[5].comments + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Comments: ");
    			t1 = text(t1_value);
    			add_location(p, file$5, 35, 20, 1158);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*exercise*/ ctx[5].comments + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(35:16) {#if exercise.comments != \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (39:16) {#each exercise.sets as set}
    function create_each_block_1(ctx) {
    	let li;
    	let t0_value = /*set*/ ctx[8].reps + "";
    	let t0;
    	let t1;
    	let t2_value = /*set*/ ctx[8].weight.weight + "";
    	let t2;
    	let t3;
    	let t4_value = /*set*/ ctx[8].weight.weight_unit + "";
    	let t4;
    	let t5;
    	let t6_value = /*set*/ ctx[8].reps_in_reserve + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" x ");
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = text(" - ");
    			t6 = text(t6_value);
    			t7 = text("RiR");
    			add_location(li, file$5, 39, 24, 1307);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);
    			append_dev(li, t5);
    			append_dev(li, t6);
    			append_dev(li, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*set*/ ctx[8].reps + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*set*/ ctx[8].weight.weight + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*data*/ 1 && t4_value !== (t4_value = /*set*/ ctx[8].weight.weight_unit + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*data*/ 1 && t6_value !== (t6_value = /*set*/ ctx[8].reps_in_reserve + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(39:16) {#each exercise.sets as set}",
    		ctx
    	});

    	return block;
    }

    // (32:8) {#each json.exercises as exercise}
    function create_each_block(ctx) {
    	let div;
    	let h2;
    	let t0_value = /*exercise*/ ctx[5].exercise.name + "";
    	let t0;
    	let t1;
    	let t2;
    	let ul;
    	let t3;
    	let if_block = /*exercise*/ ctx[5].comments != "" && create_if_block$2(ctx);
    	let each_value_1 = /*exercise*/ ctx[5].sets;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			add_location(h2, file$5, 33, 16, 1058);
    			add_location(ul, file$5, 37, 16, 1233);
    			attr_dev(div, "class", "exercise");
    			add_location(div, file$5, 32, 12, 1019);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t2);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*exercise*/ ctx[5].exercise.name + "")) set_data_dev(t0, t0_value);

    			if (/*exercise*/ ctx[5].comments != "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*data*/ 1) {
    				each_value_1 = /*exercise*/ ctx[5].sets;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(32:8) {#each json.exercises as exercise}",
    		ctx
    	});

    	return block;
    }

    // (27:17)          <p>Loading... please wait</p>     {:then json}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading... please wait";
    			add_location(p, file$5, 27, 8, 877);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(27:17)          <p>Loading... please wait</p>     {:then json}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div0;
    	let promise;
    	let t;
    	let div1;
    	let promise_1;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_1,
    		value: 4,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*data*/ ctx[0], info);

    	let info_1 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 4
    	};

    	handle_promise(promise_1 = /*data*/ ctx[0], info_1);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			info.block.c();
    			t = space();
    			div1 = element("div");
    			info_1.block.c();
    			attr_dev(div0, "class", "separator svelte-1ndxrrq");
    			attr_dev(div0, "id", "metadata");
    			add_location(div0, file$5, 14, 0, 443);
    			attr_dev(div1, "class", "separator svelte-1ndxrrq");
    			attr_dev(div1, "id", "workout");
    			add_location(div1, file$5, 25, 0, 814);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			info.block.m(div0, info.anchor = null);
    			info.mount = () => div0;
    			info.anchor = null;
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			info_1.block.m(div1, info_1.anchor = null);
    			info_1.mount = () => div1;
    			info_1.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*data*/ 1 && promise !== (promise = /*data*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}

    			info_1.ctx = ctx;

    			if (dirty & /*data*/ 1 && promise_1 !== (promise_1 = /*data*/ ctx[0]) && handle_promise(promise_1, info_1)) ; else {
    				update_await_block_branch(info_1, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			info_1.block.d();
    			info_1.token = null;
    			info_1 = null;
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
    	let data;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WorkoutView', slots, []);
    	let { id } = $$props;

    	async function load_json() {
    		const response = await fetch("/workouts/" + id + "/json");
    		const responseJson = await response.json();
    		return responseJson;
    	}

    	let json_data = load_json();
    	const writable_props = ['id'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WorkoutView> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		Nav,
    		duration_from_secs,
    		Time,
    		svelteTime,
    		id,
    		load_json,
    		json_data,
    		data
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('json_data' in $$props) $$invalidate(3, json_data = $$props.json_data);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(0, data = json_data);
    	return [data, id, load_json];
    }

    class WorkoutView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { id: 1, load_json: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WorkoutView",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !('id' in props)) {
    			console.warn("<WorkoutView> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<WorkoutView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<WorkoutView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get load_json() {
    		return this.$$.ctx[2];
    	}

    	set load_json(value) {
    		throw new Error("<WorkoutView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/App.svelte generated by Svelte v3.48.0 */
    const file$6 = "client/App.svelte";

    // (13:4) <Route exact path="/">
    function create_default_slot_4(ctx) {
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
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(13:4) <Route exact path=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (14:4) <Route path="#about">
    function create_default_slot_3(ctx) {
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
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(14:4) <Route path=\\\"#about\\\">",
    		ctx
    	});

    	return block;
    }

    // (15:4) <Route exact path="#bruh">
    function create_default_slot_2(ctx) {
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(15:4) <Route exact path=\\\"#bruh\\\">",
    		ctx
    	});

    	return block;
    }

    // (16:4) <Route path="/workouts/:id" let:router       >
    function create_default_slot_1(ctx) {
    	let workoutview;
    	let current;

    	workoutview = new WorkoutView({
    			props: { id: /*router*/ ctx[0].params.id },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(workoutview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(workoutview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const workoutview_changes = {};
    			if (dirty & /*router*/ 1) workoutview_changes.id = /*router*/ ctx[0].params.id;
    			workoutview.$set(workoutview_changes);
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
    		source: "(16:4) <Route path=\\\"/workouts/:id\\\" let:router       >",
    		ctx
    	});

    	return block;
    }

    // (12:2) <Router>
    function create_default_slot(ctx) {
    	let route0;
    	let t0;
    	let route1;
    	let t1;
    	let route2;
    	let t2;
    	let route3;
    	let current;

    	route0 = new Route({
    			props: {
    				exact: true,
    				path: "/",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route1 = new Route({
    			props: {
    				path: "#about",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route2 = new Route({
    			props: {
    				exact: true,
    				path: "#bruh",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route3 = new Route({
    			props: {
    				path: "/workouts/:id",
    				$$slots: {
    					default: [
    						create_default_slot_1,
    						({ router }) => ({ 0: router }),
    						({ router }) => router ? 1 : 0
    					]
    				},
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
    		},
    		m: function mount(target, anchor) {
    			mount_component(route0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(route1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(route2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(route3, target, anchor);
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

    			if (dirty & /*$$scope, router*/ 3) {
    				route3_changes.$$scope = { dirty, ctx };
    			}

    			route3.$set(route3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(12:2) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
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
    			add_location(main, file$6, 9, 0, 275);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		WorkoutView
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
