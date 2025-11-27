import * as THREE from 'three';
// 从 three.js 扩展库中导入 OrbitControls 类，用于实现相机轨道控制
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// 导入 ThreeJSAssetsManager 类，用于获取项目管理实例
import ThreeJSAssetsManager from "./ThreeJSAssetsManager.js";

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


    // 调用方法设置相机实例
    this.setInstance();
    // 调用方法设置相机轨道控制器
    this.setOrbitControls();
  }

  /**
   * 设置透视相机实例，并将其添加到场景中。
   */
  setInstance(cameraType = 'perspective') {
    // 根据相机类型创建对应的相机实例
    if (cameraType === 'orthographic') {
      // 创建正交相机
      const aspect = this.sizes.width / this.sizes.height;
      this.camera = new THREE.OrthographicCamera(
        -5 * aspect, // left
        5 * aspect, // right
        5, // top
        -5, // bottom
        0.1, // near
        100 // far
      );
    } else {
      // 默认创建透视相机
      this.camera = new THREE.PerspectiveCamera(
        35, // 视野角度
        this.sizes.width / this.sizes.height, // 宽高比
        0.1, // 近裁剪面
        100 // 远裁剪面
      );
    }

    // 设置相机的初始位置
    this.camera.position.set(6, 4, 8);
    // 将相机添加到场景中
    this.scene.add(this.camera);
  }

  /**
   * 设置相机的轨道控制器。
   */
  setOrbitControls() {
    // 创建轨道控制器实例，关联相机和画布元素
    this.controls = new OrbitControls(this.camera, this.canvas);
    // 启用控制器的阻尼效果，使相机移动更平滑
    this.controls.enableDamping = true;
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
  update() {
    // 更新轨道控制器的状态，实现平滑的相机控制
    this.controls.update();
  }
}
