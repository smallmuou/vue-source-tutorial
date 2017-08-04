import Watcher from './watcher'
import observer from './observer'
import Compiler from './compiler'

class MVVM {

    constructor (options) {
        //options即是 html 中 new MVVM 所传参数，如
        //new MVVM(
        //  {
        //      el: '#app',
        //      data: {
        //          message: 'Hello Vue.js!'
        //      }
        //  })

        this.$options = options;
        this._data = this.$options.data;
        var self = this;

        //将 this._data.key 转化为this.key，方便访问
        //箭头函数：是 es6引入的函数简写，可以省去 function 和 return
        //(参数) => {}，如果只是单个，(){}可以省去，如a => a+1
        Object.keys(this.$options.data).forEach(key => {
            this._proxy(key);
        });

        //观察者，为 data 中的所有 key 添加观察者
        observer(this._data);

        //创建指令编译器，如果 el 未指定，则直接使用 document.body
        this.$compiler = new Compiler(options.el || document.body, this);
    }

    $watch (expression, callback) {
        new Watcher(this, expression, callback);
    }

    _proxy (key) {
        let self = this;

        //defineProperty为对象添加属性 key
        Object.defineProperty(this, key, {
            configurable: false,
            enumerable: true,
            //对应this.key操作
            get() {
                return self._data[key];
            },
            //对应this.key = 操作
            set(value) {
                self._data[key] = value;
            }
        });
    }
}

//将对象赋值给根对象 window
window.MVVM = MVVM;
