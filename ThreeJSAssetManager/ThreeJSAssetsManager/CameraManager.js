import * as THREE from 'three';
// 从 three.js 扩展库中导入 OrbitControls 类，用于实现相机轨道控制
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// 导入配置文件，确保所有参数都从config.js读取
import config from "./config.js";

/**
 * CameraManager 类负责管理相机的创建、配置、控制以及更新操作。
 */

/**
 * CameraManager 类负责管理相机的创建、配置、控制以及更新操作。
 */
export default class CameraManager {
  /**
   * 构造函数，初始化相机管理器实例。
   */
  constructor() {
    // 直接使用全局实例，避免重复创建
    this.threejsassetsmanagerInstance = window.ThreeJSAssetsManagerInstance;
    // 从管理器实例中获取尺寸信息
    this.sizes = this.threejsassetsmanagerInstance?.sizes;
    // 从管理器实例中获取场景对象
    this.scene = this.threejsassetsmanagerInstance?.scene;
    // 从管理器实例中获取画布元素
    this.canvas = this.threejsassetsmanagerInstance?.canvas;
    // GUI 调试功能实例
    this.debug = this.threejsassetsmanagerInstance?.debug;
    this.gui = this.threejsassetsmanagerInstance?.gui;

    // 从配置文件读取相机配置
    this.config = config.CameraManager || {};
    this.enabled = this.config.enabled !== false;

    // 只有在启用状态下才初始化相机
    if (this.enabled) {
      // 调用方法设置相机实例
      this.setInstance();
      // 调用方法设置相机轨道控制器
      this.setOrbitControls();
    }

    // 无论enabled状态如何，都设置调试UI（任务要求4）
    if (this.debug) {
      this.setDebugUI();
    }
  }

  /**
   * 设置透视相机实例，并将其添加到场景中。
   */
  setInstance() {
    // 确保在启用状态下才执行
    if (!this.enabled) return;

    // 从配置读取相机类型，默认为perspective
    const cameraType = this.config.cameraType || 'perspective';
    const cameraOptions = this.config.cameraOptions || {};

    // 根据相机类型创建对应的相机实例
    if (cameraType === 'orthographic') {
      // 创建正交相机
      const aspect = this.sizes.width / this.sizes.height;
      this.camera = new THREE.OrthographicCamera(
        (-cameraOptions.size || 5) * aspect, // left
        (cameraOptions.size || 5) * aspect, // right
        cameraOptions.size || 5, // top
        -(cameraOptions.size || 5), // bottom
        cameraOptions.near || 0.1, // near
        cameraOptions.far || 100 // far
      );
    } else {
      // 默认创建透视相机
      this.camera = new THREE.PerspectiveCamera(
        cameraOptions.fov || 75, // 视野角度 - 从配置读取
        this.sizes.width / this.sizes.height, // 宽高比
        cameraOptions.near || 0.1, // 近裁剪面 - 从配置读取
        cameraOptions.far || 2000 // 远裁剪面 - 从配置读取
      );
    }

    // 设置相机的初始位置 - 从配置读取，如果没有则使用默认值
    const position = cameraOptions.position || { x: 6, y: 4, z: 8 };
    this.camera.position.set(position.x, position.y, position.z);

    // 将相机添加到场景中
    this.scene.add(this.camera);
  }

  /**
   * 设置相机的轨道控制器。
   */
  setOrbitControls() {
    // 确保在启用状态下才执行
    if (!this.enabled || !this.camera) return;

    // 创建轨道控制器实例，关联相机和画布元素
    this.controls = new OrbitControls(this.camera, this.canvas);

    // 从配置读取控制器参数，如果没有则使用默认值
    const controlsOptions = this.config.controls || {};
    this.controls.enableDamping = controlsOptions.enableDamping !== false;
    this.controls.dampingFactor = controlsOptions.dampingFactor || 0.05;
    this.controls.enableZoom = controlsOptions.enableZoom !== false;
    this.controls.zoomSpeed = controlsOptions.zoomSpeed || 1.0;
    this.controls.enableRotate = controlsOptions.enableRotate !== false;
    this.controls.rotateSpeed = controlsOptions.rotateSpeed || 1.0;
    this.controls.enablePan = controlsOptions.enablePan !== false;
    this.controls.panSpeed = controlsOptions.panSpeed || 1.0;
    this.controls.minDistance = controlsOptions.minDistance || 0;
    this.controls.maxDistance = controlsOptions.maxDistance || Infinity;
    this.controls.minPolarAngle = controlsOptions.minPolarAngle || 0;
    this.controls.maxPolarAngle = controlsOptions.maxPolarAngle || Math.PI;
  }

