import { AnimationMixer, AnimationClip, NumberKeyframeTrack } from 'three';
// 导入 ThreeJSAssetsManager 类，用于获取项目管理实例
import ThreeJSAssetsManager from "../ThreeJSAssetsManager.js";

export default class AnimationManager {
  constructor() {
    this.threejsassetsmanagerInstance = new ThreeJSAssetsManager();
    this.scene = this.threejsassetsmanagerInstance.scene;
    this.canvas = this.threejsassetsmanagerInstance.canvas;
    this.debug = this.threejsassetsmanagerInstance.debug;
    this.gui = this.threejsassetsmanagerInstance.gui;
    this.animations = [];
    this.animation = {};
    
    console.log('AnimationManager constructor');

    this.setupAnimations();
    
    if (this.debug && this.debug.ui) {
      this.addDebugUI();
    }
  }
  
  setupAnimations() {
    if (!this.scene) {
      console.warn('%cNo scene found', 'color: orange; font-weight: bold;');
      return;
    }

    // 遍历场景中的所有mesh
    this.scene.traverse((object) => {
      
      if (object.isMesh) {

        // 检查骨骼动画
        if (object.skeleton) {
          this.animation.mixer = new AnimationMixer(object);
          this.animation.actions = {};
          
          // 处理骨骼动画
          if (object.animations && object.animations.length > 0) {
            object.animations.forEach((clip, index) => {
              const name = clip.name || `skeletal_animation_${index}`;
              this.animation.actions[name] = this.animation.mixer.clipAction(clip);
            });
          }
        }
        
        // 检查变形动画
        if (object.morphTargetInfluences) {
          if (!this.animation.mixer) {
            this.animation.mixer = new AnimationMixer(object);
            this.animation.actions = {};
          }
          
          // 处理变形动画
          if (object.morphTargetDictionary) {
            Object.keys(object.morphTargetDictionary).forEach((name, index) => {
              const clipName = `morph_animation_${name}_${index}`;
              // 创建变形动画的clip
              const tracks = [];
              const times = [0, 1];
              const values = [0, 1];
              
              tracks.push(new NumberKeyframeTrack(
                `.morphTargetInfluences[${object.morphTargetDictionary[name]}]`,
                times,
                values
              ));
              
              const clip = new AnimationClip(clipName, -1, tracks);
              this.animation.actions[clipName] = this.animation.mixer.clipAction(clip);
            });
          }
        }
      }
    });
    
    // 播放第一个动画
    if (this.animation.actions) {
      const animationNames = Object.keys(this.animation.actions);
      if (animationNames.length > 0) {
        this.animation.actions.current = this.animation.actions[animationNames[0]];
        this.animation.actions.current.play();
      }
    }

    // 创建播放函数
    this.animation.play = (name) => {
      if (!this.animation.actions[name]) {
        console.warn(`Animation ${name} not found`);
        return;
      }
      
      const newAction = this.animation.actions[name];
      const oldAction = this.animation.actions.current;

      newAction.reset();
      newAction.play();
      
      if (oldAction && oldAction !== newAction) {
        newAction.crossFadeFrom(oldAction, 1);
      }

      this.animation.actions.current = newAction;
    };
    
    // 创建停止函数
    this.animation.stop = () => {
      if (this.animation.actions.current) {
        this.animation.actions.current.stop();
        this.animation.actions.current = null;
      }
    };
    
    // 初始化动画速度
    this.animation.timeScale = 1.0;
  }
  
  addDebugUI() {
    
    const animationFolder = this.gui.addFolder('Animation');
    const debugObject = {};
    
    // 为每个动画添加播放按钮
    Object.keys(this.animation.actions).forEach(name => {
      debugObject[`play_${name}`] = () => this.animation.play(name);
      animationFolder.add(debugObject, `play_${name}`).name(`Play ${name}`);
    });
    
    // 添加动画速度控制
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
    debugObject.stopAnimation = () => this.animation.stop();
    animationFolder.add(debugObject, 'stopAnimation').name('Stop Animation');
  }
  
  update(deltaTime) {
    if (this.animation.mixer) {
      this.animation.mixer.update(deltaTime * 0.001 * (this.animation.timeScale || 1.0));
    }
  }
  
  // 公共方法
  playAnimation(name) {
    if (this.animation.play) {
      this.animation.play(name);
      return true;
    }
    return false;
  }
  
  stopAnimation() {
    if (this.animation.stop) {
      this.animation.stop();
      return true;
    }
    return false;
  }
  
  setAnimationSpeed(speed) {
    if (this.animation) {
      this.animation.timeScale = speed;
      return true;
    }
    return false;
  }
  
  getAnimationNames() {
    if (this.animation.actions) {
      return Object.keys(this.animation.actions).filter(name => name !== 'current');
    }
    return [];
  }
  
  getCurrentAnimationName() {
    if (this.animation.actions && this.animation.actions.current) {
      const currentAction = this.animation.actions.current;
      for (const [name, action] of Object.entries(this.animation.actions)) {
        if (name !== 'current' && action === currentAction) {
          return name;
        }
      }
    }
    return null;
  }
  
  /**
   * 解析动画类型和参数
   * @param {Object} object - 包含动画数据的3D对象
   * @returns {Object} 包含动画类型和参数的对象
   */
  static parseAnimationParameters(object) {
    const params = {
      type: null,
      duration: 0,
      keyframes: [],
      name: ''
    };
    
    if (!object) return params;
    
    // 检查骨骼动画
    if (object.skeleton) {
      params.type = 'skeletal';
      if (object.animations && object.animations.length > 0) {
        object.animations.forEach(clip => {
          params.duration = Math.max(params.duration, clip.duration);
          params.name = clip.name || params.name;
          clip.tracks.forEach(track => {
            params.keyframes.push({
              type: 'bone',
              boneName: track.name.split('.')[0],
              times: track.times,
              values: track.values
            });
          });
        });
      }
    }
    
    // 检查变形动画
    if (object.morphTargetInfluences) {
      params.type = params.type || 'morph';
      if (object.morphTargetDictionary) {
        Object.keys(object.morphTargetDictionary).forEach(name => {
          params.keyframes.push({
            type: 'morph',
            targetName: name,
            influence: object.morphTargetInfluences[object.morphTargetDictionary[name]]
          });
        });
      }
    }
    
    // 检查顶点动画
    if (object.geometry && object.geometry.morphAttributes && object.geometry.morphAttributes.position) {
      params.type = params.type || 'vertex';
      object.geometry.morphAttributes.position.forEach((attr, index) => {
        params.keyframes.push({
          type: 'vertex',
          targetIndex: index,
          positions: attr.array
        });
      });
    }
    
    // 检查材质动画
    if (object.material) {
      params.type = params.type || 'material';
      if (object.material.uniforms) {
        Object.keys(object.material.uniforms).forEach(name => {
          const uniform = object.material.uniforms[name];
          if (uniform && uniform.value !== undefined) {
            params.keyframes.push({
              type: 'uniform',
              uniformName: name,
              value: uniform.value
            });
          }
        });
      }
    }
    
    return params;
  }
}