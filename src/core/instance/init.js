/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    // 处理组件的配置项
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 子组件 性能优化 减少原型链的动态查找 提高执行效率
      initInternalComponent(vm, options)
    } else {
      // 根组件 选项合并 将全局配置选项合并到根组件的局部配置
      // 根组件 选项合并 发生在3个地方
      // 1. Vue.component() 做了选项合并 合并的 Vue 内置的全局组件和用户自己注册的全局组件 最终都会放到全局的 components 选项中
      // 2. { components: { xxx } } 局部注册 执行编译生成的 render 函数时做了选项合并 会合并全局配置项到局部配置项中
      // 3. 根组件
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }

    // expose real self
    vm._self = vm
    // 组件关系属性的初始化，比如：$parent $root $children
    initLifecycle(vm)
    // 初始化自定义事件
    // <component @click="handleClick"></component>
    // 组件上事件的监听其实是子组件自己在监听，也就是说谁监听谁触发
    // this.$emit('click') this.$on('click', function handleClick() {})
    initEvents(vm)
    // 初始化插槽，获取 this.$slots 定义 this._c 即 createElement 方法，平时的使用 h 函数
    initRender(vm)
    // 执行 beforeCreate 生命周期函数
    callHook(vm, 'beforeCreate')
    // 初始化 inject 选项，得到 result[key] = val 形式的配置对象 并做响应式处理
    initInjections(vm) // resolve injections before data/props
    // 响应式原理核心
    initState(vm)
    // 处理 provide 选项
    initProvide(vm) // resolve provide after data/props
    // 执行 created 生命周期函数
    callHook(vm, 'created')

    // 如果 el 选项，自动执行$mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

// 性能优化，打平配置上的属性，减少运行对原型链的查找，提高执行效率    
export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  // 基于 构造函数 上的配置对象创建 vm.$options
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

// 从构造函数上解析配置项
export function resolveConstructorOptions (Ctor: Class<Component>) {
  // 从实例构造函数上获取选项
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    // 缓存
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      // 说明基类的配置项发生改变
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      // 找到更改的选项
      if (modifiedOptions) {
        // 将更改的选项和 extend 选项合并
        extend(Ctor.extendOptions, modifiedOptions)
      }
      // 将新的选项赋值给 options
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
