import { WebGLRenderer, Color, SRGBColorSpace, CineonToneMapping, PCFSoftShadowMap } from 'three';
// import { ColorSpace} from 'three/src/enums/ColorSpace.js';
import ThreeJSAssetsManager from './ThreeJSAssetsManager.js';
import Sizes from "./Utils/Sizes.js";
import config from './config.js';

export default class RenderManager {
    constructor () {
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
        
        // 应用config配置
        this.webGLRenderer.toneMapping = config.RenderManager?.toneMapping || CineonToneMapping;
        this.webGLRenderer.toneMappingExposure = config.RenderManager?.toneMappingExposure || 1.75;
        this.webGLRenderer.shadowMap.enabled = config.RenderManager?.shadowMap?.enabled || true;
        this.webGLRenderer.shadowMap.type = config.RenderManager?.shadowMap?.type || PCFSoftShadowMap;
        this.webGLRenderer.setClearColor(new Color(config.RenderManager?.clearColor || '#211d20'));
        
        // 设置渲染器尺寸
        this.webGLRenderer.setSize(this.sizes.width, this.sizes.height);
        this.webGLRenderer.setPixelRatio(this.sizes.pixelRatio);
        
        // 调试模式下添加GUI控制
        if(this.debug) {
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
        rendererFolder.add(this.webGLRenderer, 'toneMappingExposure').min(0).max(5).step(0.01).name('曝光度');
        
        // 创建一个颜色对象用于调试
        const bgColor = { value: '#211d20' };
        rendererFolder.addColor(bgColor, 'value').name('背景色').onChange((color) => {
          this.webGLRenderer.setClearColor(new Color(color));
        });
        
        rendererFolder.add(this.webGLRenderer.shadowMap, 'enabled').name('阴影映射');
        rendererFolder.close();
      }
}