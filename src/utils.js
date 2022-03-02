export function isFunction(val) {
    return typeof val === 'function';
}

export function isObject(val) {
    return typeof val === 'object' && val !== null;
}

const callbacks = [];

function flushCallbacks() {
    callbacks.forEach((cb) => cb());
    waiting = false;
}

let waiting = false;
export function nextTick(cb) {
    callbacks.push(cb); // flushSchedulerQueue  /userCallback  都在这，

    if (!waiting) {
        // vue3 不考虑兼容性直接这样。
        Promise.resolve().then(flushCallbacks);
        waiting = true;
    }
}
