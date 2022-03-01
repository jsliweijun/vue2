import { createElement, createTextElement } from './vdom/index';

export function renderMixin(Vue) {
    // 节点，产生虚拟节点
    Vue.prototype._c = function () {
        return createElement(this, ...arguments);
    };

    // 文本 , 创建文本元素
    Vue.prototype._v = function (text) {
        return createTextElement(this, text);
    };

    // 变量
    Vue.prototype._s = function (val) {
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
    };

    Vue.prototype._render = function () {
        console.log('render'); // render 比 update 先执行

        const vm = this;

        // 这个方法中的 js 代码会有 _c, _s, _v 这些方法，需要定义这些方法
        let render = vm.$options.render; // 就是解析出来的 render 方法，同时也有可能是用户写的

        let vnode = render.call(vm);

        return vnode;
    };
}
