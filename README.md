# Vue源码解读

> 对于前端理解一直很模糊，知道一些大概，js、css、html，但一直无法深入，可能没做过什么项目；几个月前学习了下 angular 基本语法，并开发了个小项目，实际只开发了一半，后来有其他任务就耽误了，现在想来，当时纯纯的只是代码搬运工，根本不理解其中的原理，因此忘的也很快，到现在基本都忘光了；最近同事要换 web 框架，打算使用 vue 来开发，于是我也去了解了下，发现语法相当简洁，但又不想步入之前学习 angular 的老路，于是我想去了解下 vue 的真正原理。百度发现一篇文章《剖析Vue原理&实现双向绑定MVVM》，写的很不错，对 vue 的双向绑定解释的很清楚，于是我从 github 找到了早期版本的代码，代码不多，非常便于我这样的 js 菜鸟阅读，通过阅读此源码，可以说收获很多，一方面是 js 的加深理解，另一方，了解到了 vue 的整个工作原理。


### 理解
* js中函数是一等公民，可以赋值
* js原本是没有类的概念，是在后期的版本中加入的
* this指向
```
js 的函数调用，实际是：
func.call(context, ...)

func(...) == func.call(undefined, ...)   js规定，当 context 为 undefined，默认为 window
obj.func(...) == obj.func.call(obj, ...)
```
* 双向绑定
  * V => M: 比较简单，只要监听 V 相应的事件即可
  * M => V
  ```
  1. 遍历所有 model，重写 get 和 set 方法，一旦外部对 model 进行赋值，则检测是否变化，并调用订阅者队列的 watcher 进行更新
  2. 遍历dom，新建 watcher，绑定属性-更新函数，并触发加入订阅者队列
  ```

### 调试代码

代码中的很多注释是在我实际调试后给出的，我也建议大家实际调试，这样体会更深，可以通过如下命令:

* npm install
* npm run webpack
* open index.html

### 致谢

在阅读代码的过程中，感谢以下链接给予的启发

1. 《[剖析Vue原理&实现双向绑定MVVM](https://segmentfault.com/a/1190000006599500)》
2. 《[vue-come-true](https://github.com/coderzzp/vue-come-true)》
