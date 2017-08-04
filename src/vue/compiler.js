/**
 * compiler.js
 *
 * 指令编译，对 dom 进行遍历，处理 Vue 指令
 * 1. 属性节点v-，v-for、v-on:click等
 * 2. 文本节点{{}}
 */

import Watcher from './watcher';
import observer from './observer';

/**
 * 正则表达式
 *
 * tagRE 匹配{{}}及{{{}}}
 * htmlRE 匹配{{{}}}，会已 html 方式展现
 * 其中()是提取匹配的值
 */
const tagRE = /\{\{\{(.*?)\}\}\}|\{\{(.*?)\}\}/g,
    htmlRE = /^\{\{\{(.*)\}\}\}$/,
    paramsRE = /\((.+)\)/g,
    stringRE = /\'(.*)\'/g;


export default class Compiler {

    constructor(el, vm) {
        this.$vm = vm;

        //判断 el 是否是 dom 元素，如果是则直接赋值，否则通过querySelector获取相应的元素，可以结合 MVVM.js的理解
        // this.$compiler = new Compiler(options.el || document.body, this);

        this.$el = this.isElementNode(el) ? el : document.querySelector(el);

        if (this.$el) {
            //1. 将 el中的子节点移到 fragment 中
            this.$fragment = this.createFragment(this.$el);

            //2. 解析Vue 指令集，如 v-、{{}}等
            //针对{{}}添加 Watcher，一旦 model 发生变化，会通知 watcher ，从而进行相应的 ui 更新
            this.compileElement(this.$fragment);

            //3. 将处理后的 dom 添加回el 中
            this.$el.appendChild(this.$fragment);
        }
    }

    createFragment(el) {
      //这里是使用createDocumentFragment创建片段，而不是 createElement 创建元素
        var fragment = document.createDocumentFragment(),
            child;

        while (child = el.firstChild) {
          //此处的 appendChild具备转移的作用，即从而 el 移到 fragment 中
          //<div>
          //  <p>xxx</p>
          //</div>
          //div 将具备3个 child，分别空文本段1、p、空文本段2，分解如下
          //<div>
          //  空文本段1
          //  <p>xxx</p>
          //  空文本段2
          //</div>
            fragment.appendChild(child);
        }

        return fragment;
    }

    compileElement(el) {
        let childNodes = el.childNodes,
            self = this;

        //childNodes是 NodeList 对象；而[].slice是将 childNodes 变为真正的 array 对象
        [].slice.call(childNodes).forEach(function (node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/g;

            //元素节点，则解析其属性
            if (self.isElementNode(node)) {
                self.compileNodeAttr(node);
            //文本节点，且包含{{}}
            } else if (self.isTextNode(node) && reg.test(text)) {
                self.compileText(node);
            }
        });
    }

    //处理属性节点
    compileNodeAttr(node) {
        let nodeAttrs = node.attributes,
            self = this,
            lazyComplier,
            lazyExp;

        [].slice.call(nodeAttrs).forEach(function (attr) {
            let attrName = attr.name;

            //是否是 v-指令，如 v-model
            if (self.isDirective(attrName)) {
                //expression为值，directive为指令(移除 v-)
                //如v-model="message", 则expression=message, directive=model
                let expression = attr.value;
                let directive = attrName.substring(2);

                //针对 v-for 延后处理
                if (directive === 'for') {
                    lazyComplier = directive;
                    lazyExp = expression;
                //针对v-on:xx 事件
                } else if (self.isEventDirective(directive)) {
                    directiveUtil.addEvent(node, self.$vm, directive, expression);
                } else {
                    //其他指令，如 v-model，调用directiveUtil.model
                    directiveUtil[directive] && directiveUtil[directive](node, self.$vm, expression);
                }

                //移除指令属性，在最终的 html 中，是看不到 vue的指令
                node.removeAttribute(attrName);
            }
        });

        //处理 v-for
        if (lazyComplier === 'for') {
            directiveUtil[lazyComplier] && directiveUtil[lazyComplier](node, this.$vm, lazyExp);
        } else if (node.childNodes && node.childNodes.length) { //处理下一级节点
            self.compileElement(node);
        }
    }

