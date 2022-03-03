import { mergeOptions } from '../utils';

export function initGloabalApi(Vue) {
    // 用来存放全局配置的， Vue.component  , Vue.filters  Vue.directives  都放在这个对象里面
    // 每个组件初始化时候都会和这个 options 进行合并
    Vue.options = {};
    Vue.mixin = function (options) {
        // 生命周期方法合并是放在一个数组里     {}    {beforeCreate:fn}  => {beforecreate:[fn]}
        //                                 {beforecreate:[fn]}  {beforecreate:fn}  => {beforecreate:[fn,fn]}
        this.options = mergeOptions(this.options, options);
        // console.log(this.options);
        return this;
    };

    //
    Vue.options._base = Vue; // 无论后续创建的多少个子类，都可以通过这个 _base 找到 Vue
    Vue.options.components = {};
    Vue.component = function (id, definition) {
        // 保证组件的隔离， 每个组件都会产生一个新的类，去继承父类。
        definition = this.options._base.extend(definition);
        this.options.components[id] = definition;

        // 选项合并 组件内的 compoents 比 Vue.component() 定义的组件级别高。这里要用继承的方式。
    };

    // 给一个对象，返回一个类
    // extend 方法就是产生一个继承于 Vue 的类，并且身上应该有父类的所有功能。
    Vue.extend = function (opts) {
        const Super = this;
        // 每个组件一个子类，什么时候被创建成对象？
        const Sub = function VueComponent(options) {
            this._init(options);
        };
        Sub.prototype = Object.create(Super.prototype);
        Sub.prototype.constructor = Sub;
        Sub.options = mergeOptions(Super.options, opts);
        return Sub;
    };
}
