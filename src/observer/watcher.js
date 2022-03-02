import { popTarget, pushTarget } from './dep';
import { queueWatcher } from './scheduler';

let id = 0;

// 一个watcher 可以理解为一个组件，这个组件上使用了多个属性 {{name}} {{age}}
// 所以需要记住多个 dep ，每个dep 就是一个属性
class Watcher {
    //  vm,  updateComponent,  () => {  console.log('更新视图了');   },   true
    constructor(vm, exprOrFn, cb, options) {
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        this.user = !!options.user; // 标识是不是用户 watcher
        this.cb = cb;
        this.options = options;
        this.id = id++; // 每个实例都身份证号

        this.deps = [];
        this.depsId = new Set();

        // 默认应该让 exprOrFn 执行， exprOrFn 方法做了什么？ 执行render （去vm 上进行取值了），所以可以理解为 getter

        if (typeof exprOrFn == 'string') {
            this.getter = function () {
                //需要将表达式转化为函数

                //进行数据取值，进行依赖收集
                // age.n  vm['age.n'] => vm[age][n]
                let path = exprOrFn.split('.');
                let obj = vm;
                for (let i = 0; i < path.length; i++) {
                    obj = obj[path[i]];
                }
                return obj;
            };
        } else {
            this.getter = exprOrFn; // render(){_c(div,{},_v(name))}
        }

        // 第一次的vlaue
        this.value = this.get(); // 默认初始化， 要取值
    }

    get() {
        // 稍后用户更新时，可以重新调研 getter 方法

        // 执行下面方法，会执行属性的 defineProperty.get 方法， 每个属性都可以收集自己的 watcher
        // 希望一个属性可以对应多个 watcher ，同时一个 watcher 可以对应多个属性。 使用 dep 管理它们多对多的关系。
        pushTarget(this); // Dep.target = watcher
        const value = this.getter(); // render（） 方法对取 vm 上取值， vm._update(vm._render())
        popTarget(); // Dep.target = null , 如果 Dep.target 有值就说明这个变量在模版中使用了。
        return value;
    }

    // vue 中的更新操作是异步的
    update() {
        //  console.log(
        //     '属性更新，也没渲染，更新视图， 这种方式多次修改，更新视图多次，性能不好。实现异步更新'
        // );
        // this.get();

        // 每次更新时，就是 this 执行， 就是 watcher 执行，可以将 watcher 缓存起来，最后一次一起执行更新，
        // 采用异步更新

        queueWatcher(this);
    }

    // 用户更新会执行这个方法
    run() {
        let newValue = this.get();
        let oldVlaue = this.value;
        this.value = newValue;
        if (this.user) {
            this.cb.call(this.vm, newValue, oldVlaue);
        }
    }

    // 记住这个组件模版中使用了哪些属性数据 {{name}} {{name}}  {{age}}
    // 一个模版中使用了 多次 name ，只需要记住一次就够了
    addDep(dep) {
        let id = dep.id;
        if (!this.depsId.has(id)) {
            this.depsId.add(id);
            this.deps.push(dep);
            dep.addSub(this);
        }
    }
}

export default Watcher;
