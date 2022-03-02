import { isObject } from '../utils';
import { arrayMethods } from './array';
import Dep from './dep';

// 总结  vue源码中 响应式原理， 编译原理（模版）  diff算法。
// 1. 如果数据是对象， 会将对象不停的递归 进行 劫持，（添加 get set 方法）
// 2. 如果数据是数组，会劫持数组的方法，修改数组中的原型链 __proto__ 指向我们的对象， 并对数组中不是基本数据类型的进行监测。

// 监测数据变化 ，类有类型，知道是它的实例

// 如果给对象新增一个属性不会触发视图更新，需要使用 $set 将属性变成响应式的才可以
// 给对象本身增加一个 dep ，dep中存watcher ，如果增加一个属性后，我就手动的触发 watcher 的更新
class Observer {
    // 对对象中的所有属性进行劫持，绑定 get /set 方法， 循环对象属性
    constructor(data) {
        // 每个数据对象（可能是对象，数组），都有一个 dep，记录哪个watcher 使用了这个数据
        this.dep = new Dep();

        Object.defineProperty(data, '__ob__', {
            value: this,
            enumerable: false
        });
        // data.__ob__ = this; // 被劫持过的属性都有 __ob__ ,下面遍历时要不能遍历的这个属性

        // 数组变化可以触发视图更新？
        if (Array.isArray(data)) {
            // 数组劫持的逻辑
            // 对数组原来对方法进行改写，切面编程，高阶函数
            // 只修改这个数组中的方法， 外部的数组不受影响
            data.__proto__ = arrayMethods;

            // 如果数组中的数据上对象类型，需要监控对象的变化
            this.observeArray(data);
        } else {
            this.walk(data);
        }
    }

    // 进行对数组中的数组，对象进行劫持，采用递归
    observeArray(data) {
        data.forEach((item) => {
            observe(item);
        });
    }

    // 循环对象属性，将这个对象的属性 设置成响应式的
    walk(data) {
        // 这个方式不会 获取data 原型中的属性。
        Object.keys(data).forEach((key) => {
            defineReactive(data, key, data[key]);
        });
    }
}

function dependArray(value) {
    for (let i = 0; i < value.length; i++) {
        let current = value[i]; // current 是数组里面的数组 [[[[[多层]]]]]
        current.__ob__ && current.__ob__.dep.depend(); // 进行依赖收集
        if (Array.isArray(current)) {
            dependArray(current);
        }
    }
}

// vue2 会对对象进行遍历，将每个属性 用 define Property 重新定义，性能差，不断递归
// {arr:[1,2,3,[a,b,c]]}
function defineReactive(data, key, value) {
    let childOb = observe(value); // 进行递归下面的属性,对象套对象

    // arr  [1,2,3]
    // childOb 是数组对应的 ob

    // 每个属性都有一个dep 属性，它记录有哪些组件使用到了这个属性
    let dep = new Dep();
    Object.defineProperty(data, key, {
        get() {
            console.log(dep, key);
            // 取值时，将 watcher 和 dep 对应起来
            // 这个get调用，是模版中调用 {{name}} 进行取值
            if (Dep.target) {
                dep.depend(); // 让 dep记住 watcher

                if (childOb) {
                    // chidlOb 可能是数组，也可能是对象，对象也要收集依赖，后续 $set 方法也需要触发视图更新
                    childOb.dep.depend(); // 数组数据对象，收集依赖 watcher ，倒是这个数组数据变化了，它就通知使用了这个数组的组件进行视图更新

                    // 对数组里的每一项也进行依赖收集 [[1],[2]]
                    if (Array.isArray(value)) {
                        // 给数组里面的每一项也进行依赖收集，当里面每一项修改后，它们会通知视图更新
                        dependArray(value);
                    }
                }
            }
            return value;
        },
        set(newV) {
            // todo  更新视图

            if (newV !== value) {
                // 把用户设置的值也进行劫持，赋值一个新对象
                observe(newV);
                value = newV;
                dep.notify(); // 告诉当前的属性存放的watcher 执行
            }
        }
    });
}

// 观测数据
export function observe(data) {
    // 如果是对象才观测

    if (!isObject(data)) {
        return;
    }
    if (data.__ob__) {
        return data.__ob__; // 数据本身 this Observer实例
    }

    // 默认最外层的data 必须是一个对象
    // 给这些数据，创建一个观察者
    return new Observer(data);
}