    //处理文本节点,如<div>xxxxx</div>中的 xxxx 部分
    compileText(node) {
        //按{{}}或{{{}}}拆分，如text1{{message}}text2{{{html}}}，则分解为：text1、message、text2、html
        const tokens = this.parseText(node.wholeText);
        let fragment = document.createDocumentFragment();
        tokens.forEach(token => {
            let el;
            if (token.tag) { //为{{}}或{{{}}}
                if (token.html) { //{{{}}}
                    el = document.createDocumentFragment();
                    el.$parent = node.parentNode;
                    el.$oncetime = true;
                    directiveUtil.html(el, this.$vm, token.value);

                } else { //{{}}
                    el = document.createTextNode(" ");
                    directiveUtil.text(el, this.$vm, token.value);
                }
            } else {
                el = document.createTextNode(token.value);
            }
            el && fragment.appendChild(el);
        });
        node.parentNode.replaceChild(fragment, node);
    }

    parseText(text) {
        //是否含有{{}}、{{{}}}字段，无则返回
        if (!tagRE.test(text)) {
            return;
        }
        const tokens = [];
        let lastIndex = tagRE.lastIndex = 0;
        let match, index, html, value;

        /**
         * tagRE.exec返回数组及匹配位置
         */
        while (match = tagRE.exec(text)) {
            index = match.index;
            // 先把{{}} 或者 {{{}}} 之前的文本提取
            if (index > lastIndex) {
                tokens.push({
                    value: text.slice(lastIndex, index)
                });
            }
            html = htmlRE.test(match[0]);
            value = html ? match[1] : match[2];
            tokens.push({
                value: value,
                tag: true,
                html: html
            });
            lastIndex = index + match[0].length;
        }

        if (lastIndex < text.length) {
            tokens.push({
                value: text.slice(lastIndex)
            });
        }
        return tokens;
    }

    isDirective(attr) {
        return attr.indexOf('v-') === 0;
    }

    isEventDirective(dir) {
        return dir.indexOf('on') === 0;
    }

    isElementNode(node) {
        return node.nodeType === 1;
    }

    isTextNode(node) {
        return node.nodeType === 3;
    }
}


