/**
 * observer.js
 *
 * 重写所有要观察属性的 get和 set 方法
 * get 方法：添加观察者 watcher到队列 Dep 中
 * set 方法：检测数据是否有变化，若有，则通知 Dep 中的 watcher 更新
 */


/**
 * es6引入了模块化概念，通过 export 和 import 可以实现函数或对象的导出导入
 * import用于导入外部模块的函数、对象等.
 * import 与 import {}的区别是如果外部模块文件声明了 export default，则可以直接用 import 导出默认函数或对象
 */
import Dep from './dep';
import { def } from './util';
import { arrayMethods } from './array';

function protoAugment(target, src) {
    target.__proto__ = src;
}

function copyAugment(target, src, keys) {
    for (let i = 0; i < keys.length; i++) {
        def(target, key[i], src[key[i]]);
    }
}

export default function observer(data) {
    //空或者非 javascript 对象则返回
    if (!data || typeof data !== 'object') {
        return;
    //是否已经初始化过
    } else if (data.hasOwnProperty("__ob__") && data["__ob__"] instanceof Observer) {
        return;
    }
    return new Observer(data);
}

class Observer {
    constructor(data) {
        this.dep = new Dep();

        //添加初始化标志，防止反复初始化并赋值 this，方便在 array.js等外部文件中调用
        def(data, "__ob__", this);
        this.data = data;

        /**
         * 如果 data 是数组，则对该数组进行监听，这里有个有趣的实验：
         <div id="app">
             <p>{{ 0 }}</p>
         </div>

         <script>
             new MVVM({
                 el: '#app',
                 data: ['hello', 'world']
             })
         </script>
         * 以上会输出hello，细节各位可以去分析，不过在新版本中无此情况
         */

        if (Array.isArray(data)) {
            const argment = data.__proto__ ? protoAugment : copyAugment;
            //为何protoAugment只有2个形参，却可以传3个实参？在 javascript 对参数个数没有严格的限制，有则要之，无则不理之
            argment(data, arrayMethods, Object.keys(arrayMethods));
            this.observerArray(data);
        } else {
            this.walk(data);
        }

    }

    walk(data) {
        let self = this;
        //对 data 中的所有key 进行监听
        Object.keys(this.data).forEach(function (key) {
            self.defineReactice(data, key, data[key]);
        });
    }

    observerArray(items) {
        for (let i = 0; i < items.length; i++) {
            observer(items[i]);
        }
    }

    defineReactice(data, key, value) {
        //getOwnPropertyDescriptor是指对象直接定义的属性，而非继承的
        let dep = new Dep(),
            descriptor = Object.getOwnPropertyDescriptor(data, key);

        //非自身属性或不可配置，则返回
        if (descriptor && !descriptor.configurable) {
            return;
        }

        //针对 value 是对象的情况，则对 value 中的所有属性进行监听，实测是有问题，但在新版本中验证没有问题
        let childObserver = observer(value);

        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            //重写 get 方法
            get: function () {
                //我起名叫：开关模式，只在new watcher 时会对 Dep.target进行赋值，并强制调用一次 get，从而触发该开关
                if (Dep.target) {
                    dep.depend();
                    if (childObserver) {
                        childObserver.dep.depend();
                    }
                }
                return value;
            },
            //重写 set 方法
            set: function (newValue) {
                //判断值是否有变化，有则通知 watcher
                if (newValue == value) {
                    return;
                }

                //如果赋值是对象，则对该对象进行监听
                if (typeof newValue === 'object') {
                    observer(newValue);
                }

                value = newValue;

                //通知 watcher 更新
                dep.notify();
            }
        });
    }
}
