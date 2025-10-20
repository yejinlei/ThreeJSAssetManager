import { AnimationMixer, Color, Fog, Scene, Mesh } from 'three';
import ThreeJSAssetsManager from "../ThreeJSAssetsManager.js";

export default class Horse {
  constructor(name) {
    // 获取 ThreeJSAssetsManager 的单例实例
    this.threejsassetsmanagerInstance = new ThreeJSAssetsManager();
    // 从管理器实例中获取场景对象
    this.scene = this.threejsassetsmanagerInstance.scene;
    this.glbmaingroup = this.scene.children.find(object => object.name ===  'GLBMainGroup');
    // 从管理器实例中获取调试模式标志
    this.debug = this.threejsassetsmanagerInstance.debug;
    // 从管理器实例中获取资源、时间、尺寸和GUI对象
    this.resources = this.threejsassetsmanagerInstance.resources;
    this.sources = this.resources.sources;
    this.time = this.threejsassetsmanagerInstance.time;
    this.sizes = this.threejsassetsmanagerInstance.sizes;
    this.gui = this.threejsassetsmanagerInstance.gui;
    
    // 初始化模型配置
    this.modelConfig = {};
    
    // 保存模型名称，用于后续查找对应的配置
    this.modelName = name;

    // Debug
    if (this.debug && this.gui) {
      if(this.gui.meshFolder !== undefined)
      {
        this.debugFolder = this.gui.meshFolder.addFolder(this.modelName);
      }
    }

    // Setup - 直接使用resources.Horse获取模型
    this.gltf = this.resources.items[name];
    // Scene的名字也改为模型名称
    this.gltf.scene.name = name;
    
    // Only set model if gltf is loaded and has scene
    if(this.gltf && this.gltf.scene) {
      this.setModel();
      this.setAnimation();
    } else {
      console.error('%cHorse GLTF model not properly loaded', 'color: red; font-weight: bold;');
    }
  }

  setModel() {
    // 获取gltf.scene
    this.model = this.gltf.scene;
    
    // 应用配置参数
    // 设置缩放 - 支持数字(统一缩放)或对象(分轴缩放)
    const defaultScale = 1;
    
    // 从 sources.js 中获取 scale 值
    // 注意：sources.js 中的 scale 是在 file 对象内部
    const sourceScale = this.sources.find(source => source.name === this.modelName)?.file?.scale;
    
    if (typeof sourceScale === 'number') {
      this.model.scale.set(sourceScale, sourceScale, sourceScale);
      // 同步到 modelConfig
      this.modelConfig.scale = sourceScale;
    } else {
      this.model.scale.set(defaultScale, defaultScale, defaultScale);
      // 设置默认值到 modelConfig
      this.modelConfig.scale = defaultScale;
    }
    
    // 设置位置
    // 从 sources.js 中获取 position 值
    const sourcePosition = this.sources.find(source => source.name === this.modelName)?.file?.position;
    
    if (sourcePosition) {
      this.model.position.set(
        sourcePosition.x || 0,
        sourcePosition.y || 0,
        sourcePosition.z || 0
      );
      // 同步到 modelConfig
      this.modelConfig.position = {
        x: sourcePosition.x || 0,
        y: sourcePosition.y || 0,
        z: sourcePosition.z || 0
      };
    } else {
      this.model.position.set(0, 0, 0);
      // 设置默认值到 modelConfig
      this.modelConfig.position = { x: 0, y: 0, z: 0 };
    }
    
    // 设置旋转
    // 从 sources.js 中获取 rotation 值
    const sourceRotation = this.sources.find(source => source.name === this.modelName)?.file?.rotation;
    
    if (sourceRotation) {
      this.model.rotation.set(
        sourceRotation.x || 0,
        sourceRotation.y || 0,
        sourceRotation.z || 0
      );
      // 同步到 modelConfig
      this.modelConfig.rotation = {
        x: sourceRotation.x || 0,
        y: sourceRotation.y || 0,
        z: sourceRotation.z || 0
      };
    } else {
      this.model.rotation.set(0, 0, 0);
      // 设置默认值到 modelConfig
      this.modelConfig.rotation = { x: 0, y: 0, z: 0 };
    }
    
    // 添加到场景的GLB主分组GLBMainGroup
    this.glbmaingroup.add(this.model);

    // 设置阴影
    this.model.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // 添加调试GUI
    this.addModelDebugUI();
  }
  
