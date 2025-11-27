// 从 importmap 导入 Three.js 库的所有导出内容，并将其绑定到 THREE 对象上
import * as THREE from 'three';

// 导入场景管理模块
import SceneManager from './SceneManager.js'
// 导入相机管理模块
import CameraManager from './CameraManager.js'
// 导入灯光管理模块
import LightManager from './LightManager.js'
// 导入渲染管理模块
import RenderManager from './RenderManager.js'
// 导入调试 UI 类模块
import DebugUI from './DebugUI.js'
// 导入窗口尺寸管理模块
import Sizes from './Utils/Sizes.js'
// 导入时间管理模块
import Time from './Utils/Time.js'
// 导入资源加载模块
import sources from './World/sources.js'
import Resources from './Utils/Resources.js'

// 导入世界管理模块
import MeshManager from './MeshManager.js'
// 导入动画管理模块
import AnimationManager from './Utils/AnimationManager.js'
// 导入后期处理模块
import PostProcessor from './PostProcessor.js'
// 导入辅助工具管理模块
import HelperManager from './HelperManager.js'
// 导入交互系统管理模块
import InteractionManager from './InteractionManager.js'
// 导入粒子系统管理模块
import ParticleManager from './ParticleManager.js'
// 导入性能优化管理模块
import PerformanceManager from './PerformanceManager.js'
// 导入着色器管理模块
import ShaderManager from './ShaderManager.js'
// 导入物理引擎管理模块
import PhysicsManager from './PhysicsManager.js'
// 导入音频系统管理模块
import AudioManager from './AudioManager.js'
// 导入WebXR管理模块
import WebXRManager from './WebXRManager.js'

// 单例模式的实例变量，初始化为 null
let instance = null;
/**
 * ThreeJSAssetsManager 类用于管理 Three.js 项目的核心资源和功能，
 * 采用单例模式确保全局只有一个实例。
 */
export default class ThreeJSAssetsManager {
  /**
   * 构造函数，初始化 Three.js 项目所需的各种管理器和资源。
   * @param {HTMLCanvasElement} canvas - 用于渲染 Three.js 场景的画布元素。
   */
  constructor(options) {
    // 全局只有一个单例，若实例已存在则直接返回
    if (instance) {
      return instance;
    }
    // 将当前实例赋值给单例变量
    instance = this;
    // 将实例挂载到 window 对象上，防止被垃圾回收
    window.ThreeJSAssetsManagerInstance = this;

    // 兼容不同的参数传递方式
     if (options && typeof options === 'object' && options.container) {
       this.canvas = options.container;
     } else {
       // 如果直接传入canvas元素
       this.canvas = options;
     }

    // 初始化资源管理器
    this.resources = new Resources(sources);
    // 初始化场景管理器并获取场景对象
    this.sceneManagerinstance = new SceneManager(this.canvas, {debug: false, gui: null});
    this.scene = this.sceneManagerinstance.scene
    this.mainGroup = this.sceneManagerinstance.mainGroup;
    // 初始化灯光管理器
    this.lightManagerInstance = new LightManager({debug: false, gui: null});
    // 初始化世界渲染实例
    this.meshManagerInstance = new MeshManager({debug: false, gui: null});
    
    // 初始化调试 GUI 实例
    this.debuguiinstance = new DebugUI(this.sceneManagerinstance, this.meshManagerInstance);
    this.debug = this.debuguiinstance.debug;
    this.gui = this.debuguiinstance.gui;
    // 初始化窗口尺寸管理器和时间管理器
    this.sizes = new Sizes();
    this.time = new Time();

    // 重新初始化管理器，传入正确的debug和gui参数
    this.sceneManagerinstance = new SceneManager(this.canvas, {debug: this.debug, gui: this.gui});
    this.scene = this.sceneManagerinstance.scene
    this.mainGroup = this.sceneManagerinstance.mainGroup;
    this.lightManagerInstance = new LightManager({debug: this.debug, gui: this.gui});
    this.meshManagerInstance = new MeshManager({debug: this.debug, gui: this.gui});
    this.animationManagerInstance = new AnimationManager({debug: this.debug, gui: this.gui});
    
    // 初始化相机管理器并获取相机对象
    this.cameraManagerInstance = new CameraManager({debug: this.debug, gui: this.gui});
    this.camera = this.cameraManagerInstance.camera;
    // 初始化渲染管理器
    this.renderManagerInstance = new RenderManager({debug: this.debug, gui: this.gui});
    // 初始化后期处理器
    this.postProcessor = new PostProcessor({debug: this.debug, gui: this.gui});
    // 初始化辅助工具管理器
    this.helperManager = new HelperManager({debug: this.debug, gui: this.gui});
    // 初始化交互系统管理器
    this.interactionManager = new InteractionManager({debug: this.debug, gui: this.gui});
    // 初始化粒子系统管理器
    this.particleManager = new ParticleManager({debug: this.debug, gui: this.gui});
    // 初始化性能优化管理器
    this.performanceManager = new PerformanceManager({debug: this.debug, gui: this.gui});
    // 初始化着色器管理器
    this.shaderManager = new ShaderManager({debug: this.debug, gui: this.gui});
    // 初始化物理引擎管理器
    this.physicsManager = new PhysicsManager({debug: this.debug, gui: this.gui});
    // 初始化音频系统管理器
    this.audioManager = new AudioManager({debug: this.debug, gui: this.gui});
    // 初始化WebXR管理器
    this.webXRManager = new WebXRManager({debug: this.debug, gui: this.gui});

    // 为窗口尺寸变化事件注册监听器，当窗口尺寸变化时调用 resize 方法
    this.sizes.on('resize', () => {
      this.resize();
    });

    // 为时间更新事件注册监听器，每帧调用 tick 方法
    this.time.on('tick', () => {
      this.tick();
    });
  }

  /**
   * 处理窗口尺寸变化时的回调方法，用于更新相关管理器的状态。
   */
  resize() {
    //TODO: 当尺寸调整时，可以在这里调整画布尺寸。
    console.log('ThreeJSAssetsManager:resize');
    // 调用相机管理器的 resize 方法更新相机状态
    this.cameraManagerInstance.resize();
    // 调用渲染管理器的 resize 方法更新渲染状态
    this.renderManagerInstance.resize();
    // 更新后期处理器尺寸
    if (this.postProcessor) this.postProcessor.resize();
  }

  /**
   * 每帧更新时的回调方法，用于更新游戏逻辑和渲染内容。
   */
  tick() {
    //TODO: 每帧更新时，可以在这里更新时间或者进行游戏逻辑
    console.log('ThreeJSAssetsManager:tick');
    // 调用相机管理器的 update 方法更新相机状态
    this.cameraManagerInstance.update();
    // 调用世界渲染实例的 update 方法更新世界状态
    this.meshManagerInstance.update();
    // 更新动画管理器
    if (this.animationManagerInstance) {
      this.animationManagerInstance.update(this.time.delta);
    }
    // 更新辅助工具
    if (this.helperManager) this.helperManager.update();
    // 更新粒子系统
    if (this.particleManager) this.particleManager.update();
    // 更新性能管理器
    if (this.performanceManager) this.performanceManager.update();
    // 更新着色器
    if (this.shaderManager) this.shaderManager.update();
    // 更新物理引擎
    if (this.physicsManager) this.physicsManager.update();
    // 调用渲染管理器的 update 方法更新渲染内容
    if (this.postProcessor && this.postProcessor.enabled) {
      this.postProcessor.update();
    } else {
      this.renderManagerInstance.update();
    }
  }
}