import { isObject, isReservedTag } from '../utils';

export function createElement(vm, tag, data = {}, ...children) {
    // tag 可能是一个 组件， 应该渲染一个组件的 vnode

    if (isReservedTag(tag)) {
        return vnode(vm, tag, data, data.key, children, undefined);
    } else {
        console.log(tag);
        const Ctor = vm.$options.components[tag];
        return createComponent(vm, tag, data, data.key, children, Ctor);
    }
}

// 创建组件的虚拟节点, 传入的组件可能是对象，也可能是函数
// 为了区分组件和原生元素 ， data.hook , componentOption
function createComponent(vm, tag, data, key, children, Ctor) {
    if (isObject(Ctor)) {
        Ctor = vm.$options._base.extend(Ctor);
    }
    // console.log('Ctor', Ctor);

    // 渲染组件时，需要调用此初始化方法。
    data.hook = {
        init(vnode) {
            // 如何将子组件对象 变成真实dom
            let vm = (vnode.componentInstance = new Ctor({
                _isComponent: true
            })); // 创建子组件, 会进行将该选项和组件的配置进行合并。
            vm.$mount(); // 组件挂载完毕后， 会在 vnode.componentInstance.$el => <button>
        }
    };

    return vnode(vm, `vue-component-${tag}`, data, key, undefined, undefined, {
        Ctor,
        children
    });
}

export function createTextElement(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
}

function vnode(vm, tag, data, key, children, text, componentOptions) {
    return { vm, tag, data, key, children, text, componentOptions };
}
