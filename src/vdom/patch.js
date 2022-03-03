export function patch(oldVnode, vnode) {
    if (!oldVnode) {
        return createElm(vnode); // 如果没有 el 元素，那就直接根据虚拟节点返回真实节点。 子组件场景
    }

    if (oldVnode.nodeType == 1) {
        // 用vnode  来生成真实dom 替换原来的 dom 元素
        const parentElm = oldVnode.parentNode;
        let elm = createElm(vnode);
        parentElm.insertBefore(elm, oldVnode.nextSibling);

        parentElm.removeChild(oldVnode);
        return elm;
    }
}

// 创建组件

function createComponent(vnode) {
    let i = vnode.data;
    if ((i = i.hook) && (i = i.init)) {
        i(vnode); // 调用 init 方法
    }

    if (vnode.componentInstance) {
        // 有属性说明子组件new 完毕了， 并且组件对应的真实dom
        return true;
    }
}

// 创建真实的元素 dom
function createElm(vnode) {
    let { tag, data, children, text, vm } = vnode;
    if (typeof tag === 'string') {
        if (createComponent(vnode)) {
            // 返回组件的真实节点
            return vnode.componentInstance.$el;
        }

        vnode.el = document.createElement(tag);
        children.forEach((child) => {
            vnode.el.appendChild(createElm(child));
        });
    } else {
        vnode.el = document.createTextNode(text);
    }
    return vnode.el;
}
