(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

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

  var Observer = /*#__PURE__*/function () {
    // 对对象中的所有属性进行劫持，绑定 get /set 方法， 循环对象属性
    function Observer(data) {
      _classCallCheck(this, Observer);

      this.walk(data);
    } // 循环对象属性，将这个对象的属性 设置成响应式的


    _createClass(Observer, [{
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

  } // 用户传入的数据，要将它们变成响应式的。怎么做呢？

  function initData(vm) {
    var data = vm.$options.data; // vue2中会将 data 中的所有数据，进行数据劫持 Object.defineProperty()
    // data 可能是对象，函数，需要判断。 当是函数时，函数里面的this 都是vue 实例
    // vm 和 data 没有任何关系，通过 _data 进行关联

    data = vm._data = isFunction(data) ? data.call(vm) : data; // console.log(data, '----');
    //  这里就获取到数据了，就要进行数据的响应式功能

    observe(data);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      // console.log(options);
      // el , data
      var vm = this;
      vm.$options = options; // 选项，用户使用时会调用 $options ,所以框架底层进行这样创建，后面会扩展他
      // 对数据进行初始化，watch  computed props  data ，都是数据

      initState(vm); // vm.$options.data 将数据处理放在另外一个方法中，状态初始化
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
