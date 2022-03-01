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
    }

    var root = null; // 根元素

    var stack = []; // 每遇见一个开始标签就创建一个 element 元素 ，然后放入栈中，构建树，记录parent

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
    } // html 字符传解析成 对应的脚本 来触发 tokens <div id="app">{{name}}</div>


    function parserHTML(html) {
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

    var Watcher = /*#__PURE__*/_createClass( //  vm,  updateComponent,  () => {  console.log('更新视图了');   },   true
    function Watcher() {
      _classCallCheck(this, Watcher);
    });

    function patch(oldVnode, vnode) {
      if (oldVnode.nodeType == 1) {
        // 用vnode  来生成真实dom 替换原来的 dom 元素
        var parentElm = oldVnode.parentNode;
        var elm = createElm(vnode);
        parentElm.insertBefore(elm, oldVnode.nextSibling);
        parentElm.removeChild(oldVnode);
        return elm;
      }
    }

    function createElm(vnode) {
      var tag = vnode.tag;
          vnode.data;
          var children = vnode.children,
          text = vnode.text;
          vnode.vm;

      if (typeof tag === 'string') {
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
      };
    }
    function mountComponent(vm, el) {
      // vue的实现很简单：做了个更新方法（初次执行，内容更新后执行）
      // 更新函数，数据变化后，会再次调用此函数
      var updateComponent = function updateComponent() {
        // 调用 render函数，生成虚拟 DOM
        vm._update(vm._render()); // 后续更新可以调用 updateComponent方法。 这两个实例方法在哪写？
        // 用虚拟 dom 生成真实 dom

      }; // 使用观察者模式，实现数据变化页面更新： 属性是“被观察者”  ， 刷新页面：“观察者”
      // updateComponent();
      // 他是一个渲染watcher ，后续还有其他watcher


      new Watcher(vm, updateComponent, function () {
        console.log('更新视图了');
      }, true);
    }

    function isFunction(val) {
      return typeof val === 'function';
    }
    function isObject(val) {
      return _typeof(val) === 'object' && val !== null;
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
        }
      };
    });

    // 1. 如果数据是对象， 会将对象不停的递归 进行 劫持，（添加 get set 方法）
    // 2. 如果数据是数组，会劫持数组的方法，修改数组中的原型链 __proto__ 指向我们的对象， 并对数组中不是基本数据类型的进行监测。
    // 监测数据变化 ，类有类型，知道是它的实例

    var Observer = /*#__PURE__*/function () {
      // 对对象中的所有属性进行劫持，绑定 get /set 方法， 循环对象属性
      function Observer(data) {
        _classCallCheck(this, Observer);

        Object.defineProperty(data, '__ob__', {
          value: this,
          enumerable: false
        }); // data.__ob__ = this; // 被劫持过的属性都有 __ob__ ,下面遍历时要不能遍历的这个属性

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
    }(); // vue2 会对对象进行遍历，将每个属性 用 define Property 重新定义，性能差，不断递归


    function defineReactive(data, key, value) {
      observe(value); // 进行递归下面的属性,对象套对象

      Object.defineProperty(data, key, {
        get: function get() {
          return value;
        },
        set: function set(newV) {
          // 把用户设置的值也进行劫持，赋值一个新对象
          observe(newV);
          value = newV;
        }
      });
    } // 观测数据


    function observe(data) {
      // 如果是对象才观测
      if (!isObject(data)) {
        return;
      }

      if (data.__ob__) {
        return;
      } // 默认最外层的data 必须是一个对象
      // 给这些数据，创建一个观察者


      return new Observer(data);
    }

    function initState(vm) {
      var opts = vm.$options;

      if (opts.data) {
        initData(vm);
      } // computed 与 watch 的区别
      // if (opts.computed) {
      //     initComputed();
      // }
      // if (opts.watch) {
      //     initWatch();
      // }

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

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        // console.log(options);
        // el , data
        var vm = this;
        vm.$options = options; // 选项，用户使用时会调用 $options ,所以框架底层进行这样创建，后面会扩展他
        // 对数据进行初始化，watch  computed props  data ，都是数据
        //  数据劫持：就是当操作数据时，让我们知道了修改了，获取了这个数据，然后我们就可以进行做 更新试图 等功能。
        // 加get set 方法，第一步是加了数据监控等功能，

        initState(vm); // vm.$options.data 将数据处理放在另外一个方法中，状态初始化
        // 将数据挂在 模版上

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
            var render = compileToFunction(template);
            options.render = render; // 就是渲染函数
          }
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

      return vnode(vm, tag, data, data.key, children, undefined);
    }
    function createTextElement(vm, text) {
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    }

    function vnode(vm, tag, data, key, children, text) {
      return {
        vm: vm,
        tag: tag,
        data: data,
        key: key,
        children: children,
        text: text
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

    function Vue(options) {
      this._init(options);
    } // 这样添加会写很多这样的代码，实现功能拆分到其他文件中，使用下面mixin 方式，扩展原型方法
    // Vue.prototype._init = function(){}
    // 给构造函数，添加实例公共方法
    // 扩展原型


    initMixin(Vue);
    renderMixin(Vue); // _render

    lifecycleMixin(Vue); // _update

    return Vue;

}));
//# sourceMappingURL=vue.js.map
