import { isObject } from '../utils';

// 监测数据变化 ，类有类型，知道是它的实例
class Observer {
    // 对对象中的所有属性进行劫持，绑定 get /set 方法， 循环对象属性
    constructor(data) {
        this.walk(data);
    }

    // 循环对象属性，将这个对象的属性 设置成响应式的
    walk(data) {
        // 这个方式不会 获取data 原型中的属性。
        Object.keys(data).forEach((key) => {
            defineReactive(data, key, data[key]);
        });
    }
}

// vue2 会对对象进行遍历，将每个属性 用 define Property 重新定义，性能差，不断递归
function defineReactive(data, key, value) {
    observe(value); // 进行递归下面的属性,对象套对象
    Object.defineProperty(data, key, {
        get() {
            return value;
        },
        set(newV) {
            // 把用户设置的值也进行劫持，赋值一个新对象
            observe(newV);
            value = newV;
        }
    });
}

// 观测数据
export function observe(data) {
    // 如果是对象才观测

    if (!isObject(data)) {
        return;
    }

    // 默认最外层的data 必须是一个对象
    // 给这些数据，创建一个观察者
    return new Observer(data);
}
