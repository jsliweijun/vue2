import { observe } from './observer/index'; // node_resolve_plugin 这个插件就能自动找目录下的index 文件
import { isFunction } from './utils';

// 状态的初始化
export function initState(vm) {
    const opts = vm.$options;

    if (opts.data) {
        initData(vm);
    }

    // computed 与 watch 的区别
    // if (opts.computed) {
    //     initComputed();
    // }
    // if (opts.watch) {
    //     initWatch();
    // }
}

// 用户传入的数据，要将它们变成响应式的。怎么做呢？
function initData(vm) {
    let data = vm.$options.data;

    // vue2中会将 data 中的所有数据，进行数据劫持 Object.defineProperty()
    // data 可能是对象，函数，需要判断。 当是函数时，函数里面的this 都是vue 实例
    // vm 和 data 没有任何关系，通过 _data 进行关联
    data = vm._data = isFunction(data) ? data.call(vm) : data;
    // console.log(data, '----');
    //  这里就获取到数据了，就要进行数据的响应式功能
    observe(data);
}
