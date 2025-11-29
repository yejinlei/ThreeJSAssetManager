import { Color, Fog, Scene, Mesh, AnimationMixer } from 'three';
import ThreeJSAssetsManager from "../ThreeJSAssetsManager.js";
import AnimationManager from '../Utils/AnimationManager.js';

export default class ModelLoader {
  constructor(name) {
    console.log(`%cModelLoader constructor called with name: ${name}`, 'color: blue; font-weight: bold;');
    
    // 使用全局实例避免创建重复实例
    this.threejsassetsmanagerInstance = window.ThreeJSAssetsManagerInstance;
    console.log('%cThreeJSAssetsManagerInstance:', 'color: blue;', this.threejsassetsmanagerInstance ? 'Found' : 'Not found');
    
    // 从管理器实例中获取场景对象
    this.scene = this.threejsassetsmanagerInstance?.scene;
    this.glbmaingroup = this.scene?.children.find(object => object.name === 'GLBMainGroup');
    console.log('%cScene available:', 'color: blue;', !!this.scene);
    console.log('%cGLBMainGroup found:', 'color: blue;', !!this.glbmaingroup);
    
    // 从管理器实例中获取调试模式标志
    this.debug = this.threejsassetsmanagerInstance?.debug;
    // 从管理器实例中获取资源、时间、尺寸和GUI对象
    this.resources = this.threejsassetsmanagerInstance?.resources;
    this.sources = this.resources?.sources;
    this.time = this.threejsassetsmanagerInstance?.time;
    this.sizes = this.threejsassetsmanagerInstance?.sizes;
    this.gui = this.threejsassetsmanagerInstance?.gui;

    console.log('%cResources available:', 'color: blue;', !!this.resources);
    
    // 初始化模型配置
    this.modelConfig = {};

    // 保存模型名称，用于后续查找对应的配置
    this.modelName = name;
    console.log('%cModel name:', 'color: blue;', this.modelName);

    // Debug
    if (this.debug && this.gui) {
      // 确保在整个应用中只有一个Objects文件夹和一个MeshManager文件夹
      // 使用静态属性来跟踪全局的文件夹引用，避免重复创建
      if (!ModelLoader.globalObjectsFolder && this.gui) {
        // 首先查找是否已有Objects文件夹
        if (this.gui.__folders && Array.isArray(this.gui.__folders) && this.gui.__folders.length > 0) {
          for (let i = 0; i < this.gui.__folders.length; i++) {
            const folder = this.gui.__folders[i];
            if (folder && (folder.name.includes('Objects') || folder.name.includes('对象管理'))) {
              ModelLoader.globalObjectsFolder = folder;
              break;
            }
          }
        }
        
        // 如果没有找到，创建一个新的Objects文件夹
        if (!ModelLoader.globalObjectsFolder && this.gui.addFolder) {
          ModelLoader.globalObjectsFolder = this.gui.addFolder('📦 Objects (对象管理)');
        }
      }
      
      // 确保在Objects下只有一个MeshManager文件夹
      if (!ModelLoader.globalMeshManagerFolder && ModelLoader.globalObjectsFolder) {
        // 查找Objects下是否已有MeshManager
        if (ModelLoader.globalObjectsFolder.__folders && 
            Array.isArray(ModelLoader.globalObjectsFolder.__folders) && 
            ModelLoader.globalObjectsFolder.__folders.length > 0) {
          for (let i = 0; i < ModelLoader.globalObjectsFolder.__folders.length; i++) {
            const subFolder = ModelLoader.globalObjectsFolder.__folders[i];
            if (subFolder && (subFolder.name.includes('MeshManager') || subFolder.name.includes('网格管理'))) {
              ModelLoader.globalMeshManagerFolder = subFolder;
              break;
            }
          }
        }
        
        // 如果没有找到，创建一个新的MeshManager文件夹
        if (!ModelLoader.globalMeshManagerFolder && ModelLoader.globalObjectsFolder.addFolder) {
          ModelLoader.globalMeshManagerFolder = ModelLoader.globalObjectsFolder.addFolder('🏗️ MeshManager(网格管理)');
        }
      }
      
      // 清理可能存在的重复Objects文件夹（根目录下的）
      if (this.gui.__folders && Array.isArray(this.gui.__folders) && this.gui.__folders.length > 0) {
        for (let i = this.gui.__folders.length - 1; i >= 0; i--) {
          const folder = this.gui.__folders[i];
          // 检查是否是Objects文件夹且不是我们的全局Objects文件夹
          if (folder && 
              (folder.name.includes('Objects') || folder.name.includes('对象管理')) && 
              folder !== ModelLoader.globalObjectsFolder) {
            // 移除重复的Objects文件夹
            if (this.gui.__folders.splice) {
              this.gui.__folders.splice(i, 1);
              // 同时移除DOM元素
              if (folder.domElement && folder.domElement.parentNode) {
                folder.domElement.parentNode.removeChild(folder.domElement);
              }
            }
          }
        }
      }
      
      // 在MeshManager文件夹下创建或获取当前模型的调试文件夹（避免重复）
      if (ModelLoader.globalMeshManagerFolder) {
        // 首先检查是否已存在同名文件夹
        let existingFolder = null;
        if (ModelLoader.globalMeshManagerFolder.__folders && 
            Array.isArray(ModelLoader.globalMeshManagerFolder.__folders) && 
            ModelLoader.globalMeshManagerFolder.__folders.length > 0) {
          for (let i = 0; i < ModelLoader.globalMeshManagerFolder.__folders.length; i++) {
            const subFolder = ModelLoader.globalMeshManagerFolder.__folders[i];
            if (subFolder && subFolder.name === this.modelName) {
              existingFolder = subFolder;
              break;
            }
          }
        }
        
        // 如果已存在同名文件夹，直接使用
        // 如果不存在，创建新的文件夹
        if (existingFolder) {
          this.debugFolder = existingFolder;
          console.log(`%c${this.modelName} debug folder already exists, reusing it`, 'color: green;');
        } else if (ModelLoader.globalMeshManagerFolder.addFolder) {
          this.debugFolder = ModelLoader.globalMeshManagerFolder.addFolder(this.modelName);
          console.log(`%cCreated ${this.modelName} debug folder`, 'color: green;');
        }
      }
    }

    // Setup - 直接使用resources获取模型
    console.log('%cTrying to get resources items:', 'color: blue;');
    if (this.resources && this.resources.items) {
      console.log('%cAvailable resource items:', 'color: blue;', Object.keys(this.resources.items));
      this.gltf = this.resources.items[this.modelName];
      console.log(`%c${this.modelName} gltf found:`, 'color: blue;', !!this.gltf);
      
      // Scene的名字也改为模型名称
      if (this.gltf && this.gltf.scene) {
        this.gltf.scene.name = this.modelName;
        this.setModel();
        this.setAnimation();
      } else {
        console.error(`%c${this.modelName} GLTF model not properly loaded`, 'color: red; font-weight: bold;');
      }
    } else {
      console.error('%cResources or resources.items is undefined', 'color: red; font-weight: bold;');
    }
  }

