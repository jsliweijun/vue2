import Watcher from './observer/watcher';
import { patch } from './vdom/patch';

export function lifecycleMixin(Vue) {
    // 传入的是 虚拟dom 节点, 虚拟dom 变成真实dom
    Vue.prototype._update = function (vnode) {
        console.log('update', vnode);
        const vm = this;
        vm.$el = patch(vm.$el, vnode);
    };
}

// 后续每个组件渲染的时候都会有一个 watcher
export function mountComponent(vm, el) {
    // vue的实现很简单：做了个更新方法（初次执行，内容更新后执行）
    // 更新函数，数据变化后，会再次调用此函数
    let updateComponent = () => {
        // 调用 render函数，生成虚拟 DOM
        vm._update(vm._render()); // 后续更新可以调用 updateComponent方法。 这两个实例方法在哪写？
        // 用虚拟 dom 生成真实 dom
    };

    // 使用观察者模式，实现数据变化页面更新： 属性是“被观察者”  ， 刷新页面：“观察者”
    // updateComponent();

    // 他是一个渲染watcher ，后续还有其他watcher
    // 渲染一个组件
    new Watcher(
        vm,
        updateComponent,
        () => {
            console.log('更新视图了');
        },
        true
    );
}
