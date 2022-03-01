export function patch(oldVnode, vnode) {
    if (oldVnode.nodeType == 1) {
        // 用vnode  来生成真实dom 替换原来的 dom 元素
        const parentElm = oldVnode.parentNode;
        let elm = createElm(vnode);
        parentElm.insertBefore(elm, oldVnode.nextSibling);

        parentElm.removeChild(oldVnode);
        return elm;
    }
}

function createElm(vnode) {
    let { tag, data, children, text, vm } = vnode;
    if (typeof tag === 'string') {
        vnode.el = document.createElement(tag);
        children.forEach((child) => {
            vnode.el.appendChild(createElm(child));
        });
    } else {
        vnode.el = document.createTextNode(text);
    }
    return vnode.el;
}
