/**
 * array.js
 * 针对 array 对象的监听，对 array 的 push 等更新方法进行重写
 */

import { def } from './util';

const arrayProto = Array.prototype;

//创建 array 对象，并重写其中的方法
export const arrayMethods = Object.create(arrayProto);

[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
].forEach(function(method) {
    //对象可以通过[]来访问相应的方法
    const original = arrayProto[method];
    def(arrayMethods, method, function() {
        let i = arguments.length;
        const args = new Array(i);
        while(i--) {
            args[i] = arguments[i];
        }

        //apply 表示立即执行方法，不同于 bind
        const result = original.apply(this, args);
        const ob = this.__ob__;
        let inserted;
        switch(method) {
            case 'push':
                inserted = args;
                break;
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.slice(2);
                break;
        }
        if (inserted) ob.observerArray(inserted);

        //通知 watch
        ob.dep.notify();
        return result;
    });
});
