/*
 * @Author: shaoqing
 * @Date: 2021-10-19 10:10:15
 * @LastEditTime: 2021-10-20 11:24:11
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: \vue\src\core\instance\index.js
 */
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // Vue.prototype.__init 方法
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
