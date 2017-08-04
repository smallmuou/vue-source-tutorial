/**
 * watcher.js
 *
 * 监听者，负责映射属性-回调函数，一旦属性有变化，则调用相应的 callback
 */


import Dep from './dep'

export default class Watcher {

    //构造函数，传入要监听的属性值及相应的更新回调
    constructor(vm, expression, callback) {
        this.callback = callback;
        this.vm = vm;
        this.expression = expression;
        this.callback = callback;
        this.depIds = {};
        this.oldValue = this.get();
    }

    update () {
        let newValue = this.get();
        let oldValue = this.oldValue;
        if (newValue !== this.oldValue) {
            this.oldValue = newValue;
            //调用相应的回调
            this.callback.call(this.vm, newValue, oldValue);
        }
    }

    addDep (dep) {
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    }

    //触发 obsever 的 get中的添加 watcher 条件，并添加该 watcher 到 dep 中
    get () {
        Dep.target = this;
        let value = this.getVMVal();
        Dep.target = null;
        return value;
    }

    getVMVal () {
        //需要对嵌套类进行处理，如message.hello.world
        let expression = this.expression.split('.');
        let value = this.vm;
        expression.forEach(function (curVal) {
            value = value[curVal];
        });
        return value;
    }
}
