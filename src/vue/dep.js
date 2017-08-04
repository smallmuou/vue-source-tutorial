/**
 * dep.js
 *
 * 负责管理监听对象的管理，增删等
 */

import Watcher from './watcher';

//暂未发现具体用处
let uid = 0;

export default class Dep {

    //定义类属性，由于我的 webpack 编译不过，因此我将 target 移到最后一行
    //static target;

    //创建订阅者数组subs
    constructor () {
        this.id = uid++;
        this.subs = [];
    }

    //添加订阅者
    addSub (sub) {
        this.subs.push(sub);
    }

    //移除订阅者
    removeSub (sub) {
        let index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    }
    depend () {
        //调用 watcher 的 addDep
        Dep.target.addDep(this);
    }

    notify () {
        this.subs.forEach(sub => sub.update());
    }
}

//定义类属性
Dep.target;
