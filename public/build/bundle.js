
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var wlrs = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached if target is not <head>
        let children = target.childNodes;
        // If target is <head>, there may be children without claim_order
        if (target.nodeName === 'HEAD') {
            const myChildren = [];
            for (let i = 0; i < children.length; i++) {
                const node = children[i];
                if (node.claim_order !== undefined) {
                    myChildren.push(node);
                }
            }
            children = myChildren;
        }
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            // with fast path for when we are on the current longest subsequence
            const seqLen = ((longest > 0 && children[m[longest]].claim_order <= current) ? longest + 1 : upper_bound(1, longest, idx => children[m[idx]].claim_order, current)) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function append_hydration(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            // Skip nodes of undefined ordering
            while ((target.actual_end_child !== null) && (target.actual_end_child.claim_order === undefined)) {
                target.actual_end_child = target.actual_end_child.nextSibling;
            }
            if (node !== target.actual_end_child) {
                // We only insert if the ordering of this node should be modified or the parent node is not target
                if (node.claim_order !== undefined || node.parentNode !== target) {
                    target.insertBefore(node, target.actual_end_child);
                }
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target || node.nextSibling !== null) {
            target.appendChild(node);
        }
    }
    function insert_hydration(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append_hydration(target, node);
        }
        else if (node.parentNode !== target || node.nextSibling != anchor) {
            target.insertBefore(node, anchor || null);
        }
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function init_claim_info(nodes) {
        if (nodes.claim_info === undefined) {
            nodes.claim_info = { last_index: 0, total_claimed: 0 };
        }
    }
    function claim_node(nodes, predicate, processNode, createNode, dontUpdateLastIndex = false) {
        // Try to find nodes in an order such that we lengthen the longest increasing subsequence
        init_claim_info(nodes);
        const resultNode = (() => {
            // We first try to find an element after the previous one
            for (let i = nodes.claim_info.last_index; i < nodes.length; i++) {
                const node = nodes[i];
                if (predicate(node)) {
                    const replacement = processNode(node);
                    if (replacement === undefined) {
                        nodes.splice(i, 1);
                    }
                    else {
                        nodes[i] = replacement;
                    }
                    if (!dontUpdateLastIndex) {
                        nodes.claim_info.last_index = i;
                    }
                    return node;
                }
            }
            // Otherwise, we try to find one before
            // We iterate in reverse so that we don't go too far back
            for (let i = nodes.claim_info.last_index - 1; i >= 0; i--) {
                const node = nodes[i];
                if (predicate(node)) {
                    const replacement = processNode(node);
                    if (replacement === undefined) {
                        nodes.splice(i, 1);
                    }
                    else {
                        nodes[i] = replacement;
                    }
                    if (!dontUpdateLastIndex) {
                        nodes.claim_info.last_index = i;
                    }
                    else if (replacement === undefined) {
                        // Since we spliced before the last_index, we decrease it
                        nodes.claim_info.last_index--;
                    }
                    return node;
                }
            }
            // If we can't find any matching node, we create a new one
            return createNode();
        })();
        resultNode.claim_order = nodes.claim_info.total_claimed;
        nodes.claim_info.total_claimed += 1;
        return resultNode;
    }
    function claim_element_base(nodes, name, attributes, create_element) {
        return claim_node(nodes, (node) => node.nodeName === name, (node) => {
            const remove = [];
            for (let j = 0; j < node.attributes.length; j++) {
                const attribute = node.attributes[j];
                if (!attributes[attribute.name]) {
                    remove.push(attribute.name);
                }
            }
            remove.forEach(v => node.removeAttribute(v));
            return undefined;
        }, () => create_element(name));
    }
    function claim_element(nodes, name, attributes) {
        return claim_element_base(nodes, name, attributes, element);
    }
    function claim_svg_element(nodes, name, attributes) {
        return claim_element_base(nodes, name, attributes, svg_element);
    }
    function claim_text(nodes, data) {
        return claim_node(nodes, (node) => node.nodeType === 3, (node) => {
            const dataStr = '' + data;
            if (node.data.startsWith(dataStr)) {
                if (node.data.length !== dataStr.length) {
                    return node.splitText(dataStr.length);
                }
            }
            else {
                node.data = dataStr;
            }
        }, () => text(data), true // Text nodes should not update last index since it is likely not worth it to eliminate an increasing subsequence of actual elements
        );
    }
    function claim_space(nodes) {
        return claim_text(nodes, ' ');
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
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
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
        return context;
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
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

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
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
    function claim_component(block, parent_nodes) {
        block && block.l(parent_nodes);
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
                start_hydrating();
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
            end_hydrating();
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
    function append_hydration_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append_hydration(target, node);
    }
    function insert_hydration_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert_hydration(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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
    	let t1;
    	let t2;
    	let li1;
    	let a2;
    	let t3;
    	let t4;
    	let li2;
    	let a3;
    	let t5;

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
    			t1 = text("Home");
    			t2 = space();
    			li1 = element("li");
    			a2 = element("a");
    			t3 = text("Svelte");
    			t4 = space();
    			li2 = element("li");
    			a3 = element("a");
    			t5 = text("Common");
    			this.h();
    		},
    		l: function claim(nodes) {
    			nav = claim_element(nodes, "NAV", { class: true, "aria-label": true });
    			var nav_nodes = children(nav);
    			div3 = claim_element(nav_nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			div1 = claim_element(div3_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			a0 = claim_element(div0_nodes, "A", { href: true, class: true });
    			var a0_nodes = children(a0);
    			img = claim_element(a0_nodes, "IMG", { src: true, alt: true, class: true });
    			a0_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t0 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			ul = claim_element(div2_nodes, "UL", { class: true });
    			var ul_nodes = children(ul);
    			li0 = claim_element(ul_nodes, "LI", { class: true });
    			var li0_nodes = children(li0);
    			a1 = claim_element(li0_nodes, "A", { class: true, href: true });
    			var a1_nodes = children(a1);
    			t1 = claim_text(a1_nodes, "Home");
    			a1_nodes.forEach(detach_dev);
    			li0_nodes.forEach(detach_dev);
    			t2 = claim_space(ul_nodes);
    			li1 = claim_element(ul_nodes, "LI", { class: true });
    			var li1_nodes = children(li1);
    			a2 = claim_element(li1_nodes, "A", { class: true, href: true });
    			var a2_nodes = children(a2);
    			t3 = claim_text(a2_nodes, "Svelte");
    			a2_nodes.forEach(detach_dev);
    			li1_nodes.forEach(detach_dev);
    			t4 = claim_space(ul_nodes);
    			li2 = claim_element(ul_nodes, "LI", { class: true });
    			var li2_nodes = children(li2);
    			a3 = claim_element(li2_nodes, "A", { class: true, href: true });
    			var a3_nodes = children(a3);
    			t5 = claim_text(a3_nodes, "Common");
    			a3_nodes.forEach(detach_dev);
    			li2_nodes.forEach(detach_dev);
    			ul_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			nav_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
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
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, nav, anchor);
    			append_hydration_dev(nav, div3);
    			append_hydration_dev(div3, div1);
    			append_hydration_dev(div1, div0);
    			append_hydration_dev(div0, a0);
    			append_hydration_dev(a0, img);
    			append_hydration_dev(div3, t0);
    			append_hydration_dev(div3, div2);
    			append_hydration_dev(div2, ul);
    			append_hydration_dev(ul, li0);
    			append_hydration_dev(li0, a1);
    			append_hydration_dev(a1, t1);
    			append_hydration_dev(ul, t2);
    			append_hydration_dev(ul, li1);
    			append_hydration_dev(li1, a2);
    			append_hydration_dev(a2, t3);
    			append_hydration_dev(ul, t4);
    			append_hydration_dev(ul, li2);
    			append_hydration_dev(li2, a3);
    			append_hydration_dev(a3, t5);
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
    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
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
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
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
    		l: function claim(nodes) {
    			if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
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
    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
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
    		l: function claim(nodes) {
    			if (switch_instance) claim_component(switch_instance.$$.fragment, nodes);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_hydration_dev(target, switch_instance_anchor, anchor);
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
    		l: function claim(nodes) {
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
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
    		l: function claim(nodes) {
    			if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
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
    		l: function claim(nodes) {
    			t = claim_text(nodes, t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, t, anchor);
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
    		l: function claim(nodes) {
    			if (switch_instance) claim_component(switch_instance.$$.fragment, nodes);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_hydration_dev(target, switch_instance_anchor, anchor);
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
    		l: function claim(nodes) {
    			if (switch_instance) claim_component(switch_instance.$$.fragment, nodes);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_hydration_dev(target, switch_instance_anchor, anchor);
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
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
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
    	let t1;
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
    			t1 = text("Your Footer markup goes here ");
    			t2 = space();
    			pre1 = element("pre");
    			t3 = text("Router Info from svelte store: ");
    			t4 = text(t4_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			hr = claim_element(nodes, "HR", {});
    			t0 = claim_space(nodes);
    			pre0 = claim_element(nodes, "PRE", {});
    			var pre0_nodes = children(pre0);
    			t1 = claim_text(pre0_nodes, "Your Footer markup goes here ");
    			pre0_nodes.forEach(detach_dev);
    			t2 = claim_space(nodes);
    			pre1 = claim_element(nodes, "PRE", {});
    			var pre1_nodes = children(pre1);
    			t3 = claim_text(pre1_nodes, "Router Info from svelte store: ");
    			t4 = claim_text(pre1_nodes, t4_value);
    			pre1_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(hr, file$1, 4, 0, 54);
    			add_location(pre0, file$1, 5, 0, 59);
    			add_location(pre1, file$1, 6, 0, 100);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, hr, anchor);
    			insert_hydration_dev(target, t0, anchor);
    			insert_hydration_dev(target, pre0, anchor);
    			append_hydration_dev(pre0, t1);
    			insert_hydration_dev(target, t2, anchor);
    			insert_hydration_dev(target, pre1, anchor);
    			append_hydration_dev(pre1, t3);
    			append_hydration_dev(pre1, t4);
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
    	let t0;
    	let t1;
    	let h4;
    	let t2;
    	let t3;
    	let ul;
    	let li0;
    	let a0;
    	let t4;
    	let t5;
    	let t6;
    	let li1;
    	let a1;
    	let t7;
    	let t8;
    	let t9;
    	let li2;
    	let a2;
    	let t10;
    	let t11;
    	let t12;
    	let li3;
    	let a3;
    	let t13;
    	let t14;

    	const block = {
    		c: function create() {
    			center = element("center");
    			h1 = element("h1");
    			t0 = text("Svelte On Rust");
    			t1 = space();
    			h4 = element("h4");
    			t2 = text("A compiled frontend, deserves a compiled backend");
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			t4 = text("Svelte JS");
    			t5 = text(" - Cybernetically enhanced web apps");
    			t6 = space();
    			li1 = element("li");
    			a1 = element("a");
    			t7 = text("Rocket.rs");
    			t8 = text(" - A web framework for Rust");
    			t9 = space();
    			li2 = element("li");
    			a2 = element("a");
    			t10 = text("YRV Router");
    			t11 = text(" - Your routing bro!");
    			t12 = space();
    			li3 = element("li");
    			a3 = element("a");
    			t13 = text("Bulma CSS ");
    			t14 = text("- Modern CSS framework based on Flexbox");
    			this.h();
    		},
    		l: function claim(nodes) {
    			center = claim_element(nodes, "CENTER", {});
    			var center_nodes = children(center);
    			h1 = claim_element(center_nodes, "H1", { class: true });
    			var h1_nodes = children(h1);
    			t0 = claim_text(h1_nodes, "Svelte On Rust");
    			h1_nodes.forEach(detach_dev);
    			t1 = claim_space(center_nodes);
    			h4 = claim_element(center_nodes, "H4", { class: true });
    			var h4_nodes = children(h4);
    			t2 = claim_text(h4_nodes, "A compiled frontend, deserves a compiled backend");
    			h4_nodes.forEach(detach_dev);
    			t3 = claim_space(center_nodes);
    			ul = claim_element(center_nodes, "UL", {});
    			var ul_nodes = children(ul);
    			li0 = claim_element(ul_nodes, "LI", {});
    			var li0_nodes = children(li0);
    			a0 = claim_element(li0_nodes, "A", { href: true });
    			var a0_nodes = children(a0);
    			t4 = claim_text(a0_nodes, "Svelte JS");
    			a0_nodes.forEach(detach_dev);
    			t5 = claim_text(li0_nodes, " - Cybernetically enhanced web apps");
    			li0_nodes.forEach(detach_dev);
    			t6 = claim_space(ul_nodes);
    			li1 = claim_element(ul_nodes, "LI", {});
    			var li1_nodes = children(li1);
    			a1 = claim_element(li1_nodes, "A", { href: true });
    			var a1_nodes = children(a1);
    			t7 = claim_text(a1_nodes, "Rocket.rs");
    			a1_nodes.forEach(detach_dev);
    			t8 = claim_text(li1_nodes, " - A web framework for Rust");
    			li1_nodes.forEach(detach_dev);
    			t9 = claim_space(ul_nodes);
    			li2 = claim_element(ul_nodes, "LI", {});
    			var li2_nodes = children(li2);
    			a2 = claim_element(li2_nodes, "A", { href: true });
    			var a2_nodes = children(a2);
    			t10 = claim_text(a2_nodes, "YRV Router");
    			a2_nodes.forEach(detach_dev);
    			t11 = claim_text(li2_nodes, " - Your routing bro!");
    			li2_nodes.forEach(detach_dev);
    			t12 = claim_space(ul_nodes);
    			li3 = claim_element(ul_nodes, "LI", {});
    			var li3_nodes = children(li3);
    			a3 = claim_element(li3_nodes, "A", { href: true });
    			var a3_nodes = children(a3);
    			t13 = claim_text(a3_nodes, "Bulma CSS ");
    			a3_nodes.forEach(detach_dev);
    			t14 = claim_text(li3_nodes, "- Modern CSS framework based on Flexbox");
    			li3_nodes.forEach(detach_dev);
    			ul_nodes.forEach(detach_dev);
    			center_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
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
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, center, anchor);
    			append_hydration_dev(center, h1);
    			append_hydration_dev(h1, t0);
    			append_hydration_dev(center, t1);
    			append_hydration_dev(center, h4);
    			append_hydration_dev(h4, t2);
    			append_hydration_dev(center, t3);
    			append_hydration_dev(center, ul);
    			append_hydration_dev(ul, li0);
    			append_hydration_dev(li0, a0);
    			append_hydration_dev(a0, t4);
    			append_hydration_dev(li0, t5);
    			append_hydration_dev(ul, t6);
    			append_hydration_dev(ul, li1);
    			append_hydration_dev(li1, a1);
    			append_hydration_dev(a1, t7);
    			append_hydration_dev(li1, t8);
    			append_hydration_dev(ul, t9);
    			append_hydration_dev(ul, li2);
    			append_hydration_dev(li2, a2);
    			append_hydration_dev(a2, t10);
    			append_hydration_dev(li2, t11);
    			append_hydration_dev(ul, t12);
    			append_hydration_dev(ul, li3);
    			append_hydration_dev(li3, a3);
    			append_hydration_dev(a3, t13);
    			append_hydration_dev(li3, t14);
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
    	let t0;
    	let t1;
    	let h4;
    	let p;
    	let t2;
    	let br;
    	let t3;
    	let t4;
    	let a0;
    	let t5;
    	let t6;
    	let a1;
    	let t7;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Svelte On Rust");
    			t1 = space();
    			h4 = element("h4");
    			p = element("p");
    			t2 = text("This component was servered by YRV svelte routing...\n    ");
    			br = element("br");
    			t3 = text("\n    Use svelte routes with # instead of / for browser history and refresh buttons to work correctly");
    			t4 = space();
    			a0 = element("a");
    			t5 = text("YRV Github |");
    			t6 = space();
    			a1 = element("a");
    			t7 = text("YRV REPL");
    			this.h();
    		},
    		l: function claim(nodes) {
    			h1 = claim_element(nodes, "H1", {});
    			var h1_nodes = children(h1);
    			t0 = claim_text(h1_nodes, "Svelte On Rust");
    			h1_nodes.forEach(detach_dev);
    			t1 = claim_space(nodes);
    			h4 = claim_element(nodes, "H4", {});
    			var h4_nodes = children(h4);
    			p = claim_element(h4_nodes, "P", {});
    			var p_nodes = children(p);
    			t2 = claim_text(p_nodes, "This component was servered by YRV svelte routing...\n    ");
    			br = claim_element(p_nodes, "BR", {});
    			t3 = claim_text(p_nodes, "\n    Use svelte routes with # instead of / for browser history and refresh buttons to work correctly");
    			p_nodes.forEach(detach_dev);
    			h4_nodes.forEach(detach_dev);
    			t4 = claim_space(nodes);
    			a0 = claim_element(nodes, "A", { href: true });
    			var a0_nodes = children(a0);
    			t5 = claim_text(a0_nodes, "YRV Github |");
    			a0_nodes.forEach(detach_dev);
    			t6 = claim_space(nodes);
    			a1 = claim_element(nodes, "A", { href: true });
    			var a1_nodes = children(a1);
    			t7 = claim_text(a1_nodes, "YRV REPL");
    			a1_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h1, file$3, 0, 0, 0);
    			add_location(br, file$3, 4, 4, 96);
    			add_location(p, file$3, 2, 4, 31);
    			add_location(h4, file$3, 2, 0, 27);
    			attr_dev(a0, "href", "https://github.com/pateketrueke/yrv");
    			add_location(a0, file$3, 8, 0, 212);
    			attr_dev(a1, "href", "https://svelte.dev/repl/0f07c6134b16432591a9a3a0095a80de?version=3.14.1");
    			add_location(a1, file$3, 9, 0, 277);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, h1, anchor);
    			append_hydration_dev(h1, t0);
    			insert_hydration_dev(target, t1, anchor);
    			insert_hydration_dev(target, h4, anchor);
    			append_hydration_dev(h4, p);
    			append_hydration_dev(p, t2);
    			append_hydration_dev(p, br);
    			append_hydration_dev(p, t3);
    			insert_hydration_dev(target, t4, anchor);
    			insert_hydration_dev(target, a0, anchor);
    			append_hydration_dev(a0, t5);
    			insert_hydration_dev(target, t6, anchor);
    			insert_hydration_dev(target, a1, anchor);
    			append_hydration_dev(a1, t7);
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
    			this.h();
    		},
    		l: function claim(nodes) {
    			time = claim_element(nodes, "TIME", { title: true, datetime: true });
    			var time_nodes = children(time);
    			t = claim_text(time_nodes, /*formatted*/ ctx[0]);
    			time_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			set_attributes(time, time_data);
    			add_location(time, file$4, 60, 0, 1479);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, time, anchor);
    			append_hydration_dev(time, t);
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
    		l: noop,
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
    			this.h();
    		},
    		l: function claim(nodes) {
    			h1 = claim_element(nodes, "H1", {});
    			var h1_nodes = children(h1);
    			t0 = claim_text(h1_nodes, "Workout: ");
    			claim_component(time.$$.fragment, h1_nodes);
    			h1_nodes.forEach(detach_dev);
    			t1 = claim_space(nodes);
    			hr = claim_element(nodes, "HR", {});
    			t2 = claim_space(nodes);
    			p0 = claim_element(nodes, "P", {});
    			var p0_nodes = children(p0);
    			t3 = claim_text(p0_nodes, "Duration: ");
    			t4 = claim_text(p0_nodes, t4_value);
    			p0_nodes.forEach(detach_dev);
    			t5 = claim_space(nodes);
    			p1 = claim_element(nodes, "P", {});
    			var p1_nodes = children(p1);
    			t6 = claim_text(p1_nodes, "By: ");
    			t7 = claim_text(p1_nodes, t7_value);
    			p1_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h1, file$5, 18, 8, 562);
    			add_location(hr, file$5, 19, 8, 675);
    			add_location(p0, file$5, 20, 8, 688);
    			add_location(p1, file$5, 21, 8, 770);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, h1, anchor);
    			append_hydration_dev(h1, t0);
    			mount_component(time, h1, null);
    			insert_hydration_dev(target, t1, anchor);
    			insert_hydration_dev(target, hr, anchor);
    			insert_hydration_dev(target, t2, anchor);
    			insert_hydration_dev(target, p0, anchor);
    			append_hydration_dev(p0, t3);
    			append_hydration_dev(p0, t4);
    			insert_hydration_dev(target, t5, anchor);
    			insert_hydration_dev(target, p1, anchor);
    			append_hydration_dev(p1, t6);
    			append_hydration_dev(p1, t7);
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
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text("Loading... please wait");
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", {});
    			var p_nodes = children(p);
    			t = claim_text(p_nodes, "Loading... please wait");
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(p, file$5, 16, 8, 507);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, t);
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
    	const block = {
    		c: noop,
    		l: noop,
    		m: noop,
    		p: noop,
    		d: noop
    	};

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
    	let t0;
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
    			t0 = text("Exercises");
    			t1 = space();
    			hr = element("hr");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			this.h();
    		},
    		l: function claim(nodes) {
    			h1 = claim_element(nodes, "H1", {});
    			var h1_nodes = children(h1);
    			t0 = claim_text(h1_nodes, "Exercises");
    			h1_nodes.forEach(detach_dev);
    			t1 = claim_space(nodes);
    			hr = claim_element(nodes, "HR", {});
    			t2 = claim_space(nodes);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(nodes);
    			}

    			each_1_anchor = empty();
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h1, file$5, 29, 8, 932);
    			add_location(hr, file$5, 30, 8, 959);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, h1, anchor);
    			append_hydration_dev(h1, t0);
    			insert_hydration_dev(target, t1, anchor);
    			insert_hydration_dev(target, hr, anchor);
    			insert_hydration_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_hydration_dev(target, each_1_anchor, anchor);
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
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", {});
    			var p_nodes = children(p);
    			t0 = claim_text(p_nodes, "Comments: ");
    			t1 = claim_text(p_nodes, t1_value);
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(p, file$5, 35, 20, 1158);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, t0);
    			append_hydration_dev(p, t1);
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
    			this.h();
    		},
    		l: function claim(nodes) {
    			li = claim_element(nodes, "LI", {});
    			var li_nodes = children(li);
    			t0 = claim_text(li_nodes, t0_value);
    			t1 = claim_text(li_nodes, " x ");
    			t2 = claim_text(li_nodes, t2_value);
    			t3 = claim_space(li_nodes);
    			t4 = claim_text(li_nodes, t4_value);
    			t5 = claim_text(li_nodes, " - ");
    			t6 = claim_text(li_nodes, t6_value);
    			t7 = claim_text(li_nodes, "RiR");
    			li_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(li, file$5, 39, 24, 1307);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, li, anchor);
    			append_hydration_dev(li, t0);
    			append_hydration_dev(li, t1);
    			append_hydration_dev(li, t2);
    			append_hydration_dev(li, t3);
    			append_hydration_dev(li, t4);
    			append_hydration_dev(li, t5);
    			append_hydration_dev(li, t6);
    			append_hydration_dev(li, t7);
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
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			h2 = claim_element(div_nodes, "H2", {});
    			var h2_nodes = children(h2);
    			t0 = claim_text(h2_nodes, t0_value);
    			h2_nodes.forEach(detach_dev);
    			t1 = claim_space(div_nodes);
    			if (if_block) if_block.l(div_nodes);
    			t2 = claim_space(div_nodes);
    			ul = claim_element(div_nodes, "UL", {});
    			var ul_nodes = children(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(ul_nodes);
    			}

    			ul_nodes.forEach(detach_dev);
    			t3 = claim_space(div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h2, file$5, 33, 16, 1058);
    			add_location(ul, file$5, 37, 16, 1233);
    			attr_dev(div, "class", "exercise");
    			add_location(div, file$5, 32, 12, 1019);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			append_hydration_dev(div, h2);
    			append_hydration_dev(h2, t0);
    			append_hydration_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_hydration_dev(div, t2);
    			append_hydration_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_hydration_dev(div, t3);
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
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text("Loading... please wait");
    			this.h();
    		},
    		l: function claim(nodes) {
    			p = claim_element(nodes, "P", {});
    			var p_nodes = children(p);
    			t = claim_text(p_nodes, "Loading... please wait");
    			p_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(p, file$5, 27, 8, 877);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, p, anchor);
    			append_hydration_dev(p, t);
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
    			this.h();
    		},
    		l: function claim(nodes) {
    			div0 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div0_nodes = children(div0);
    			info.block.l(div0_nodes);
    			div0_nodes.forEach(detach_dev);
    			t = claim_space(nodes);
    			div1 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div1_nodes = children(div1);
    			info_1.block.l(div1_nodes);
    			div1_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div0, "class", "separator svelte-1ndxrrq");
    			attr_dev(div0, "id", "metadata");
    			add_location(div0, file$5, 14, 0, 443);
    			attr_dev(div1, "class", "separator svelte-1ndxrrq");
    			attr_dev(div1, "id", "workout");
    			add_location(div1, file$5, 25, 0, 814);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div0, anchor);
    			info.block.m(div0, info.anchor = null);
    			info.mount = () => div0;
    			info.anchor = null;
    			insert_hydration_dev(target, t, anchor);
    			insert_hydration_dev(target, div1, anchor);
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

    const en$1 = {
      days:        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      daysShort:   ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      daysMin:     ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
      months:      ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      meridiem:    ['am', 'pm'],
      suffix:      ['st', 'nd', 'rd', 'th'],
      todayBtn:    'Today',
      clearBtn:    'Clear',
      timeView:    'Show time view',
      backToDate:  'Back to calendar view'
    };

    var settings = {
      theme: 'sdt-calendar-colors',
      mode: 'auto',
      format: 'yyyy-mm-dd',
      formatType: 'standard',
      weekStart: 1,
      visible: false,
      inputClasses: null,
      todayBtnClasses: 'sdt-action-btn sdt-today-btn',
      clearBtnClasses: 'sdt-action-btn sdt-clear-btn',
      todayBtn: true,
      clearBtn: true,
      autoclose: true,
      clearToggle: true,
      i18n: en$1
    };

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    const MODE_DECADE = 0;
    const MODE_YEAR = 1;
    const MODE_MONTH = 2;

    function compute(currentDate, selectedDate, view, locale, weekStart) {
      // years 4 x 3
      if (view === MODE_DECADE) {
        const nextFrom = 11;
        const prevTo = 1;
        const todayMark = -1;
        const grid = [];
        let yearRow = [];
        let currYear = currentDate.getUTCFullYear() - (currentDate.getUTCFullYear() % 10) - 1;
        for (let i = 0; i < 12; i++) {
          yearRow.push(currYear + i);
          if (yearRow.length === 4) {
            grid.push(yearRow);
            yearRow = [];
          }
        }
        let selectionMark = null;
        if (!selectedDate) {
          selectedDate = new Date();
        }
        if (selectedDate.getUTCFullYear() >= currYear) {
          selectionMark = selectedDate.getUTCFullYear() % currYear;
        }

        return {
          grid, todayMark, nextFrom, prevTo, selectionMark
        }
      }

      // months 4 x 3
      if (view === MODE_YEAR) {
        let grid = [];
        let monthRow = [];
        let prevTo = 12;
        let nextFrom = 24;
        const ISO = currentDate.toISOString().split('T')[0].substring(0, 8);
        const dateNormalized = new Date(ISO + '01 00:00:00');
        const initYear = dateNormalized.getFullYear() - 1;
        dateNormalized.setFullYear(initYear);
        let todayMark = 0;
        for (let y = 0; y < 3; y++) {
          for (let i = 0; i < 12; i++) {
            dateNormalized.setUTCMonth(i);
            monthRow.push(locale.monthsShort[i % 12]);
            if (monthRow.length === 4) {
              grid.push(monthRow);
              monthRow = [];
            }
          }
          dateNormalized.setFullYear(dateNormalized.getFullYear() + 1);
        }
        let selectionMark = null;
        if (!selectedDate) {
          selectedDate = new Date();
        }
        if (selectedDate.getUTCFullYear() - initYear >= 0 && selectedDate.getUTCFullYear() - initYear <= 2) {
          selectionMark = selectedDate.getUTCMonth() + ((selectedDate.getUTCFullYear() - initYear || 0) * 12);
        }
        return {
          grid, todayMark, nextFrom, prevTo, selectionMark
        }
      } 

      // days 7x6
      let d = currentDate || new Date(), // or currently selected date
          y = d.getUTCFullYear(),
          m = d.getUTCMonth(),
          dM = d.getUTCDate(),
          h = d.getUTCHours(),
          today = new Date();
      let prevMonth = UTCDate(y, m-1, 28, 0, 0, 0, 0),
          day = utils.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
      prevMonth.setUTCDate(day);
      prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - weekStart + 7) % 7);

      let nextMonth = new Date(prevMonth);
      nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
      let nextMonthValue = nextMonth.valueOf();

      let grid = [];
      let dayRow = [];
      let todayMark = -1;
      let selectionMark = null;
      let prevTo = 0;
      let nextFrom = 42;

      let inc = 0;
      while(prevMonth.valueOf() < nextMonthValue) {
        inc++;
        dayRow.push(new Date(prevMonth));
        if (prevMonth.getUTCFullYear() < y || (prevMonth.getUTCFullYear() === y && prevMonth.getUTCMonth() < m)) {
          prevTo = inc;
        } else if (nextFrom === 42 && (prevMonth.getUTCFullYear() > y || (prevMonth.getUTCFullYear() === y && prevMonth.getUTCMonth() > m))) {
          nextFrom = inc - 1;
        }

        prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);


        if (prevMonth.getUTCFullYear() === today.getUTCFullYear() &&
          prevMonth.getUTCMonth() === today.getUTCMonth() &&
          prevMonth.getUTCDate() === today.getUTCDate()
        ) {
          todayMark = inc;
        }
        if (!selectionMark && selectedDate
          && prevMonth.getUTCFullYear() === selectedDate.getUTCFullYear()
          && prevMonth.getUTCMonth() === selectedDate.getUTCMonth()
          && prevMonth.getUTCDate() === selectedDate.getUTCDate()
        ) {
          selectionMark = inc;
        }
        
        if (dayRow.length === 7) {
          grid.push(dayRow);
          dayRow = [];
        }
      }
      return { grid, todayMark, prevTo, nextFrom, selectionMark };
    }

    function moveGrid(newPos, view) {
      if (view === MODE_MONTH) {
        if (newPos < 0) {
          newPos = 42 + newPos;
        }
        return {
          x: newPos % 7,
          y: Math.floor(newPos / 7)
        }
      }
    }

    const utils = {
      isLeapYear:       function (year) {
        return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
      },
      getDaysInMonth:   function (year, month) {
        return [31, (utils.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
      },
    };

    function UTCDate() {
      return new Date(Date.UTC.apply(Date, arguments));
    }

    function parseDate$1(date, format, i18n, type) {
      if (date instanceof Date) {
        const dateUTC = new Date(date.valueOf() - date.getTimezoneOffset() * 60000);
        dateUTC.setMilliseconds(0);
        return dateUTC;
      }
      if (/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(date)) {
        format = formatHelper.parseFormat('yyyy-mm-dd', type);
      } else 
      if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}$/.test(date)) {
        format = formatHelper.parseFormat('yyyy-mm-dd hh:ii', type);
      } else 
      if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}\:\d{1,2}[Z]{0,1}$/.test(date)) {
        format = formatHelper.parseFormat('yyyy-mm-dd hh:ii:ss', type);
      } else {
        format = formatHelper.parseFormat(format, type);
      }
      var parts = date && date.toString().match(formatHelper.nonpunctuation) || [],
        date = new Date(0, 0, 0, 0, 0, 0, 0),
        parsed = {},
        setters_order = ['hh', 'h', 'ii', 'i', 'ss', 's', 'yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'D', 'DD', 'd', 'dd', 'H', 'HH', 'p', 'P', 'z', 'Z'],
        setters_map = {
          hh:   function (d, v) {
            return d.setUTCHours(v);
          },
          h:    function (d, v) {
            return d.setUTCHours(v);
          },
          HH:   function (d, v) {
            return d.setUTCHours(v === 12 ? 0 : v);
          },
          H:    function (d, v) {
            return d.setUTCHours(v === 12 ? 0 : v);
          },
          ii:   function (d, v) {
            return d.setUTCMinutes(v);
          },
          i:    function (d, v) {
            return d.setUTCMinutes(v);
          },
          ss:   function (d, v) {
            return d.setUTCSeconds(v);
          },
          s:    function (d, v) {
            return d.setUTCSeconds(v);
          },
          yyyy: function (d, v) {
            return d.setUTCFullYear(v);
          },
          yy:   function (d, v) {
            return d.setUTCFullYear(2000 + v);
          },
          m:    function (d, v) {
            v -= 1;
            while (v < 0) v += 12;
            v %= 12;
            d.setUTCMonth(v);
            while (d.getUTCMonth() !== v)
              if (isNaN(d.getUTCMonth()))
                return d;
              else
                d.setUTCDate(d.getUTCDate() - 1);
            return d;
          },
          d:    function (d, v) {
            return d.setUTCDate(v);
          },
          p:    function (d, v) {
            return d.setUTCHours(v === 1 ? d.getUTCHours() + 12 : d.getUTCHours());
          }
        },
        val, part;
      setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
      setters_map['dd'] = setters_map['d'];
      setters_map['P'] = setters_map['p'];
      date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getUTCHours(), date.getUTCMinutes(), date.getSeconds());
      if (parts.length === format.parts.length) {
        for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
          val = parseInt(parts[i], 10);
          part = format.parts[i];
          if (isNaN(val)) {
            switch (part) {
              case 'MM':
                val = i18n.months.indexOf(parts[i]) + 1;
                break;
              case 'M':
                val= i18n.monthsShort.indexOf(parts[i]) + 1;
                break;
              case 'p':
              case 'P':
                val = i18n.meridiem.indexOf(parts[i].toLowerCase());
                break;
            }
          }
          parsed[part] = val;
        }
        for (var i = 0, s; i < setters_order.length; i++) {
          s = setters_order[i];
          if (s in parsed && !isNaN(parsed[s]))
            setters_map[s](date, parsed[s]);
        }
      }
      return date;
    }

    function formatDate(date, format, i18n, type) {
      if (date === null) {
        return '';
      }
      var val;
      if (type === 'standard') {
        val = {
          t:    date.getTime(),
          // year
          yy:   date.getUTCFullYear().toString().substring(2),
          yyyy: date.getUTCFullYear(),
          // month
          m:    date.getUTCMonth() + 1,
          M:    i18n.monthsShort[date.getUTCMonth()],
          MM:   i18n.months[date.getUTCMonth()],
          // day
          d:    date.getUTCDate(),
          D:    i18n.daysShort[date.getUTCDay()],
          DD:   i18n.days[date.getUTCDay()],
          p:    (i18n.meridiem.length === 2 ? i18n.meridiem[date.getUTCHours() < 12 ? 0 : 1] : ''),
          // hour
          h:    date.getUTCHours(),
          // minute
          i:    date.getUTCMinutes(),
          // second
          s:    date.getUTCSeconds(),
          // timezone
          z:    date.toLocaleDateString(undefined, {day:'2-digit',timeZoneName: 'long' }).substring(4)
        };

        if (i18n.meridiem.length === 2) {
          val.H = (val.h % 12 === 0 ? 12 : val.h % 12);
        }
        else {
          val.H = val.h;
        }
        val.HH = (val.H < 10 ? '0' : '') + val.H;
        val.P = val.p.toUpperCase();
        val.Z = val.z;
        val.hh = (val.h < 10 ? '0' : '') + val.h;
        val.ii = (val.i < 10 ? '0' : '') + val.i;
        val.ss = (val.s < 10 ? '0' : '') + val.s;
        val.dd = (val.d < 10 ? '0' : '') + val.d;
        val.mm = (val.m < 10 ? '0' : '') + val.m;
      } else if (type === 'php') {
        // php format
        val = {
          // year
          y: date.getUTCFullYear().toString().substring(2),
          Y: date.getUTCFullYear(),
          // month
          F: i18n.months[date.getUTCMonth()],
          M: i18n.monthsShort[date.getUTCMonth()],
          n: date.getUTCMonth() + 1,
          t: utils.getDaysInMonth(date.getUTCFullYear(), date.getUTCMonth()),
          // day
          j: date.getUTCDate(),
          l: i18n.days[date.getUTCDay()],
          D: i18n.daysShort[date.getUTCDay()],
          w: date.getUTCDay(), // 0 -> 6
          N: (date.getUTCDay() === 0 ? 7 : date.getUTCDay()),       // 1 -> 7
          S: (date.getUTCDate() % 10 <= i18n.suffix.length ? i18n.suffix[date.getUTCDate() % 10 - 1] : ''),
          // hour
          a: (i18n.meridiem.length === 2 ? i18n.meridiem[date.getUTCHours() < 12 ? 0 : 1] : ''),
          g: (date.getUTCHours() % 12 === 0 ? 12 : date.getUTCHours() % 12),
          G: date.getUTCHours(),
          // minute
          i: date.getUTCMinutes(),
          // second
          s: date.getUTCSeconds()
        };
        val.m = (val.n < 10 ? '0' : '') + val.n;
        val.d = (val.j < 10 ? '0' : '') + val.j;
        val.A = val.a.toString().toUpperCase();
        val.h = (val.g < 10 ? '0' : '') + val.g;
        val.H = (val.G < 10 ? '0' : '') + val.G;
        val.i = (val.i < 10 ? '0' : '') + val.i;
        val.s = (val.s < 10 ? '0' : '') + val.s;
      } else {
        throw new Error('Invalid format type.');
      }
      let dateArr = [];
      format = formatHelper.parseFormat(format, type);
      for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
        if (format.separators.length) {
          dateArr.push(format.separators.shift());
        }
        dateArr.push(val[format.parts[i]]);
      }
      if (format.separators.length) {
        dateArr.push(format.separators.shift());
      }
      return dateArr.join('');
    }

    const formatHelper = {
      validParts: function (type) {
        if (type === 'standard') {
          return /t|hh?|HH?|p|P|z|Z|ii?|ss?|dd?|DD?|mm?|MM?|yy(?:yy)?/g;
        } else if (type === 'php') {
          return /[dDjlNwzFmMnStyYaABgGhHis]/g;
        } else {
          throw new Error('Invalid format type.');
        }
      },
      nonpunctuation: /[^ -\/:-@\[-`{-~\t\n\rTZ]+/g,
      parseFormat: function (format, type) {
          // IE treats \0 as a string end in inputs (truncating the value),
          // so it's a bad format delimiter, anyway
        var separators = format.replace(this.validParts(type), '\0').split('\0'),
        parts = format.match(this.validParts(type));
        if (!separators || !separators.length || !parts || parts.length === 0) {
          throw new Error('Invalid date format.');
        }
        return {separators: separators, parts: parts};
      },
    };

    function usePosition(el, { inputEl, visible, inputRect }) {
      if (!visible) {
        const calRect = el.getBoundingClientRect();
        const style = ['position: absolute', 'z-index: 12250'];
        style.push(inputRect.x + calRect.width > window.innerWidth
          ? `right: 1rem`
          : `left: ${inputRect.left}px`
        );
        if (calRect.height + calRect.top > (window.innerHeight + window.scrollY)) {
          style.push(`bottom: 1rem`);
        } else {
          style.push(`top: ${inputRect.top + inputRect.height + window.scrollY}px`);
        }
        el.style = style.join(';');
        el.hidden = false;
        document.body.appendChild(el);
      }
      el.hidden = false;

      function destroy() {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }

      return {
        destroy
      }
    }

    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, end = 1, opacity = 0 } = {}) {
      const style = getComputedStyle(node);
      const target_opacity = +style.opacity;
      const transform = style.transform === 'none' ? '' : style.transform;
      const sd = 1 - start;
      const od = target_opacity * (1 - opacity);
      return {
          delay,
          duration,
          easing,
          css: (_t, u) => `
        transform: ${transform} scale(${end !== 1 ? start + end * u : 1 - (sd * u)});
        opacity: ${target_opacity - (od * u)};
      `
      };
    }

    /* node_modules/svelty-picker/src/Calendar.svelte generated by Svelte v3.48.0 */
    const file$6 = "node_modules/svelty-picker/src/Calendar.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[38] = list[i];
    	child_ctx[40] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[41] = list[i];
    	child_ctx[43] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[44] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[38] = list[i];
    	child_ctx[40] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[48] = list[i];
    	child_ctx[43] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[38] = list[i];
    	child_ctx[40] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[51] = list[i];
    	child_ctx[43] = i;
    	return child_ctx;
    }

    // (231:4) {#if enableTimeToggle && internalDate}
    function create_if_block_3$1(ctx) {
    	let button;
    	let svg;
    	let path;
    	let button_title_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { class: true, title: true });
    			var button_nodes = children(button);

    			svg = claim_svg_element(button_nodes, "svg", {
    				class: true,
    				xmlns: true,
    				viewBox: true,
    				width: true,
    				height: true
    			});

    			var svg_nodes = children(svg);
    			path = claim_svg_element(svg_nodes, "path", { "fill-rule": true, d: true });
    			children(path).forEach(detach_dev);
    			svg_nodes.forEach(detach_dev);
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm.5 4.75a.75.75 0 00-1.5 0v3.5a.75.75 0 00.471.696l2.5 1a.75.75 0 00.557-1.392L8.5 7.742V4.75z");
    			add_location(path, file$6, 232, 105, 7862);
    			attr_dev(svg, "class", "sdt-svg svelte-1xp8yha");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "16");
    			add_location(svg, file$6, 232, 6, 7763);
    			attr_dev(button, "class", "std-btn std-btn-header icon-btn sdt-time-icon svelte-1xp8yha");
    			attr_dev(button, "title", button_title_value = /*i18n*/ ctx[0].timeView);
    			add_location(button, file$6, 231, 4, 7631);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, svg);
    			append_hydration_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", prevent_default(/*onTimeSwitch*/ ctx[21]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*i18n*/ 1 && button_title_value !== (button_title_value = /*i18n*/ ctx[0].timeView)) {
    				attr_dev(button, "title", button_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(231:4) {#if enableTimeToggle && internalDate}",
    		ctx
    	});

    	return block;
    }

    // (245:2) {#if currentView === MODE_DECADE}
    function create_if_block_2$1(ctx) {
    	let table;
    	let tbody;
    	let tbody_intro;
    	let tbody_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_5 = /*dataset*/ ctx[9].grid;
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.h();
    		},
    		l: function claim(nodes) {
    			table = claim_element(nodes, "TABLE", { class: true, style: true });
    			var table_nodes = children(table);
    			tbody = claim_element(table_nodes, "TBODY", { class: true });
    			var tbody_nodes = children(tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(tbody_nodes);
    			}

    			tbody_nodes.forEach(detach_dev);
    			table_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(tbody, "class", "sdt-tbody-lg svelte-1xp8yha");
    			add_location(tbody, file$6, 246, 4, 9008);
    			attr_dev(table, "class", "sdt-table svelte-1xp8yha");
    			set_style(table, "max-height", "221px");
    			set_style(table, "height", "221px");
    			add_location(table, file$6, 245, 2, 8936);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, table, anchor);
    			append_hydration_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(tbody, "outroend", /*onTransitionOut*/ ctx[20], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*dataset, isBetween, onClick*/ 557568) {
    				each_value_5 = /*dataset*/ ctx[9].grid;
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (tbody_outro) tbody_outro.end(1);

    				tbody_intro = create_in_transition(tbody, /*swapTransition*/ ctx[11], {
    					duration: /*duration*/ ctx[14],
    					start: /*start*/ ctx[13],
    					opacity: 1
    				});

    				tbody_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (tbody_intro) tbody_intro.invalidate();

    			if (local) {
    				tbody_outro = create_out_transition(tbody, /*swapTransition*/ ctx[11], {
    					duration: /*duration*/ ctx[14],
    					end: /*end*/ ctx[12],
    					start: 1
    				});
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching && tbody_outro) tbody_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(245:2) {#if currentView === MODE_DECADE}",
    		ctx
    	});

    	return block;
    }

    // (250:8) {#each row as year, j(j)}
    function create_each_block_6(key_1, ctx) {
    	let td;
    	let button;
    	let t_value = /*year*/ ctx[51] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[30](/*year*/ ctx[51]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			td = element("td");
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			td = claim_element(nodes, "TD", { class: true });
    			var td_nodes = children(td);
    			button = claim_element(td_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			td_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", "std-btn svelte-1xp8yha");
    			toggle_class(button, "not-current", !/*isBetween*/ ctx[15](/*i*/ ctx[40] * 4 + /*j*/ ctx[43]));
    			add_location(button, file$6, 251, 10, 9332);
    			attr_dev(td, "class", "svelte-1xp8yha");
    			toggle_class(td, "is-selected", /*i*/ ctx[40] * 4 + /*j*/ ctx[43] === /*dataset*/ ctx[9].selectionMark);
    			add_location(td, file$6, 250, 8, 9264);
    			this.first = td;
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, td, anchor);
    			append_hydration_dev(td, button);
    			append_hydration_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", prevent_default(click_handler_2), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*dataset*/ 512 && t_value !== (t_value = /*year*/ ctx[51] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*isBetween, dataset*/ 33280) {
    				toggle_class(button, "not-current", !/*isBetween*/ ctx[15](/*i*/ ctx[40] * 4 + /*j*/ ctx[43]));
    			}

    			if (dirty[0] & /*dataset*/ 512) {
    				toggle_class(td, "is-selected", /*i*/ ctx[40] * 4 + /*j*/ ctx[43] === /*dataset*/ ctx[9].selectionMark);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(250:8) {#each row as year, j(j)}",
    		ctx
    	});

    	return block;
    }

    // (248:6) {#each dataset.grid as row, i}
    function create_each_block_5(ctx) {
    	let tr;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_6 = /*row*/ ctx[38];
    	validate_each_argument(each_value_6);
    	const get_key = ctx => /*j*/ ctx[43];
    	validate_each_keys(ctx, each_value_6, get_each_context_6, get_key);

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		let child_ctx = get_each_context_6(ctx, each_value_6, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_6(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			this.h();
    		},
    		l: function claim(nodes) {
    			tr = claim_element(nodes, "TR", {});
    			var tr_nodes = children(tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(tr_nodes);
    			}

    			t = claim_space(tr_nodes);
    			tr_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(tr, file$6, 248, 6, 9215);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_hydration_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*dataset, isBetween, onClick*/ 557568) {
    				each_value_6 = /*row*/ ctx[38];
    				validate_each_argument(each_value_6);
    				validate_each_keys(ctx, each_value_6, get_each_context_6, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_6, each_1_lookup, tr, destroy_block, create_each_block_6, t, get_each_context_6);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(248:6) {#each dataset.grid as row, i}",
    		ctx
    	});

    	return block;
    }

    // (264:2) {#if currentView === MODE_YEAR}
    function create_if_block_1$1(ctx) {
    	let table;
    	let tbody;
    	let tbody_style_value;
    	let tbody_intro;
    	let tbody_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*dataset*/ ctx[9].grid;
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.h();
    		},
    		l: function claim(nodes) {
    			table = claim_element(nodes, "TABLE", { class: true });
    			var table_nodes = children(table);
    			tbody = claim_element(table_nodes, "TBODY", { class: true, style: true });
    			var tbody_nodes = children(tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(tbody_nodes);
    			}

    			tbody_nodes.forEach(detach_dev);
    			table_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(tbody, "class", "sdt-tbody-lg svelte-1xp8yha");
    			attr_dev(tbody, "style", tbody_style_value = `transform: translateY(-${/*transform*/ ctx[6]}px)`);
    			toggle_class(tbody, "animate-transition", /*onMonthTransitionTrigger*/ ctx[7] ? true : false);
    			add_location(tbody, file$6, 265, 4, 9676);
    			attr_dev(table, "class", "sdt-table svelte-1xp8yha");
    			add_location(table, file$6, 264, 2, 9645);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, table, anchor);
    			append_hydration_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(tbody, "outroend", /*onTransitionOut*/ ctx[20], false, false, false),
    					listen_dev(tbody, "transitionend", /*transitionend_handler*/ ctx[32], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*dataset, isBetween, onClick*/ 557568) {
    				each_value_3 = /*dataset*/ ctx[9].grid;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}

    			if (!current || dirty[0] & /*transform*/ 64 && tbody_style_value !== (tbody_style_value = `transform: translateY(-${/*transform*/ ctx[6]}px)`)) {
    				attr_dev(tbody, "style", tbody_style_value);
    			}

    			if (dirty[0] & /*onMonthTransitionTrigger*/ 128) {
    				toggle_class(tbody, "animate-transition", /*onMonthTransitionTrigger*/ ctx[7] ? true : false);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (tbody_outro) tbody_outro.end(1);

    				tbody_intro = create_in_transition(tbody, /*swapTransition*/ ctx[11], {
    					duration: /*duration*/ ctx[14],
    					start: /*start*/ ctx[13],
    					opacity: 1
    				});

    				tbody_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (tbody_intro) tbody_intro.invalidate();

    			if (local) {
    				tbody_outro = create_out_transition(tbody, /*swapTransition*/ ctx[11], {
    					duration: /*duration*/ ctx[14],
    					end: /*end*/ ctx[12],
    					start: 1
    				});
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching && tbody_outro) tbody_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(264:2) {#if currentView === MODE_YEAR}",
    		ctx
    	});

    	return block;
    }

    // (272:8) {#each row as month, j(j)}
    function create_each_block_4(key_1, ctx) {
    	let td;
    	let button;
    	let t_value = /*month*/ ctx[48] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[31](/*month*/ ctx[48]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			td = element("td");
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			td = claim_element(nodes, "TD", { class: true });
    			var td_nodes = children(td);
    			button = claim_element(td_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			td_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", "std-btn svelte-1xp8yha");
    			toggle_class(button, "not-current", !/*isBetween*/ ctx[15](/*i*/ ctx[40] * 4 + /*j*/ ctx[43]));
    			add_location(button, file$6, 273, 10, 10218);
    			attr_dev(td, "class", "svelte-1xp8yha");
    			toggle_class(td, "is-selected", /*i*/ ctx[40] * 4 + /*j*/ ctx[43] === /*dataset*/ ctx[9].selectionMark);
    			add_location(td, file$6, 272, 8, 10150);
    			this.first = td;
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, td, anchor);
    			append_hydration_dev(td, button);
    			append_hydration_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", prevent_default(click_handler_3), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*dataset*/ 512 && t_value !== (t_value = /*month*/ ctx[48] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*isBetween, dataset*/ 33280) {
    				toggle_class(button, "not-current", !/*isBetween*/ ctx[15](/*i*/ ctx[40] * 4 + /*j*/ ctx[43]));
    			}

    			if (dirty[0] & /*dataset*/ 512) {
    				toggle_class(td, "is-selected", /*i*/ ctx[40] * 4 + /*j*/ ctx[43] === /*dataset*/ ctx[9].selectionMark);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(272:8) {#each row as month, j(j)}",
    		ctx
    	});

    	return block;
    }

    // (270:6) {#each dataset.grid as row, i}
    function create_each_block_3(ctx) {
    	let tr;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_4 = /*row*/ ctx[38];
    	validate_each_argument(each_value_4);
    	const get_key = ctx => /*j*/ ctx[43];
    	validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		let child_ctx = get_each_context_4(ctx, each_value_4, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_4(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			this.h();
    		},
    		l: function claim(nodes) {
    			tr = claim_element(nodes, "TR", {});
    			var tr_nodes = children(tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(tr_nodes);
    			}

    			t = claim_space(tr_nodes);
    			tr_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(tr, file$6, 270, 6, 10100);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_hydration_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*dataset, isBetween, onClick*/ 557568) {
    				each_value_4 = /*row*/ ctx[38];
    				validate_each_argument(each_value_4);
    				validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_4, each_1_lookup, tr, destroy_block, create_each_block_4, t, get_each_context_4);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(270:6) {#each dataset.grid as row, i}",
    		ctx
    	});

    	return block;
    }

    // (285:2) {#if currentView === MODE_MONTH}
    function create_if_block$3(ctx) {
    	let table;
    	let tbody;
    	let tr;
    	let t;
    	let tbody_intro;
    	let tbody_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*dayLabels*/ ctx[10];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*dataset*/ ctx[9].grid;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			tbody = element("tbody");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.h();
    		},
    		l: function claim(nodes) {
    			table = claim_element(nodes, "TABLE", { class: true });
    			var table_nodes = children(table);
    			tbody = claim_element(table_nodes, "TBODY", {});
    			var tbody_nodes = children(tbody);
    			tr = claim_element(tbody_nodes, "TR", { class: true });
    			var tr_nodes = children(tr);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].l(tr_nodes);
    			}

    			tr_nodes.forEach(detach_dev);
    			t = claim_space(tbody_nodes);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(tbody_nodes);
    			}

    			tbody_nodes.forEach(detach_dev);
    			table_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(tr, "class", "sdt-cal-td svelte-1xp8yha");
    			add_location(tr, file$6, 287, 6, 10733);
    			add_location(tbody, file$6, 286, 4, 10567);
    			attr_dev(table, "class", "sdt-table sdt-table-height svelte-1xp8yha");
    			add_location(table, file$6, 285, 2, 10519);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, table, anchor);
    			append_hydration_dev(table, tbody);
    			append_hydration_dev(tbody, tr);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			append_hydration_dev(tbody, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(tbody, "outroend", /*onTransitionOut*/ ctx[20], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*dayLabels*/ 1024) {
    				each_value_2 = /*dayLabels*/ ctx[10];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*dataset, isDisabledDate, isBetween, onClick*/ 623104) {
    				each_value = /*dataset*/ ctx[9].grid;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (tbody_outro) tbody_outro.end(1);

    				tbody_intro = create_in_transition(tbody, /*swapTransition*/ ctx[11], {
    					duration: /*duration*/ ctx[14],
    					start: 0.5,
    					opacity: 1
    				});

    				tbody_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (tbody_intro) tbody_intro.invalidate();

    			if (local) {
    				tbody_outro = create_out_transition(tbody, /*swapTransition*/ ctx[11], {
    					duration: /*duration*/ ctx[14],
    					start: Math.abs(/*viewDelta*/ ctx[4])
    				});
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching && tbody_outro) tbody_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(285:2) {#if currentView === MODE_MONTH}",
    		ctx
    	});

    	return block;
    }

    // (289:6) {#each dayLabels as header}
    function create_each_block_2(ctx) {
    	let th;
    	let t_value = /*header*/ ctx[44] + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			th = claim_element(nodes, "TH", { class: true });
    			var th_nodes = children(th);
    			t = claim_text(th_nodes, t_value);
    			th_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(th, "class", "sdt-cal-th svelte-1xp8yha");
    			add_location(th, file$6, 289, 8, 10801);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, th, anchor);
    			append_hydration_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*dayLabels*/ 1024 && t_value !== (t_value = /*header*/ ctx[44] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(289:6) {#each dayLabels as header}",
    		ctx
    	});

    	return block;
    }

    // (295:8) {#each row as currDate, j(j)}
    function create_each_block_1$1(key_1, ctx) {
    	let td;
    	let button;
    	let t_value = /*currDate*/ ctx[41].getUTCDate() + "";
    	let t;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[33](/*currDate*/ ctx[41]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			td = element("td");
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			td = claim_element(nodes, "TD", { class: true });
    			var td_nodes = children(td);
    			button = claim_element(td_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			td_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", "std-btn sdt-btn-day svelte-1xp8yha");
    			button.disabled = button_disabled_value = /*isDisabledDate*/ ctx[16](/*currDate*/ ctx[41]);
    			toggle_class(button, "not-current", !/*isBetween*/ ctx[15](/*i*/ ctx[40] * 7 + /*j*/ ctx[43], /*currDate*/ ctx[41]));
    			add_location(button, file$6, 299, 10, 11130);
    			attr_dev(td, "class", "sdt-cal-td svelte-1xp8yha");
    			toggle_class(td, "sdt-today", /*i*/ ctx[40] * 7 + /*j*/ ctx[43] === /*dataset*/ ctx[9].todayMark);
    			toggle_class(td, "is-selected", /*i*/ ctx[40] * 7 + /*j*/ ctx[43] === /*dataset*/ ctx[9].selectionMark);
    			add_location(td, file$6, 295, 8, 10965);
    			this.first = td;
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, td, anchor);
    			append_hydration_dev(td, button);
    			append_hydration_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", prevent_default(click_handler_4), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*dataset*/ 512 && t_value !== (t_value = /*currDate*/ ctx[41].getUTCDate() + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*dataset*/ 512 && button_disabled_value !== (button_disabled_value = /*isDisabledDate*/ ctx[16](/*currDate*/ ctx[41]))) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty[0] & /*isBetween, dataset*/ 33280) {
    				toggle_class(button, "not-current", !/*isBetween*/ ctx[15](/*i*/ ctx[40] * 7 + /*j*/ ctx[43], /*currDate*/ ctx[41]));
    			}

    			if (dirty[0] & /*dataset*/ 512) {
    				toggle_class(td, "sdt-today", /*i*/ ctx[40] * 7 + /*j*/ ctx[43] === /*dataset*/ ctx[9].todayMark);
    			}

    			if (dirty[0] & /*dataset*/ 512) {
    				toggle_class(td, "is-selected", /*i*/ ctx[40] * 7 + /*j*/ ctx[43] === /*dataset*/ ctx[9].selectionMark);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(295:8) {#each row as currDate, j(j)}",
    		ctx
    	});

    	return block;
    }

    // (293:6) {#each dataset.grid as row, i }
    function create_each_block$1(ctx) {
    	let tr;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_1 = /*row*/ ctx[38];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*j*/ ctx[43];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			this.h();
    		},
    		l: function claim(nodes) {
    			tr = claim_element(nodes, "TR", {});
    			var tr_nodes = children(tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(tr_nodes);
    			}

    			t = claim_space(tr_nodes);
    			tr_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(tr, file$6, 293, 6, 10912);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_hydration_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*dataset, isDisabledDate, isBetween, onClick*/ 623104) {
    				each_value_1 = /*row*/ ctx[38];
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, tr, destroy_block, create_each_block_1$1, t, get_each_context_1$1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(293:6) {#each dataset.grid as row, i }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div1;
    	let button0;
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let button1;
    	let svg0;
    	let path0;
    	let t3;
    	let button2;
    	let svg1;
    	let path1;
    	let t4;
    	let div2;
    	let t5;
    	let t6;
    	let mounted;
    	let dispose;
    	let if_block0 = /*enableTimeToggle*/ ctx[1] && /*internalDate*/ ctx[2] && create_if_block_3$1(ctx);
    	let if_block1 = /*currentView*/ ctx[3] === MODE_DECADE && create_if_block_2$1(ctx);
    	let if_block2 = /*currentView*/ ctx[3] === MODE_YEAR && create_if_block_1$1(ctx);
    	let if_block3 = /*currentView*/ ctx[3] === MODE_MONTH && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button0 = element("button");
    			t0 = text(/*tableCaption*/ ctx[8]);
    			t1 = space();
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			button1 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t3 = space();
    			button2 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t4 = space();
    			div2 = element("div");
    			if (if_block1) if_block1.c();
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div1 = claim_element(nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			button0 = claim_element(div1_nodes, "BUTTON", { class: true });
    			var button0_nodes = children(button0);
    			t0 = claim_text(button0_nodes, /*tableCaption*/ ctx[8]);
    			button0_nodes.forEach(detach_dev);
    			t1 = claim_space(div1_nodes);
    			div0 = claim_element(div1_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			if (if_block0) if_block0.l(div0_nodes);
    			t2 = claim_space(div0_nodes);
    			button1 = claim_element(div0_nodes, "BUTTON", { class: true });
    			var button1_nodes = children(button1);

    			svg0 = claim_svg_element(button1_nodes, "svg", {
    				class: true,
    				xmlns: true,
    				viewBox: true,
    				width: true,
    				height: true
    			});

    			var svg0_nodes = children(svg0);
    			path0 = claim_svg_element(svg0_nodes, "path", { d: true });
    			children(path0).forEach(detach_dev);
    			svg0_nodes.forEach(detach_dev);
    			button1_nodes.forEach(detach_dev);
    			t3 = claim_space(div0_nodes);
    			button2 = claim_element(div0_nodes, "BUTTON", { class: true });
    			var button2_nodes = children(button2);

    			svg1 = claim_svg_element(button2_nodes, "svg", {
    				class: true,
    				xmlns: true,
    				viewBox: true,
    				width: true,
    				height: true
    			});

    			var svg1_nodes = children(svg1);
    			path1 = claim_svg_element(svg1_nodes, "path", { d: true });
    			children(path1).forEach(detach_dev);
    			svg1_nodes.forEach(detach_dev);
    			button2_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			div1_nodes.forEach(detach_dev);
    			t4 = claim_space(nodes);
    			div2 = claim_element(nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			if (if_block1) if_block1.l(div2_nodes);
    			t5 = claim_space(div2_nodes);
    			if (if_block2) if_block2.l(div2_nodes);
    			t6 = claim_space(div2_nodes);
    			if (if_block3) if_block3.l(div2_nodes);
    			div2_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button0, "class", "std-btn std-btn-header sdt-toggle-btn svelte-1xp8yha");
    			add_location(button0, file$6, 228, 2, 7435);
    			attr_dev(path0, "d", "M4.427 9.573l3.396-3.396a.25.25 0 01.354 0l3.396 3.396a.25.25 0 01-.177.427H4.604a.25.25 0 01-.177-.427z");
    			add_location(path0, file$6, 236, 105, 8318);
    			attr_dev(svg0, "class", "sdt-svg svelte-1xp8yha");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 16 16");
    			attr_dev(svg0, "width", "24");
    			attr_dev(svg0, "height", "24");
    			add_location(svg0, file$6, 236, 6, 8219);
    			attr_dev(button1, "class", "std-btn std-btn-header icon-btn svelte-1xp8yha");
    			add_location(button1, file$6, 235, 4, 8104);
    			attr_dev(path1, "d", "M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z");
    			add_location(path1, file$6, 239, 105, 8680);
    			attr_dev(svg1, "class", "sdt-svg svelte-1xp8yha");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 16 16");
    			attr_dev(svg1, "width", "24");
    			attr_dev(svg1, "height", "24");
    			add_location(svg1, file$6, 239, 6, 8581);
    			attr_dev(button2, "class", "std-btn std-btn-header icon-btn svelte-1xp8yha");
    			add_location(button2, file$6, 238, 4, 8467);
    			attr_dev(div0, "class", "sdt-nav-btns svelte-1xp8yha");
    			add_location(div0, file$6, 229, 2, 7555);
    			attr_dev(div1, "class", "sdt-thead-nav svelte-1xp8yha");
    			add_location(div1, file$6, 227, 0, 7404);
    			attr_dev(div2, "class", "sdt-calendar svelte-1xp8yha");
    			toggle_class(div2, "is-grid", /*viewChanged*/ ctx[5]);
    			add_location(div2, file$6, 243, 0, 8841);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div1, anchor);
    			append_hydration_dev(div1, button0);
    			append_hydration_dev(button0, t0);
    			append_hydration_dev(div1, t1);
    			append_hydration_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_hydration_dev(div0, t2);
    			append_hydration_dev(div0, button1);
    			append_hydration_dev(button1, svg0);
    			append_hydration_dev(svg0, path0);
    			append_hydration_dev(div0, t3);
    			append_hydration_dev(div0, button2);
    			append_hydration_dev(button2, svg1);
    			append_hydration_dev(svg1, path1);
    			insert_hydration_dev(target, t4, anchor);
    			insert_hydration_dev(target, div2, anchor);
    			if (if_block1) if_block1.m(div2, null);
    			append_hydration_dev(div2, t5);
    			if (if_block2) if_block2.m(div2, null);
    			append_hydration_dev(div2, t6);
    			if (if_block3) if_block3.m(div2, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", prevent_default(/*onSwitchView*/ ctx[18]), false, true, false),
    					listen_dev(button1, "click", prevent_default(/*click_handler*/ ctx[28]), false, true, false),
    					listen_dev(button2, "click", prevent_default(/*click_handler_1*/ ctx[29]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*tableCaption*/ 256) set_data_dev(t0, /*tableCaption*/ ctx[8]);

    			if (/*enableTimeToggle*/ ctx[1] && /*internalDate*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(div0, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*currentView*/ ctx[3] === MODE_DECADE) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*currentView*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, t5);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*currentView*/ ctx[3] === MODE_YEAR) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*currentView*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div2, t6);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*currentView*/ ctx[3] === MODE_MONTH) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*currentView*/ 8) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$3(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div2, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*viewChanged*/ 32) {
    				toggle_class(div2, "is-grid", /*viewChanged*/ ctx[5]);
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div2);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			run_all(dispose);
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

    const TRANSFORM_CONST = 222;

    function instance$8($$self, $$props, $$invalidate) {
    	let start;
    	let end;
    	let swapTransition;
    	let dataset;
    	let dayLabels;
    	let tableCaption;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Calendar', slots, []);
    	let { date = null } = $$props;
    	let { startDate = null } = $$props;
    	let { endDate = null } = $$props;
    	let { weekStart = 1 } = $$props;
    	let { i18n } = $$props;
    	let { enableTimeToggle = false } = $$props;

    	function handleGridNav(key, shiftKey) {
    		if (!internalDate) {
    			onClick(new Date());
    			return;
    		}

    		let pos;

    		switch (key) {
    			case 'PageDown':
    				shiftKey = true;
    			case 'ArrowDown':
    				if (shiftKey) return handleShiftNav(activeDate.getUTCFullYear(), activeDate.getMonth() + 1, 1);
    				pos = moveGrid(dataset.selectionMark + 7, currentView);
    				if (pos.y > 5) {
    					const tmpDate = new Date(activeDate.getUTCFullYear(), activeDate.getMonth() + 1, activeDate.getDate());
    					let tmpData = compute(tmpDate, internalDate, currentView, i18n, weekStart);

    					if (tmpData.grid[0][pos.x].getUTCMonth() < internalDate.getUTCMonth()) {
    						tmpDate.setMonth(tmpDate.getMonth() + 1);
    						tmpData = compute(tmpDate, internalDate, currentView, i18n, weekStart);
    					}

    					pos.y = tmpData.grid[0][pos.x].getUTCDate() === internalDate.getUTCDate()
    					? 1
    					: 0;

    					onChangeMonth(1);
    					onClick(tmpData.grid[pos.y][pos.x]);
    					return;
    				}
    				if (dataset.grid[pos.y][pos.x].getUTCMonth() !== activeDate.getUTCMonth()) {
    					onChangeMonth(1);
    				}
    				onClick(dataset.grid[pos.y][pos.x]);
    				break;
    			case 'PageUp':
    				shiftKey = true;
    			case 'ArrowUp':
    				if (shiftKey) return handleShiftNav(activeDate.getUTCFullYear(), activeDate.getMonth() - 1, -1);
    				pos = moveGrid(dataset.selectionMark - 7, currentView);
    				if (pos.y === 5) {
    					const tmpDate = new Date(activeDate.getUTCFullYear(), activeDate.getMonth() > 0 ? activeDate.getMonth() : 11, 1);
    					const tmpData = compute(tmpDate, internalDate, currentView, i18n, weekStart);

    					pos.y = tmpData.grid[5][pos.x].getUTCDate() === internalDate.getUTCDate()
    					? 4
    					: tmpData.grid[5][pos.x].getUTCMonth() === internalDate.getUTCMonth()
    						? 3
    						: 5;

    					onChangeMonth(-1);
    					onClick(tmpData.grid[pos.y][pos.x]);
    					return;
    				}
    				if (dataset.grid[pos.y][pos.x].getUTCMonth() !== activeDate.getUTCMonth()) {
    					onChangeMonth(-1);
    				}
    				onClick(dataset.grid[pos.y][pos.x]);
    				break;
    			case 'ArrowLeft':
    				if (shiftKey) return handleShiftNav(activeDate.getUTCFullYear() - 1, activeDate.getMonth(), 1);
    				pos = moveGrid(dataset.selectionMark - 1, currentView);
    				if (dataset.grid[pos.y][pos.x].getUTCMonth() !== activeDate.getUTCMonth()) {
    					onChangeMonth(-1);
    				}
    				onClick(dataset.grid[pos.y][pos.x]);
    				break;
    			case 'ArrowRight':
    				if (shiftKey) return handleShiftNav(activeDate.getUTCFullYear() + 1, activeDate.getMonth(), 1);
    				pos = moveGrid(dataset.selectionMark + 1, currentView);
    				if (dataset.grid[pos.y][pos.x].getUTCMonth() !== activeDate.getUTCMonth()) {
    					onChangeMonth(1);
    				}
    				onClick(dataset.grid[pos.y][pos.x]);
    				break;
    		}
    	}

    	function handleShiftNav(year, month, monthChange) {
    		const tzOffset = activeDate.getTimezoneOffset() >= 0 ? 0 : 1;
    		const tmpDate = new Date(year, month, activeDate.getUTCDate() + tzOffset);
    		const tmpData = compute(tmpDate, tmpDate, currentView, i18n, weekStart);
    		onChangeMonth(monthChange);
    		onClick(tmpData.grid[Math.floor(tmpData.selectionMark / 7)][tmpData.selectionMark % 7]);
    	}

    	let internalDate = date;
    	let activeDate = date ? new Date(date.valueOf()) : new Date();
    	const dispatch = createEventDispatcher();
    	let currentView = MODE_MONTH;
    	let viewDelta = -2;
    	let viewChanged = false;
    	let duration = 400;
    	let transform = TRANSFORM_CONST; // month +/- constant
    	let onMonthTransitionTrigger = null;

    	function isBetween(num) {
    		return dataset.prevTo <= num && num < dataset.nextFrom;
    	}

    	function isDisabledDate(date) {
    		if (startDate && startDate > date) return true;
    		if (endDate && endDate <= date) return true;
    		return false;
    	}

    	function onChangeMonth(val) {
    		const multiplier = currentView === MODE_DECADE
    		? 120
    		: currentView === MODE_YEAR ? 12 : 1;

    		activeDate.setUTCMonth(activeDate.getUTCMonth() + val * multiplier);
    		(($$invalidate(27, activeDate), $$invalidate(22, date)), $$invalidate(2, internalDate));
    		$$invalidate(7, onMonthTransitionTrigger = null);
    		$$invalidate(6, transform = 222);
    	}

    	function onTransformChangeMonth(val) {
    		if (currentView !== MODE_YEAR) {
    			return onChangeMonth(val);
    		}

    		$$invalidate(7, onMonthTransitionTrigger = () => {
    			onChangeMonth(val);
    		});

    		$$invalidate(6, transform = val === -1
    		? transform - TRANSFORM_CONST
    		: transform + TRANSFORM_CONST);
    	}

    	function onSwitchView() {
    		$$invalidate(4, viewDelta = -1);
    		$$invalidate(5, viewChanged = true);
    		currentView && $$invalidate(3, currentView--, currentView);
    	}

    	function onClick(value) {
    		$$invalidate(4, viewDelta = 1);
    		$$invalidate(5, viewChanged = true);

    		switch (currentView) {
    			case 0:
    				activeDate.setYear(value);
    				(($$invalidate(27, activeDate), $$invalidate(22, date)), $$invalidate(2, internalDate));
    				break;
    			case 1:
    				activeDate.setUTCMonth(i18n.monthsShort.indexOf(value));
    				(($$invalidate(27, activeDate), $$invalidate(22, date)), $$invalidate(2, internalDate));
    				break;
    			case 2:
    				const newInternalDate = UTCDate(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
    				if (internalDate) {
    					newInternalDate.setMinutes(internalDate.getMinutes());
    					newInternalDate.setUTCHours(internalDate.getUTCHours());
    				}
    				$$invalidate(2, internalDate = newInternalDate);
    				dispatch('date', internalDate);
    				break;
    		}

    		currentView < MODE_MONTH && $$invalidate(3, currentView++, currentView);
    	}

    	function onTransitionOut() {
    		$$invalidate(5, viewChanged = false);
    	}

    	function onTimeSwitch() {
    		dispatch('switch', 'time');
    	}

    	function showCaption() {
    		switch (currentView) {
    			case 0:
    				return `${dataset.grid[0][1]} - ${dataset.grid[2][2]}`;
    			case 1:
    				return activeDate.getUTCFullYear();
    			case 2:
    				return i18n.months[activeDate.getUTCMonth()] + ' ' + activeDate.getUTCFullYear();
    		}
    	}

    	const writable_props = ['date', 'startDate', 'endDate', 'weekStart', 'i18n', 'enableTimeToggle'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Calendar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => onTransformChangeMonth(-1);
    	const click_handler_1 = () => onTransformChangeMonth(1);

    	const click_handler_2 = year => {
    		onClick(year);
    	};

    	const click_handler_3 = month => {
    		onClick(month);
    	};

    	const transitionend_handler = () => onMonthTransitionTrigger && onMonthTransitionTrigger();

    	const click_handler_4 = currDate => {
    		onClick(currDate);
    	};

    	$$self.$$set = $$props => {
    		if ('date' in $$props) $$invalidate(22, date = $$props.date);
    		if ('startDate' in $$props) $$invalidate(23, startDate = $$props.startDate);
    		if ('endDate' in $$props) $$invalidate(24, endDate = $$props.endDate);
    		if ('weekStart' in $$props) $$invalidate(25, weekStart = $$props.weekStart);
    		if ('i18n' in $$props) $$invalidate(0, i18n = $$props.i18n);
    		if ('enableTimeToggle' in $$props) $$invalidate(1, enableTimeToggle = $$props.enableTimeToggle);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fade,
    		compute,
    		MODE_MONTH,
    		MODE_YEAR,
    		MODE_DECADE,
    		moveGrid,
    		UTCDate,
    		scale,
    		date,
    		startDate,
    		endDate,
    		weekStart,
    		i18n,
    		enableTimeToggle,
    		handleGridNav,
    		handleShiftNav,
    		internalDate,
    		activeDate,
    		dispatch,
    		currentView,
    		viewDelta,
    		viewChanged,
    		duration,
    		TRANSFORM_CONST,
    		transform,
    		onMonthTransitionTrigger,
    		isBetween,
    		isDisabledDate,
    		onChangeMonth,
    		onTransformChangeMonth,
    		onSwitchView,
    		onClick,
    		onTransitionOut,
    		onTimeSwitch,
    		showCaption,
    		tableCaption,
    		dataset,
    		dayLabels,
    		swapTransition,
    		end,
    		start
    	});

    	$$self.$inject_state = $$props => {
    		if ('date' in $$props) $$invalidate(22, date = $$props.date);
    		if ('startDate' in $$props) $$invalidate(23, startDate = $$props.startDate);
    		if ('endDate' in $$props) $$invalidate(24, endDate = $$props.endDate);
    		if ('weekStart' in $$props) $$invalidate(25, weekStart = $$props.weekStart);
    		if ('i18n' in $$props) $$invalidate(0, i18n = $$props.i18n);
    		if ('enableTimeToggle' in $$props) $$invalidate(1, enableTimeToggle = $$props.enableTimeToggle);
    		if ('internalDate' in $$props) $$invalidate(2, internalDate = $$props.internalDate);
    		if ('activeDate' in $$props) $$invalidate(27, activeDate = $$props.activeDate);
    		if ('currentView' in $$props) $$invalidate(3, currentView = $$props.currentView);
    		if ('viewDelta' in $$props) $$invalidate(4, viewDelta = $$props.viewDelta);
    		if ('viewChanged' in $$props) $$invalidate(5, viewChanged = $$props.viewChanged);
    		if ('duration' in $$props) $$invalidate(14, duration = $$props.duration);
    		if ('transform' in $$props) $$invalidate(6, transform = $$props.transform);
    		if ('onMonthTransitionTrigger' in $$props) $$invalidate(7, onMonthTransitionTrigger = $$props.onMonthTransitionTrigger);
    		if ('tableCaption' in $$props) $$invalidate(8, tableCaption = $$props.tableCaption);
    		if ('dataset' in $$props) $$invalidate(9, dataset = $$props.dataset);
    		if ('dayLabels' in $$props) $$invalidate(10, dayLabels = $$props.dayLabels);
    		if ('swapTransition' in $$props) $$invalidate(11, swapTransition = $$props.swapTransition);
    		if ('end' in $$props) $$invalidate(12, end = $$props.end);
    		if ('start' in $$props) $$invalidate(13, start = $$props.start);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*startDate*/ 8388608) {
    			 {
    				if (startDate) {
    					startDate.setUTCDate(startDate.getUTCDate() - 1);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*date, internalDate*/ 4194308) {
    			 {
    				if (date !== internalDate) {
    					$$invalidate(2, internalDate = date);

    					if (date) {
    						$$invalidate(27, activeDate = new Date(date.valueOf()));
    					}
    					$$invalidate(4, viewDelta = 1);
    					$$invalidate(5, viewChanged = true);
    					$$invalidate(3, currentView = MODE_MONTH);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*viewDelta*/ 16) {
    			 $$invalidate(13, start = viewDelta < 1 ? 1.5 : 0.5);
    		}

    		if ($$self.$$.dirty[0] & /*viewDelta*/ 16) {
    			 $$invalidate(12, end = viewDelta < 1 ? 1 : 1.5);
    		}

    		if ($$self.$$.dirty[0] & /*viewDelta*/ 16) {
    			 $$invalidate(11, swapTransition = viewDelta === -2
    			? fade
    			: viewDelta !== null
    				? scale
    				: () => {
    						
    					});
    		}

    		if ($$self.$$.dirty[0] & /*activeDate, internalDate, currentView, i18n, weekStart*/ 167772173) {
    			 $$invalidate(9, dataset = compute(activeDate, internalDate, currentView, i18n, weekStart));
    		}

    		if ($$self.$$.dirty[0] & /*weekStart, i18n*/ 33554433) {
    			 $$invalidate(10, dayLabels = weekStart > -1
    			? i18n.daysMin.concat(i18n.daysMin).slice(weekStart, 7 + weekStart)
    			: i18n.daysMin.slice(weekStart, 7 + weekStart));
    		}

    		if ($$self.$$.dirty[0] & /*currentView, activeDate*/ 134217736) {
    			 $$invalidate(8, tableCaption = showCaption());
    		}
    	};

    	return [
    		i18n,
    		enableTimeToggle,
    		internalDate,
    		currentView,
    		viewDelta,
    		viewChanged,
    		transform,
    		onMonthTransitionTrigger,
    		tableCaption,
    		dataset,
    		dayLabels,
    		swapTransition,
    		end,
    		start,
    		duration,
    		isBetween,
    		isDisabledDate,
    		onTransformChangeMonth,
    		onSwitchView,
    		onClick,
    		onTransitionOut,
    		onTimeSwitch,
    		date,
    		startDate,
    		endDate,
    		weekStart,
    		handleGridNav,
    		activeDate,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		transitionend_handler,
    		click_handler_4
    	];
    }

    class Calendar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$8,
    			create_fragment$8,
    			safe_not_equal,
    			{
    				date: 22,
    				startDate: 23,
    				endDate: 24,
    				weekStart: 25,
    				i18n: 0,
    				enableTimeToggle: 1,
    				handleGridNav: 26
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Calendar",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*i18n*/ ctx[0] === undefined && !('i18n' in props)) {
    			console.warn("<Calendar> was created without expected prop 'i18n'");
    		}
    	}

    	get date() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startDate() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startDate(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endDate() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endDate(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get weekStart() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weekStart(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i18n() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i18n(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get enableTimeToggle() {
    		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enableTimeToggle(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleGridNav() {
    		return this.$$.ctx[26];
    	}

    	set handleGridNav(value) {
    		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelty-picker/src/Time.svelte generated by Svelte v3.48.0 */
    const file$7 = "node_modules/svelty-picker/src/Time.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	child_ctx[33] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	child_ctx[33] = i;
    	return child_ctx;
    }

    // (204:4) {#if hasDateComponent}
    function create_if_block_2$2(ctx) {
    	let button;
    	let svg;
    	let path;
    	let button_title_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { class: true, title: true });
    			var button_nodes = children(button);

    			svg = claim_svg_element(button_nodes, "svg", {
    				class: true,
    				xmlns: true,
    				viewBox: true,
    				width: true,
    				height: true
    			});

    			var svg_nodes = children(svg);
    			path = claim_svg_element(svg_nodes, "path", { "fill-rule": true, d: true });
    			children(path).forEach(detach_dev);
    			svg_nodes.forEach(detach_dev);
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M6.75 0a.75.75 0 01.75.75V3h9V.75a.75.75 0 011.5 0V3h2.75c.966 0 1.75.784 1.75 1.75v16a1.75 1.75 0 01-1.75 1.75H3.25a1.75 1.75 0 01-1.75-1.75v-16C1.5 3.784 2.284 3 3.25 3H6V.75A.75.75 0 016.75 0zm-3.5 4.5a.25.25 0 00-.25.25V8h18V4.75a.25.25 0 00-.25-.25H3.25zM21 9.5H3v11.25c0 .138.112.25.25.25h17.5a.25.25 0 00.25-.25V9.5z");
    			add_location(path, file$7, 205, 105, 6223);
    			attr_dev(svg, "class", "sdt-svg svelte-yz95cb");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "20");
    			attr_dev(svg, "height", "20");
    			add_location(svg, file$7, 205, 6, 6124);
    			attr_dev(button, "class", "sdt-time-btn sdt-back-btn svelte-yz95cb");
    			attr_dev(button, "title", button_title_value = /*i18n*/ ctx[2].backToDate);
    			add_location(button, file$7, 204, 4, 6026);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, svg);
    			append_hydration_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*onModeSwitch*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*i18n*/ 4 && button_title_value !== (button_title_value = /*i18n*/ ctx[2].backToDate)) {
    				attr_dev(button, "title", button_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(204:4) {#if hasDateComponent}",
    		ctx
    	});

    	return block;
    }

    // (218:4) {#if showMeridian}
    function create_if_block_1$2(ctx) {
    	let div;
    	let button0;
    	let t0;
    	let button0_data_value_value;
    	let t1;
    	let button1;
    	let t2;
    	let button1_data_value_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text("AM");
    			t1 = space();
    			button1 = element("button");
    			t2 = text("PM");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			button0 = claim_element(div_nodes, "BUTTON", { class: true, "data-value": true });
    			var button0_nodes = children(button0);
    			t0 = claim_text(button0_nodes, "AM");
    			button0_nodes.forEach(detach_dev);
    			t1 = claim_space(div_nodes);
    			button1 = claim_element(div_nodes, "BUTTON", { class: true, "data-value": true });
    			var button1_nodes = children(button1);
    			t2 = claim_text(button1_nodes, "PM");
    			button1_nodes.forEach(detach_dev);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button0, "class", "sdt-time-btn svelte-yz95cb");
    			attr_dev(button0, "data-value", button0_data_value_value = /*selectedHour*/ ctx[4] % 12);
    			toggle_class(button0, "is-active", /*selectedHour*/ ctx[4] < 12);
    			add_location(button0, file$7, 219, 6, 7063);
    			attr_dev(button1, "class", "sdt-time-btn svelte-yz95cb");
    			attr_dev(button1, "data-value", button1_data_value_value = /*selectedHour*/ ctx[4] % 12 + 12);
    			toggle_class(button1, "is-active", /*selectedHour*/ ctx[4] >= 12);
    			add_location(button1, file$7, 220, 6, 7206);
    			attr_dev(div, "class", "sdt-meridian svelte-yz95cb");
    			add_location(div, file$7, 218, 4, 7029);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			append_hydration_dev(div, button0);
    			append_hydration_dev(button0, t0);
    			append_hydration_dev(div, t1);
    			append_hydration_dev(div, button1);
    			append_hydration_dev(button1, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*onSwitchMeridian*/ ctx[14], false, false, false),
    					listen_dev(button1, "click", /*onSwitchMeridian*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedHour*/ 16 && button0_data_value_value !== (button0_data_value_value = /*selectedHour*/ ctx[4] % 12)) {
    				attr_dev(button0, "data-value", button0_data_value_value);
    			}

    			if (dirty[0] & /*selectedHour*/ 16) {
    				toggle_class(button0, "is-active", /*selectedHour*/ ctx[4] < 12);
    			}

    			if (dirty[0] & /*selectedHour*/ 16 && button1_data_value_value !== (button1_data_value_value = /*selectedHour*/ ctx[4] % 12 + 12)) {
    				attr_dev(button1, "data-value", button1_data_value_value);
    			}

    			if (dirty[0] & /*selectedHour*/ 16) {
    				toggle_class(button1, "is-active", /*selectedHour*/ ctx[4] >= 12);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(218:4) {#if showMeridian}",
    		ctx
    	});

    	return block;
    }

    // (232:4) {#each pos as p, i(p.val)}
    function create_each_block_1$2(key_1, ctx) {
    	let button;
    	let t_value = /*p*/ ctx[31].val + "";
    	let t;
    	let button_style_value;
    	let button_data_value_value;
    	let button_transition;
    	let current;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", {
    				style: true,
    				class: true,
    				"data-value": true
    			});

    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "style", button_style_value = `left:${/*p*/ ctx[31].x}px; top:${/*p*/ ctx[31].y}px`);
    			attr_dev(button, "class", "sdt-tick svelte-yz95cb");
    			attr_dev(button, "data-value", button_data_value_value = /*p*/ ctx[31].val);

    			toggle_class(button, "is-selected", /*isSelected*/ ctx[12](
    				/*isMinuteView*/ ctx[3]
    				? /*selectedMinutes*/ ctx[5]
    				: /*selectedHour*/ ctx[4],
    				/*p*/ ctx[31].val,
    				/*i*/ ctx[33]
    			));

    			add_location(button, file$7, 232, 6, 7785);
    			this.first = button;
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*pos*/ 512) && t_value !== (t_value = /*p*/ ctx[31].val + "")) set_data_dev(t, t_value);

    			if (!current || dirty[0] & /*pos*/ 512 && button_style_value !== (button_style_value = `left:${/*p*/ ctx[31].x}px; top:${/*p*/ ctx[31].y}px`)) {
    				attr_dev(button, "style", button_style_value);
    			}

    			if (!current || dirty[0] & /*pos*/ 512 && button_data_value_value !== (button_data_value_value = /*p*/ ctx[31].val)) {
    				attr_dev(button, "data-value", button_data_value_value);
    			}

    			if (dirty[0] & /*isSelected, isMinuteView, selectedMinutes, selectedHour, pos*/ 4664) {
    				toggle_class(button, "is-selected", /*isSelected*/ ctx[12](
    					/*isMinuteView*/ ctx[3]
    					? /*selectedMinutes*/ ctx[5]
    					: /*selectedHour*/ ctx[4],
    					/*p*/ ctx[31].val,
    					/*i*/ ctx[33]
    				));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (local) {
    				add_render_callback(() => {
    					if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, true);
    					button_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			if (local) {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, false);
    				button_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_transition) button_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(232:4) {#each pos as p, i(p.val)}",
    		ctx
    	});

    	return block;
    }

    // (238:4) {#if !showMeridian && !isMinuteView}
    function create_if_block$4(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*innerHours*/ ctx[8];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(nodes);
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_hydration_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*innerHours, isSelected, selectedHour*/ 4368) {
    				each_value = /*innerHours*/ ctx[8];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(238:4) {#if !showMeridian && !isMinuteView}",
    		ctx
    	});

    	return block;
    }

    // (239:6) {#each innerHours as p, i}
    function create_each_block$2(ctx) {
    	let button;
    	let t_value = /*p*/ ctx[31].val + "";
    	let t;
    	let button_style_value;
    	let button_data_value_value;
    	let button_transition;
    	let current;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", {
    				style: true,
    				class: true,
    				"data-value": true
    			});

    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "style", button_style_value = `left:${/*p*/ ctx[31].x}px; top:${/*p*/ ctx[31].y}px`);
    			attr_dev(button, "class", "sdt-tick svelte-yz95cb");
    			attr_dev(button, "data-value", button_data_value_value = /*p*/ ctx[31].val);
    			toggle_class(button, "is-selected", /*isSelected*/ ctx[12](/*selectedHour*/ ctx[4], /*p*/ ctx[31].val, /*i*/ ctx[33]));
    			add_location(button, file$7, 239, 6, 8134);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*innerHours*/ 256) && t_value !== (t_value = /*p*/ ctx[31].val + "")) set_data_dev(t, t_value);

    			if (!current || dirty[0] & /*innerHours*/ 256 && button_style_value !== (button_style_value = `left:${/*p*/ ctx[31].x}px; top:${/*p*/ ctx[31].y}px`)) {
    				attr_dev(button, "style", button_style_value);
    			}

    			if (!current || dirty[0] & /*innerHours*/ 256 && button_data_value_value !== (button_data_value_value = /*p*/ ctx[31].val)) {
    				attr_dev(button, "data-value", button_data_value_value);
    			}

    			if (dirty[0] & /*isSelected, selectedHour, innerHours*/ 4368) {
    				toggle_class(button, "is-selected", /*isSelected*/ ctx[12](/*selectedHour*/ ctx[4], /*p*/ ctx[31].val, /*i*/ ctx[33]));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (local) {
    				add_render_callback(() => {
    					if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, true);
    					button_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			if (local) {
    				if (!button_transition) button_transition = create_bidirectional_transition(button, fade, { duration: 200 }, false);
    				button_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_transition) button_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(239:6) {#each innerHours as p, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div5;
    	let div0;
    	let t0;
    	let button0;
    	let t1_value = /*view*/ ctx[11](/*selectedHour*/ ctx[4], /*showMeridian*/ ctx[0]) + "";
    	let t1;
    	let t2;
    	let span;
    	let t3;
    	let t4;
    	let button1;
    	let t5_value = /*view*/ ctx[11](/*selectedMinutes*/ ctx[5], false) + "";
    	let t5;
    	let t6;
    	let t7;
    	let div4;
    	let div1;
    	let t8;
    	let div3;
    	let div2;
    	let t9;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t10;
    	let div5_intro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*hasDateComponent*/ ctx[1] && create_if_block_2$2(ctx);
    	let if_block1 = /*showMeridian*/ ctx[0] && create_if_block_1$2(ctx);
    	let each_value_1 = /*pos*/ ctx[9];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*p*/ ctx[31].val;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$2(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$2(key, child_ctx));
    	}

    	let if_block2 = !/*showMeridian*/ ctx[0] && !/*isMinuteView*/ ctx[3] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			button0 = element("button");
    			t1 = text(t1_value);
    			t2 = space();
    			span = element("span");
    			t3 = text(":");
    			t4 = space();
    			button1 = element("button");
    			t5 = text(t5_value);
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			div4 = element("div");
    			div1 = element("div");
    			t8 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			if (if_block2) if_block2.c();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div5 = claim_element(nodes, "DIV", { class: true });
    			var div5_nodes = children(div5);
    			div0 = claim_element(div5_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			if (if_block0) if_block0.l(div0_nodes);
    			t0 = claim_space(div0_nodes);
    			button0 = claim_element(div0_nodes, "BUTTON", { class: true });
    			var button0_nodes = children(button0);
    			t1 = claim_text(button0_nodes, t1_value);
    			button0_nodes.forEach(detach_dev);
    			t2 = claim_space(div0_nodes);
    			span = claim_element(div0_nodes, "SPAN", {});
    			var span_nodes = children(span);
    			t3 = claim_text(span_nodes, ":");
    			span_nodes.forEach(detach_dev);
    			t4 = claim_space(div0_nodes);
    			button1 = claim_element(div0_nodes, "BUTTON", { class: true });
    			var button1_nodes = children(button1);
    			t5 = claim_text(button1_nodes, t5_value);
    			button1_nodes.forEach(detach_dev);
    			t6 = claim_space(div0_nodes);
    			if (if_block1) if_block1.l(div0_nodes);
    			div0_nodes.forEach(detach_dev);
    			t7 = claim_space(div5_nodes);
    			div4 = claim_element(div5_nodes, "DIV", { class: true });
    			var div4_nodes = children(div4);
    			div1 = claim_element(div4_nodes, "DIV", { class: true });
    			children(div1).forEach(detach_dev);
    			t8 = claim_space(div4_nodes);
    			div3 = claim_element(div4_nodes, "DIV", { class: true, style: true });
    			var div3_nodes = children(div3);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			children(div2).forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			t9 = claim_space(div4_nodes);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(div4_nodes);
    			}

    			t10 = claim_space(div4_nodes);
    			if (if_block2) if_block2.l(div4_nodes);
    			div4_nodes.forEach(detach_dev);
    			div5_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button0, "class", "sdt-time-btn sdt-time-figure svelte-yz95cb");
    			toggle_class(button0, "is-active", !/*isMinuteView*/ ctx[3]);
    			add_location(button0, file$7, 208, 4, 6622);
    			add_location(span, file$7, 212, 4, 6806);
    			attr_dev(button1, "class", "sdt-time-btn sdt-time-figure svelte-yz95cb");
    			toggle_class(button1, "is-active", /*isMinuteView*/ ctx[3]);
    			add_location(button1, file$7, 213, 4, 6826);
    			attr_dev(div0, "class", "sdt-time-head svelte-yz95cb");
    			add_location(div0, file$7, 202, 2, 5965);
    			attr_dev(div1, "class", "sdt-middle-dot svelte-yz95cb");
    			add_location(div1, file$7, 227, 4, 7604);
    			attr_dev(div2, "class", "sdt-hand-circle svelte-yz95cb");
    			add_location(div2, file$7, 229, 6, 7698);
    			attr_dev(div3, "class", "sdt-hand-pointer svelte-yz95cb");
    			attr_dev(div3, "style", /*handCss*/ ctx[10]);
    			add_location(div3, file$7, 228, 4, 7644);
    			attr_dev(div4, "class", "sdt-clock svelte-yz95cb");
    			toggle_class(div4, "is-minute-view", /*isMinuteView*/ ctx[3]);
    			add_location(div4, file$7, 224, 2, 7384);
    			attr_dev(div5, "class", "sdt-timer svelte-yz95cb");
    			add_location(div5, file$7, 201, 0, 5912);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div5, anchor);
    			append_hydration_dev(div5, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_hydration_dev(div0, t0);
    			append_hydration_dev(div0, button0);
    			append_hydration_dev(button0, t1);
    			append_hydration_dev(div0, t2);
    			append_hydration_dev(div0, span);
    			append_hydration_dev(span, t3);
    			append_hydration_dev(div0, t4);
    			append_hydration_dev(div0, button1);
    			append_hydration_dev(button1, t5);
    			append_hydration_dev(div0, t6);
    			if (if_block1) if_block1.m(div0, null);
    			append_hydration_dev(div5, t7);
    			append_hydration_dev(div5, div4);
    			append_hydration_dev(div4, div1);
    			append_hydration_dev(div4, t8);
    			append_hydration_dev(div4, div3);
    			append_hydration_dev(div3, div2);
    			append_hydration_dev(div4, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			append_hydration_dev(div4, t10);
    			if (if_block2) if_block2.m(div4, null);
    			/*div4_binding*/ ctx[24](div4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[21], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[22], false, false, false),
    					listen_dev(div4, "click", /*onClick*/ ctx[13], false, false, false),
    					listen_dev(div4, "mousedown", /*onToggleMove*/ ctx[15], false, false, false),
    					listen_dev(div4, "mousemove", /*mousemove_handler*/ ctx[23], false, false, false),
    					listen_dev(div4, "mouseup", /*onToggleMove*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*hasDateComponent*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((!current || dirty[0] & /*selectedHour, showMeridian*/ 17) && t1_value !== (t1_value = /*view*/ ctx[11](/*selectedHour*/ ctx[4], /*showMeridian*/ ctx[0]) + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*isMinuteView*/ 8) {
    				toggle_class(button0, "is-active", !/*isMinuteView*/ ctx[3]);
    			}

    			if ((!current || dirty[0] & /*selectedMinutes*/ 32) && t5_value !== (t5_value = /*view*/ ctx[11](/*selectedMinutes*/ ctx[5], false) + "")) set_data_dev(t5, t5_value);

    			if (dirty[0] & /*isMinuteView*/ 8) {
    				toggle_class(button1, "is-active", /*isMinuteView*/ ctx[3]);
    			}

    			if (/*showMeridian*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (!current || dirty[0] & /*handCss*/ 1024) {
    				attr_dev(div3, "style", /*handCss*/ ctx[10]);
    			}

    			if (dirty[0] & /*pos, isSelected, isMinuteView, selectedMinutes, selectedHour*/ 4664) {
    				each_value_1 = /*pos*/ ctx[9];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div4, outro_and_destroy_block, create_each_block_1$2, t10, get_each_context_1$2);
    				check_outros();
    			}

    			if (!/*showMeridian*/ ctx[0] && !/*isMinuteView*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*showMeridian, isMinuteView*/ 9) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div4, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*isMinuteView*/ 8) {
    				toggle_class(div4, "is-minute-view", /*isMinuteView*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block2);

    			if (!div5_intro) {
    				add_render_callback(() => {
    					div5_intro = create_in_transition(div5, fade, { duration: 200 });
    					div5_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (if_block2) if_block2.d();
    			/*div4_binding*/ ctx[24](null);
    			mounted = false;
    			run_all(dispose);
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
    	let selectedHour;
    	let isPM;
    	let selectedMinutes;
    	let handCss;
    	let multiplier;
    	let pos;
    	let innerHours;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Time', slots, []);
    	let { date = null } = $$props;
    	let { showMeridian = false } = $$props;
    	let { hasDateComponent = false } = $$props;
    	let { i18n } = $$props;

    	function minuteSwitch(val) {
    		if (val === undefined) return isMinuteView;
    		$$invalidate(3, isMinuteView = val);
    	}

    	function makeTick(val) {
    		if (isMinuteView) {
    			val = val * 5 + selectedMinutes;

    			if (val % 5 !== 0) {
    				val = val < selectedMinutes
    				? val + (5 - val % 5)
    				: val - val % 5;
    			}
    		} else {
    			val = selectedHour + val;
    		}

    		onClick({
    			meridianSwitch: !isMinuteView,
    			target: {
    				tagName: 'BUTTON',
    				dataset: { value: val }
    			}
    		});
    	}

    	let clockEl;
    	let isMinuteView = false;
    	let handleMoveMove = false;
    	let enableViewToggle = false;
    	let innerDate = date || UTCDate(0, 0, 0, 0, 0, 0);

    	if (!date) {
    		date = innerDate;
    	}

    	let canSelect = true;
    	const dispatch = createEventDispatcher();

    	function positions(size, offset, valueForZero, minuteView, hourAdded) {
    		const r = size / 2;
    		offset = offset || r;
    		const coeff = [0, 1 - 0.5, 1 - 0.134, 1, 1 - 0.134, 1 - 0.5];
    		const xCoeff = coeff.concat(coeff);
    		const yCoeff = coeff.slice(3).concat(coeff).concat(coeff.slice(0, 3));
    		const pos = [];

    		for (let i = 0; i < 12; i++) {
    			pos.push({
    				x: Math.abs(xCoeff[i] * r + (i <= 6 ? 1 : -1) * offset),
    				y: Math.abs(yCoeff[i] * r + (i >= 9 || i < 3 ? -1 : 1) * offset),
    				val: minuteView
    				? i * 5 || valueForZero
    				: i ? i + hourAdded : valueForZero
    			});
    		}

    		return pos;
    	}

    	function view(value, asMeridian) {
    		if (asMeridian) {
    			if (isPM && value === 12) return 12;

    			return value < 10 || value % 12 < 10
    			? `0${value % 12}`
    			: value % 12;
    		}

    		return value < 10 ? `0${value}` : value;
    	}

    	function isSelected(selected, val, i) {
    		if (isMinuteView) {
    			return val === selected || i === 0 && i === selected;
    		} else {
    			if (showMeridian) {
    				if (isPM && val == 12 && selected === 12) return true;
    				if (!isPM && val == 12 && selected === 0) return true;
    				return val === (selected ? selected % 12 : 12);
    			} else if (val > 12) {
    				return (i ? multiplier * i + 12 : 0) === selected;
    			} else {
    				return val === '00' || val === '12'
    				? selected === 12 && val == 12 || val === '00' && selected === 0
    				: val === selected;
    			}
    		}
    	}

    	function onClick(e) {
    		if (!canSelect) return;
    		if (e.type === 'mousemove' && !handleMoveMove || !isMinuteView && e.target.tagName !== 'BUTTON') return;

    		if (e.target.tagName === 'BUTTON') {
    			let val = parseInt(e.target.dataset.value);

    			const setter = e.meridianSwitch || !isMinuteView
    			? 'setUTCHours'
    			: 'setUTCMinutes';

    			innerDate[setter](val);
    		} else if (isMinuteView) {
    			// compute it out of x,y 
    			const rect = clockEl.getBoundingClientRect();

    			const clientX = e.clientX - rect.left;
    			const clientY = e.clientY - rect.top;
    			const cntX = 130, cntY = 130;
    			let quadrant = null;
    			let a, b;

    			if (clientX > cntX) {
    				quadrant = clientY > cntY ? 2 : 1;
    			} else {
    				quadrant = clientY > cntY ? 3 : 4;
    			}

    			switch (quadrant) {
    				case 1:
    					a = clientX - cntX;
    					b = cntY - clientY;
    					break;
    				case 2:
    					a = clientX - cntX;
    					b = clientY - cntY;
    					break;
    				case 3:
    					a = cntX - clientX;
    					b = clientY - cntY;
    					break;
    				case 4:
    					a = cntX - clientX;
    					b = cntY - clientY;
    					break;
    			}

    			const c = Math.sqrt(a * a + b * b);
    			const beta = 90 - Math.asin(a / c) * (180 / Math.PI);
    			let degree;

    			switch (quadrant) {
    				case 1:
    					degree = 90 - beta;
    					break;
    				case 2:
    					degree = beta + 90;
    					break;
    				case 3:
    					degree = 270 - beta;
    					break;
    				case 4:
    					degree = beta + 270;
    					break;
    			}

    			degree = Math.floor(degree / 6);
    			innerDate.setMinutes(degree);
    		}

    		($$invalidate(20, innerDate), $$invalidate(17, date));
    		canSelect = false;
    		dispatch('time', innerDate);

    		if (!e.meridianSwitch && !handleMoveMove && isMinuteView) setTimeout(
    			() => {
    				dispatch('close');
    			},
    			300
    		);

    		if (!e.meridianSwitch && !isMinuteView) $$invalidate(3, isMinuteView = true);
    		enableViewToggle = true;

    		setTimeout(
    			() => {
    				enableViewToggle = false;
    				canSelect = true;
    			},
    			200
    		);
    	}

    	function onSwitchMeridian(e) {
    		e.meridianSwitch = true;
    		onClick(e);
    	}

    	function onToggleMove(e) {
    		$$invalidate(7, handleMoveMove = e.type === 'mousedown');
    	}

    	function onModeSwitch() {
    		dispatch('switch', 'date');
    	}

    	const writable_props = ['date', 'showMeridian', 'hasDateComponent', 'i18n'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Time> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(3, isMinuteView = false);
    	const click_handler_1 = () => $$invalidate(3, isMinuteView = true);

    	const mousemove_handler = e => {
    		handleMoveMove && onClick(e);
    	};

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			clockEl = $$value;
    			$$invalidate(6, clockEl);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('date' in $$props) $$invalidate(17, date = $$props.date);
    		if ('showMeridian' in $$props) $$invalidate(0, showMeridian = $$props.showMeridian);
    		if ('hasDateComponent' in $$props) $$invalidate(1, hasDateComponent = $$props.hasDateComponent);
    		if ('i18n' in $$props) $$invalidate(2, i18n = $$props.i18n);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fade,
    		UTCDate,
    		date,
    		showMeridian,
    		hasDateComponent,
    		i18n,
    		minuteSwitch,
    		makeTick,
    		clockEl,
    		isMinuteView,
    		handleMoveMove,
    		enableViewToggle,
    		innerDate,
    		canSelect,
    		dispatch,
    		positions,
    		view,
    		isSelected,
    		onClick,
    		onSwitchMeridian,
    		onToggleMove,
    		onModeSwitch,
    		multiplier,
    		isPM,
    		innerHours,
    		pos,
    		selectedHour,
    		selectedMinutes,
    		handCss
    	});

    	$$self.$inject_state = $$props => {
    		if ('date' in $$props) $$invalidate(17, date = $$props.date);
    		if ('showMeridian' in $$props) $$invalidate(0, showMeridian = $$props.showMeridian);
    		if ('hasDateComponent' in $$props) $$invalidate(1, hasDateComponent = $$props.hasDateComponent);
    		if ('i18n' in $$props) $$invalidate(2, i18n = $$props.i18n);
    		if ('clockEl' in $$props) $$invalidate(6, clockEl = $$props.clockEl);
    		if ('isMinuteView' in $$props) $$invalidate(3, isMinuteView = $$props.isMinuteView);
    		if ('handleMoveMove' in $$props) $$invalidate(7, handleMoveMove = $$props.handleMoveMove);
    		if ('enableViewToggle' in $$props) enableViewToggle = $$props.enableViewToggle;
    		if ('innerDate' in $$props) $$invalidate(20, innerDate = $$props.innerDate);
    		if ('canSelect' in $$props) canSelect = $$props.canSelect;
    		if ('multiplier' in $$props) multiplier = $$props.multiplier;
    		if ('isPM' in $$props) isPM = $$props.isPM;
    		if ('innerHours' in $$props) $$invalidate(8, innerHours = $$props.innerHours);
    		if ('pos' in $$props) $$invalidate(9, pos = $$props.pos);
    		if ('selectedHour' in $$props) $$invalidate(4, selectedHour = $$props.selectedHour);
    		if ('selectedMinutes' in $$props) $$invalidate(5, selectedMinutes = $$props.selectedMinutes);
    		if ('handCss' in $$props) $$invalidate(10, handCss = $$props.handCss);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*date, innerDate*/ 1179648) {
    			 {
    				if (date !== innerDate) {
    					$$invalidate(20, innerDate = date);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*innerDate*/ 1048576) {
    			 $$invalidate(4, selectedHour = innerDate ? innerDate.getUTCHours() : 0);
    		}

    		if ($$self.$$.dirty[0] & /*showMeridian, selectedHour*/ 17) {
    			 isPM = showMeridian ? selectedHour >= 12 : false;
    		}

    		if ($$self.$$.dirty[0] & /*innerDate*/ 1048576) {
    			 $$invalidate(5, selectedMinutes = innerDate ? innerDate.getUTCMinutes() : 0);
    		}

    		if ($$self.$$.dirty[0] & /*isMinuteView, selectedMinutes, showMeridian, selectedHour*/ 57) {
    			 $$invalidate(10, handCss = isMinuteView
    			? `transform: rotateZ(${selectedMinutes * 6}deg)`
    			: showMeridian
    				? `transform: rotateZ(${selectedHour % 12 * 30}deg);`
    				: `transform: rotateZ(${selectedHour % 12 * 30}deg); ${selectedHour > 12 || !selectedHour
					? 'height: calc(25% + 1px)'
					: ''}`);
    		}

    		if ($$self.$$.dirty[0] & /*isMinuteView*/ 8) {
    			 multiplier = isMinuteView ? 5 : 1;
    		}

    		if ($$self.$$.dirty[0] & /*isMinuteView*/ 8) {
    			 $$invalidate(9, pos = positions(220, 130, isMinuteView ? '00' : '12', isMinuteView, 0));
    		}

    		if ($$self.$$.dirty[0] & /*isMinuteView*/ 8) {
    			 {
    				dispatch('time-switch', isMinuteView);
    			}
    		}
    	};

    	 $$invalidate(8, innerHours = positions(140, 130, '00', false, 12));

    	return [
    		showMeridian,
    		hasDateComponent,
    		i18n,
    		isMinuteView,
    		selectedHour,
    		selectedMinutes,
    		clockEl,
    		handleMoveMove,
    		innerHours,
    		pos,
    		handCss,
    		view,
    		isSelected,
    		onClick,
    		onSwitchMeridian,
    		onToggleMove,
    		onModeSwitch,
    		date,
    		minuteSwitch,
    		makeTick,
    		innerDate,
    		click_handler,
    		click_handler_1,
    		mousemove_handler,
    		div4_binding
    	];
    }

    class Time$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$9,
    			create_fragment$9,
    			safe_not_equal,
    			{
    				date: 17,
    				showMeridian: 0,
    				hasDateComponent: 1,
    				i18n: 2,
    				minuteSwitch: 18,
    				makeTick: 19
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Time",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*i18n*/ ctx[2] === undefined && !('i18n' in props)) {
    			console.warn("<Time> was created without expected prop 'i18n'");
    		}
    	}

    	get date() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showMeridian() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showMeridian(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasDateComponent() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasDateComponent(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i18n() {
    		throw new Error("<Time>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i18n(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minuteSwitch() {
    		return this.$$.ctx[18];
    	}

    	set minuteSwitch(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get makeTick() {
    		return this.$$.ctx[19];
    	}

    	set makeTick(value) {
    		throw new Error("<Time>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelty-picker/src/SveltyPicker.svelte generated by Svelte v3.48.0 */
    const file$8 = "node_modules/svelty-picker/src/SveltyPicker.svelte";

    // (238:0) {#if visible || isFocused}
    function create_if_block$5(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let div_class_value;
    	let positionFn_action;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_1$3, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentMode*/ ctx[27] === 'date') return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			if_block.l(div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", div_class_value = "std-calendar-wrap is-popup " + /*theme*/ ctx[9] + " svelte-tb6rom");
    			add_location(div, file$8, 238, 0, 7404);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(positionFn_action = /*positionFn*/ ctx[19].call(null, div, {
    						inputEl: /*inputEl*/ ctx[22],
    						visible: /*internalVisibility*/ ctx[28],
    						inputRect: /*inputRect*/ ctx[23]
    					})),
    					listen_dev(div, "mousedown", prevent_default(/*mousedown_handler*/ ctx[47]), false, true, false)
    				];

    				mounted = true;
    			}
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
    				if_block.m(div, null);
    			}

    			if (!current || dirty[0] & /*theme*/ 512 && div_class_value !== (div_class_value = "std-calendar-wrap is-popup " + /*theme*/ ctx[9] + " svelte-tb6rom")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (positionFn_action && is_function(positionFn_action.update) && dirty[0] & /*inputEl, internalVisibility, inputRect*/ 281018368) positionFn_action.update.call(null, {
    				inputEl: /*inputEl*/ ctx[22],
    				visible: /*internalVisibility*/ ctx[28],
    				inputRect: /*inputRect*/ ctx[23]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			if (local) {
    				add_render_callback(() => {
    					if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 200 }, true);
    					div_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);

    			if (local) {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 200 }, false);
    				div_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(238:0) {#if visible || isFocused}",
    		ctx
    	});

    	return block;
    }

    // (264:2) {:else}
    function create_else_block$1(ctx) {
    	let time;
    	let current;

    	let time_props = {
    		date: /*innerDate*/ ctx[20],
    		hasDateComponent: /*resolvedMode*/ ctx[26] !== 'time',
    		showMeridian: /*format*/ ctx[1].match('p|P'),
    		i18n: /*i18n*/ ctx[18]
    	};

    	time = new Time$1({ props: time_props, $$inline: true });
    	/*time_binding*/ ctx[53](time);
    	time.$on("time", /*onDate*/ ctx[31]);
    	time.$on("switch", /*onModeSwitch*/ ctx[36]);
    	time.$on("close", /*onTimeClose*/ ctx[37]);

    	const block = {
    		c: function create() {
    			create_component(time.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(time.$$.fragment, nodes);
    		},
    		m: function mount(target, anchor) {
    			mount_component(time, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const time_changes = {};
    			if (dirty[0] & /*innerDate*/ 1048576) time_changes.date = /*innerDate*/ ctx[20];
    			if (dirty[0] & /*resolvedMode*/ 67108864) time_changes.hasDateComponent = /*resolvedMode*/ ctx[26] !== 'time';
    			if (dirty[0] & /*format*/ 2) time_changes.showMeridian = /*format*/ ctx[1].match('p|P');
    			if (dirty[0] & /*i18n*/ 262144) time_changes.i18n = /*i18n*/ ctx[18];
    			time.$set(time_changes);
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
    			/*time_binding*/ ctx[53](null);
    			destroy_component(time, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(264:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:2) {#if currentMode === 'date'}
    function create_if_block_1$3(ctx) {
    	let calendar;
    	let t;
    	let if_block_anchor;
    	let current;

    	let calendar_props = {
    		date: /*innerDate*/ ctx[20],
    		startDate: /*startDate*/ ctx[6]
    		? parseDate$1(/*startDate*/ ctx[6], /*format*/ ctx[1], /*i18n*/ ctx[18], /*formatType*/ ctx[10])
    		: null,
    		endDate: /*endDate*/ ctx[7]
    		? parseDate$1(/*endDate*/ ctx[7], /*format*/ ctx[1], /*i18n*/ ctx[18], /*formatType*/ ctx[10])
    		: null,
    		enableTimeToggle: /*resolvedMode*/ ctx[26].includes('time'),
    		i18n: /*i18n*/ ctx[18],
    		weekStart: /*weekStart*/ ctx[11]
    	};

    	calendar = new Calendar({ props: calendar_props, $$inline: true });
    	/*calendar_binding*/ ctx[52](calendar);
    	calendar.$on("date", /*onDate*/ ctx[31]);
    	calendar.$on("switch", /*onModeSwitch*/ ctx[36]);
    	let if_block = (/*todayBtn*/ ctx[16] || /*clearBtn*/ ctx[17]) && create_if_block_2$3(ctx);

    	const block = {
    		c: function create() {
    			create_component(calendar.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			claim_component(calendar.$$.fragment, nodes);
    			t = claim_space(nodes);
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(calendar, target, anchor);
    			insert_hydration_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const calendar_changes = {};
    			if (dirty[0] & /*innerDate*/ 1048576) calendar_changes.date = /*innerDate*/ ctx[20];

    			if (dirty[0] & /*startDate, format, i18n, formatType*/ 263234) calendar_changes.startDate = /*startDate*/ ctx[6]
    			? parseDate$1(/*startDate*/ ctx[6], /*format*/ ctx[1], /*i18n*/ ctx[18], /*formatType*/ ctx[10])
    			: null;

    			if (dirty[0] & /*endDate, format, i18n, formatType*/ 263298) calendar_changes.endDate = /*endDate*/ ctx[7]
    			? parseDate$1(/*endDate*/ ctx[7], /*format*/ ctx[1], /*i18n*/ ctx[18], /*formatType*/ ctx[10])
    			: null;

    			if (dirty[0] & /*resolvedMode*/ 67108864) calendar_changes.enableTimeToggle = /*resolvedMode*/ ctx[26].includes('time');
    			if (dirty[0] & /*i18n*/ 262144) calendar_changes.i18n = /*i18n*/ ctx[18];
    			if (dirty[0] & /*weekStart*/ 2048) calendar_changes.weekStart = /*weekStart*/ ctx[11];
    			calendar.$set(calendar_changes);

    			if (/*todayBtn*/ ctx[16] || /*clearBtn*/ ctx[17]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(calendar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(calendar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*calendar_binding*/ ctx[52](null);
    			destroy_component(calendar, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(244:2) {#if currentMode === 'date'}",
    		ctx
    	});

    	return block;
    }

    // (254:4) {#if todayBtn || clearBtn}
    function create_if_block_2$3(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*todayBtn*/ ctx[16] && create_if_block_4$1(ctx);
    	let if_block1 = /*clearBtn*/ ctx[17] && create_if_block_3$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			if (if_block0) if_block0.l(div_nodes);
    			t = claim_space(div_nodes);
    			if (if_block1) if_block1.l(div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "std-btn-row svelte-tb6rom");
    			add_location(div, file$8, 254, 4, 8055);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_hydration_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*todayBtn*/ ctx[16]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4$1(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*clearBtn*/ ctx[17]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3$2(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(254:4) {#if todayBtn || clearBtn}",
    		ctx
    	});

    	return block;
    }

    // (256:6) {#if todayBtn}
    function create_if_block_4$1(ctx) {
    	let button;
    	let t_value = /*i18n*/ ctx[18].todayBtn + "";
    	let t;
    	let button_class_value;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*todayBtnClasses*/ ctx[14]) + " svelte-tb6rom"));
    			button.disabled = button_disabled_value = /*startDate*/ ctx[6] > formatDate(new Date(), /*format*/ ctx[1], /*i18n*/ ctx[18], /*formatType*/ ctx[10]);
    			add_location(button, file$8, 256, 8, 8112);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*onToday*/ ctx[32], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*i18n*/ 262144 && t_value !== (t_value = /*i18n*/ ctx[18].todayBtn + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*todayBtnClasses*/ 16384 && button_class_value !== (button_class_value = "" + (null_to_empty(/*todayBtnClasses*/ ctx[14]) + " svelte-tb6rom"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty[0] & /*startDate, format, i18n, formatType*/ 263234 && button_disabled_value !== (button_disabled_value = /*startDate*/ ctx[6] > formatDate(new Date(), /*format*/ ctx[1], /*i18n*/ ctx[18], /*formatType*/ ctx[10]))) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(256:6) {#if todayBtn}",
    		ctx
    	});

    	return block;
    }

    // (259:6) {#if clearBtn}
    function create_if_block_3$2(ctx) {
    	let button;
    	let t_value = /*i18n*/ ctx[18].clearBtn + "";
    	let t;
    	let button_class_value;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			button = claim_element(nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t = claim_text(button_nodes, t_value);
    			button_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*clearBtnClasses*/ ctx[15]) + " svelte-tb6rom"));
    			button.disabled = button_disabled_value = !/*innerDate*/ ctx[20];
    			add_location(button, file$8, 259, 8, 8304);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, button, anchor);
    			append_hydration_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*onClear*/ ctx[33], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*i18n*/ 262144 && t_value !== (t_value = /*i18n*/ ctx[18].clearBtn + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*clearBtnClasses*/ 32768 && button_class_value !== (button_class_value = "" + (null_to_empty(/*clearBtnClasses*/ ctx[15]) + " svelte-tb6rom"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty[0] & /*innerDate*/ 1048576 && button_disabled_value !== (button_disabled_value = !/*innerDate*/ ctx[20])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(259:6) {#if clearBtn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let input;
    	let input_type_value;
    	let input_class_value;
    	let inputAction_action;
    	let t;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = (/*visible*/ ctx[12] || /*isFocused*/ ctx[21]) && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.h();
    		},
    		l: function claim(nodes) {
    			input = claim_element(nodes, "INPUT", {
    				type: true,
    				name: true,
    				autocomplete: true,
    				placeholder: true,
    				class: true
    			});

    			t = claim_space(nodes);
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(input, "type", input_type_value = /*pickerOnly*/ ctx[8] ? 'hidden' : 'text');
    			attr_dev(input, "name", /*name*/ ctx[2]);
    			attr_dev(input, "autocomplete", "off");
    			input.disabled = /*disabled*/ ctx[3];
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[4]);
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*inputClasses*/ ctx[13]) + " svelte-tb6rom"));
    			input.required = /*required*/ ctx[5];
    			input.readOnly = /*isFocused*/ ctx[21];
    			input.value = /*value*/ ctx[0];
    			add_location(input, file$8, 223, 0, 6992);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, input, anchor);
    			/*input_binding*/ ctx[50](input);
    			insert_hydration_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_hydration_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(inputAction_action = /*inputAction*/ ctx[29].call(null, input, /*inputActionParams*/ ctx[30])),
    					listen_dev(input, "focus", /*onFocus*/ ctx[34], false, false, false),
    					listen_dev(input, "blur", /*onBlur*/ ctx[38], false, false, false),
    					listen_dev(input, "click", /*click_handler*/ ctx[51], false, false, false),
    					listen_dev(input, "input", /*input_handler*/ ctx[48], false, false, false),
    					listen_dev(input, "change", /*change_handler*/ ctx[49], false, false, false),
    					listen_dev(input, "keydown", /*onKeyDown*/ ctx[35], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*pickerOnly*/ 256 && input_type_value !== (input_type_value = /*pickerOnly*/ ctx[8] ? 'hidden' : 'text')) {
    				attr_dev(input, "type", input_type_value);
    			}

    			if (!current || dirty[0] & /*name*/ 4) {
    				attr_dev(input, "name", /*name*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*disabled*/ 8) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[3]);
    			}

    			if (!current || dirty[0] & /*placeholder*/ 16) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*inputClasses*/ 8192 && input_class_value !== (input_class_value = "" + (null_to_empty(/*inputClasses*/ ctx[13]) + " svelte-tb6rom"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (!current || dirty[0] & /*required*/ 32) {
    				prop_dev(input, "required", /*required*/ ctx[5]);
    			}

    			if (!current || dirty[0] & /*isFocused*/ 2097152) {
    				prop_dev(input, "readOnly", /*isFocused*/ ctx[21]);
    			}

    			if (!current || dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (/*visible*/ ctx[12] || /*isFocused*/ ctx[21]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*visible, isFocused*/ 2101248) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
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
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[50](null);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const config = settings;

    function instance$a($$self, $$props, $$invalidate) {
    	let internalVisibility;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SveltyPicker', slots, []);
    	let { name = 'date' } = $$props;
    	let { disabled = false } = $$props;
    	let { placeholder = null } = $$props;
    	let { required = false } = $$props;
    	let { value = null } = $$props;
    	let { initialDate = null } = $$props;
    	let { startDate = null } = $$props;
    	let { endDate = null } = $$props;
    	let { pickerOnly = false } = $$props;
    	let { theme = config.theme } = $$props;
    	let { mode = config.mode } = $$props;
    	let { format = config.format } = $$props;
    	let { formatType = config.formatType } = $$props;
    	let { weekStart = config.weekStart } = $$props;
    	let { visible = config.visible } = $$props;
    	let { inputClasses = config.inputClasses } = $$props;
    	let { todayBtnClasses = config.todayBtnClasses } = $$props;
    	let { clearBtnClasses = config.clearBtnClasses } = $$props;
    	let { todayBtn = config.todayBtn } = $$props;
    	let { clearBtn = config.clearBtn } = $$props;
    	let { clearToggle = config.clearToggle } = $$props;
    	let { autoclose = config.autoclose } = $$props;
    	let { i18n = config.i18n } = $$props;
    	let { positionFn = usePosition } = $$props;
    	let { validatorAction = null } = $$props;

    	function setDateValue(val) {
    		$$invalidate(20, innerDate = parseDate$1(val, format, i18n, formatType));
    	}

    	if (format === 'yyyy-mm-dd' && mode === 'time') {
    		format = 'hh:ii';
    	}

    	const dispatch = createEventDispatcher();
    	if (value) value = value.replace(/(:\d+):\d+/, '$1'); // strip seconds if present in initial value
    	let prevValue = value;
    	let currentFormat = format;

    	let innerDate = initialDate && initialDate instanceof Date
    	? UTCDate(initialDate.getUTCFullYear(), initialDate.getUTCMonth(), initialDate.getUTCDate(), initialDate.getHours(), initialDate.getUTCMinutes())
    	: value
    		? parseDate$1(value, format, i18n, formatType)
    		: null;

    	if (innerDate && initialDate) {
    		value = formatDate(innerDate, format, i18n, formatType);
    	}

    	let isFocused = pickerOnly;
    	let inputEl = null;
    	let inputRect = null;

    	let inputAction = validatorAction
    	? validatorAction.shift()
    	: () => {
    			
    		};

    	let inputActionParams = validatorAction || [];
    	let calendarEl = null;
    	let timeEl;
    	let preventClose = false;
    	let preventCloseTimer = null;

    	let resolvedMode = mode === 'auto'
    	? format.match(/hh?|ii?/i) && format.match(/y|m|d/i)
    		? 'datetime'
    		: format.match(/hh?|ii?/i) ? 'time' : 'date'
    	: mode;

    	let currentMode = resolvedMode === 'time' ? 'time' : 'date';

    	function onDate(e) {
    		let setter = e.detail || null;

    		if (e.detail && innerDate) {
    			if (innerDate.getUTCFullYear() === e.detail.getUTCFullYear() && innerDate.getUTCMonth() === e.detail.getUTCMonth() && innerDate.getUTCDate() === e.detail.getUTCDate() && resolvedMode === 'date' && clearToggle) setter = null;
    		}

    		$$invalidate(0, value = setter
    		? formatDate(setter, format, i18n, formatType)
    		: null);

    		if (autoclose && (resolvedMode === 'date' || !setter) && !pickerOnly && !preventClose) {
    			onBlur(false);
    		}

    		if (setter && !preventClose && resolvedMode === 'datetime' && currentMode === 'date') {
    			$$invalidate(27, currentMode = 'time');
    		}

    		if (preventClose && currentMode === 'time') {
    			preventCloseTimer = setTimeout(
    				() => {
    					preventClose = false;
    				},
    				400
    			);
    		} else {
    			preventClose = false;
    		}

    		tick().then(() => {
    			inputEl.dispatchEvent(new Event('input'));
    			dispatch('change', value);
    		});
    	}

    	function onToday() {
    		const today = new Date();
    		if (startDate && parseDate$1(startDate, format, i18n, formatType) < today) return;
    		const todayHours = innerDate ? innerDate.getUTCHours() : today.getHours();

    		const todayMinutes = innerDate
    		? innerDate.getUTCMinutes()
    		: today.getUTCMinutes();

    		onDate({
    			detail: UTCDate(today.getUTCFullYear(), today.getMonth(), today.getDate(), todayHours, todayMinutes, 0)
    		});
    	}

    	function onClear() {
    		onDate({ detail: null });
    	}

    	function onFocus() {
    		$$invalidate(23, inputRect = inputEl.getBoundingClientRect());
    		$$invalidate(21, isFocused = true);
    	}

    	function onKeyDown(e) {
    		if (!isFocused) {
    			['Backspace', 'Delete'].includes(e.key) && onClear();
    			if (e.key !== 'Enter') return onFocus();
    		}

    		switch (e.key) {
    			case 'PageDown':
    			case 'PageUp':
    			case 'ArrowDown':
    			case 'ArrowUp':
    			case 'ArrowLeft':
    			case 'ArrowRight':
    				e.preventDefault();
    				preventCloseTimer && clearTimeout(preventCloseTimer);
    				preventClose = true;
    				if (currentMode === 'date') {
    					calendarEl.handleGridNav(e.key, e.shiftKey);
    				} else {
    					// if (currentMode === 'time') {
    					timeEl.makeTick(['ArrowDown', 'ArrowLeft', 'PageDown'].includes(e.key)
    					? -1
    					: 1);
    				}
    				break;
    			case 'Escape':
    				if (isFocused && !internalVisibility) {
    					$$invalidate(21, isFocused = false);
    				}
    				break;
    			case 'Backspace':
    			case 'Delete':
    				onClear();
    				break;
    			case 'Enter':
    				isFocused && e.preventDefault();
    				if (currentMode === 'time') {
    					if (!timeEl.minuteSwitch()) {
    						return timeEl.minuteSwitch(true);
    					}

    					return onBlur(false);
    				}
    				if (isFocused && resolvedMode === 'date') $$invalidate(21, isFocused = false);
    				if (innerDate && resolvedMode.includes('time')) {
    					$$invalidate(27, currentMode = 'time');
    				}
    				break;
    			case 'Tab':
    			case 'F5':
    				break;
    			default:
    				e.preventDefault();
    		}
    	}

    	function onModeSwitch(e) {
    		$$invalidate(27, currentMode = e.detail);
    	}

    	function onTimeClose() {
    		autoclose && !preventClose && !pickerOnly && onBlur(false);
    	}

    	function onBlur(e) {
    		$$invalidate(21, isFocused = false);
    		if (resolvedMode.includes('date')) $$invalidate(27, currentMode = 'date');
    		e && dispatch('blur');
    	}

    	const writable_props = [
    		'name',
    		'disabled',
    		'placeholder',
    		'required',
    		'value',
    		'initialDate',
    		'startDate',
    		'endDate',
    		'pickerOnly',
    		'theme',
    		'mode',
    		'format',
    		'formatType',
    		'weekStart',
    		'visible',
    		'inputClasses',
    		'todayBtnClasses',
    		'clearBtnClasses',
    		'todayBtn',
    		'clearBtn',
    		'clearToggle',
    		'autoclose',
    		'i18n',
    		'positionFn',
    		'validatorAction'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SveltyPicker> was created with unknown prop '${key}'`);
    	});

    	function mousedown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			inputEl = $$value;
    			$$invalidate(22, inputEl);
    		});
    	}

    	const click_handler = () => {
    		!isFocused && onFocus();
    	};

    	function calendar_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			calendarEl = $$value;
    			$$invalidate(24, calendarEl);
    		});
    	}

    	function time_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			timeEl = $$value;
    			$$invalidate(25, timeEl);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('disabled' in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate(4, placeholder = $$props.placeholder);
    		if ('required' in $$props) $$invalidate(5, required = $$props.required);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('initialDate' in $$props) $$invalidate(39, initialDate = $$props.initialDate);
    		if ('startDate' in $$props) $$invalidate(6, startDate = $$props.startDate);
    		if ('endDate' in $$props) $$invalidate(7, endDate = $$props.endDate);
    		if ('pickerOnly' in $$props) $$invalidate(8, pickerOnly = $$props.pickerOnly);
    		if ('theme' in $$props) $$invalidate(9, theme = $$props.theme);
    		if ('mode' in $$props) $$invalidate(40, mode = $$props.mode);
    		if ('format' in $$props) $$invalidate(1, format = $$props.format);
    		if ('formatType' in $$props) $$invalidate(10, formatType = $$props.formatType);
    		if ('weekStart' in $$props) $$invalidate(11, weekStart = $$props.weekStart);
    		if ('visible' in $$props) $$invalidate(12, visible = $$props.visible);
    		if ('inputClasses' in $$props) $$invalidate(13, inputClasses = $$props.inputClasses);
    		if ('todayBtnClasses' in $$props) $$invalidate(14, todayBtnClasses = $$props.todayBtnClasses);
    		if ('clearBtnClasses' in $$props) $$invalidate(15, clearBtnClasses = $$props.clearBtnClasses);
    		if ('todayBtn' in $$props) $$invalidate(16, todayBtn = $$props.todayBtn);
    		if ('clearBtn' in $$props) $$invalidate(17, clearBtn = $$props.clearBtn);
    		if ('clearToggle' in $$props) $$invalidate(41, clearToggle = $$props.clearToggle);
    		if ('autoclose' in $$props) $$invalidate(42, autoclose = $$props.autoclose);
    		if ('i18n' in $$props) $$invalidate(18, i18n = $$props.i18n);
    		if ('positionFn' in $$props) $$invalidate(19, positionFn = $$props.positionFn);
    		if ('validatorAction' in $$props) $$invalidate(43, validatorAction = $$props.validatorAction);
    	};

    	$$self.$capture_state = () => ({
    		settings,
    		config,
    		createEventDispatcher,
    		tick,
    		fade,
    		Calendar,
    		Time: Time$1,
    		formatDate,
    		parseDate: parseDate$1,
    		UTCDate,
    		usePosition,
    		name,
    		disabled,
    		placeholder,
    		required,
    		value,
    		initialDate,
    		startDate,
    		endDate,
    		pickerOnly,
    		theme,
    		mode,
    		format,
    		formatType,
    		weekStart,
    		visible,
    		inputClasses,
    		todayBtnClasses,
    		clearBtnClasses,
    		todayBtn,
    		clearBtn,
    		clearToggle,
    		autoclose,
    		i18n,
    		positionFn,
    		validatorAction,
    		setDateValue,
    		dispatch,
    		prevValue,
    		currentFormat,
    		innerDate,
    		isFocused,
    		inputEl,
    		inputRect,
    		inputAction,
    		inputActionParams,
    		calendarEl,
    		timeEl,
    		preventClose,
    		preventCloseTimer,
    		resolvedMode,
    		currentMode,
    		onDate,
    		onToday,
    		onClear,
    		onFocus,
    		onKeyDown,
    		onModeSwitch,
    		onTimeClose,
    		onBlur,
    		internalVisibility
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('disabled' in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate(4, placeholder = $$props.placeholder);
    		if ('required' in $$props) $$invalidate(5, required = $$props.required);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('initialDate' in $$props) $$invalidate(39, initialDate = $$props.initialDate);
    		if ('startDate' in $$props) $$invalidate(6, startDate = $$props.startDate);
    		if ('endDate' in $$props) $$invalidate(7, endDate = $$props.endDate);
    		if ('pickerOnly' in $$props) $$invalidate(8, pickerOnly = $$props.pickerOnly);
    		if ('theme' in $$props) $$invalidate(9, theme = $$props.theme);
    		if ('mode' in $$props) $$invalidate(40, mode = $$props.mode);
    		if ('format' in $$props) $$invalidate(1, format = $$props.format);
    		if ('formatType' in $$props) $$invalidate(10, formatType = $$props.formatType);
    		if ('weekStart' in $$props) $$invalidate(11, weekStart = $$props.weekStart);
    		if ('visible' in $$props) $$invalidate(12, visible = $$props.visible);
    		if ('inputClasses' in $$props) $$invalidate(13, inputClasses = $$props.inputClasses);
    		if ('todayBtnClasses' in $$props) $$invalidate(14, todayBtnClasses = $$props.todayBtnClasses);
    		if ('clearBtnClasses' in $$props) $$invalidate(15, clearBtnClasses = $$props.clearBtnClasses);
    		if ('todayBtn' in $$props) $$invalidate(16, todayBtn = $$props.todayBtn);
    		if ('clearBtn' in $$props) $$invalidate(17, clearBtn = $$props.clearBtn);
    		if ('clearToggle' in $$props) $$invalidate(41, clearToggle = $$props.clearToggle);
    		if ('autoclose' in $$props) $$invalidate(42, autoclose = $$props.autoclose);
    		if ('i18n' in $$props) $$invalidate(18, i18n = $$props.i18n);
    		if ('positionFn' in $$props) $$invalidate(19, positionFn = $$props.positionFn);
    		if ('validatorAction' in $$props) $$invalidate(43, validatorAction = $$props.validatorAction);
    		if ('prevValue' in $$props) $$invalidate(45, prevValue = $$props.prevValue);
    		if ('currentFormat' in $$props) $$invalidate(46, currentFormat = $$props.currentFormat);
    		if ('innerDate' in $$props) $$invalidate(20, innerDate = $$props.innerDate);
    		if ('isFocused' in $$props) $$invalidate(21, isFocused = $$props.isFocused);
    		if ('inputEl' in $$props) $$invalidate(22, inputEl = $$props.inputEl);
    		if ('inputRect' in $$props) $$invalidate(23, inputRect = $$props.inputRect);
    		if ('inputAction' in $$props) $$invalidate(29, inputAction = $$props.inputAction);
    		if ('inputActionParams' in $$props) $$invalidate(30, inputActionParams = $$props.inputActionParams);
    		if ('calendarEl' in $$props) $$invalidate(24, calendarEl = $$props.calendarEl);
    		if ('timeEl' in $$props) $$invalidate(25, timeEl = $$props.timeEl);
    		if ('preventClose' in $$props) preventClose = $$props.preventClose;
    		if ('preventCloseTimer' in $$props) preventCloseTimer = $$props.preventCloseTimer;
    		if ('resolvedMode' in $$props) $$invalidate(26, resolvedMode = $$props.resolvedMode);
    		if ('currentMode' in $$props) $$invalidate(27, currentMode = $$props.currentMode);
    		if ('internalVisibility' in $$props) $$invalidate(28, internalVisibility = $$props.internalVisibility);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*pickerOnly, visible*/ 4352) {
    			 $$invalidate(28, internalVisibility = pickerOnly ? true : visible);
    		}

    		if ($$self.$$.dirty[0] & /*value, format, i18n, formatType, innerDate*/ 1311747 | $$self.$$.dirty[1] & /*prevValue, currentFormat, mode*/ 49664) {
    			 {
    				if (value !== prevValue) {
    					const parsed = value
    					? parseDate$1(value, format, i18n, formatType)
    					: null;

    					$$invalidate(20, innerDate = parsed);
    					$$invalidate(45, prevValue = value);
    				}

    				if (currentFormat !== format && innerDate) {
    					$$invalidate(0, value = formatDate(innerDate, format, i18n, formatType));
    					$$invalidate(45, prevValue = value);
    					$$invalidate(46, currentFormat = format);

    					if (mode === 'auto') {
    						$$invalidate(26, resolvedMode = format.match(/hh?|ii?/i) && format.match(/y|m|d/i)
    						? 'datetime'
    						: format.match(/hh?|ii?/i) ? 'time' : 'date');
    					}
    				}
    			}
    		}
    	};

    	return [
    		value,
    		format,
    		name,
    		disabled,
    		placeholder,
    		required,
    		startDate,
    		endDate,
    		pickerOnly,
    		theme,
    		formatType,
    		weekStart,
    		visible,
    		inputClasses,
    		todayBtnClasses,
    		clearBtnClasses,
    		todayBtn,
    		clearBtn,
    		i18n,
    		positionFn,
    		innerDate,
    		isFocused,
    		inputEl,
    		inputRect,
    		calendarEl,
    		timeEl,
    		resolvedMode,
    		currentMode,
    		internalVisibility,
    		inputAction,
    		inputActionParams,
    		onDate,
    		onToday,
    		onClear,
    		onFocus,
    		onKeyDown,
    		onModeSwitch,
    		onTimeClose,
    		onBlur,
    		initialDate,
    		mode,
    		clearToggle,
    		autoclose,
    		validatorAction,
    		setDateValue,
    		prevValue,
    		currentFormat,
    		mousedown_handler,
    		input_handler,
    		change_handler,
    		input_binding,
    		click_handler,
    		calendar_binding,
    		time_binding
    	];
    }

    class SveltyPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$a,
    			create_fragment$a,
    			safe_not_equal,
    			{
    				name: 2,
    				disabled: 3,
    				placeholder: 4,
    				required: 5,
    				value: 0,
    				initialDate: 39,
    				startDate: 6,
    				endDate: 7,
    				pickerOnly: 8,
    				theme: 9,
    				mode: 40,
    				format: 1,
    				formatType: 10,
    				weekStart: 11,
    				visible: 12,
    				inputClasses: 13,
    				todayBtnClasses: 14,
    				clearBtnClasses: 15,
    				todayBtn: 16,
    				clearBtn: 17,
    				clearToggle: 41,
    				autoclose: 42,
    				i18n: 18,
    				positionFn: 19,
    				validatorAction: 43,
    				setDateValue: 44
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SveltyPicker",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get name() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get required() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set required(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get initialDate() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialDate(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startDate() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startDate(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endDate() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endDate(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pickerOnly() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pickerOnly(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theme() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mode() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get format() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set format(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get formatType() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formatType(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get weekStart() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set weekStart(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputClasses() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputClasses(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get todayBtnClasses() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todayBtnClasses(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearBtnClasses() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clearBtnClasses(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get todayBtn() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todayBtn(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearBtn() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clearBtn(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearToggle() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clearToggle(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoclose() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoclose(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i18n() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i18n(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get positionFn() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set positionFn(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get validatorAction() {
    		throw new Error("<SveltyPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set validatorAction(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setDateValue() {
    		return this.$$.ctx[44];
    	}

    	set setDateValue(value) {
    		throw new Error("<SveltyPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function modifysets() {
        // Delete previously created sets, if any
        let setslist = document.getElementsByClassName("set");
        while (setslist.length > 0) {
            setslist[0].remove();
        }

        let sets = document.getElementById("sets").value;
        // Only render a max of 100 sets, for fucks sake how much time do you spend in the gym?
        for (let i = 0; i < sets && i < 100; i++) {
            let set = document.createElement("div");

            // Reps
            set.className = "set";
            let reps = document.createElement("input");
            reps.type = "number";
            reps.className = "reps numberform";
            reps.placeholder = "Reps";
            reps.min = "0";
            reps.max = "100";
            reps.required = true;

            // Weight
            let weight = document.createElement("input");
            weight.type = "number";
            weight.className = "weight numberform";
            weight.placeholder = "Weight";
            weight.required = true;

            // Weight Unit
            let weightunit = document.createElement("select");
            weightunit.className = "weightunit";
            // When any of the options are changed, change all the weight units to the new one
            weightunit.onchange = function () {
                let list = document.getElementsByClassName("weightunit");
                for (let i = 0; i < list.length; i++) {
                    list[i].value = weightunit.value;
                }
            };
            let option1 = document.createElement("option");
            option1.value = "kgs";
            option1.text = "Kilograms";
            let option2 = document.createElement("option");
            option2.value = "lbs";
            option2.text = "Pounds";
            weightunit.appendChild(option1);
            weightunit.appendChild(option2);

            // Reps in Reserve
            let rir = document.createElement("input");
            rir.type = "number";
            rir.className = "rir numberform";
            rir.placeholder = "Reps in Reserve";
            rir.maxLength = "10.0";
            rir.required = true;
            rir.step = "0.5";

            // Build
            set.appendChild(reps);
            set.appendChild(weight);
            set.appendChild(weightunit);
            set.appendChild(rir);
            document.getElementById("setsdiv").appendChild(set);
        }
    }

    function addexercise() {
        console.log("addexercise");

        let exercise = {
            name: "",
            comments: "",
            sets: [],
        };

        // Name
        exercise.name = document.getElementById("exercisename").value;

        // Comments
        exercise.comments = document.getElementById("comments").value;

        // Sets
        for (let i = 0; i < document.getElementsByClassName("set").length; i++) {
            let set = {
                reps: document.getElementsByClassName("reps")[i].value,
                weight: document.getElementsByClassName("weight")[i].value,
                weightunit: document.getElementsByClassName("weightunit")[i].value,
                rir: document.getElementsByClassName("rir")[i].value,
            };
            exercise.sets.push(set);
        }

        // Check for empty fields
        if (exercise.name == "" || exercise.sets.length == 0 || exercise.sets[0].reps == "" || exercise.sets[0].weight == "" || exercise.sets[0].rir == "") {
            alert("Please fill in all fields!");
            return;
        }

        // Render
        let exercises = document.getElementById("exercises");
        let exerciseDiv = document.createElement("div");
        exerciseDiv.className = "exercise";
        exerciseDiv.innerHTML = `
        <h2>${exercise.name}</h2>
        <ul>
            ${exercise.sets.map(set => `
                <li>
                    <p>Reps: ${set.reps} x ${set.weight}${set.weightunit} - ${set.rir}RiR</p>
                </li>
            `).join("")}
        </ul>
    `;
        exercises.appendChild(exerciseDiv);
    }

    /* client/pages/WorkoutNew.svelte generated by Svelte v3.48.0 */
    const file$9 = "client/pages/WorkoutNew.svelte";

    function create_fragment$b(ctx) {
    	let div0;
    	let h10;
    	let t0;
    	let t1;
    	let hr0;
    	let t2;
    	let p0;
    	let t3;
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let sveltypicker;
    	let t7;
    	let p2;
    	let t8;
    	let input0;
    	let span0;
    	let t9;
    	let div2;
    	let h11;
    	let t10;
    	let t11;
    	let hr1;
    	let t12;
    	let p3;
    	let t13;
    	let input1;
    	let span1;
    	let t14;
    	let p4;
    	let t15;
    	let input2;
    	let span2;
    	let t16;
    	let p5;
    	let t17;
    	let input3;
    	let span3;
    	let t18;
    	let div1;
    	let t19;
    	let button;
    	let t20;
    	let t21;
    	let div3;
    	let h12;
    	let t22;
    	let t23;
    	let hr2;
    	let current;
    	let mounted;
    	let dispose;

    	sveltypicker = new SveltyPicker({
    			props: {
    				inputClasses: "form-control",
    				format: "yyyy-mm-dd hh:ii",
    				pickerDone: "true"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h10 = element("h1");
    			t0 = text("New Workout");
    			t1 = space();
    			hr0 = element("hr");
    			t2 = space();
    			p0 = element("p");
    			t3 = text("By: ");
    			t4 = text(/*user*/ ctx[0]);
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Start: ");
    			create_component(sveltypicker.$$.fragment);
    			t7 = space();
    			p2 = element("p");
    			t8 = text("Duration: ");
    			input0 = element("input");
    			span0 = element("span");
    			t9 = space();
    			div2 = element("div");
    			h11 = element("h1");
    			t10 = text("Add Exercise");
    			t11 = space();
    			hr1 = element("hr");
    			t12 = space();
    			p3 = element("p");
    			t13 = text("Exercise: ");
    			input1 = element("input");
    			span1 = element("span");
    			t14 = space();
    			p4 = element("p");
    			t15 = text("Comments: ");
    			input2 = element("input");
    			span2 = element("span");
    			t16 = space();
    			p5 = element("p");
    			t17 = text("Sets: ");
    			input3 = element("input");
    			span3 = element("span");
    			t18 = space();
    			div1 = element("div");
    			t19 = space();
    			button = element("button");
    			t20 = text("Submit");
    			t21 = space();
    			div3 = element("div");
    			h12 = element("h1");
    			t22 = text("Exercises");
    			t23 = space();
    			hr2 = element("hr");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div0 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div0_nodes = children(div0);
    			h10 = claim_element(div0_nodes, "H1", {});
    			var h10_nodes = children(h10);
    			t0 = claim_text(h10_nodes, "New Workout");
    			h10_nodes.forEach(detach_dev);
    			t1 = claim_space(div0_nodes);
    			hr0 = claim_element(div0_nodes, "HR", {});
    			t2 = claim_space(div0_nodes);
    			p0 = claim_element(div0_nodes, "P", {});
    			var p0_nodes = children(p0);
    			t3 = claim_text(p0_nodes, "By: ");
    			t4 = claim_text(p0_nodes, /*user*/ ctx[0]);
    			p0_nodes.forEach(detach_dev);
    			t5 = claim_space(div0_nodes);
    			p1 = claim_element(div0_nodes, "P", {});
    			var p1_nodes = children(p1);
    			t6 = claim_text(p1_nodes, "Start: ");
    			claim_component(sveltypicker.$$.fragment, p1_nodes);
    			p1_nodes.forEach(detach_dev);
    			t7 = claim_space(div0_nodes);
    			p2 = claim_element(div0_nodes, "P", {});
    			var p2_nodes = children(p2);
    			t8 = claim_text(p2_nodes, "Duration: ");

    			input0 = claim_element(p2_nodes, "INPUT", {
    				type: true,
    				class: true,
    				id: true,
    				placeholder: true,
    				min: true,
    				max: true
    			});

    			span0 = claim_element(p2_nodes, "SPAN", { class: true });
    			children(span0).forEach(detach_dev);
    			p2_nodes.forEach(detach_dev);
    			div0_nodes.forEach(detach_dev);
    			t9 = claim_space(nodes);
    			div2 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div2_nodes = children(div2);
    			h11 = claim_element(div2_nodes, "H1", {});
    			var h11_nodes = children(h11);
    			t10 = claim_text(h11_nodes, "Add Exercise");
    			h11_nodes.forEach(detach_dev);
    			t11 = claim_space(div2_nodes);
    			hr1 = claim_element(div2_nodes, "HR", {});
    			t12 = claim_space(div2_nodes);
    			p3 = claim_element(div2_nodes, "P", {});
    			var p3_nodes = children(p3);
    			t13 = claim_text(p3_nodes, "Exercise: ");

    			input1 = claim_element(p3_nodes, "INPUT", {
    				type: true,
    				class: true,
    				id: true,
    				placeholder: true,
    				maxlength: true
    			});

    			span1 = claim_element(p3_nodes, "SPAN", { class: true });
    			children(span1).forEach(detach_dev);
    			p3_nodes.forEach(detach_dev);
    			t14 = claim_space(div2_nodes);
    			p4 = claim_element(div2_nodes, "P", {});
    			var p4_nodes = children(p4);
    			t15 = claim_text(p4_nodes, "Comments: ");

    			input2 = claim_element(p4_nodes, "INPUT", {
    				type: true,
    				class: true,
    				id: true,
    				maxlength: true,
    				placeholder: true
    			});

    			span2 = claim_element(p4_nodes, "SPAN", { class: true });
    			children(span2).forEach(detach_dev);
    			p4_nodes.forEach(detach_dev);
    			t16 = claim_space(div2_nodes);
    			p5 = claim_element(div2_nodes, "P", {});
    			var p5_nodes = children(p5);
    			t17 = claim_text(p5_nodes, "Sets: ");

    			input3 = claim_element(p5_nodes, "INPUT", {
    				type: true,
    				class: true,
    				id: true,
    				placeholder: true,
    				min: true,
    				max: true
    			});

    			span3 = claim_element(p5_nodes, "SPAN", { class: true });
    			children(span3).forEach(detach_dev);
    			p5_nodes.forEach(detach_dev);
    			t18 = claim_space(div2_nodes);
    			div1 = claim_element(div2_nodes, "DIV", { id: true });
    			children(div1).forEach(detach_dev);
    			t19 = claim_space(div2_nodes);
    			button = claim_element(div2_nodes, "BUTTON", { type: true, class: true, id: true });
    			var button_nodes = children(button);
    			t20 = claim_text(button_nodes, "Submit");
    			button_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			t21 = claim_space(nodes);
    			div3 = claim_element(nodes, "DIV", { class: true, id: true });
    			var div3_nodes = children(div3);
    			h12 = claim_element(div3_nodes, "H1", {});
    			var h12_nodes = children(h12);
    			t22 = claim_text(h12_nodes, "Exercises");
    			h12_nodes.forEach(detach_dev);
    			t23 = claim_space(div3_nodes);
    			hr2 = claim_element(div3_nodes, "HR", {});
    			div3_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(h10, file$9, 9, 4, 317);
    			add_location(hr0, file$9, 10, 4, 342);
    			add_location(p0, file$9, 11, 4, 351);
    			add_location(p1, file$9, 12, 4, 373);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "form-control svelte-1u2wbx3");
    			attr_dev(input0, "id", "duration");
    			attr_dev(input0, "placeholder", "Duration in minutes");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "360");
    			input0.required = true;
    			add_location(input0, file$9, 13, 17, 504);
    			attr_dev(span0, "class", "validity svelte-1u2wbx3");
    			add_location(span0, file$9, 13, 134, 621);
    			add_location(p2, file$9, 13, 4, 491);
    			attr_dev(div0, "class", "separator svelte-1u2wbx3");
    			attr_dev(div0, "id", "metadata");
    			add_location(div0, file$9, 8, 0, 275);
    			add_location(h11, file$9, 17, 4, 704);
    			add_location(hr1, file$9, 18, 4, 730);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control svelte-1u2wbx3");
    			attr_dev(input1, "id", "exercisename");
    			attr_dev(input1, "placeholder", "Bench Press");
    			attr_dev(input1, "maxlength", "100");
    			input1.required = true;
    			add_location(input1, file$9, 19, 17, 752);
    			attr_dev(span1, "class", "validity svelte-1u2wbx3");
    			add_location(span1, file$9, 19, 126, 861);
    			add_location(p3, file$9, 19, 4, 739);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control svelte-1u2wbx3");
    			attr_dev(input2, "id", "comments");
    			attr_dev(input2, "maxlength", "5000");
    			attr_dev(input2, "placeholder", "Comments (optional)");
    			add_location(input2, file$9, 20, 17, 913);
    			attr_dev(span2, "class", "validity svelte-1u2wbx3");
    			add_location(span2, file$9, 20, 122, 1018);
    			add_location(p4, file$9, 20, 4, 900);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "form-control numberform svelte-1u2wbx3");
    			attr_dev(input3, "id", "sets");
    			attr_dev(input3, "placeholder", "Sets");
    			attr_dev(input3, "min", "0");
    			attr_dev(input3, "max", "100");
    			input3.required = true;
    			add_location(input3, file$9, 21, 13, 1066);
    			attr_dev(span3, "class", "validity svelte-1u2wbx3");
    			add_location(span3, file$9, 21, 146, 1199);
    			add_location(p5, file$9, 21, 4, 1057);
    			attr_dev(div1, "id", "setsdiv");
    			add_location(div1, file$9, 22, 4, 1238);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			attr_dev(button, "id", "add-exercise");
    			add_location(button, file$9, 23, 4, 1267);
    			attr_dev(div2, "class", "separator svelte-1u2wbx3");
    			attr_dev(div2, "id", "create");
    			add_location(div2, file$9, 16, 0, 664);
    			add_location(h12, file$9, 27, 4, 1423);
    			add_location(hr2, file$9, 28, 4, 1446);
    			attr_dev(div3, "class", "separator svelte-1u2wbx3");
    			attr_dev(div3, "id", "exercises");
    			add_location(div3, file$9, 26, 0, 1380);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, div0, anchor);
    			append_hydration_dev(div0, h10);
    			append_hydration_dev(h10, t0);
    			append_hydration_dev(div0, t1);
    			append_hydration_dev(div0, hr0);
    			append_hydration_dev(div0, t2);
    			append_hydration_dev(div0, p0);
    			append_hydration_dev(p0, t3);
    			append_hydration_dev(p0, t4);
    			append_hydration_dev(div0, t5);
    			append_hydration_dev(div0, p1);
    			append_hydration_dev(p1, t6);
    			mount_component(sveltypicker, p1, null);
    			append_hydration_dev(div0, t7);
    			append_hydration_dev(div0, p2);
    			append_hydration_dev(p2, t8);
    			append_hydration_dev(p2, input0);
    			append_hydration_dev(p2, span0);
    			insert_hydration_dev(target, t9, anchor);
    			insert_hydration_dev(target, div2, anchor);
    			append_hydration_dev(div2, h11);
    			append_hydration_dev(h11, t10);
    			append_hydration_dev(div2, t11);
    			append_hydration_dev(div2, hr1);
    			append_hydration_dev(div2, t12);
    			append_hydration_dev(div2, p3);
    			append_hydration_dev(p3, t13);
    			append_hydration_dev(p3, input1);
    			append_hydration_dev(p3, span1);
    			append_hydration_dev(div2, t14);
    			append_hydration_dev(div2, p4);
    			append_hydration_dev(p4, t15);
    			append_hydration_dev(p4, input2);
    			append_hydration_dev(p4, span2);
    			append_hydration_dev(div2, t16);
    			append_hydration_dev(div2, p5);
    			append_hydration_dev(p5, t17);
    			append_hydration_dev(p5, input3);
    			append_hydration_dev(p5, span3);
    			append_hydration_dev(div2, t18);
    			append_hydration_dev(div2, div1);
    			append_hydration_dev(div2, t19);
    			append_hydration_dev(div2, button);
    			append_hydration_dev(button, t20);
    			insert_hydration_dev(target, t21, anchor);
    			insert_hydration_dev(target, div3, anchor);
    			append_hydration_dev(div3, h12);
    			append_hydration_dev(h12, t22);
    			append_hydration_dev(div3, t23);
    			append_hydration_dev(div3, hr2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input3, "input", modifysets, false, false, false),
    					listen_dev(button, "click", addexercise, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sveltypicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sveltypicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(sveltypicker);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WorkoutNew', slots, []);
    	let myDate = new Date();
    	let user = "John Doe"; // replace once auth is implemented
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WorkoutNew> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		myDate,
    		SveltyPicker,
    		user,
    		modifysets,
    		addexercise
    	});

    	$$self.$inject_state = $$props => {
    		if ('myDate' in $$props) myDate = $$props.myDate;
    		if ('user' in $$props) $$invalidate(0, user = $$props.user);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [user];
    }

    class WorkoutNew extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WorkoutNew",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* client/App.svelte generated by Svelte v3.48.0 */
    const file$a = "client/App.svelte";

    // (14:4) <Route exact path="/">
    function create_default_slot_5(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(home.$$.fragment, nodes);
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
    		source: "(14:4) <Route exact path=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (15:4) <Route path="#about">
    function create_default_slot_4(ctx) {
    	let about;
    	let current;
    	about = new About({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(about.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(about.$$.fragment, nodes);
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
    		source: "(15:4) <Route path=\\\"#about\\\">",
    		ctx
    	});

    	return block;
    }

    // (16:4) <Route exact path="#bruh">
    function create_default_slot_3(ctx) {
    	let workoutview;
    	let current;
    	workoutview = new WorkoutView({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(workoutview.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(workoutview.$$.fragment, nodes);
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
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(16:4) <Route exact path=\\\"#bruh\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:4) <Route path="/workouts/:id" let:router       >
    function create_default_slot_2(ctx) {
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
    		l: function claim(nodes) {
    			claim_component(workoutview.$$.fragment, nodes);
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(17:4) <Route path=\\\"/workouts/:id\\\" let:router       >",
    		ctx
    	});

    	return block;
    }

    // (20:4) <Route exact path="/workouts/new">
    function create_default_slot_1(ctx) {
    	let workoutnew;
    	let current;
    	workoutnew = new WorkoutNew({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(workoutnew.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(workoutnew.$$.fragment, nodes);
    		},
    		m: function mount(target, anchor) {
    			mount_component(workoutnew, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(workoutnew.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(workoutnew.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(workoutnew, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(20:4) <Route exact path=\\\"/workouts/new\\\">",
    		ctx
    	});

    	return block;
    }

    // (13:2) <Router>
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
    				exact: true,
    				path: "#bruh",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route3 = new Route({
    			props: {
    				path: "/workouts/:id",
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
    				path: "/workouts/new",
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
    		l: function claim(nodes) {
    			claim_component(route0.$$.fragment, nodes);
    			t0 = claim_space(nodes);
    			claim_component(route1.$$.fragment, nodes);
    			t1 = claim_space(nodes);
    			claim_component(route2.$$.fragment, nodes);
    			t2 = claim_space(nodes);
    			claim_component(route3.$$.fragment, nodes);
    			t3 = claim_space(nodes);
    			claim_component(route4.$$.fragment, nodes);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route0, target, anchor);
    			insert_hydration_dev(target, t0, anchor);
    			mount_component(route1, target, anchor);
    			insert_hydration_dev(target, t1, anchor);
    			mount_component(route2, target, anchor);
    			insert_hydration_dev(target, t2, anchor);
    			mount_component(route3, target, anchor);
    			insert_hydration_dev(target, t3, anchor);
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

    			if (dirty & /*$$scope, router*/ 3) {
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
    		source: "(13:2) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
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
    			this.h();
    		},
    		l: function claim(nodes) {
    			main = claim_element(nodes, "MAIN", {});
    			var main_nodes = children(main);
    			claim_component(nav.$$.fragment, main_nodes);
    			t0 = claim_space(main_nodes);
    			claim_component(router.$$.fragment, main_nodes);
    			t1 = claim_space(main_nodes);
    			claim_component(footer.$$.fragment, main_nodes);
    			main_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			add_location(main, file$a, 10, 0, 329);
    		},
    		m: function mount(target, anchor) {
    			insert_hydration_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_hydration_dev(main, t0);
    			mount_component(router, main, null);
    			append_hydration_dev(main, t1);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    		WorkoutView,
    		WorkoutNew
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
