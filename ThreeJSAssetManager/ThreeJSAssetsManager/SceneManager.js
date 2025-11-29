// import * as THREE from 'https://gcore.jsdelivr.net/npm/three@0.132.2/build/three.min.js'
import { Scene, Fog, Color, Group, SRGBColorSpace } from 'three';
import config from './config.js';
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
    // 直接使用全局实例，避免重复创建
    this.threejsassetsmanagerInstance = window.ThreeJSAssetsManagerInstance;
    this.resources = this.threejsassetsmanagerInstance?.resources;
    this.debug = this.threejsassetsmanagerInstance?.debug;
    this.gui = this.threejsassetsmanagerInstance?.gui;

    // 任务要求1：所有参数来源于config.js
    this.config = config['SceneManager'] || {
      enabled: true,
      Color: {
        enabled: true,
        value: 0xffffff
      },
      fog: {
        enabled: false,
        color: 0xffffff,
        near: 1,
        far: 1000
      }
    };

    // 任务要求2：根据enabled的值决定是否初始化
    this.enabled = this.config.enabled !== false;

    this.cavas = cavas;

    // 无论enabled状态如何，都创建基本的场景对象以支持调试
    this.scene = new Scene();
    this.mainGroup = new Group();
    // GLB根部节点，便于添加glb模型场景到主场景组
    this.mainGroup.name = 'GLBMainGroup';
    this.scene.add(this.mainGroup);

    this.resources.on('ready', () => {
      // 遍历所有资源
      this.resources.sources.forEach(object => {
        if (object.type === "rgbeLoader" && object.name === "environment") {
          this.scene.background = this.resources.items['environment'];
          this.scene.environment = this.resources.items['environment'];
        }
      })
    });


    // 根据enabled状态配置场景
    if (this.enabled) {
      this.confScene();
    }

    // 任务要求3：无论enabled状态如何，都设置调试UI
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
    if (!this.enabled || !this.scene) return;

    console.log('SceneManager:confScene函数，配置：', this.config);

    // 任务要求1：所有参数来源于this.config
    // 背景颜色
    if (this.config.Color?.enabled) {
      this.scene.background = new Color(this.config.Color.value);
    } else {
      this.scene.background = new Color(0xffffff);
    }

    // 雾效果
    if (this.config.fog?.enabled) {
      this.scene.fog = new Fog(
        this.config.fog.color,
        this.config.fog.near,
        this.config.fog.far
      );
    } else {
      this.scene.fog = null;
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

  confGUI() {
    if (!this.debug || !this.gui) return;

    // 任务要求3：无论enabled状态如何，都显示DebugUI
    if (!this.scene) this.scene = new Scene();

    // 任务要求1：确保this.config存在
    if (!this.config) {
      this.config = config['SceneManager'] || {
        enabled: true,
        Color: {
          enabled: true,
          value: 0xffffff
        },
        fog: {
          enabled: false,
          color: 0xffffff,
          near: 1,
          far: 1000
        }
      };
    }

    // 添加到场景与对象分类下
    const parentFolder = this.gui.sceneFolder || this.gui.addFolder('🏞️ Scene & Objects (场景与对象)');
    this.debugFolder = parentFolder.addFolder('SceneManager(场景管理)');

    // 任务要求4：添加enabled控制，确保值变更时实时生效
    this.debugFolder.add(this.config, 'enabled').name('启用SceneManager').onChange((value) => {
      // 任务要求2和4：实时更新enabled状态并应用
      this.enabled = value;
      config['SceneManager'].enabled = value;

      // 根据新的enabled状态重新配置场景
      if (value) {
        this.confScene();
      } else {
        // 禁用时清除效果但保留场景对象
        if (this.scene) {
          this.scene.fog = null;
          // 保持背景色不变，仅清除雾效
        }
      }
    });

    // 确保场景属性存在
    if (!this.scene.background) this.scene.background = new Color(this.config.Color?.value || 0xffffff);
    if (!this.scene.environment) this.scene.environment = new Color(0xffffff);

    // 背景颜色控制
    const bgFolder = this.debugFolder.addFolder('Background');

    // 确保Color配置存在
    if (!this.config.Color) {
      this.config.Color = { enabled: true, value: 0xffffff };
    }

    bgFolder.add(this.config.Color, 'enabled').name('启用背景色').onChange((value) => {
      // 任务要求4：实时同步到配置并生效
      config['SceneManager'].Color.enabled = value;
      if (this.enabled && this.scene) {
        if (value) {
          this.scene.background = new Color(this.config.Color.value);
        } else {
          this.scene.background = null;
        }
      }
    });

    const bgColor = {
      value: this.config.Color.value
    };
    bgFolder.addColor(bgColor, 'value').name('背景色').onChange((val) => {
      // 任务要求4：实时同步到配置并生效
      this.scene.background = new Color(val);
      this.config.Color.value = val;
      config['SceneManager'].Color.value = val;
    });

    // 雾效控制
    const fogFolder = this.debugFolder.addFolder('Fog(雾效)');

    // 确保fog配置存在
    if (!this.config.fog) {
      this.config.fog = { enabled: false, color: 0xffffff, near: 1, far: 1000 };
    }

    fogFolder.add(this.config.fog, 'enabled').name('启用雾效').onChange((value) => {
      // 任务要求4：实时同步到配置并生效
      config['SceneManager'].fog.enabled = value;
      if (this.enabled && this.scene) {
        if (value) {
          this.scene.fog = new Fog(
            this.config.fog.color,
            this.config.fog.near,
            this.config.fog.far
          );
        } else {
          this.scene.fog = null;
        }
      }
    });

    // 雾效参数控制
    const fogParamsFolder = fogFolder.addFolder('参数');

    // 颜色控制
    fogParamsFolder.addColor(this.config.fog, 'color').name('颜色').onChange((value) => {
      // 任务要求4：实时同步到配置并生效
      config['SceneManager'].fog.color = value;
      if (this.enabled && this.scene && this.scene.fog) {
        this.scene.fog.color = new Color(value);
      }
    });

    // 近距离控制
    fogParamsFolder.add(this.config.fog, 'near', 0, 100).name('近距离').onChange((value) => {
      // 任务要求4：实时同步到配置并生效
      config['SceneManager'].fog.near = value;
      if (this.enabled && this.scene && this.scene.fog) {
        this.scene.fog.near = value;
      }
    });

    // 远距离控制
    fogParamsFolder.add(this.config.fog, 'far', 0, 1000).name('远距离').onChange((value) => {
      // 任务要求4：实时同步到配置并生效
      config['SceneManager'].fog.far = value;
      if (this.enabled && this.scene && this.scene.fog) {
        this.scene.fog.far = value;
      }
    });

    // 根据启用状态设置参数文件夹可见性
    this.config.fog.enabled ? fogParamsFolder.show() : fogParamsFolder.hide();



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

class ModelsManager {
  constructor(THREE) {
  }
}
