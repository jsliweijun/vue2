import { initMixin } from './init';
import { renderMixin } from './render';
import { lifecycleMixin } from './lifecycle';

// Vue 是一个构造函数
function Vue(options) {
    this._init(options);
}

// 这样添加会写很多这样的代码，实现功能拆分到其他文件中，使用下面mixin 方式，扩展原型方法
// Vue.prototype._init = function(){}

// 给构造函数，添加实例公共方法
// 扩展原型
initMixin(Vue);
renderMixin(Vue); // _render
lifecycleMixin(Vue); // _update

export default Vue;
