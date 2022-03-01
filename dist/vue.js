(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    function complileToFuntion(template) {
      console.log(template);
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
        el = document.querySelector(el); // 把模版转化成 对应的渲染函数  =》 虚拟 DOM 概念， vnode  =》 diff 算法 更新虚拟dom =》 产生真实的节点，更新

        if (!options.render) {
          var template = options.template;

          if (!template && el) {
            template = el.outerHTML;
            var render = complileToFuntion(template);
            options.render = render; // 就是渲染函数
          }
        }
      };
    }

    function Vue(options) {
      this._init(options);
    } // 这样添加会写很多这样的代码，实现功能拆分到其他文件中，使用下面mixin 方式，扩展原型方法
    // Vue.prototype._init = function(){}
    // 给构造函数，添加实例公共方法
    // 扩展原型


    initMixin(Vue);

    return Vue;

}));
//# sourceMappingURL=vue.js.map
