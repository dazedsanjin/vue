/*
 * @Author: your name
 * @Date: 2021-10-19 10:10:15
 * @LastEditTime: 2021-10-19 11:12:04
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \vue\src\core\observer\array.js
 */
/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
// 基于数组原型对象创建一个新的对象
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  // 分别在 arrayMethods 对象上定义七个方法
  def(arrayMethods, method, function mutator (...args) {
    // 先执行原生的方法
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 如果是新增的元素,进行响应式处理
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 进行依赖通知
    ob.dep.notify()
    return result
  })
})
