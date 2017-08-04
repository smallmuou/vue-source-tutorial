/**
 * util.js
 *
 * 公共文件，定义基础函数
 */

export function def(obj, key, value, enumerable) {
    /**
     * Object.defineProperty为对象添加属性
     * value 值
     * writeable 是否可写
     * configurable 是否配置，如可删除
     * enumerable 是否出现在枚举结果集中
     */
    Object.defineProperty(obj, key, {
        value: value,
        writeable: true,
        configurable: true,
        enumerable: !!enumerable
    });
}

export function debounce(func, wait, immediate) {
  var timeout = null;

  return function () {
    var delay = function () {
      timeout = null;
      if (!immediate) {
        func.apply(this, arguments);
      }
    }
    var callnow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(delay ,wait);
    if (callnow) {
      func.apply(this, arguments);
    }
  }
}
