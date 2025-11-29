import * as THREE from 'three';
import { WebGLRenderer, Color, SRGBColorSpace, PCFSoftShadowMap } from 'three';
import Sizes from "./Utils/Sizes.js";
import config from './config.js';

export default class RenderManager {
  constructor() {
    // 直接使用全局实例，避免重复创建
    this.threejsassetsmanagerInstance = window.ThreeJSAssetsManagerInstance;
    this.canvas = this.threejsassetsmanagerInstance?.canvas;
    this.sizes = this.threejsassetsmanagerInstance?.sizes;
    this.scene = this.threejsassetsmanagerInstance?.scene;
    this.camera = this.threejsassetsmanagerInstance?.cameraManagerInstance?.camera;
    this.debug = this.threejsassetsmanagerInstance?.debug;
    this.gui = this.threejsassetsmanagerInstance?.gui;

    // 任务要求1：所有参数来源于config.js
    // 任务要求2：根据enabled的值决定是否初始化
    this.config = config.RenderManager || {
      enabled: true,
      antialias: true,
      physicallyCorrectLights: true,
      outputColorSpace: 'SRGBColorSpace',
      toneMapping: 'CineonToneMapping',
      toneMappingExposure: 1.0,
      clearColor: 0x212831,
      shadow: {
        enabled: true,
        type: 'PCFSoftShadowMap'
      }
    };
    
    // 设置启用状态
    this.enabled = this.config.enabled !== false;

    // 无论enabled状态如何，都初始化渲染器以支持调试功能
    this.webGLRenderer = null;
    this.initializeRenderer();

    // 任务要求3：无论enabled状态如何，都设置调试UI
    if (this.debug) {
      this.setupDebugGUI();
    }

    // 设置渲染器尺寸
    if (this.webGLRenderer && this.sizes) {
      this.webGLRenderer.setSize(this.sizes.width, this.sizes.height);
      this.webGLRenderer.setPixelRatio(this.sizes.pixelRatio);
    }
  }

  resize() {
    this.webGLRenderer.setSize(this.sizes.width, this.sizes.height);
    this.webGLRenderer.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    // 任务要求2：根据enabled的值决定是否调用threejs的api
    if (this.enabled && this.webGLRenderer && this.scene && this.camera) {
      this.webGLRenderer.render(this.scene, this.camera);
    }
  }

