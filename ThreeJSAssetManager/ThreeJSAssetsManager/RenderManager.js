import * as THREE from 'three';
import { WebGLRenderer, Color, SRGBColorSpace, PCFSoftShadowMap } from 'three';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
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

    this.webGLRenderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });

    // 基础渲染器配置
    this.webGLRenderer.physicallyCorrectLights = true;
    this.webGLRenderer.outputColorSpace = SRGBColorSpace;

    // 应用config配置 - 从config.js读取所有值，不使用硬编码默认值
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

    this.webGLRenderer.toneMapping = toneMappingMap[config.RenderManager.toneMapping] || THREE.CineonToneMapping;
    this.webGLRenderer.toneMappingExposure = config.RenderManager.toneMappingExposure;
    this.webGLRenderer.shadowMap.enabled = config.RenderManager.shadow.enabled;
    this.webGLRenderer.shadowMap.type = shadowMapTypeMap[config.RenderManager.shadow.type] || THREE.PCFSoftShadowMap;
    this.webGLRenderer.setClearColor(new Color(config.RenderManager.clearColor));

    // 设置渲染器尺寸
    this.webGLRenderer.setSize(this.sizes.width, this.sizes.height);
    this.webGLRenderer.setPixelRatio(this.sizes.pixelRatio);

    // 调试模式下添加GUI控制
    if (this.debug) {
      this.setupDebugGUI();
    }
  }

  resize() {
    this.webGLRenderer.setSize(this.sizes.width, this.sizes.height);
    this.webGLRenderer.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    this.webGLRenderer.render(this.scene, this.camera);
  }

  setupDebugGUI() {
    // 添加到相机与渲染分类下
    const cameraRenderFolder = this.gui.cameraFolder || this.gui.addFolder('📷 Camera & Rendering (相机与渲染)');
    const rendererFolder = cameraRenderFolder.addFolder('Renderer(渲染管理)');

    // ToneMapping 下拉选择
    const toneMappingOptions = {
      'NoToneMapping': THREE.NoToneMapping,
      'LinearToneMapping': THREE.LinearToneMapping,
      'ReinhardToneMapping': THREE.ReinhardToneMapping,
      'CineonToneMapping': THREE.CineonToneMapping,
      'ACESFilmicToneMapping': THREE.ACESFilmicToneMapping
    };

    const toneMappingControl = {
      toneMapping: config.RenderManager.toneMapping
    };

    rendererFolder.add(toneMappingControl, 'toneMapping', Object.keys(toneMappingOptions))
      .name('色调映射(Tone Mapping)')
      .onChange((value) => {
        this.webGLRenderer.toneMapping = toneMappingOptions[value];
        config.RenderManager.toneMapping = value;
      });

    rendererFolder.add(this.webGLRenderer, 'toneMappingExposure').min(0).max(5).step(0.01).name('曝光度(Exposure)');

    // 创建一个颜色对象用于调试
    const bgColor = { value: config.RenderManager.clearColor };
    rendererFolder.addColor(bgColor, 'value').name('背景色(Clear Color)').onChange((color) => {
      this.webGLRenderer.setClearColor(new Color(color));
      config.RenderManager.clearColor = color;
    });

    // Shadow 控制
    const shadowFolder = rendererFolder.addFolder('Shadow(阴影)');
    shadowFolder.add(this.webGLRenderer.shadowMap, 'enabled').name('启用(Enabled)').onChange((value) => {
      config.RenderManager.shadow.enabled = value;
    });

    // ShadowMap 类型下拉选择
    const shadowMapTypeOptions = {
      'BasicShadowMap': THREE.BasicShadowMap,
      'PCFShadowMap': THREE.PCFShadowMap,
      'PCFSoftShadowMap': THREE.PCFSoftShadowMap,
      'VSMShadowMap': THREE.VSMShadowMap
    };

    const shadowTypeControl = {
      type: config.RenderManager.shadow.type
    };

    shadowFolder.add(shadowTypeControl, 'type', Object.keys(shadowMapTypeOptions))
      .name('类型(Type)')
      .onChange((value) => {
        this.webGLRenderer.shadowMap.type = shadowMapTypeOptions[value];
        this.webGLRenderer.shadowMap.needsUpdate = true;
        config.RenderManager.shadow.type = value;
      });

    rendererFolder.close();
  }
}