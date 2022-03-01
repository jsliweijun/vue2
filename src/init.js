import { initState } from './state';

//  在 vue 上进行一次混合操作，扩展添加方法
export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        // console.log(options);
        // el , data
        const vm = this;
        vm.$options = options; // 选项，用户使用时会调用 $options ,所以框架底层进行这样创建，后面会扩展他

        // 对数据进行初始化，watch  computed props  data ，都是数据
        initState(vm); // vm.$options.data 将数据处理放在另外一个方法中，状态初始化
    };
}