  initializeRenderer() {
    // 无论enabled状态如何，都初始化渲染器以支持调试功能
    if (!this.canvas) return;
    
    this.webGLRenderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: this.config.antialias
    });

    // 基础渲染器配置
    this.webGLRenderer.physicallyCorrectLights = this.config.physicallyCorrectLights;
    
    // 颜色空间设置
    const colorSpaceMap = {
      'SRGBColorSpace': SRGBColorSpace,
      'LinearSRGBColorSpace': THREE.LinearSRGBColorSpace
    };
    this.webGLRenderer.outputColorSpace = colorSpaceMap[this.config.outputColorSpace] || SRGBColorSpace;

    // ToneMapping 映射
    const toneMappingMap = {
      'NoToneMapping': THREE.NoToneMapping,
      'LinearToneMapping': THREE.LinearToneMapping,
      'ReinhardToneMapping': THREE.ReinhardToneMapping,
      'CineonToneMapping': THREE.CineonToneMapping,
      'ACESFilmicToneMapping': THREE.ACESFilmicToneMapping
    };

    // ShadowMap 类型映射
    const shadowMapTypeMap = {
      'BasicShadowMap': THREE.BasicShadowMap,
      'PCFShadowMap': THREE.PCFShadowMap,
      'PCFSoftShadowMap': THREE.PCFSoftShadowMap,
      'VSMShadowMap': THREE.VSMShadowMap
    };

    // 应用配置 - 任务要求1：所有参数来源于config.js
    this.webGLRenderer.toneMapping = toneMappingMap[this.config.toneMapping] || THREE.CineonToneMapping;
    this.webGLRenderer.toneMappingExposure = this.config.toneMappingExposure;
    this.webGLRenderer.shadowMap.enabled = this.config.shadow?.enabled;
    this.webGLRenderer.shadowMap.type = shadowMapTypeMap[this.config.shadow?.type] || THREE.PCFSoftShadowMap;
    this.webGLRenderer.setClearColor(new Color(this.config.clearColor));
  }

  setupDebugGUI() {
    if (!this.gui) return;
    
    // 任务要求3：无论enabled状态如何，都显示DebugUI
    // 添加到相机与渲染分类下
    const cameraRenderFolder = this.gui.cameraFolder || this.gui.addFolder('📷 Camera & Rendering (相机与渲染)');
    const rendererFolder = cameraRenderFolder.addFolder('Renderer(渲染管理)');

    // 启用/禁用控制 - 任务要求4：值变更时实时生效
    rendererFolder.add(this, 'enabled').name('启用渲染器(Enabled)').onChange((value) => {
      this.config.enabled = value;
      // 实时生效：重新初始化渲染器
      this.initializeRenderer();
    });

    // ToneMapping 下拉选择
    const toneMappingOptions = {
      'NoToneMapping': THREE.NoToneMapping,
      'LinearToneMapping': THREE.LinearToneMapping,
      'ReinhardToneMapping': THREE.ReinhardToneMapping,
      'CineonToneMapping': THREE.CineonToneMapping,
      'ACESFilmicToneMapping': THREE.ACESFilmicToneMapping
    };

    const toneMappingControl = {
      toneMapping: this.config.toneMapping
    };

    rendererFolder.add(toneMappingControl, 'toneMapping', Object.keys(toneMappingOptions))
      .name('色调映射(Tone Mapping)')
      .onChange((value) => {
        this.config.toneMapping = value;
        if (this.webGLRenderer) {
          this.webGLRenderer.toneMapping = toneMappingOptions[value];
        }
      });

    rendererFolder.add(this.config, 'toneMappingExposure').min(0).max(5).step(0.01).name('曝光度(Exposure)')
      .onChange((value) => {
        if (this.webGLRenderer) {
          this.webGLRenderer.toneMappingExposure = value;
        }
      });

    // 创建一个颜色对象用于调试
    const bgColor = { value: this.config.clearColor };
    rendererFolder.addColor(bgColor, 'value').name('背景色(Clear Color)').onChange((color) => {
      this.config.clearColor = color;
      if (this.webGLRenderer) {
        this.webGLRenderer.setClearColor(new Color(color));
      }
    });

    // Shadow 控制 - 任务要求3和4
    const shadowFolder = rendererFolder.addFolder('Shadow(阴影)');
    
    // 确保shadow配置对象存在
    if (!this.config.shadow) {
      this.config.shadow = { enabled: false, type: 'PCFSoftShadowMap' };
    }
    
    // 启用/禁用阴影 - 从this.config读取并实时同步
    shadowFolder.add(this.config.shadow, 'enabled').name('启用(Enabled)').onChange((value) => {
      this.config.shadow.enabled = value;
      if (this.webGLRenderer) {
        this.webGLRenderer.shadowMap.enabled = value;
      }
    });

    // ShadowMap 类型下拉选择
    const shadowMapTypeOptions = {
      'BasicShadowMap': THREE.BasicShadowMap,
      'PCFShadowMap': THREE.PCFShadowMap,
      'PCFSoftShadowMap': THREE.PCFSoftShadowMap,
      'VSMShadowMap': THREE.VSMShadowMap
    };

    const shadowTypeControl = {
      type: this.config.shadow.type
    };

    shadowFolder.add(shadowTypeControl, 'type', Object.keys(shadowMapTypeOptions))
      .name('类型(Type)')
      .onChange((value) => {
        this.config.shadow.type = value;
        if (this.webGLRenderer) {
          this.webGLRenderer.shadowMap.type = shadowMapTypeOptions[value];
          this.webGLRenderer.shadowMap.needsUpdate = true;
        }
      });

    rendererFolder.close();
  }
}