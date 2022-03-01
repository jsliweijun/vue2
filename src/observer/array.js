let oldArrayPrototype = Array.prototype;

export let arrayMethods = Object.create(oldArrayPrototype);
// 这个创建的对像，的原型链 __proto__ 指向 Array.prototype
// arrayMerhods.__proto__ = Array.prototype 继承

let methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice'];

methods.forEach((method) => {
    // 用户调用上面 7 个方法，会使用这里重写的，否则使用原理数组 原生的方法。
    arrayMethods[method] = function (...args) {
        console.log('数组变化了');

        // 调用数组原生的方法
        oldArrayPrototype[method].call(this, ...args);

        // arr.push({a:1})

        // 新数据进行添加get set 方法

        let inserted;
        let ob = this.__ob__;
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args; // 新增的数据
                break;
            case 'splice':
                inserted = args.slice(2);
            default:
                break;
        }

        // 如果有新增的内容需要进行集训劫持，需要观测数组里面的每一项。
        if (inserted) {
            ob.observeArray(inserted);
        }
    };
});
