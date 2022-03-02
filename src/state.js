import { observe } from './observer/index'; // node_resolve_plugin 这个插件就能自动找目录下的index 文件
import Watcher from './observer/watcher';
import { isFunction } from './utils';

// 状态的初始化
export function initState(vm) {
    const opts = vm.$options;

    if (opts.data) {
        initData(vm);
    }

    // computed 与 watch 的区别
    if (opts.computed) {
        initComputed(vm, opts.computed);
    }
    if (opts.watch) {
        initWatch(vm, opts.watch);
    }
}

export function stateMixin(Vue) {
    // 渲染 watcher 通过 页面使用数据调用get
    // 用户 watcher 是通过调用 get方式实现 依赖收集的
    Vue.prototype.$watch = function (key, handler, options = {}) {
        // watch 可以传入选项参数 deep immediate
        options.user = true; // 是用户写的 watcher

        // vm name ,用户回调， options.user
        let watcher = new Watcher(this, key, handler, options);

        // 实现立即执行
        if (options.immediate) {
            handler(watcher.value);
        }
    };
}

function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
        get() {
            return vm[source][key];
        },
        set(newValue) {
            vm[source][key] = newValue;
        }
    });
}

// 用户传入的数据，要将它们变成响应式的。怎么做呢？
function initData(vm) {
    let data = vm.$options.data;

    // vue2中会将 data 中的所有数据，进行数据劫持 Object.defineProperty()
    // data 可能是对象，函数，需要判断。 当是函数时，函数里面的this 都是vue 实例
    // vm 和 data 没有任何关系，通过 _data 进行关联
    data = vm._data = isFunction(data) ? data.call(vm) : data;
    // console.log(data, '----');

    // 将 data 中数据代理到 vm上， 可以直接到 vm 获取数据
    // 用户 vm.name 等价于 vm._data.name
    for (let key in data) {
        proxy(vm, '_data', key);
    }

    //  这里就获取到数据了，就要进行数据的响应式功能
    observe(data);
}

function initWatch(vm, watch) {
    for (let key in watch) {
        let handler = watch[key];

        if (Array.isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                createWatcher(vm, key, handler[i]);
            }
        } else {
            createWatcher(vm, key, handler);
        }
    }
}

function createWatcher(vm, key, handler) {
    return vm.$watch(key, handler);
}

// 多个计算属性，多个 watcher
function initComputed(vm, computed) {
    for (let key in computed) {
        const userDef = computed[key];

        // 依赖的属性变化就重新取值 get
        let getter = typeof userDef == 'function' ? userDef : userDef.get;

        // 每个计算属性就是 watcher
        new Watcher(vm, getter, () => {}, { lazy: true }); // 默认不执行

        // 将 key 定义在 vm 上， 才有了计算属性能使用
        defineComputed(vm, key, userDef); // 就是一个 defineProperty
    }
}

function defineComputed(vm, key, userDef) {
    let sharedProperty = {};
    if (typeof userDef == 'function') {
        sharedProperty.get = userDef;
    } else {
        sharedProperty.get = userDef.get;
        sharedProperty.set = userDef.set;
    }
    Object.defineProperty(vm, key, sharedProperty);
}