  setModel() {
    // 获取gltf.scene
    this.model = this.gltf.scene;

    // 应用配置参数
    // 设置缩放 - 支持数字(统一缩放)或对象(分轴缩放)
    const defaultScale = 1;

    // 从 sources.js 中获取 scale 值
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
    
    // 应用旋转顺序（需要在设置旋转值之前）
    if (this.modelConfig.rotationOrder) {
      this.model.rotation.order = this.modelConfig.rotationOrder;
    }
    
    // 应用四元数旋转（如果提供）
    if (this.modelConfig.quaternion) {
      this.model.quaternion.set(
        this.modelConfig.quaternion.x || 0,
        this.modelConfig.quaternion.y || 0,
        this.modelConfig.quaternion.z || 0,
        this.modelConfig.quaternion.w || 1
      );
    }
    
    // 应用可见性和渲染属性
    if (this.modelConfig.visible !== undefined) {
      this.model.visible = this.modelConfig.visible;
    }
    
    if (this.modelConfig.renderOrder !== undefined) {
      this.model.renderOrder = this.modelConfig.renderOrder;
    }
    
    if (this.modelConfig.frustumCulled !== undefined) {
      this.model.frustumCulled = this.modelConfig.frustumCulled;
    }

    // 添加到场景的GLB主分组GLBMainGroup
    console.log("ModelLoader: Adding model to group");

    if (this.glbmaingroup) {
      this.glbmaingroup.add(this.model);
    } else {
      // 如果GLBMainGroup不存在，直接添加到场景
      this.scene.add(this.model);
    }

    // 设置阴影 - 优先使用配置中的值
    if (this.modelConfig.castShadow !== undefined || this.modelConfig.receiveShadow !== undefined) {
      this.model.traverse(child => {
        if (child instanceof Mesh) {
          child.castShadow = this.modelConfig.castShadow !== undefined ? this.modelConfig.castShadow : true;
          child.receiveShadow = this.modelConfig.receiveShadow !== undefined ? this.modelConfig.receiveShadow : true;
        }
      });
    } else {
      // 默认阴影设置
      this.model.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
    
    // 应用材质选项到所有网格
    if (this.modelConfig.materialOptions) {
      this.model.traverse(child => {
        if (child instanceof Mesh && child.material) {
          const { wireframe, transparent, opacity, metalness, roughness, emissiveIntensity, color, side, emissive } = this.modelConfig.materialOptions;
          
          if (wireframe !== undefined) child.material.wireframe = wireframe;
          if (transparent !== undefined) child.material.transparent = transparent;
          if (opacity !== undefined) child.material.opacity = opacity;
          if (metalness !== undefined && child.material.metalness !== undefined) {
            child.material.metalness = metalness;
          }
          if (roughness !== undefined && child.material.roughness !== undefined) {
            child.material.roughness = roughness;
          }
          if (emissiveIntensity !== undefined && child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = emissiveIntensity;
          }
          
          // 应用颜色（支持十六进制字符串和数值）
          if (color !== undefined) {
            // 检查是否是十六进制字符串
            if (typeof color === 'string' && color.startsWith('#')) {
              child.material.color.set(color);
            } else if (typeof color === 'number') {
              child.material.color.setHex(color);
            }
          }
          
          // 应用材质侧面渲染（0: FrontSide, 1: BackSide, 2: DoubleSide）
          if (side !== undefined) {
            child.material.side = side;
          }
          
          // 应用自发光颜色
          if (emissive !== undefined) {
            if (typeof emissive === 'string' && emissive.startsWith('#')) {
              child.material.emissive.set(emissive);
            } else if (typeof emissive === 'number') {
              child.material.emissive.setHex(emissive);
            }
          }
          
          child.material.needsUpdate = true;
        }
      });
    }

    // 添加调试GUI
    this.addModelDebugUI();
  }

  // 添加模型调试UI
  addModelDebugUI() {
    if (!this.debug || !this.debugFolder || !this.modelConfig) return;

    // 基础变换属性 - 位置控制
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
      if (!this.modelConfig) this.modelConfig = {};
      if (!this.modelConfig.rotation) this.modelConfig.rotation = {};
      this.modelConfig.rotation.x = this.model.rotation.x;
      // 如果使用了四元数，清除四元数以避免冲突
      if (this.modelConfig.quaternion) {
        delete this.modelConfig.quaternion;
      }
    });
    rotationFolder.add(this.model.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Y').onChange(() => {
      if (!this.modelConfig) this.modelConfig = {};
      if (!this.modelConfig.rotation) this.modelConfig.rotation = {};
      this.modelConfig.rotation.y = this.model.rotation.y;
      if (this.modelConfig.quaternion) {
        delete this.modelConfig.quaternion;
      }
    });
    rotationFolder.add(this.model.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Z').onChange(() => {
      if (!this.modelConfig) this.modelConfig = {};
      if (!this.modelConfig.rotation) this.modelConfig.rotation = {};
      this.modelConfig.rotation.z = this.model.rotation.z;
      if (this.modelConfig.quaternion) {
        delete this.modelConfig.quaternion;
      }
    });
    
    // 旋转顺序控制
    const rotationOrderOptions = ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'];
    rotationFolder.add(this.model.rotation, 'order', rotationOrderOptions).name('Rotation Order').onChange(() => {
      if (!this.modelConfig) this.modelConfig = {};
      this.modelConfig.rotationOrder = this.model.rotation.order;
    });
    
    // 四元数旋转控制
    const quaternionDebug = {
      x: this.model.quaternion.x,
      y: this.model.quaternion.y,
      z: this.model.quaternion.z,
      w: this.model.quaternion.w,
      apply: () => {
        this.model.quaternion.set(quaternionDebug.x, quaternionDebug.y, quaternionDebug.z, quaternionDebug.w);
        
        // 更新配置
        if (!this.modelConfig) this.modelConfig = {};
        this.modelConfig.quaternion = {
          x: quaternionDebug.x,
          y: quaternionDebug.y,
          z: quaternionDebug.z,
          w: quaternionDebug.w
        };
        
        // 清除欧拉旋转以避免冲突
        if (this.modelConfig.rotation) {
          delete this.modelConfig.rotation;
        }
      }
    };
    
    const quaternionFolder = rotationFolder.addFolder('Quaternion');
    quaternionFolder.add(quaternionDebug, 'x', -1, 1, 0.01).name('X');
    quaternionFolder.add(quaternionDebug, 'y', -1, 1, 0.01).name('Y');
    quaternionFolder.add(quaternionDebug, 'z', -1, 1, 0.01).name('Z');
    quaternionFolder.add(quaternionDebug, 'w', -1, 1, 0.01).name('W');
    quaternionFolder.add(quaternionDebug, 'apply').name('Apply Quaternion');
    quaternionFolder.close();
    rotationFolder.close();

    // 缩放控制
    const scaleFolder = this.debugFolder.addFolder('Scale');

    // 统一缩放控制
    const scaleUniform = {
      value: typeof this.modelConfig.scale === 'number' ?
        this.modelConfig.scale :
        ((this.model.scale.x || 1) + (this.model.scale.y || 1) + (this.model.scale.z || 1)) / 3
    };

    scaleFolder.add(scaleUniform, 'value', 0.01, 10, 0.01).name('Uniform Scale').onChange(() => {
      this.model.scale.set(scaleUniform.value, scaleUniform.value, scaleUniform.value);
      this.modelConfig.scale = scaleUniform.value;
    });

    // 独立轴缩放控制
    const scaleAxes = scaleFolder.addFolder('Axis Scale');
    scaleAxes.add(this.model.scale, 'x', 0.01, 10, 0.01).name('X').onChange(() => {
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

    scaleAxes.add(this.model.scale, 'y', 0.01, 10, 0.01).name('Y').onChange(() => {
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

    scaleAxes.add(this.model.scale, 'z', 0.01, 10, 0.01).name('Z').onChange(() => {
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

    // 可见性和渲染属性
    const visibilityFolder = this.debugFolder.addFolder('Visibility & Rendering');
    visibilityFolder.add(this.model, 'visible').name('Visible').onChange(() => {
      if (!this.modelConfig) this.modelConfig = {};
      this.modelConfig.visible = this.model.visible;
    });
    visibilityFolder.add(this.model, 'renderOrder', 0, 100, 1).name('Render Order').onChange(() => {
      if (!this.modelConfig) this.modelConfig = {};
      this.modelConfig.renderOrder = this.model.renderOrder;
    });
    visibilityFolder.add(this.model, 'frustumCulled').name('Frustum Culled').onChange(() => {
      if (!this.modelConfig) this.modelConfig = {};
      this.modelConfig.frustumCulled = this.model.frustumCulled;
    });
    
    // 阴影属性（应用到所有mesh）
    const shadowDebug = {
      castShadow: this.model.children.some(child => child.isMesh && child.castShadow),
      receiveShadow: this.model.children.some(child => child.isMesh && child.receiveShadow)
    };
    
    visibilityFolder.add(shadowDebug, 'castShadow').name('Cast Shadow').onChange(() => {
      this.model.traverse(child => {
        if (child.isMesh) child.castShadow = shadowDebug.castShadow;
      });
      if (!this.modelConfig) this.modelConfig = {};
      this.modelConfig.castShadow = shadowDebug.castShadow;
    });
    
    visibilityFolder.add(shadowDebug, 'receiveShadow').name('Receive Shadow').onChange(() => {
      this.model.traverse(child => {
        if (child.isMesh) child.receiveShadow = shadowDebug.receiveShadow;
      });
      if (!this.modelConfig) this.modelConfig = {};
      this.modelConfig.receiveShadow = shadowDebug.receiveShadow;
    });
    visibilityFolder.close();

    // 材质属性控制（应用到所有mesh）
    const materialFolder = this.debugFolder.addFolder('Material Properties');
    const materialDebug = {
      wireframe: false,
      transparent: false,
      opacity: 1,
      metalness: 0,
      roughness: 1,
      emissiveIntensity: 1,
      color: '#ffffff',
      emissive: '#000000',
      side: 2, // DoubleSide
      updateMaterials: () => {
        this.model.traverse(child => {
          if (child.isMesh && child.material) {
            child.material.wireframe = materialDebug.wireframe;
            child.material.transparent = materialDebug.transparent;
            child.material.opacity = materialDebug.opacity;
            if (child.material.metalness !== undefined) {
              child.material.metalness = materialDebug.metalness;
            }
            if (child.material.roughness !== undefined) {
              child.material.roughness = materialDebug.roughness;
            }
            if (child.material.emissiveIntensity !== undefined) {
              child.material.emissiveIntensity = materialDebug.emissiveIntensity;
            }
            
            // 应用颜色
            child.material.color.set(materialDebug.color);
            
            // 应用自发光颜色
            child.material.emissive.set(materialDebug.emissive);
            
            // 应用材质侧面
            child.material.side = materialDebug.side;
            
            child.material.needsUpdate = true;
          }
        });
        
        // 保存配置
        if (!this.modelConfig) this.modelConfig = {};
        if (!this.modelConfig.materialOptions) this.modelConfig.materialOptions = {};
        this.modelConfig.materialOptions.wireframe = materialDebug.wireframe;
        this.modelConfig.materialOptions.transparent = materialDebug.transparent;
        this.modelConfig.materialOptions.opacity = materialDebug.opacity;
        this.modelConfig.materialOptions.metalness = materialDebug.metalness;
        this.modelConfig.materialOptions.roughness = materialDebug.roughness;
        this.modelConfig.materialOptions.emissiveIntensity = materialDebug.emissiveIntensity;
        this.modelConfig.materialOptions.color = materialDebug.color;
        this.modelConfig.materialOptions.emissive = materialDebug.emissive;
        this.modelConfig.materialOptions.side = materialDebug.side;
      }
    };
    
    materialFolder.add(materialDebug, 'wireframe').name('Wireframe');
    materialFolder.add(materialDebug, 'transparent').name('Transparent');
    materialFolder.add(materialDebug, 'opacity', 0, 1, 0.01).name('Opacity');
    materialFolder.addColor(materialDebug, 'color').name('Color');
    materialFolder.addColor(materialDebug, 'emissive').name('Emissive Color');
    
    const sideOptions = {
      'Front Side': 0,
      'Back Side': 1,
      'Double Side': 2
    };
    materialFolder.add(materialDebug, 'side', sideOptions).name('Render Side');
    
    materialFolder.add(materialDebug, 'metalness', 0, 1, 0.01).name('Metalness');
    materialFolder.add(materialDebug, 'roughness', 0, 1, 0.01).name('Roughness');
    materialFolder.add(materialDebug, 'emissiveIntensity', 0, 5, 0.01).name('Emissive Intensity');
    materialFolder.add(materialDebug, 'updateMaterials').name('Update Materials');
    materialFolder.close();

    // 层级控制
    const hierarchyFolder = this.debugFolder.addFolder('Hierarchy');
    const hierarchyDebug = {
      listChildren: () => {
        console.log(`\n--- ${this.model.name} 层级结构 ---`);
        this.printHierarchy(this.model, 0);
        console.log('----------------------\n');
      },
      centerModel: () => {
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        if (!this.modelConfig.position) this.modelConfig.position = {};
        this.modelConfig.position.x = this.model.position.x;
        this.modelConfig.position.y = this.model.position.y;
        this.modelConfig.position.z = this.model.position.z;
      }
    };
    hierarchyFolder.add(hierarchyDebug, 'listChildren').name('List Children');
    hierarchyFolder.add(hierarchyDebug, 'centerModel').name('Center Model');
    hierarchyFolder.close();

    // 动画配置（如果模型有动画）
    if (this.animation) {
      const animationFolder = this.debugFolder.addFolder('Animation');
      const debugObject = {};

      // 为每个动画创建调试按钮
      const animationNames = Object.keys(this.animation.actions).filter(name => name !== 'current');
      animationNames.forEach(name => {
        debugObject[`play_${name}`] = () => {
          this.animation.play(name);
        };
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
          if (!this.modelConfig) this.modelConfig = {};
          if (!this.modelConfig.animationOptions) this.modelConfig.animationOptions = {};
          this.modelConfig.animationOptions.timeScale = this.animation.timeScale;
        });

      // 添加停止按钮
      debugObject.stopAnimation = () => {
        this.animation.stop();
      };
      animationFolder.add(debugObject, 'stopAnimation').name('Stop Animation');
      
      // 动画循环控制
      if (this.animation.actions.current) {
        const loopDebug = {
          loopOnce: () => {
            if (this.animation.actions.current) {
              this.animation.actions.current.setLoop(THREE.LoopOnce);
            }
          },
          loopRepeat: () => {
            if (this.animation.actions.current) {
              this.animation.actions.current.setLoop(THREE.LoopRepeat);
            }
          },
          loopPingPong: () => {
            if (this.animation.actions.current) {
              this.animation.actions.current.setLoop(THREE.LoopPingPong);
            }
          }
        };
        animationFolder.add(loopDebug, 'loopOnce').name('Loop Once');
        animationFolder.add(loopDebug, 'loopRepeat').name('Loop Repeat');
        animationFolder.add(loopDebug, 'loopPingPong').name('Loop Ping-Pong');
      }
      animationFolder.close();
    }

    // 导出配置按钮
    const exportConfig = {
      exportModelConfig: () => {
        // 获取当前模型的完整配置
        const fullConfig = {
          name: this.modelName,
          type: 'glbModel',
          file: {
            name: this.modelName + '.glb',
            path: `./models/${this.modelName}.glb`,
            ...this.modelConfig
          }
        };
        
        // 格式化并打印到控制台
        console.log('\n--- 模型配置导出 ---');
        console.log(JSON.stringify(fullConfig, null, 2));
        console.log('------------------\n');
        
        // 创建下载
        const blob = new Blob([JSON.stringify(fullConfig, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.modelName}_config.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`✅ 模型配置已导出: ${this.modelName}_config.json`);
      }
    };
    this.debugFolder.add(exportConfig, 'exportModelConfig').name('Export Model Config');
  }

  // 辅助方法：打印模型层级结构
  printHierarchy(object, level) {
    const indent = '  '.repeat(level);
    console.log(`${indent}- ${object.name} (${object.type})`);
    
    object.children.forEach(child => {
      this.printHierarchy(child, level + 1);
    });
  }

  setAnimation() {
    if (!this.model || !this.gltf.animations || this.gltf.animations.length === 0) {
      console.warn(`%cNo animations found in the ${this.modelName} model`, 'color: orange; font-weight: bold;');
      return;
    }

    console.log(`%c${this.modelName} model animations:`, 'color: green; font-weight: bold;', this.gltf.animations);
    this.animation = {};
    this.animation.mixer = new AnimationMixer(this.model);
    this.animation.actions = {};

    // 自动为所有动画创建动作
    this.gltf.animations.forEach((clip, index) => {
      // 使用动画名称作为键，如果没有名称则使用索引
      const name = clip.name || `animation_${index}`;
      console.log(`%cAdding ${this.modelName} animation: ${name}`, 'color: green;');
      this.animation.actions[name] = this.animation.mixer.clipAction(clip);
    });

    // 获取所有动画名称
    const animationNames = Object.keys(this.animation.actions);

    // 如果有动画，则播放第一个
    if (animationNames.length > 0) {
      const defaultAnimation = animationNames[0];
      this.animation.actions.current = this.animation.actions[defaultAnimation];
      this.animation.actions.current.play();
      console.log(`%cPlaying default ${this.modelName} animation: ${defaultAnimation}`, 'color: green;');
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
    // 更新动画混合器
    if (this.animation && this.animation.mixer) {
      this.animation.mixer.update(this.time.delta * 0.001);
    }
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