  // 添加模型调试UI
  addModelDebugUI() {
    if (!this.debug || !this.debugFolder || !this.modelConfig) return;

    // 位置控制
    const positionFolder = this.debugFolder.addFolder('Position');
    positionFolder.add(this.model.position, 'x', -10, 10, 0.1).name('X').onChange(() => {
      if (!this.modelConfig.position) this.modelConfig.position = {};
      this.modelConfig.position.x = this.model.position.x;
    });
    positionFolder.add(this.model.position, 'y', -10, 10, 0.1).name('Y').onChange(() => {
      if (!this.modelConfig.position) this.modelConfig.position = {};
      this.modelConfig.position.y = this.model.position.y;
    });
    positionFolder.add(this.model.position, 'z', -10, 10, 0.1).name('Z').onChange(() => {
      if (!this.modelConfig.position) this.modelConfig.position = {};
      this.modelConfig.position.z = this.model.position.z;
    });
    positionFolder.close();

    // 旋转控制
    const rotationFolder = this.debugFolder.addFolder('Rotation');
    rotationFolder.add(this.model.rotation, 'x', -Math.PI, Math.PI, 0.01).name('X').onChange(() => {
      if (!this.modelConfig.rotation) this.modelConfig.rotation = {};
      this.modelConfig.rotation.x = this.model.rotation.x;
    });
    rotationFolder.add(this.model.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Y').onChange(() => {
      if (!this.modelConfig.rotation) this.modelConfig.rotation = {};
      this.modelConfig.rotation.y = this.model.rotation.y;
    });
    rotationFolder.add(this.model.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Z').onChange(() => {
      if (!this.modelConfig.rotation) this.modelConfig.rotation = {};
      this.modelConfig.rotation.z = this.model.rotation.z;
    });
    rotationFolder.close();

    // 缩放控制
    const scaleFolder = this.debugFolder.addFolder('Scale');
  
    // 统一缩放控制
    const scaleUniform = { 
      value: typeof this.modelConfig.scale === 'number' ? 
        this.modelConfig.scale : 
        ((this.model.scale.x || 1) + (this.model.scale.y || 1) + (this.model.scale.z || 1)) / 3 
    };
  
    scaleFolder.add(scaleUniform, 'value', 0.01, 1, 0.01).name('Uniform Scale').onChange(() => {
      this.model.scale.set(scaleUniform.value, scaleUniform.value, scaleUniform.value);
      this.modelConfig.scale = scaleUniform.value;
    });
  
    // 独立轴缩放控制
    const scaleAxes = scaleFolder.addFolder('Axis Scale');
    scaleAxes.add(this.model.scale, 'x', 0.01, 1, 0.01).name('X').onChange(() => {
      if (typeof this.modelConfig.scale === 'number') {
        // 转换为对象
        this.modelConfig.scale = {
          x: this.model.scale.x,
          y: this.model.scale.y,
          z: this.model.scale.z
        };
      } else if (!this.modelConfig.scale) {
        this.modelConfig.scale = {};
      }
      this.modelConfig.scale.x = this.model.scale.x;
    });
    
  
    scaleAxes.add(this.model.scale, 'y', 0.01, 1, 0.01).name('Y').onChange(() => {
      if (typeof this.modelConfig.scale === 'number') {
        // 转换为对象
        this.modelConfig.scale = {
          x: this.model.scale.x,
          y: this.model.scale.y,
          z: this.model.scale.z
        };
      } else if (!this.modelConfig.scale) {
        this.modelConfig.scale = {};
      }
      this.modelConfig.scale.y = this.model.scale.y;
    });
  
    scaleAxes.add(this.model.scale, 'z', 0.01, 1, 0.01).name('Z').onChange(() => {
      if (typeof this.modelConfig.scale === 'number') {
        // 转换为对象
        this.modelConfig.scale = {
          x: this.model.scale.x,
          y: this.model.scale.y,
          z: this.model.scale.z
        };
      } else if (!this.modelConfig.scale) {
        this.modelConfig.scale = {};
      }
      this.modelConfig.scale.z = this.model.scale.z;
    });

    scaleFolder.close();
  }

  setAnimation() {
    if (!this.model || !this.gltf.animations || this.gltf.animations.length === 0) {
      console.warn('%cNo animations found in the model', 'color: orange; font-weight: bold;');
      return;
    }

    console.log('%cModel animations:', 'color: blue; font-weight: bold;', this.gltf.animations);
    this.animation = {};
    this.animation.mixer = new AnimationMixer(this.model);
    this.animation.actions = {};
    
    // 自动为所有动画创建动作
    this.gltf.animations.forEach((clip, index) => {
      // 使用动画名称作为键，如果没有名称则使用索引
      const name = clip.name || `animation_${index}`;
      console.log(`%cAdding animation: ${name}`, 'color: green;');
      this.animation.actions[name] = this.animation.mixer.clipAction(clip);
    });
    
    // 获取所有动画名称
    const animationNames = Object.keys(this.animation.actions);
    
    // 如果有动画，则播放第一个
    if (animationNames.length > 0) {
      const defaultAnimation = animationNames[0];
      this.animation.actions.current = this.animation.actions[defaultAnimation];
      this.animation.actions.current.play();
      console.log(`%cPlaying default animation: ${defaultAnimation}`, 'color: green;');
    }

    // 创建播放函数
    this.animation.play = (name) => {
      if (!this.animation.actions[name]) {
        console.warn(`Animation ${name} not found`);
        return;
      }
      
      const oldAction = this.animation.actions.current;
      const newAction = this.animation.actions[name];

      newAction.reset();
      newAction.play();
      // 平滑过渡
      if (oldAction && oldAction !== newAction) {
        newAction.crossFadeFrom(oldAction, 1);
      }

      this.animation.actions.current = newAction;
      console.log(`%cPlaying animation: ${name}`, 'color: green;');
    };
    
    // 创建停止函数
    this.animation.stop = () => {
      if (this.animation.actions.current) {
        this.animation.actions.current.stop();
        this.animation.actions.current = null;
        console.log('%cAnimation stopped', 'color: red; font-weight: bold;');
      }
    };
    
    // 将停止函数绑定到实例上
    this.stopAnimation = () => {
      this.animation.stop();
    };

    // 添加动画调试UI
    this.addAnimationDebugUI(animationNames);
  }
  
  // 添加动画调试UI
  addAnimationDebugUI(animationNames) {
    if (!this.debug || !this.debugFolder) return;
    
    const animationFolder = this.debugFolder.addFolder('Animation');
    const debugObject = {};
    
    // 为每个动画创建调试按钮并导出控制函数
    animationNames.forEach(name => {
      // 创建调试按钮
      debugObject[`play_${name}`] = () => {
        this.animation.play(name);
      };
      animationFolder.add(debugObject, `play_${name}`).name(`Play ${name}`);
      
      // 将动画控制函数绑定到实例上
      this[`play${name.charAt(0).toUpperCase() + name.slice(1)}`] = () => {
        this.animation.play(name);
      };
    });
    
    // 添加动画速度控制
    this.animation.timeScale = 1.0;
    animationFolder.add(this.animation, 'timeScale', 0.1, 2.0, 0.1)
      .name('Animation Speed')
      .onChange(() => {
        Object.values(this.animation.actions).forEach(action => {
          if (action && typeof action.setEffectiveTimeScale === 'function') {
            action.setEffectiveTimeScale(this.animation.timeScale);
          }
        });
      });
      
    // 添加停止按钮
    debugObject.stopAnimation = () => {
      this.animation.stop();
    };
    animationFolder.add(debugObject, 'stopAnimation').name('Stop Animation');
  }

  update() {
    if (!this.model || !this.animation || !this.animation.mixer) return;

    // 使用动画速度缩放因子
    const timeScale = this.animation.timeScale || 1.0;
    this.animation.mixer.update(this.time.delta * 0.001 * timeScale); // multiply by 0.001 or divide by 1000 because the animation is in milliseconds
  }
  
  // 提供公共方法用于外部控制
  
  // 播放指定动画
  playAnimation(name) {
    if (this.animation && this.animation.play) {
      this.animation.play(name);
      return true;
    }
    return false;
  }
  
  // 停止当前动画
  stopAnimation() {
    if (this.animation && this.animation.stop) {
      this.animation.stop();
      return true;
    }
    return false;
  }
  
  // 设置动画速度
  setAnimationSpeed(speed) {
    if (this.animation) {
      this.animation.timeScale = speed;
      Object.values(this.animation.actions).forEach(action => {
        if (action && typeof action.setEffectiveTimeScale === 'function') {
          action.setEffectiveTimeScale(speed);
        }
      });
      return true;
    }
    return false;
  }
  
  // 获取所有可用动画名称
  getAnimationNames() {
    if (this.animation && this.animation.actions) {
      return Object.keys(this.animation.actions).filter(name => name !== 'current');
    }
    return [];
  }
  
  // 获取当前播放的动画名称
  getCurrentAnimationName() {
    if (this.animation && this.animation.actions && this.animation.actions.current) {
      const currentAction = this.animation.actions.current;
      for (const [name, action] of Object.entries(this.animation.actions)) {
        if (name !== 'current' && action === currentAction) {
          return name;
        }
      }
    }
    return null;
  }
}