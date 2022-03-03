(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    /**
     * 对正则对熟悉程度
     */
    var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*"; // 标签名

    var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")"); //  用来获取的标签名的 match后的索引为1的

    var startTagOpen = new RegExp("^<".concat(qnameCapture)); // 匹配开始标签的

    var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // 匹配闭合标签的
    //           aa  =   "  xxx "  | '  xxxx '  | xxx

    var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'

    var startTagClose = /^\s*(\/?)>/; //     />   <div/>
    // html 字符传解析成 对应的脚本 来触发 tokens <div id="app">{{name}}</div>

    function parserHTML(html) {
      /**
       *  将解析后的结果，组装层一个树结构 ，通过 栈 实现。
       */
      function createAstElement(tagName, attrs) {
        return {
          tag: tagName,
          type: 1,
          children: [],
          parent: null,
          attrs: attrs
        };
      } // 每遇见一个开始标签就创建一个 element 元素 ，然后放入栈中，构建树，记录parent


      function start(tagName, attribute) {
        // console.log(tagName,attribute)
        var parent = stack[stack.length - 1];
        var element = createAstElement(tagName, attribute);

        if (!root) {
          root = element;
        }

        if (parent) {
          element.parent = parent; // 当放入栈中时，记录父亲是谁

          parent.children.push(element);
        }

        stack.push(element);
      }

      function end(tagName) {
        // console.log(tagName)
        var last = stack.pop();

        if (last.tag !== tagName) {
          throw new Error('标签有错误');
        }
      }

      function chars(text) {
        // console.log(text)
        text = text.replace(/\s/g, '');
        var parent = stack[stack.length - 1];

        if (text) {
          parent.children.push({
            type: 3,
            text: text
          });
        }
      }

      var root = null; // 根元素(自定义组件时它时独立的)

      var stack = [];

      function advance(len) {
        html = html.substring(len);
      }

      function parserStartTag() {
        var start = html.match(startTagOpen); //  console.log('parserStartTag start',start)

        if (start) {
          // match 不是 ast ，只是一个对象
          var match = {
            tagName: start[1],
            attrs: []
          };
          advance(start[0].length); // console.log(html) // id="app">{{name}}</div>
          // 进行匹配开始标签中的属性

          var _end;

          var attr; //  如果没有遇到开始标签的结尾就不停的解析

          while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            // console.log('attr',attr)
            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5]
            });
            advance(attr[0].length); // 一边解析，一边删除
          } // 去掉开始标签的 > 字符


          if (_end) {
            advance(_end[0].length);
          } // console.log('处理完开始标签后的  html ',html)


          return match;
        }

        return false; // 不是开始标签
      } // 看要解析对内容是否存在，如果存在就不停的解析


      while (html) {
        var textEnd = html.indexOf('<');

        if (textEnd === 0) {
          var startTagMatch = parserStartTag(); // 解析开始标签

          if (startTagMatch) {
            start(startTagMatch.tagName, startTagMatch.attrs);
            continue;
          }

          var endTagMatch = html.match(endTag);

          if (endTagMatch) {
            end(endTagMatch[1]);
            advance(endTagMatch[0].length);
          }
        } // -----


        var text = void 0; // 123123</div>  取到 123123 的文本内容

        if (textEnd > 0) {
          text = html.substring(0, textEnd);
        }

        if (text) {
          chars(text);
          advance(text.length);
        }
      }

      return root;
    }

    var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaa}}
    // 要将 ast 的属性转换成字符串形式 [{name:'xx',value:'yy'}]  => xx=yy

    function genProps(attrs) {
      var str = '';

      for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i]; // 要处理样式  color:red;background:blue

        if (attr.name === 'style') {
          (function () {
            var styleObj = {};
            attr.value.replace(/([^;:]+)\:([^;:]+)/g, function () {
              styleObj[arguments[1]] = arguments[2];
            });
            attr.value = styleObj;
          })();
        }

        str += "".concat(attr.name, ":").concat(JSON.stringify(attr.value), ",");
      } // a:1,b:2, 将最后一个 逗号去掉


      return "{".concat(str.slice(0, -1), "}");
    }

    function gen(el) {
      if (el.type == 1) {
        return generate(el);
      } else {
        var text = el.text; // 匹配 大括号 {{}}

        if (!defaultTagRE.test(text)) {
          return "_v('".concat(text, "')");
        } else {
          console.log('11111111', text); // hello {{name}}  world 变成=》 'hello' + name + 'world'  ; name  是变量.

          var tokens = [];
          var match;
          var lastIndex = defaultTagRE.lastIndex = 0; // 正则执行过一次之后会不在匹配了，需要重写进行。

          while (match = defaultTagRE.exec(text)) {
            // 看有没有匹配到
            console.log('2222', match);
            var index = match.index; // 开始索引

            if (index > lastIndex) {
              tokens.push(JSON.stringify(text.slice(lastIndex, index)));
            } // 这个变量有可能是对象


            tokens.push("_s(".concat(match[1].trim(), ")")); // _s 就是 JSON.stringfly()

            lastIndex = index + match[0].length;
          }

          if (lastIndex < text.length) {
            tokens.push(JSON.stringify(text.slice(lastIndex)));
          }

          return "_v(".concat(tokens.join('+'), ")");
        }
      }
    }

    function genChildren(el) {
      var children = el.children;

      if (children) {
        return children.map(function (c) {
          return gen(c);
        }).join(',');
      }

      return false;
    } // html 字符串 =》 字符串  _c('div',{id:'app',a:1},'hello')
    // _c() 创建元素虚拟节点  _v() 创建文本的虚拟节点
    // 目标： _c('div',{id:'app',a:1},'hello')


    function generate(el) {
      console.log('generate  ', el);
      var children = genChildren(el); // 遍历树，将树拼接成字符串 。 生成 儿子 需要不断遍历  children => '','','' 多个

      var code = "_c('".concat(el.tag, "' ,").concat(el.attrs.length ? genProps(el.attrs) : 'undefined', " ").concat(children ? " , ".concat(children) : '', " )");
      return code;
    }

    /**
     * 将模版内容转换成 render() 函数进行执行
     *    1. 解析 html，生成 AST 树
     *    2. 生成可执行的代码 code 。 类似变成了 React.createElement() 结构 js 代码
     *    3.
     */

    function compileToFunction(template) {
      // console.log('compileToFunction',template)
      var root = parserHTML(template);
      console.log('AST 树', root); // 这个 ast 树是一个 js 对象，描述成标签树的标签类型，层级.
      // 具体对象 {tag：div，attrs:{},children：[],type:1,parent:null}
      // 生成代码

      var code = generate(root); // 返回的是 js 代码,可用于进行创建虚拟 dom ，虚拟DOM 实现原理

      console.log('code: ', code); // code:  _c('div' ,{id:"app",test:"1",style:{"color":" red"," background-color":" aqua"}}  , _c('span' ,undefined  , _v("myage:"+_s(age)+"ssssss"+_s(test)+"'ssssss'") ),_v(_s(name)) )

      var render = new Function("with(this){return ".concat(code, "}"));
      return render; // html => ast (只能描述语法，语法不存在的属性无法描述)  =>  render 函数 （new Function + with）
      // =》 虚拟 DOM （增加额外的属性） =》 生成真实 dom
    }

    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }

      return keys;
    }

    function _objectSpread2(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }

      return target;
    }

    function _typeof(obj) {
      "@babel/helpers - typeof";

      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      }, _typeof(obj);
    }

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", {
        writable: false
      });
      return Constructor;
    }

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    var id$1 = 0;

    var Dep = /*#__PURE__*/function () {
      function Dep() {
        _classCallCheck(this, Dep);

        this.id = id$1++;
        this.subs = [];
      }

      _createClass(Dep, [{
        key: "depend",
        value: function depend() {
          // Dep.target  dep 里面要存放这个 watcher， watcher要存放dep  多对多的关系
          if (Dep.target) {
            Dep.target.addDep(this);
          }
        }
      }, {
        key: "addSub",
        value: function addSub(watcher) {
          this.subs.push(watcher);
        }
      }, {
        key: "notify",
        value: function notify() {
          console.log('notify');
          this.subs.forEach(function (watcher) {
            watcher.update();
          });
        }
      }]);

      return Dep;
    }();

    Dep.target = null;
    var stack = [];
    function pushTarget(watcher) {
      Dep.target = watcher;
      stack.push(watcher);
    }
    function popTarget() {
      stack.pop();
      Dep.target = stack[stack.length - 1];
    }

    function isFunction(val) {
      return typeof val === 'function';
    }
    function isObject(val) {
      return _typeof(val) === 'object' && val !== null;
    }
    var callbacks = [];

    function flushCallbacks() {
      callbacks.forEach(function (cb) {
        return cb();
      });
      waiting = false;
    }

    var waiting = false;
    function nextTick(cb) {
      callbacks.push(cb); // flushSchedulerQueue  /userCallback  都在这，

      if (!waiting) {
        // vue3 不考虑兼容性直接这样。
        Promise.resolve().then(flushCallbacks);
        waiting = true;
      }
    }
    var lifeCycleHooks = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'beforeDestroy', 'destroyed']; //let strategy;
    // 存放各种策略

    var strats = {};
    lifeCycleHooks.forEach(function (hook) {
      strats[hook] = mergeHook;
    }); // 钩子函数合并的原理

    function mergeHook(parentVal, childVal) {
      if (childVal) {
        if (parentVal) {
          return parentVal.concat(childVal);
        } else {
          return [childVal];
        }
      } else {
        return parentVal;
      }
    }

    strats.components = function (parentVal, childVal) {
      // Vue.options.components
      var options = Object.create(parentVal); // 将子类的属性拷贝到 options上

      if (childVal) {
        for (var key in childVal) {
          options[key] = childVal[key];
        }
      }

      return options;
    };

    function mergeOptions(parent, child) {
      var options = {}; // 合并后的结果

      for (var key in parent) {
        mergeField(key);
      } //处理 child 中新的属性


      for (var _key in child) {
        if (parent.hasOwnProperty(_key)) {
          continue;
        }

        mergeField(_key);
      }

      function mergeField(key) {
        var parentVal = parent[key];
        var chidlVal = child[key]; // 采用策略模式，针对不同的属性进行合并

        if (strats[key]) {
          // 如果有对应的策略就调用对应的策略即可
          options[key] = strats[key](parentVal, chidlVal);
        } else {
          if (isObject(parentVal) && isObject(chidlVal)) {
            options[key] = _objectSpread2(_objectSpread2({}, parentVal), chidlVal);
          } else {
            options[key] = child[key] || parent[key];
          }
        }
      }

      return options;
    }
    function isReservedTag(str) {
      var reservedTag = 'a,div,span,p,img,button,ul,li'; // 源码根据 ，分割，生成对象 映射表 ，{a:true , div : true , p:true}

      return reservedTag.includes(str);
    }

    var queue = [];
    var has = {}; //  做列表的， 列表为何存放了哪些 watcher

    function flushSchedulerQueue() {
      for (var i = 0; i < queue.length; i++) {
        queue[i].run();
      }

      queue = [];
      has = {};
      pending = false;
    }

    var pending = false; // 这里开启异步操作，要等待同步代码执行完才进行执行异步逻辑 update ，虚拟变真实dom

    function queueWatcher(watcher) {
      var id = watcher.id;

      if (has[id] == null) {
        queue.push(watcher);
        has[id] = true; // 开启一次更新操作， 批处理（防抖）

        if (!pending) {
          // 当前执行栈中代码执行完毕后，会先清空微任务，再清空宏任务，希望尽早更新页面，就不要用setTimeout ，它是宏任务 。 vue 中自己 封装了一个 nextTick
          // 异步操作
          // setTimeout(flushSchedulerQueue, 0);
          nextTick(flushSchedulerQueue);
          pending = true;
        }
      }
    }

    var id = 0; // 一个watcher 可以理解为一个组件，这个组件上使用了多个属性 {{name}} {{age}}
    // 所以需要记住多个 dep ，每个dep 就是一个属性

    var Watcher = /*#__PURE__*/function () {
      //  vm,  updateComponent,  () => {  console.log('更新视图了');   },   true
      function Watcher(vm, exprOrFn, cb, options) {
        _classCallCheck(this, Watcher);

        this.vm = vm;
        this.exprOrFn = exprOrFn;
        this.user = !!options.user; // 标识是不是用户 watcher

        this.lazy = !!options.lazy;
        this.dirty = options.lazy; // 如果是计算属性，那么默认值 lazy,dirty 都是 true

        this.cb = cb;
        this.options = options;
        this.id = id++; // 每个实例都身份证号

        this.deps = [];
        this.depsId = new Set(); // 默认应该让 exprOrFn 执行， exprOrFn 方法做了什么？ 执行render （去vm 上进行取值了），所以可以理解为 getter

        if (typeof exprOrFn == 'string') {
          this.getter = function () {
            //需要将表达式转化为函数
            //进行数据取值，进行依赖收集
            // age.n  vm['age.n'] => vm[age][n]
            var path = exprOrFn.split('.');
            var obj = vm;

            for (var i = 0; i < path.length; i++) {
              obj = obj[path[i]];
            }

            return obj;
          };
        } else {
          this.getter = exprOrFn; // render(){_c(div,{},_v(name))}
        } // 计算属性，第一次不取值
        // 第一次的vlaue


        this.value = this.lazy ? undefined : this.get(); // 默认初始化， 要取值
      }

      _createClass(Watcher, [{
        key: "get",
        value: function get() {
          // 稍后用户更新时，可以重新调研 getter 方法
          // 执行下面方法，会执行属性的 defineProperty.get 方法， 每个属性都可以收集自己的 watcher
          // 希望一个属性可以对应多个 watcher ，同时一个 watcher 可以对应多个属性。 使用 dep 管理它们多对多的关系。
          pushTarget(this); // Dep.target = watcher

          var value = this.getter.call(this.vm); // render（） 方法对取 vm 上取值， vm._update(vm._render())

          popTarget(); // Dep.target = null , 如果 Dep.target 有值就说明这个变量在模版中使用了。

          return value;
        } // vue 中的更新操作是异步的

      }, {
        key: "update",
        value: function update() {
          //  console.log(
          //     '属性更新，也没渲染，更新视图， 这种方式多次修改，更新视图多次，性能不好。实现异步更新'
          // );
          // this.get();
          // 每次更新时，就是 this 执行， 就是 watcher 执行，可以将 watcher 缓存起来，最后一次一起执行更新，
          // 采用异步更新
          // queueWatcher(this);
          if (this.lazy) {
            this.dirty = true;
          } else {
            queueWatcher(this);
          }
        } // 用户更新会执行这个方法

      }, {
        key: "run",
        value: function run() {
          var newValue = this.get();
          var oldVlaue = this.value;
          this.value = newValue;

          if (this.user) {
            this.cb.call(this.vm, newValue, oldVlaue);
          }
        } // 记住这个组件模版中使用了哪些属性数据 {{name}} {{name}}  {{age}}
        // 一个模版中使用了 多次 name ，只需要记住一次就够了

      }, {
        key: "addDep",
        value: function addDep(dep) {
          var id = dep.id;

          if (!this.depsId.has(id)) {
            this.depsId.add(id);
            this.deps.push(dep);
            dep.addSub(this);
          }
        } // 计算属性 重新 get，计算出最新的值

      }, {
        key: "evaluate",
        value: function evaluate() {
          this.dirty = false; // 不需要重新get求值了

          this.value = this.get();
        } // 计算属性 记住了 它的依赖属性。 也需要 被依赖是 firstName lastName 也记住计算属性

      }, {
        key: "depend",
        value: function depend() {
          var i = this.deps.length;

          while (i--) {
            this.deps[i].depend(); //firstName lastName 收集渲染watcher
          }
        }
      }]);

      return Watcher;
    }();

    function patch(oldVnode, vnode) {
      if (!oldVnode) {
        return createElm(vnode); // 如果没有 el 元素，那就直接根据虚拟节点返回真实节点。 子组件场景
      }

      if (oldVnode.nodeType == 1) {
        // 用vnode  来生成真实dom 替换原来的 dom 元素
        var parentElm = oldVnode.parentNode;
        var elm = createElm(vnode);
        parentElm.insertBefore(elm, oldVnode.nextSibling);
        parentElm.removeChild(oldVnode);
        return elm;
      }
    } // 创建组件

    function createComponent$1(vnode) {
      var i = vnode.data;

      if ((i = i.hook) && (i = i.init)) {
        i(vnode); // 调用 init 方法
      }

      if (vnode.componentInstance) {
        // 有属性说明子组件new 完毕了， 并且组件对应的真实dom
        return true;
      }
    } // 创建真实的元素 dom


    function createElm(vnode) {
      var tag = vnode.tag;
          vnode.data;
          var children = vnode.children,
          text = vnode.text;
          vnode.vm;

      if (typeof tag === 'string') {
        if (createComponent$1(vnode)) {
          // 返回组件的真实节点
          return vnode.componentInstance.$el;
        }

        vnode.el = document.createElement(tag);
        children.forEach(function (child) {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        vnode.el = document.createTextNode(text);
      }

      return vnode.el;
    }

    function lifecycleMixin(Vue) {
      // 传入的是 虚拟dom 节点, 虚拟dom 变成真实dom
      Vue.prototype._update = function (vnode) {
        console.log('update', vnode);
        var vm = this;
        vm.$el = patch(vm.$el, vnode);
      }; // 扩展出一个异步更新方法，项目中使用，用户中也可以使用


      Vue.prototype.$nextTick = nextTick;
    } // 后续每个组件渲染的时候都会有一个 watcher

    function mountComponent(vm, el) {
      // vue的实现很简单：做了个更新方法（初次执行，内容更新后执行）
      // 更新函数，数据变化后，会再次调用此函数
      var updateComponent = function updateComponent() {
        // 调用 render函数，生成虚拟 DOM
        vm._update(vm._render()); // 后续更新可以调用 updateComponent方法。 这两个实例方法在哪写？
        // 用虚拟 dom 生成真实 dom

      }; // 使用观察者模式，实现数据变化页面更新： 属性是“被观察者”  ， 刷新页面：“观察者”
      // updateComponent();


      callHook(vm, 'beforeMount'); // 他是一个渲染watcher ，后续还有其他watcher
      // 渲染一个组件

      new Watcher(vm, updateComponent, function () {
        console.log('更新视图了');
      }, true);
    }
    function callHook(vm, hook) {
      var handlers = vm.$options[hook];

      if (handlers) {
        for (var i = 0; i < handlers.length; i++) {
          handlers[i].call(vm);
        }
      }
    }

    var oldArrayPrototype = Array.prototype;
    var arrayMethods = Object.create(oldArrayPrototype); // 这个创建的对像，的原型链 __proto__ 指向 Array.prototype
    // arrayMerhods.__proto__ = Array.prototype 继承

    var methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice'];
    methods.forEach(function (method) {
      // 用户调用上面 7 个方法，会使用这里重写的，否则使用原理数组 原生的方法。
      arrayMethods[method] = function () {
        var _oldArrayPrototype$me;

        console.log('数组变化了'); // 调用数组原生的方法

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        (_oldArrayPrototype$me = oldArrayPrototype[method]).call.apply(_oldArrayPrototype$me, [this].concat(args)); // arr.push({a:1})
        // 新数据进行添加get set 方法


        var inserted;
        var ob = this.__ob__;

        switch (method) {
          case 'push':
          case 'unshift':
            inserted = args; // 新增的数据

            break;

          case 'splice':
            inserted = args.slice(2);
        } // 如果有新增的内容需要进行集训劫持，需要观测数组里面的每一项。


        if (inserted) {
          ob.observeArray(inserted);
        } // 更新操作，触发视图更新, 数组的 observer.dep 属性


        ob.dep.notify();
      };
    });

    // 1. 如果数据是对象， 会将对象不停的递归 进行 劫持，（添加 get set 方法）
    // 2. 如果数据是数组，会劫持数组的方法，修改数组中的原型链 __proto__ 指向我们的对象， 并对数组中不是基本数据类型的进行监测。
    // 监测数据变化 ，类有类型，知道是它的实例
    // 如果给对象新增一个属性不会触发视图更新，需要使用 $set 将属性变成响应式的才可以
    // 给对象本身增加一个 dep ，dep中存watcher ，如果增加一个属性后，我就手动的触发 watcher 的更新

    var Observer = /*#__PURE__*/function () {
      // 对对象中的所有属性进行劫持，绑定 get /set 方法， 循环对象属性
      function Observer(data) {
        _classCallCheck(this, Observer);

        // 每个数据对象（可能是对象，数组），都有一个 dep，记录哪个watcher 使用了这个数据
        this.dep = new Dep();
        Object.defineProperty(data, '__ob__', {
          value: this,
          enumerable: false
        }); // data.__ob__ = this; // 被劫持过的属性都有 __ob__ ,下面遍历时要不能遍历的这个属性
        // 数组变化可以触发视图更新？

        if (Array.isArray(data)) {
          // 数组劫持的逻辑
          // 对数组原来对方法进行改写，切面编程，高阶函数
          // 只修改这个数组中的方法， 外部的数组不受影响
          data.__proto__ = arrayMethods; // 如果数组中的数据上对象类型，需要监控对象的变化

          this.observeArray(data);
        } else {
          this.walk(data);
        }
      } // 进行对数组中的数组，对象进行劫持，采用递归


      _createClass(Observer, [{
        key: "observeArray",
        value: function observeArray(data) {
          data.forEach(function (item) {
            observe(item);
          });
        } // 循环对象属性，将这个对象的属性 设置成响应式的

      }, {
        key: "walk",
        value: function walk(data) {
          // 这个方式不会 获取data 原型中的属性。
          Object.keys(data).forEach(function (key) {
            defineReactive(data, key, data[key]);
          });
        }
      }]);

      return Observer;
    }();

    function dependArray(value) {
      for (var i = 0; i < value.length; i++) {
        var current = value[i]; // current 是数组里面的数组 [[[[[多层]]]]]

        current.__ob__ && current.__ob__.dep.depend(); // 进行依赖收集

        if (Array.isArray(current)) {
          dependArray(current);
        }
      }
    } // vue2 会对对象进行遍历，将每个属性 用 define Property 重新定义，性能差，不断递归
    // {arr:[1,2,3,[a,b,c]]}


    function defineReactive(data, key, value) {
      var childOb = observe(value); // 进行递归下面的属性,对象套对象
      // arr  [1,2,3]
      // childOb 是数组对应的 ob
      // 每个属性都有一个dep 属性，它记录有哪些组件使用到了这个属性

      var dep = new Dep();
      Object.defineProperty(data, key, {
        get: function get() {
          console.log(dep, key); // 取值时，将 watcher 和 dep 对应起来
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
        set: function set(newV) {
          // todo  更新视图
          if (newV !== value) {
            // 把用户设置的值也进行劫持，赋值一个新对象
            observe(newV);
            value = newV;
            dep.notify(); // 告诉当前的属性存放的watcher 执行
          }
        }
      });
    } // 观测数据


    function observe(data) {
      // 如果是对象才观测
      if (!isObject(data)) {
        return;
      }

      if (data.__ob__) {
        return data.__ob__; // 数据本身 this Observer实例
      } // 默认最外层的data 必须是一个对象
      // 给这些数据，创建一个观察者


      return new Observer(data);
    }

    function initState(vm) {
      var opts = vm.$options;

      if (opts.data) {
        initData(vm);
      } // computed 与 watch 的区别


      if (opts.computed) {
        initComputed(vm, opts.computed);
      }

      if (opts.watch) {
        initWatch(vm, opts.watch);
      }
    }
    function stateMixin(Vue) {
      // 渲染 watcher 通过 页面使用数据调用get
      // 用户 watcher 是通过调用 get方式实现 依赖收集的
      Vue.prototype.$watch = function (key, handler) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        // watch 可以传入选项参数 deep immediate
        options.user = true; // 是用户写的 watcher
        // vm name ,用户回调， options.user

        var watcher = new Watcher(this, key, handler, options); // 实现立即执行

        if (options.immediate) {
          handler(watcher.value);
        }
      };
    }

    function proxy(vm, source, key) {
      Object.defineProperty(vm, key, {
        get: function get() {
          return vm[source][key];
        },
        set: function set(newValue) {
          vm[source][key] = newValue;
        }
      });
    } // 用户传入的数据，要将它们变成响应式的。怎么做呢？


    function initData(vm) {
      var data = vm.$options.data; // vue2中会将 data 中的所有数据，进行数据劫持 Object.defineProperty()
      // data 可能是对象，函数，需要判断。 当是函数时，函数里面的this 都是vue 实例
      // vm 和 data 没有任何关系，通过 _data 进行关联

      data = vm._data = isFunction(data) ? data.call(vm) : data; // console.log(data, '----');
      // 将 data 中数据代理到 vm上， 可以直接到 vm 获取数据
      // 用户 vm.name 等价于 vm._data.name

      for (var key in data) {
        proxy(vm, '_data', key);
      } //  这里就获取到数据了，就要进行数据的响应式功能


      observe(data);
    }

    function initWatch(vm, watch) {
      for (var key in watch) {
        var handler = watch[key];

        if (Array.isArray(handler)) {
          for (var i = 0; i < handler.length; i++) {
            createWatcher(vm, key, handler[i]);
          }
        } else {
          createWatcher(vm, key, handler);
        }
      }
    }

    function createWatcher(vm, key, handler) {
      return vm.$watch(key, handler);
    } // 多个计算属性，多个 watcher


    function initComputed(vm, computed) {
      var watchers = vm._computedWatchers = {};

      for (var key in computed) {
        var userDef = computed[key]; // 依赖的属性变化就重新取值 get

        var getter = typeof userDef == 'function' ? userDef : userDef.get; // 每个计算属性就是 watcher
        // 将watcher 和 计算属性 做映射

        watchers[key] = new Watcher(vm, getter, function () {}, {
          lazy: true
        }); // 默认不执行
        // 将 key 定义在 vm 上， 才有了计算属性能使用

        defineComputed(vm, key, userDef); // 就是一个 defineProperty
      }
    }

    function createComputedGetter(key) {
      // 取计算属性的值，走的是这个函数
      return function computedGetter() {
        // this._computedWatchers 包含所有的计算属性
        // 通过key 可以拿到对应的 watcher ， 这个watcher 包含了 getter
        var watcher = this._computedWatchers[key];
        console.log(watcher.dirty); // 根据 dirty 属性，判断是否需要重新求值，实现缓存功能

        if (watcher.dirty) {
          watcher.evaluate();
        } // 如果当前取完值后 Dep.target 还有值，需要继续向上收集


        if (Dep.target) {
          // 计算属性 watcher 内部有两个 dep  firstName ，lastName
          watcher.depend(); // watcher 里 对应了 多个 dep
        }

        return watcher.value;
      };
    }

    function defineComputed(vm, key, userDef) {
      console.log('-----------');
      var sharedProperty = {};

      if (typeof userDef == 'function') {
        sharedProperty.get = userDef;
      } else {
        sharedProperty.get = createComputedGetter(key);
        sharedProperty.set = userDef.set;
      }

      Object.defineProperty(vm, key, sharedProperty);
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        // console.log(options);
        // el , data
        var vm = this; // vm.$options = options; // 选项，用户使用时会调用 $options ,所以框架底层进行这样创建，后面会扩展他

        vm.$options = mergeOptions(vm.constructor.options, options); // 调用生命周期钩子

        callHook(vm, 'beforeCreate'); // 对数据进行初始化，watch  computed props  data ，都是数据
        //  数据劫持：就是当操作数据时，让我们知道了修改了，获取了这个数据，然后我们就可以进行做 更新试图 等功能。
        // 加get set 方法，第一步是加了数据监控等功能，

        initState(vm); // vm.$options.data 将数据处理放在另外一个方法中，状态初始化

        callHook(vm, 'created'); // 将数据挂在 模版上

        if (vm.$options.el) {
          // 将数据挂载到这个模板上
          vm.$mount(vm.$options.el);
        } // 有可能传入 template：“” ， render:h() //优先级高

      };

      Vue.prototype.$mount = function (el) {
        var vm = this;
        var options = vm.$options;
        el = document.querySelector(el);
        vm.$el = el; // 把模版转化成 对应的渲染函数  =》 虚拟 DOM 概念， vnode  =》 diff 算法 更新虚拟dom =》 产生真实的节点，更新

        if (!options.render) {
          var template = options.template;

          if (!template && el) {
            template = el.outerHTML;
          }

          var render = compileToFunction(template);
          options.render = render; // 就是渲染函数
        } // options.render  就是渲染函数


        console.log(options.render); // 调用render 方法 ，渲染成真实 dom 替换掉页面的内容
        // new Vue() 的过程叫做组件，这个组件能自动实现组件挂载，放在真实的页面中。

        mountComponent(vm); // 组件的挂载流程，挂载到 el 元素上。在生命周期的方法中执行完成挂载
      };
    }

    function createElement(vm, tag) {
      var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        children[_key - 3] = arguments[_key];
      }

      // tag 可能是一个 组件， 应该渲染一个组件的 vnode
      if (isReservedTag(tag)) {
        return vnode(vm, tag, data, data.key, children, undefined);
      } else {
        console.log(tag);
        var Ctor = vm.$options.components[tag];
        return createComponent(vm, tag, data, data.key, children, Ctor);
      }
    } // 创建组件的虚拟节点, 传入的组件可能是对象，也可能是函数
    // 为了区分组件和原生元素 ， data.hook , componentOption

    function createComponent(vm, tag, data, key, children, Ctor) {
      if (isObject(Ctor)) {
        Ctor = vm.$options._base.extend(Ctor);
      } // console.log('Ctor', Ctor);
      // 渲染组件时，需要调用此初始化方法。


      data.hook = {
        init: function init(vnode) {
          // 如何将子组件对象 变成真实dom
          var vm = vnode.componentInstance = new Ctor({
            _isComponent: true
          }); // 创建子组件, 会进行将该选项和组件的配置进行合并。

          vm.$mount(); // 组件挂载完毕后， 会在 vnode.componentInstance.$el => <button>
        }
      };
      return vnode(vm, "vue-component-".concat(tag), data, key, undefined, undefined, {
        Ctor: Ctor,
        children: children
      });
    }

    function createTextElement(vm, text) {
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    }

    function vnode(vm, tag, data, key, children, text, componentOptions) {
      return {
        vm: vm,
        tag: tag,
        data: data,
        key: key,
        children: children,
        text: text,
        componentOptions: componentOptions
      };
    }

    function renderMixin(Vue) {
      // 节点，产生虚拟节点
      Vue.prototype._c = function () {
        return createElement.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
      }; // 文本 , 创建文本元素


      Vue.prototype._v = function (text) {
        return createTextElement(this, text);
      }; // 变量


      Vue.prototype._s = function (val) {
        if (_typeof(val) === 'object') return JSON.stringify(val);
        return val;
      };

      Vue.prototype._render = function () {
        console.log('render'); // render 比 update 先执行

        var vm = this; // 这个方法中的 js 代码会有 _c, _s, _v 这些方法，需要定义这些方法

        var render = vm.$options.render; // 就是解析出来的 render 方法，同时也有可能是用户写的

        var vnode = render.call(vm);
        return vnode;
      };
    }

    function initGloabalApi(Vue) {
      // 用来存放全局配置的， Vue.component  , Vue.filters  Vue.directives  都放在这个对象里面
      // 每个组件初始化时候都会和这个 options 进行合并
      Vue.options = {};

      Vue.mixin = function (options) {
        // 生命周期方法合并是放在一个数组里     {}    {beforeCreate:fn}  => {beforecreate:[fn]}
        //                                 {beforecreate:[fn]}  {beforecreate:fn}  => {beforecreate:[fn,fn]}
        this.options = mergeOptions(this.options, options); // console.log(this.options);

        return this;
      }; //


      Vue.options._base = Vue; // 无论后续创建的多少个子类，都可以通过这个 _base 找到 Vue

      Vue.options.components = {};

      Vue.component = function (id, definition) {
        // 保证组件的隔离， 每个组件都会产生一个新的类，去继承父类。
        definition = this.options._base.extend(definition);
        this.options.components[id] = definition; // 选项合并 组件内的 compoents 比 Vue.component() 定义的组件级别高。这里要用继承的方式。
      }; // 给一个对象，返回一个类
      // extend 方法就是产生一个继承于 Vue 的类，并且身上应该有父类的所有功能。


      Vue.extend = function (opts) {
        var Super = this; // 每个组件一个子类，什么时候被创建成对象？

        var Sub = function VueComponent(options) {
          this._init(options);
        };

        Sub.prototype = Object.create(Super.prototype);
        Sub.prototype.constructor = Sub;
        Sub.options = mergeOptions(Super.options, opts);
        return Sub;
      };
    }

    function Vue(options) {
      this._init(options);
    } // 这样添加会写很多这样的代码，实现功能拆分到其他文件中，使用下面mixin 方式，扩展原型方法
    // Vue.prototype._init = function(){}
    // 给构造函数，添加实例公共方法
    // 扩展原型


    initMixin(Vue);
    renderMixin(Vue); // _render

    lifecycleMixin(Vue); // _update

    stateMixin(Vue); // 在类上扩展， 使用是 Vue.mixin

    initGloabalApi(Vue);

    return Vue;

}));
//# sourceMappingURL=vue.js.map
