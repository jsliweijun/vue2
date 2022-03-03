import { compileToFunction } from './compiler/index';
import { callHook, mountComponent } from './lifecycle';
import { initState } from './state';
import { mergeOptions } from './utils';

//  在 vue 上进行一次混合操作，扩展添加方法
export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        // console.log(options);
        // el , data
        const vm = this;
        // vm.$options = options; // 选项，用户使用时会调用 $options ,所以框架底层进行这样创建，后面会扩展他
        vm.$options = mergeOptions(vm.constructor.options, options);

        // 调用生命周期钩子
        callHook(vm, 'beforeCreate');

        // 对数据进行初始化，watch  computed props  data ，都是数据
        //  数据劫持：就是当操作数据时，让我们知道了修改了，获取了这个数据，然后我们就可以进行做 更新试图 等功能。
        // 加get set 方法，第一步是加了数据监控等功能，
        initState(vm); // vm.$options.data 将数据处理放在另外一个方法中，状态初始化

        callHook(vm, 'created');

        // 将数据挂在 模版上
        if (vm.$options.el) {
            // 将数据挂载到这个模板上
            vm.$mount(vm.$options.el);
        }
        // 有可能传入 template：“” ， render:h() //优先级高
    };

    Vue.prototype.$mount = function (el) {
        const vm = this;
        const options = vm.$options;
        el = document.querySelector(el);
        vm.$el = el;
        // 把模版转化成 对应的渲染函数  =》 虚拟 DOM 概念， vnode  =》 diff 算法 更新虚拟dom =》 产生真实的节点，更新
        if (!options.render) {
            let template = options.template;
            if (!template && el) {
                template = el.outerHTML;
                let render = compileToFunction(template);
                options.render = render; // 就是渲染函数
            }
        }
        // options.render  就是渲染函数
        console.log(options.render); // 调用render 方法 ，渲染成真实 dom 替换掉页面的内容

        // new Vue() 的过程叫做组件，这个组件能自动实现组件挂载，放在真实的页面中。
        mountComponent(vm, el); // 组件的挂载流程，挂载到 el 元素上。在生命周期的方法中执行完成挂载
    };
}
