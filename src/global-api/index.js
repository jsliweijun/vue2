import { mergeOptions } from '../utils';

export function initGloabalApi(Vue) {
    // 用来存放全局配置的， Vue.component  , Vue.filters  Vue.directives  都放在这个对象里面
    // 每个组件初始化时候都会和这个 options 进行合并
    Vue.options = {};
    Vue.mixin = function (options) {
        // 生命周期方法合并是放在一个数组里     {}    {beforeCreate:fn}  => {beforecreate:[fn]}
        //                                 {beforecreate:[fn]}  {beforecreate:fn}  => {beforecreate:[fn,fn]}
        this.options = mergeOptions(this.options, options);
        console.log(this.options);
        return this;
    };
}