  /**
   * 处理窗口尺寸变化时的相机调整操作。
   */
  resize() {
    // 更新相机的宽高比
    this.camera.aspect = this.sizes.width / this.sizes.height;
    // 更新相机的投影矩阵，使新的宽高比生效
    this.camera.updateProjectionMatrix();
  }

  /**
   * 更新相机轨道控制器的状态，通常在每一帧调用。
   */
  /**
   * 设置调试UI，无论enabled状态如何都显示（任务要求3）
   */
  setDebugUI() {
    // 确保gui存在
    if (!this.gui) return;

    // 添加到相机与渲染分类下
    const cameraRenderFolder = this.gui.cameraFolder || this.gui.addFolder('📷 Camera & Rendering (相机与渲染)');
    const cameraFolder = cameraRenderFolder.addFolder('Camera(相机管理)');

    // 添加启用/禁用控制 - 实时生效
    cameraFolder.add(this.config, 'enabled').name('启用相机(Enabled)').onChange((value) => {
      this.enabled = value;
      // 如果启用且之前没有初始化相机，则初始化
      if (value && !this.camera) {
        this.setInstance();
        this.setOrbitControls();
      }
      // 如果禁用，则移除相机
      else if (!value && this.camera && this.scene) {
        this.scene.remove(this.camera);
        this.camera = null;
        this.controls = null;
      }
    });

    // 相机类型选择
    cameraFolder.add(this.config, 'cameraType', ['perspective', 'orthographic']).name('相机类型(Type)').onChange((value) => {
      if (this.enabled && this.camera && this.scene) {
        this.scene.remove(this.camera);
        this.setInstance();
        this.setOrbitControls();
      }
    });

    // 相机参数控制
    const cameraOptions = this.config.cameraOptions || {};

    // 透视相机参数
    if (cameraOptions.fov !== undefined) {
      cameraFolder.add(cameraOptions, 'fov', 10, 120, 1).name('视场角(FOV)').onChange((value) => {
        if (this.camera && this.camera.isPerspectiveCamera) {
          this.camera.fov = value;
          this.camera.updateProjectionMatrix();
        }
      });
    }

    // 近/远裁剪面
    cameraFolder.add(cameraOptions, 'near', 0.01, 10, 0.01).name('近裁剪面(Near)').onChange((value) => {
      if (this.camera) {
        this.camera.near = value;
        this.camera.updateProjectionMatrix();
      }
    });

    cameraFolder.add(cameraOptions, 'far', 10, 5000, 10).name('远裁剪面(Far)').onChange((value) => {
      if (this.camera) {
        this.camera.far = value;
        this.camera.updateProjectionMatrix();
      }
    });

    // 相机位置控制
    const position = cameraOptions.position || { x: 6, y: 4, z: 8 };
    cameraFolder.add(position, 'x', -20, 20, 0.1).name('X Position').onChange((value) => {
      if (this.camera) {
        this.camera.position.x = value;
      }
    });

    cameraFolder.add(position, 'y', -20, 20, 0.1).name('Y Position').onChange((value) => {
      if (this.camera) {
        this.camera.position.y = value;
      }
    });

    cameraFolder.add(position, 'z', -20, 20, 0.1).name('Z Position').onChange((value) => {
      if (this.camera) {
        this.camera.position.z = value;
      }
    });


    // 控制器参数控制
    const controlsOptions = this.config.controls || {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1,
      maxDistance: 100
    };

    // 只有当controls实际存在时才添加GUI控制
    if (this.controls) {
      const controlsFolder = cameraFolder.addFolder('Controls(控制器)');

      controlsFolder.add(controlsOptions, 'enableDamping').name('启用阻尼').onChange((value) => {
        if (this.controls) {
          this.controls.enableDamping = value;
        }
      });

      controlsFolder.add(controlsOptions, 'dampingFactor', 0.01, 0.5, 0.01).name('阻尼系数').onChange((value) => {
        if (this.controls) {
          this.controls.dampingFactor = value;
        }
      });

      controlsFolder.add(controlsOptions, 'minDistance', 0, 100, 0.1).name('最小距离').onChange((value) => {
        if (this.controls) {
          this.controls.minDistance = value;
        }
      });

      controlsFolder.add(controlsOptions, 'maxDistance', 1, 500, 1).name('最大距离').onChange((value) => {
        if (this.controls) {
          this.controls.maxDistance = value;
        }
      });
    }

    cameraFolder.close();
  }

  update() {
    // 只有在启用状态下且有控制器时才更新
    if (this.enabled && this.controls) {
      this.controls.update();
    }
  }
}
