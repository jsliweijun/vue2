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

let lifeCycleHooks = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'beforeDestroy',
    'destroyed'
];

//let strategy;
// 存放各种策略
let strats = {};

lifeCycleHooks.forEach((hook) => {
    strats[hook] = mergeHook;
});

// 钩子函数合并的原理
function mergeHook(parentVal, childVal) {
    if (childVal) {
        if (parentVal) {
            return parentVal.concat(childVal);
        } else {
            return [childVal];
        }
    } else {
        return parentVal;
    }
}

export function mergeOptions(parent, child) {
    const options = {}; // 合并后的结果

    for (let key in parent) {
        mergeField(key);
    }

    //处理 child 中新的属性
    for (let key in child) {
        if (parent.hasOwnProperty(key)) {
            continue;
        }
        mergeField(key);
    }

    function mergeField(key) {
        let parentVal = parent[key];
        let chidlVal = child[key];

        // 采用策略模式，针对不同的属性进行合并
        if (strats[key]) {
            // 如果有对应的策略就调用对应的策略即可
            options[key] = strats[key](parentVal, chidlVal);
        } else {
            if (isObject(parentVal) && isObject(chidlVal)) {
                options[key] = { ...parentVal, ...chidlVal };
            } else {
                options[key] = child[key] || parent[key];
            }
        }
    }

    return options;
}
