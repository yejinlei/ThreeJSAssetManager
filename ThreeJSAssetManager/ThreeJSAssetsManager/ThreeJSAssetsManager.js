// 从 CDN 导入 Three.js 库的所有导出内容，并将其绑定到 THREE 对象上
import * as THREE from 'https://gcore.jsdelivr.net/npm/three@0.165.0/build/three.module.js'

// 导入调试 UI 实例模块
import debuguiInstance from './DebugUI.js'
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

// 单例模式的实例变量，初始化为 null
let instance = null;
/**
 * ThreeJSAssetsManager 类用于管理 Three.js 项目的核心资源和功能，
 * 采用单例模式确保全局只有一个实例。
 */
export default class ThreeJSAssetsManager 
{
  /**
   * 构造函数，初始化 Three.js 项目所需的各种管理器和资源。
   * @param {HTMLCanvasElement} canvas - 用于渲染 Three.js 场景的画布元素。
   */
  constructor(canvas) 
  {	
    // 全局只有一个单例，若实例已存在则直接返回
    if (instance) 
    {
      return instance;
    }
    // 将当前实例赋值给单例变量
    instance = this;
    // 将实例挂载到 window 对象上，防止被垃圾回收
    window.ThreeJSAssetsManagerInstance = this;
    
    // 保存传入的画布元素
    this.canvas = canvas;

    // 初始化调试 GUI 实例
    this.debuguiinstance = new DebugUI();
    this.debug = this.debuguiinstance.debug;
    this.gui = this.debuguiinstance.gui;

    // 初始化资源管理器
    this.resources = new Resources(sources);
    // 初始化场景管理器并获取场景对象
    this.sceneManagerinstance = new SceneManager(this.canvas);
    this.scene = this.sceneManagerinstance.scene
    this.mainGroup = this.sceneManagerinstance.mainGroup;
    // 初始化灯光管理器
    this.lightManagerInstance = new LightManager();
    // 初始化世界渲染实例
    this.meshManagerInstance = new MeshManager();
    // 初始化动画管理器
    this.animationManagerInstance = new AnimationManager();

    // 初始化窗口尺寸管理器和时间管理器
    this.sizes = new Sizes();
    this.time = new Time();

    // 初始化相机管理器并获取相机对象
    this.cameraManagerInstance = new CameraManager();
    this.camera = this.cameraManagerInstance.camera;
    // 初始化渲染管理器
    this.renderManagerInstance = new RenderManager();

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
  resize()
  {
    //TODO: 当尺寸调整时，可以在这里调整画布尺寸。
    console.log('ThreeJSAssetsManager:resize');
    // 调用相机管理器的 resize 方法更新相机状态
    this.cameraManagerInstance.resize();
    // 调用渲染管理器的 resize 方法更新渲染状态
    this.renderManagerInstance.resize();
  }

  /**
   * 每帧更新时的回调方法，用于更新游戏逻辑和渲染内容。
   */
  tick()
  {
    //TODO: 每帧更新时，可以在这里更新时间或者进行游戏逻辑
    console.log('ThreeJSAssetsManager:tick');
    // 调用相机管理器的 update 方法更新相机状态
    this.cameraManagerInstance.update();
    // 调用世界渲染实例的 update 方法更新世界状态
    this.meshManagerInstance.update();
    // 调用渲染管理器的 update 方法更新渲染内容
    this.renderManagerInstance.update();
  }
}
