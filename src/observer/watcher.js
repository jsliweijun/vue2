import { popTarget, pushTarget } from './dep';

let id = 0;

// 一个watcher 可以理解为一个组件，这个组件上使用了多个属性 {{name}} {{age}}
// 所以需要记住多个 dep ，每个dep 就是一个属性
class Watcher {
    //  vm,  updateComponent,  () => {  console.log('更新视图了');   },   true
    constructor(vm, exprOrFn, cb, options) {
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        this.cb = cb;
        this.options = options;
        this.id = id++; // 每个实例都身份证号

        this.deps = [];
        this.depsId = new Set();

        // 默认应该让 exprOrFn 执行， exprOrFn 方法做了什么？ 执行render （去vm 上进行取值了），所以可以理解为 getter

        this.getter = exprOrFn; // render(){_c(div,{},_v(name))}

        this.get(); // 默认初始化， 要取值
    }

    get() {
        // 稍后用户更新时，可以重新调研 getter 方法

        // 执行下面方法，会执行属性的 defineProperty.get 方法， 每个属性都可以收集自己的 watcher
        // 希望一个属性可以对应多个 watcher ，同时一个 watcher 可以对应多个属性。 使用 dep 管理它们多对多的关系。
        pushTarget(this); // Dep.target = watcher
        this.getter(); // render（） 方法对取 vm 上取值， vm._update(vm._render())
        popTarget(); // Dep.target = null , 如果 Dep.target 有值就说明这个变量在模版中使用了。
    }

    update() {
        console.log('属性更新，也没渲染，更新视图');
        this.get();
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
