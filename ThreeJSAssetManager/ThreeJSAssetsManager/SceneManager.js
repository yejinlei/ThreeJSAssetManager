//import * as THREE from 'https://gcore.jsdelivr.net/npm/three@0.132.2/build/three.min.js'
import { Scene, Fog, Color, Group, SRGBColorSpace } from 'three'
import threeJSAssetsManager from './ThreeJSAssetsManager.js'
import config from './config.js'
/**
 * 场景管理器类
 */
export default class SceneManager {
  /**
   * 构造函数
   * @param {Object} THREE - Three.js 库对象
   * @param {Object} [options] - 场景配置选项
   */
  constructor(cavas, options = {}) {
    this.threejsassetsmanagerInstance = new threeJSAssetsManager();
    this.resources = this.threejsassetsmanagerInstance.resources;
    this.debug = this.threejsassetsmanagerInstance.debug;
    this.gui = this.threejsassetsmanagerInstance.gui;
  
    console.log(this.threejsassetsmanagerInstance);

    this.cavas = cavas;

    this.scene = new Scene();
    this.mainGroup = new Group();
    // GLB根部节点，便于添加glb模型场景到主场景组
    this.mainGroup.name = 'GLBMainGroup';
    this.scene.add(this.mainGroup);

    this.resources.on('ready', () => {
      // 遍历所有资源
      this.resources.sources.forEach(object =>
      {
          if(object.type === "rgbeLoader" && object.name === "environment"){
            this.scene.background = this.resources.items['environment'];
            this.scene.environment = this.resources.items['environment'];
          }
      })
  });


    this.confScene();
    this.confGUI();
    this.modelVisibility = {}; // 模型可见性状态
    
    // 应用配置选项
    // 背景颜色
    // if (options.background) {
    //   this.scene.background = new THREE.Color(options.background);
    // } else {
    //   this.scene.background = new THREE.Color(0xffffff);
    // }
  }
  
  /**
   * 设置当前场景对象
   * @param {THREE.Scene} scene - 要设置的新场景对象
   */
  setScence(scene) {
    // 将传入的场景对象赋值给当前实例的场景属性
    this.scene = scene;
  }
  /**
   * 获取场景对象
   * @returns {THREE.Scene}
   */
  getScene() {
    return this.scene;
  }

  confScene() {
  
    if(!(config['SceneManager'] || {}).enabled)
      return; 


    console.log('SceneManager:confScene函数，配置：',(config['SceneManager'] || {}));
    // 背景颜色
    if ((config['SceneManager'] || {}).Color.enabled) {
      console.log((config['SceneManager'] || {}).Color.value);
      this.scene.background = new Color((config['SceneManager'] || {}).Color.value);
    } else {
      this.scene.background = new Color(0xffffff);
    }

    // 雾效果
    if ((config['SceneManager'] || {}).fog.enabled) {
      this.scene.fog = new Fog((config['SceneManager'] || {}).fog.color, (config['SceneManager'] || {}).fog.near, (config['SceneManager'] || {}).fog.far);
    }

    // // 环境光
    // if (sceneConfig.environment) {
    //   this.scene.environment = new THREE.TextureLoader().load(sceneConfig.environment);
    // }

    // // 阴影设置
    // if (sceneConfig.shadow) {
    //   this.setupShadows(sceneConfig.shadow);
    // }
    
  }

