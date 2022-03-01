import { patch } from './vdom/patch';

export function lifecycleMixin(Vue) {
    // 传入的是 虚拟dom 节点, 虚拟dom 变成真实dom
    Vue.prototype._update = function (vnode) {
        console.log('update', vnode);
        const vm = this;
        patch(vm.$el, vnode);
    };
}

export function mountComponent(vm, el) {
    // vue的实现很简单：做了个更新方法（初次执行，内容更新后执行）
    // 更新函数，数据变化后，会再次调用此函数
    let updateComponent = () => {
        // 调用 render函数，生成虚拟 DOM
        vm._update(vm._render()); // 后续更新可以调用 updateComponent方法。 这两个实例方法在哪写？
        // 用虚拟 dom 生成真实 dom
    };

    updateComponent();
}