const directiveUtil = {
    text: function (node, vm, expression) {
        this.bind(node, vm, expression, 'text');
    },

    html: function (node, vm, expression) {
        this.bind(node, vm, expression, 'html');
    },

    class: function (node, vm, expression) {
        this.bind(node, vm, expression, 'class');
    },

    for: function (node, vm, expression) {
        let itemName = expression.split('in')[0].replace(/\s/g, ''),
            arrayName = expression.split('in')[1].replace(/\s/g, '').split('.'),
            parentNode = node.parentNode,
            startNode = document.createTextNode(''),
            endNode = document.createTextNode(''),
            range = document.createRange();

        parentNode.replaceChild(endNode, node);
        parentNode.insertBefore(startNode, endNode);

        let value = vm;
        arrayName.forEach(function (curVal) {
            value = value[curVal];
        });

        value.forEach(function (item, index) {
            let cloneNode = node.cloneNode(true);
            parentNode.insertBefore(cloneNode, endNode);
            let forVm = Object.create(vm);
            forVm.$index = index;
            forVm[itemName] = item;
            new Compiler(cloneNode, forVm);
        });

        new Watcher(vm, arrayName + ".length", function (newValue, oldValue) {
            range.setStart(startNode, 0);
            range.setEnd(endNode, 0);
            range.deleteContents();
            value.forEach((item, index) => {
                let cloneNode = node.cloneNode(true);
                parentNode.insertBefore(cloneNode, endNode);
                let forVm = Object.create(this);
                forVm.$index = index;
                forVm[itemName] = item;
                new Compiler(cloneNode, forVm);
            });
        });

    },

    model: function (node, vm, expression) {
        this.bind(node, vm, expression, 'model');

        let value = this._getVMVal(vm, expression);

        let composing = false;

        //compositionstart触发于键盘按键按下之前
        node.addEventListener('compositionstart', () => {
            composing = true;
        }, false);

        //compositionend触发于按键松开后，恢复待输入状态
        node.addEventListener('compositionend', event => {
            composing = false;
            if (value !== event.target.value) {
                this._setVMVal(vm, expression, event.target.value);
            }
        }, false);

        //监听 input 的输入
        node.addEventListener('input', event => {
            if (!composing && value !== event.target.value) {
                this._setVMVal(vm, expression, event.target.value);
            }
        }, false);
    },

    //创建监听者，绑定属性与更新函数 updaterXXX
    bind: function (node, vm, expression, directive) {
        var updaterFn = updater[directive + 'Updater'];
        let value = this._getVMVal(vm, expression);
        updaterFn && updaterFn(node, value);
        new Watcher(vm, expression, function (newValue, oldValue) {
            updaterFn && updaterFn(node, newValue, oldValue);
        });
    },

    addEvent: function (node, vm, directive, expression) {
        let eventType = directive.split(':');
        let fn = vm.$options.methods && vm.$options.methods[expression];

        if (eventType[1] && typeof fn === 'function') {
            node.addEventListener(eventType[1], fn.bind(vm), false);
        } else {
            let match = paramsRE.exec(expression),
                fnName = expression.replace(match[0], ''),
                paramNames = match[1].split(','),
                params = [];

            paramsRE.exec("remove(todo)");
            fn = vm.$options.methods[fnName];
            for (let i = 0; i < paramNames.length; i++) {
                let name = paramNames[i].trim(),
                    stringMatch = stringRE.exec(name);
                if (stringMatch) {
                    params.push(stringMatch[1]);
                } else {
                    params.push(vm[name]);
                }

            }
            node.addEventListener(eventType[1], function () {
                fn.apply(vm, params);
            }, false);
        }
    },

    _getVMVal: function (vm, expression) {
        expression = expression.trim();
        let value = vm;
        expression = expression.split('.');
        expression.forEach((key) => {
            if (value.hasOwnProperty(key)) {
                value = value[key];
            } else {
                throw new Error("can not find the property: " + key);
            }

        });

        if (typeof value === 'object') {
            return JSON.stringify(value);
        } else {
            return value;
        }
    },

    _setVMVal: function (vm, expression, value) {
        expression = expression.trim();
        let data = vm._data;
        expression = expression.split('.');
        expression.forEach((key, index) => {
            if (index == expression.length - 1) {
                data[key] = value;
            } else {
                data = data[key];
            }
        });
    }
}

const cacheDiv = document.createElement('div');

//界面更新函数
const updater = {
    textUpdater: function (node, value) {
        node.textContent = typeof value === 'undefined' ? '' : value;
    },

    htmlUpdater: function (node, value) {
      console.log(value);
        if (node.$parent) {
            cacheDiv.innerHTML = value;
            const childNodes = cacheDiv.childNodes,
                doms = [];
            let len = childNodes.length,
                tempNode;

            //暂不知道 oncetime 具体作用
            if (node.$oncetime) {
                while (len--) {
                    tempNode = childNodes[0];
                    node.appendChild(tempNode);
                    doms.push(tempNode);
                }
                node.$doms = doms;
                node.$oncetime = false;
            } else {
                let newFragment = document.createDocumentFragment();
                while (len--) {
                    tempNode = childNodes[0];
                    newFragment.appendChild(tempNode);
                    doms.push(tempNode);
                }
                node.$parent.insertBefore(newFragment, node.$doms[0]);
                node.$doms.forEach(childNode => {
                    node.$parent.removeChild(childNode);
                });
                node.$doms = doms;
            }

        } else {
            node.innerHTML = typeof value === 'undefined' ? '' : value;
        }
    },

    classUpdater: function (node, value, oldValue) {
        var nodeNames = node.className;
        if (oldValue) {
            nodeNames = nodeNames.replace(oldValue, '').replace(/\s$/, '');
        }
        var space = nodeNames && value ? ' ' : '';
        node.className = nodeNames + space + value;
    },

    modelUpdater: function (node, value) {
        node.value = typeof value === 'undefined' ? '' : value;
    },
}