  confGUI()
  {
    if (!this.debug || !this.gui) return;
    
    if (!this.scene) this.scene = new Scene();
    this.debugFolder = this.gui.addFolder('SceneManager(场景管理)');

    // 确保场景属性存在
    if (!this.scene.background) this.scene.background = new Color(0xffffff);
    if (!this.scene.fog) this.scene.fog = new Fog(0xcccccc, 10, 50);
    if (this.scene.fog && !this.scene.fog.color) this.scene.fog.color = new Color(0xcccccc);
    if (!this.scene.environment) this.scene.environment = new Color(0xffffff);

    // 背景颜色控制
    const bgFolder = this.debugFolder.addFolder('Background');
    const bgColor = {
      value: this.scene.background ? this.scene.background.getHex() : 0xffffff
    };
    bgFolder.addColor(bgColor, 'value').name('背景色').onChange((val) => {
      this.scene.background = new Color(val);
      console.log('config:this.scene.background', val.toString(16));  
    });

    // 雾效控制 - 极简版
    const fogFolder = this.debugFolder.addFolder('Fog(雾效)');
    const fog = {
      enabled: config['SceneManager'].fog.enabled,
      color: config['SceneManager'].fog.color,
      near: config['SceneManager'].fog.near,
      far: config['SceneManager'].fog.far,
      
      // 更新场景雾效
      update: () => {
        if (fog.enabled) {
          // 创建新的雾效
          this.scene.fog = new Fog(fog.color, fog.near, fog.far);
          
          // 如果参数控制文件夹不存在，则创建
          if (!this._fogControls) {
            this._createFogControls();
          } else {
            // 显示已有的参数控制文件夹
            this._fogControls.show();
          }
        } else {
          // 销毁雾效对象
          this.scene.fog = null;
          
          // 销毁参数控制文件夹
          if (this._fogControls) {
            this._fogControls.hide();
          }
        }
      }
    };
    
    // 保存雾效实例引用
    this._fog = fog;
    
    // 创建控制器 - 只保留启用选项
    fogFolder.add(fog, 'enabled').name('启用').onChange(fog.update);
    
    // 创建雾效参数控制文件夹的方法
    this._createFogControls = () => {
      // 创建参数控制文件夹
      this._fogControls = fogFolder.addFolder('参数');
      
      // 添加参数控制器
      this._fogControls.addColor(this._fog, 'color').name('颜色').onChange(this._fog.update);
      this._fogControls.add(this._fog, 'near', 0, 100).name('近距离').onChange(this._fog.update);
      this._fogControls.add(this._fog, 'far', 0, 1000).name('远距离').onChange(this._fog.update);
      
      // 根据启用状态设置参数文件夹可见性
      this._fog.enabled ? this._fogControls.show() : this._fogControls.hide();
    };
    
    // 初始化时，如果雾效已启用，则创建参数控制文件夹
    if (fog.enabled) {
      this._createFogControls();
    }

    // 环境光控制
    const envFolder = this.debugFolder.addFolder('Environment(环境光)');
    if (!this.scene.environment) {
      this.scene.environment = null;
    }
    envFolder.add({
      toggleEnvironment: () => {
        if (this.scene.environment) {
          this.scene.environment = null;
          console.log('环境光已禁用');
        } else {
          this.scene.environment = new Color(0xffffff);
          console.log('使用灰色环境光');
        }
      }
    }, 'toggleEnvironment').name('切换环境光');

    // 默认展开部分文件夹
    bgFolder.open();
    fogFolder.close();
  }

  /**
   * 切换场景
   * @param {string} sceneName - 场景名称
   */
  switchScene(sceneName) {
    if (this.scenes[sceneName]) {
      this.scene = this.scenes[sceneName];
    } else {
      console.warn(`场景 ${sceneName} 不存在`);
    }
  }

  /**
   * 设置模型可见性
   * @param {string} uuid - 模型唯一标识
   * @param {boolean} visible - 是否可见
   */
  setModelVisibility(uuid, visible) {
    this.modelVisibility[uuid] = visible;
  }

  /**
   * 获取模型可见性状态
   * @param {string} uuid - 模型唯一标识
   * @returns {boolean} - 是否可见
   */
  getModelVisibility(uuid) {
    return this.modelVisibility[uuid] !== false;
  }

  /**
   * 销毁场景管理器及其资源
   * 在不再需要场景管理器时调用此方法以释放内存
   */
  dispose() {
    // 销毁雾效
    if (this.scene) {
      this.scene.fog = null;
    }
    
    // 清理雾效相关资源
    if (this._fogControls) {
      // 销毁参数控制文件夹
      if (typeof this._fogControls.destroy === 'function') {
        this._fogControls.destroy();
      }
      this._fogControls = null;
    }
    
    // 清理雾效实例引用
    this._fog = null;
    
    // 清理GUI相关资源
    if (this.debugFolder) {
      // 移除所有子文件夹和控制器
      if (this.debugFolder.folders) {
        Object.keys(this.debugFolder.folders).forEach(key => {
          const folder = this.debugFolder.folders[key];
          if (folder && typeof folder.destroy === 'function') {
            folder.destroy();
          }
        });
      }
      
      // 销毁主文件夹
      if (typeof this.debugFolder.destroy === 'function') {
        this.debugFolder.destroy();
      }
      
      this.debugFolder = null;
    }
    
    // 清理其他资源
    this.modelVisibility = null;
    
    console.log('SceneManager: 资源已清理');
  }
}

class ModelsManager 
{
  constructor(THREE) 
  {
  }
}
