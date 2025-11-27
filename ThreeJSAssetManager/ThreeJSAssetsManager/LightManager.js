// 从 three 库中导入所需的类，用于创建灯光、几何体、材质和辅助对象
import { AmbientLight, HemisphereLight, DirectionalLight, PointLight, SpotLight, RectAreaLight, Mesh, SphereGeometry, MeshBasicMaterial, ArrowHelper, Vector3, HemisphereLightHelper, SpotLightHelper, DirectionalLightHelper, PointLightHelper } from 'three';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
// import { SpotLightHelper } from 'three/helpers/SpotLightHelper.js';
//import { AmbientLightHelper } from 'three/addons/helpers/AmbientLightHelper.js';
//import { HemisphereLightHelper } from 'three/helpers/HemisphereLightHelper.js'; 
//import { SpotLightHelper } from 'three/addons/helpers/SpotLightHelper.js';
//import { DirectionalLightHelper } from 'three/addons/helpers/DirectionalLightHelper.js';
//import { PointLightHelper } from 'three/addons/helpers/PointLightHelper.js';
// 导入 ThreeJSAssetsManager 类，用于获取项目管理实例
import ThreeJSAssetsManager from "./ThreeJSAssetsManager.js";
// 导入配置文件，用于获取灯光配置信息
import config from "./config.js";

/**
 * LightManager 类负责管理场景中的各种灯光，包括环境光、方向光、点光源和聚光灯。
 * 在调试模式下，还会提供 GUI 界面来调整灯光参数，并添加灯光辅助对象。
 */
export default class LightManager {
    /**
     * 构造函数，初始化灯光管理器并根据配置创建灯光。
     */
    constructor() {
        // 直接使用全局实例，避免重复创建
        this.threejsassetsmanagerInstance = window.ThreeJSAssetsManagerInstance;
        // 从管理器实例中获取场景对象
        this.scene = this.threejsassetsmanagerInstance?.scene;
        // 从管理器实例中获取调试模式标志
        this.debug = this.threejsassetsmanagerInstance?.debug;
        // 从管理器实例中获取 GUI 对象
        this.gui = this.threejsassetsmanagerInstance?.gui;

        this.ambientLight = null;
        // 用于存储所有灯光的辅助对象，方便后续管理
        this.lightHelpers = []; 

        // 检查调试模式是否开启，GUI 对象是否存在
        if (this.debug && this.gui) {
            // 添加到灯光系统分类下
            const parentFolder = this.gui.lightingFolder || this.gui.addFolder('💡 Lighting System (灯光系统)');
            const folder = parentFolder.addFolder('LightManager(光源管理)');
            
            // 环境光配置
            this.setupAmbientLightGUI(folder);
            
            // 方向光配置
            this.setupDirectionalLightGUI(folder);
            
            // 点光源配置
            this.setupPointLightGUI(folder);
            
            // 聚光灯配置
            this.setupSpotLightGUI(folder);
            
            // 半球光配置
            this.setupHemisphereLightGUI(folder); 

            // 矩形区域光配置
            this.setupRectAreaLightGUI(folder);
            
            // 打开 LightManager 文件夹
            folder.close();
        } else {
            // 非调试模式下的默认灯光
            if (config['LightManager'].ambientLight.enabled) {
                // 创建环境光实例，根据配置设置颜色和强度
                const ambientLight = new AmbientLight(
                    config['LightManager'].ambientLight.color,
                    config['LightManager'].ambientLight.intensity
                );
                // 将环境光添加到场景中
                this.scene.add(ambientLight);
            }
            
            if (config['LightManager'].directionalLight.enabled) {
                const directionalLight = new DirectionalLight(
                    config['LightManager'].directionalLight.color,
                    config['LightManager'].directionalLight.intensity
                );
                directionalLight.position.copy(config['LightManager'].directionalLight.position);
                this.scene.add(directionalLight);
            }
            
            if (config['LightManager'].pointLight && config['LightManager'].pointLight.enabled) {
                const pointLight = new PointLight(
                    config['LightManager'].pointLight.color,
                    config['LightManager'].pointLight.intensity,
                    config['LightManager'].pointLight.distance,
                    config['LightManager'].pointLight.decay
                );
                pointLight.position.copy(config['LightManager'].pointLight.position);
                this.scene.add(pointLight);
            }
            
            if (config['LightManager'].spotLight && config['LightManager'].spotLight.enabled) {
                const spotLight = new SpotLight(
                    config['LightManager'].spotLight.color,
                    config['LightManager'].spotLight.intensity,
                    config['LightManager'].spotLight.distance,
                    config['LightManager'].spotLight.angle,
                    config['LightManager'].spotLight.penumbra,
                    config['LightManager'].spotLight.decay
                );
                spotLight.position.set(config['LightManager'].spotLight.position.x, config['LightManager'].spotLight.position.y, config['LightManager'].spotLight.position.z);
                spotLight.target.position.set(config['LightManager'].spotLight.target[0], config['LightManager'].spotLight.target[1], config['LightManager'].spotLight.target[2]);
                this.scene.add(spotLight);
                this.scene.add(spotLight.target);
            }
            
            if (config['LightManager'].hemiLight && config['LightManager'].hemiLight.enabled) {
                const hemisphereLight = new HemisphereLight(
                    config['LightManager'].hemiLight.color,
                    config['LightManager'].hemiLight.groundColor,
                    config['LightManager'].hemiLight.intensity
                );
                hemisphereLight.position.set(config['LightManager'].hemiLight.position.x, config['LightManager'].hemiLight.position.y, config['LightManager'].hemiLight.position.z);
                this.scene.add(hemisphereLight);
            }
            
            if (config['LightManager'].rectAreaLight.enabled) {
                const rectAreaLight = new RectAreaLight(
                    config['LightManager'].rectAreaLight.color,
                    config['LightManager'].rectAreaLight.intensity,
                    config['LightManager'].rectAreaLight.width,
                    config['LightManager'].rectAreaLight.height
                );
                rectAreaLight.position.set(config['LightManager'].rectAreaLight.position.x, config['LightManager'].rectAreaLight.position.y, config['LightManager'].rectAreaLight.position.z);
                rectAreaLight.lookAt(config['LightManager'].rectAreaLight.lookAt.x, config['LightManager'].rectAreaLight.lookAt.y, config['LightManager'].rectAreaLight.lookAt.z);
                this.scene.add(rectAreaLight);
            }
        }


    }

    // 矩形区域光配置
    setupRectAreaLightGUI(folder) {
        const rectAreaLightConfig = config['LightManager'].rectAreaLight;
        const rectAreaFolder = folder.addFolder('矩形区域光(模拟明亮窗户/条状灯光)');

        // 启用控制
        rectAreaFolder.add(rectAreaLightConfig, 'enabled').name('启用').onChange((value) => {
            if (value) {
                // 创建矩形区域光
                this.rectAreaLight = new RectAreaLight(
                    rectAreaLightConfig.color,
                    rectAreaLightConfig.intensity,
                    rectAreaLightConfig.width,
                    rectAreaLightConfig.height
                );
                this.rectAreaLight.position.set(rectAreaLightConfig.position.x, rectAreaLightConfig.position.y, rectAreaLightConfig.position.z);
                this.rectAreaLight.lookAt(rectAreaLightConfig.lookAt.x, rectAreaLightConfig.lookAt.y, rectAreaLightConfig.lookAt.z);
                this.scene.add(this.rectAreaLight);

                // 创建辅助对象
                this.rectAreaLightHelper = new RectAreaLightHelper(this.rectAreaLight);
                this.scene.add(this.rectAreaLightHelper);
                this.lightHelpers.push(this.rectAreaLightHelper);
            } else {
                // 移除矩形区域光
                if (this.rectAreaLight) {
                    this.scene.remove(this.rectAreaLight);
                    this.rectAreaLight = null;
                }
                // 移除辅助对象
                if (this.rectAreaLightHelper) {
                    this.scene.remove(this.rectAreaLightHelper);
                    const index = this.lightHelpers.indexOf(this.rectAreaLightHelper);
                    if (index > -1) this.lightHelpers.splice(index, 1);
                    this.rectAreaLightHelper = null;
                }
            }
        });

        // 颜色控制
        rectAreaFolder.addColor(rectAreaLightConfig, 'color').name('颜色').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.color.set(value);
            }
        });

        // 强度控制
        rectAreaFolder.add(rectAreaLightConfig, 'intensity', 0, 10, 0.1).name('强度').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.intensity = value;
            }
        });

        // 宽度控制
        rectAreaFolder.add(rectAreaLightConfig, 'width', 0, 20, 0.1).name('宽度').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.width = value;
                if (this.rectAreaLightHelper) this.rectAreaLightHelper.position.x = value;
            }
        });

        // 高度控制
        rectAreaFolder.add(rectAreaLightConfig, 'height', 0, 20, 0.1).name('高度').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.height = value;
                if (this.rectAreaLightHelper) this.rectAreaLightHelper.position.x = value;
            }
        });

        // 位置控制
        rectAreaFolder.add(rectAreaLightConfig.position, 'x', -10, 10, 0.1).name('X轴位置').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.position.x = value;
                if (this.rectAreaLightHelper) {
                    this.rectAreaLightHelper.position.x = value;
                }
            }
        });
        rectAreaFolder.add(rectAreaLightConfig.position, 'y', -10, 10, 0.1).name('Y轴位置').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.position.y = value;
                if (this.rectAreaLightHelper) {
                    this.rectAreaLightHelper.position.y = value;
                }
            }
        });
        rectAreaFolder.add(rectAreaLightConfig.position, 'z', -10, 10, 0.1).name('Z轴位置').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.position.z = value;
                if (this.rectAreaLightHelper) {
                    this.rectAreaLightHelper.position.z = value;
                }
            }
        });
        
        // 朝向控制
        rectAreaFolder.add(rectAreaLightConfig.lookAt, 'x', -10, 10, 0.1).name('X轴朝向').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.lookAt(
                    value,
                    rectAreaLightConfig.lookAt.y,
                    rectAreaLightConfig.lookAt.z
                );
            }
        });
        rectAreaFolder.add(rectAreaLightConfig.lookAt, 'y', -10, 10, 0.1).name('Y轴朝向').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.lookAt(
                    rectAreaLightConfig.lookAt.x,
                    value,
                    rectAreaLightConfig.lookAt.z
                );
            }
        });
        rectAreaFolder.add(rectAreaLightConfig.lookAt, 'z', -10, 10, 0.1).name('Z轴朝向').onChange((value) => {
            if (this.rectAreaLight) {
                this.rectAreaLight.lookAt(
                    rectAreaLightConfig.lookAt.x,
                    rectAreaLightConfig.lookAt.y,
                    value
                );
            }
        });

        // 初始创建
        if (rectAreaLightConfig.enabled) {
            this.rectAreaLight = new RectAreaLight(
                rectAreaLightConfig.color,
                rectAreaLightConfig.intensity,
                rectAreaLightConfig.width,
                rectAreaLightConfig.height
            );
            this.rectAreaLight.position.set(rectAreaLightConfig.position.x, rectAreaLightConfig.position.y, rectAreaLightConfig.position.z);
            this.rectAreaLight.lookAt(rectAreaLightConfig.lookAt.x, rectAreaLightConfig.lookAt.y, rectAreaLightConfig.lookAt.z);
            this.scene.add(this.rectAreaLight);

            this.rectAreaLightHelper = new RectAreaLightHelper(this.rectAreaLight);
            this.scene.add(this.rectAreaLightHelper);
            this.lightHelpers.push(this.rectAreaLightHelper);
        }

        rectAreaFolder.close();
    }

    setupHemisphereLightGUI(folder) {

        const hemiLightConfig = config['LightManager'].hemiLight;
        if (hemiLightConfig) {
            const hemisphericFolder = folder.addFolder('半球光');

            // 启用控制
            hemisphericFolder.add(hemiLightConfig, 'enabled').name('启用').onChange((value) => {
                if (value) {
                    // 创建半球光
                    this.hemisphereLight = new HemisphereLight(
                        hemiLightConfig.color,
                        hemiLightConfig.groundColor,
                        hemiLightConfig.intensity
                    );
                    this.hemisphereLight.position.set(hemiLightConfig.position.x, hemiLightConfig.position.y, hemiLightConfig.position.z);
                    this.scene.add(this.hemisphereLight);

                    // 创建方向辅助箭头
                    this.hemisphereLightHelper = new HemisphereLightHelper(this.hemisphereLight, 5);
                    this.scene.add(this.hemisphereLightHelper);
                    this.lightHelpers.push(this.hemisphereLightHelper);
                } else {
                    // 移除半球光
                    if (this.hemisphereLight) {
                        this.scene.remove(this.hemisphereLight);
                        this.hemisphereLight = null;
                    }
                    // 移除辅助箭头
                    if (this.hemisphereLightHelper) {
                        this.scene.remove(this.hemisphereLightHelper);
                        const index = this.lightHelpers.indexOf(this.hemisphereLightHelper);
                        if (index > -1) this.lightHelpers.splice(index, 1);
                        this.hemisphereLightHelper = null;
                    }
                }
            });

            // 天空颜色控制
            hemisphericFolder.addColor(hemiLightConfig, 'color').name('天空颜色').onChange((value) => {
                if (this.hemisphereLight) {
                    this.hemisphereLight.color.set(value);
                }
            });

            // 地面颜色控制
            hemisphericFolder.addColor(hemiLightConfig, 'groundColor').name('地面颜色').onChange((value) => {
                if (this.hemisphereLight) {
                    this.hemisphereLight.groundColor.set(value);
                }
            });

            // 强度控制
            hemisphericFolder.add(hemiLightConfig, 'intensity', 0, 5, 0.1).name('强度').onChange((value) => {
                if (this.hemisphereLight) {
                    this.hemisphereLight.intensity = value;
                }
            });

            // 位置控制
            hemisphericFolder.add(hemiLightConfig.position, 'x', -10, 10, 0.1).name('X轴位置').onChange((value) => {
                if (this.hemisphereLight) {
                    this.hemisphereLight.position.x = value;
                    if (this.hemisphereLightHelper) {
                        this.hemisphereLightHelper.position.x = value;
                    }
                }
            });
            hemisphericFolder.add(hemiLightConfig.position, 'y', -10, 10, 0.1).name('Y轴位置').onChange((value) => {
                if (this.hemisphereLight) {
                    this.hemisphereLight.position.y = value;
                    if (this.hemisphereLightHelper) {
                        this.hemisphereLightHelper.position.y = value;
                    }
                }
            });
            hemisphericFolder.add(hemiLightConfig.position, 'z', -10, 10, 0.1).name('Z轴位置').onChange((value) => {
                if (this.hemisphereLight) {
                    this.hemisphereLight.position.z = value;
                    if (this.hemisphereLightHelper) {
                        this.hemisphereLightHelper.position.z = value;
                    }
                }
            });

            // 初始创建
            if (hemiLightConfig.enabled) {
                this.hemisphereLight = new HemisphereLight(
                    hemiLightConfig.color,
                    hemiLightConfig.groundColor,
                    hemiLightConfig.intensity
                );
                this.hemisphereLight.position.set(hemiLightConfig.position.x, hemiLightConfig.position.y, hemiLightConfig.position.z);
                this.scene.add(this.hemisphereLight);

                this.hemisphereLightHelper = new HemisphereLightHelper(this.hemisphereLight, 5);
                this.scene.add(this.hemisphereLightHelper);
                this.hemisphereLightHelper.update();
                this.lightHelpers.push(this.hemisphereLightHelper);
            }

            hemisphericFolder.close();
        }
    }

    setupSpotLightGUI(folder) {
        const spotLightConfig = config['LightManager'].spotLight;
        const spotFolder = folder.addFolder('聚光灯');

        // 启用控制
        spotFolder.add(spotLightConfig, 'enabled').name('启用').onChange((value) => {
            if (value) {
                // 创建聚光灯
                this.spotLight = new SpotLight(
                    spotLightConfig.color,
                    spotLightConfig.intensity,
                    spotLightConfig.distance,
                    spotLightConfig.angle,
                    spotLightConfig.penumbra,
                    spotLightConfig.decay
                );
                this.spotLight.position.set(spotLightConfig.position.x, spotLightConfig.position.y, spotLightConfig.position.z);
                this.spotLight.target.position.set(spotLightConfig.target[0], spotLightConfig.target[1], spotLightConfig.target[2]);
                this.scene.add(this.spotLight);
                this.scene.add(this.spotLight.target);

                // 创建辅助对象
                this.spotLightHelper = new SpotLightHelper(this.spotLight, 0x0000ff);
                this.scene.add(this.spotLightHelper);
                this.lightHelpers.push(this.spotLightHelper);
            } else {
                // 移除聚光灯
                if (this.spotLight) {
                    this.scene.remove(this.spotLight);
                    this.scene.remove(this.spotLight.target);
                    this.spotLight = null;
                }
                // 移除辅助对象
                if (this.spotLightHelper) {
                    this.scene.remove(this.spotLightHelper);
                    const index = this.lightHelpers.indexOf(this.spotLightHelper);
                    if (index > -1) this.lightHelpers.splice(index, 1);
                    this.spotLightHelper = null;
                }
            }
        });

        // 颜色控制
        spotFolder.addColor(spotLightConfig, 'color').name('颜色').onChange((value) => {
            if (this.spotLight) {
                this.spotLight.color.set(value);
            }
        });

        // 强度控制
        spotFolder.add(spotLightConfig, 'intensity', 0, 5, 0.1).name('强度').onChange((value) => {
            if (this.spotLight) {
                this.spotLight.intensity = value;
            }
        });

        // 距离控制
        spotFolder.add(spotLightConfig, 'distance', 0, 100, 1).name('距离').onChange((value) => {
            if (this.spotLight) {
                this.spotLight.distance = value;
            }
        });

        // 角度控制
        spotFolder.add(spotLightConfig, 'angle', 0, Math.PI / 2, 0.01).name('角度').onChange((value) => {
            if (this.spotLight) {
                this.spotLight.angle = value;
                if (this.spotLightHelper) this.spotLightHelper.update();
            }
        });

        // 半影控制
        spotFolder.add(spotLightConfig, 'penumbra', 0, 1, 0.01).name('半影').onChange((value) => {
            if (this.spotLight) {
                this.spotLight.penumbra = value;
                if (this.spotLightHelper) this.spotLightHelper.update();
            }
        });

        // 衰减控制
        spotFolder.add(spotLightConfig, 'decay', 0, 2, 0.1).name('衰减').onChange((value) => {
            if (this.spotLight) {
                this.spotLight.decay = value;
            }
        });

        // 位置控制
        spotFolder.add(spotLightConfig.position, 'x', -10, 10, 0.1).name('X轴位置').onChange((value) => {
            if (this.spotLight) {
                this.spotLight.position.x = value;
                if (this.spotLightHelper) {
                    this.spotLightHelper.update();
                    this.spotLightHelper.position.copy(this.spotLight.position);
                }
            }
        });
        spotFolder.add(spotLightConfig.position, 'y', -10, 10, 0.1).name('Y轴位置').onChange((value) => {
            if (this.spotLight) {
                this.spotLight.position.y = value;
                if (this.spotLightHelper) this.spotLightHelper.update();
            }
        });
        spotFolder.add(spotLightConfig.position, 'z', -10, 10, 0.1).name('Z轴位置').onChange((value) => {
            if (this.spotLight) {
                this.spotLight.position.z = value;
                if (this.spotLightHelper) this.spotLightHelper.update();
            }
        });

        // 初始创建
        if (spotLightConfig.enabled) {
            this.spotLight = new SpotLight(
                spotLightConfig.color,
                spotLightConfig.intensity,
                spotLightConfig.distance,
                spotLightConfig.angle,
                spotLightConfig.penumbra,
                spotLightConfig.decay
            );
            this.spotLight.position.set(spotLightConfig.position.x, spotLightConfig.position.y, spotLightConfig.position.z);
            this.spotLight.target.position.set(spotLightConfig.target[0], spotLightConfig.target[1], spotLightConfig.target[2]);
            this.scene.add(this.spotLight);
            this.scene.add(this.spotLight.target);

            this.spotLightHelper = new SpotLightHelper(this.spotLight, 0x0000ff);
            this.scene.add(this.spotLightHelper);
            this.spotLightHelper.update();
            this.lightHelpers.push(this.spotLightHelper);
        }

        spotFolder.close();
    }

    setupPointLightGUI(folder) {
        const pointLightConfig = config['LightManager'].pointLight;
        const pointFolder = folder.addFolder('点光源(模拟灯泡)');

        // 启用控制
        pointFolder.add(pointLightConfig, 'enabled').name('启用').onChange((value) => {
            if (value) {
                // 创建点光源
                this.pointLight = new PointLight(
                    pointLightConfig.color,
                    pointLightConfig.intensity,
                    pointLightConfig.distance,
                    pointLightConfig.decay
                );
                this.pointLight.position.set(pointLightConfig.position.x, pointLightConfig.position.y, pointLightConfig.position.z);
                this.scene.add(this.pointLight);

                // 创建点光源辅助对象
                this.pointLightHelper = new PointLightHelper(this.pointLight, 1);
                this.scene.add(this.pointLightHelper);
                this.lightHelpers.push(this.pointLightHelper);
            } else {
                // 移除点光源
                if (this.pointLight) {
                    this.scene.remove(this.pointLight);
                    this.pointLight = null;
                }
                // 移除辅助球体
                if (this.pointLightHelper) {
                    this.scene.remove(this.pointLightHelper);
                    const index = this.lightHelpers.indexOf(this.pointLightHelper);
                    if (index > -1) this.lightHelpers.splice(index, 1);
                    this.pointLightHelper = null;
                }
            }
        });

        // 颜色控制
        pointFolder.addColor(pointLightConfig, 'color').name('颜色').onChange((value) => {
            if (this.pointLight) {
                this.pointLight.color.set(value);
            }
        });

        // 强度控制
        pointFolder.add(pointLightConfig, 'intensity', 0, 5, 0.1).name('强度').onChange((value) => {
            if (this.pointLight) {
                this.pointLight.intensity = value;
            }
        });

        // 距离控制
        pointFolder.add(pointLightConfig, 'distance', 0, 100, 1).name('距离').onChange((value) => {
            if (this.pointLight) {
                this.pointLight.distance = value;
            }
        });

        // 衰减控制
        pointFolder.add(pointLightConfig, 'decay', 0, 2, 0.1).name('衰减').onChange((value) => {
            if (this.pointLight) {
                this.pointLight.decay = value;
            }
        });

        // 位置控制
        pointFolder.add(pointLightConfig.position, 'x', -10, 10, 0.1).name('X轴位置').onChange((value) => {
            if (this.pointLight) {
                this.pointLight.position.x = value;
                if (this.pointLightHelper) {
                    this.pointLightHelper.position.x = value;
                    this.pointLightHelper.updateMatrix();
                }
                if (this.pointLightHelper instanceof PointLightHelper) {
                    this.pointLightHelper.update();
                }
            }
        });
        pointFolder.add(pointLightConfig.position, 'y', -10, 10, 0.1).name('Y轴位置').onChange((value) => {
            if (this.pointLight) {
                this.pointLight.position.y = value;
                if (this.pointLightHelper) {
                    this.pointLightHelper.position.y = value;
                    if (this.pointLightHelper instanceof PointLightHelper) {
                        this.pointLightHelper.update();
                    }
                }
            }
        });
        pointFolder.add(pointLightConfig.position, 'z', -10, 10, 0.1).name('Z轴位置').onChange((value) => {
            if (this.pointLight) {
                this.pointLight.position.z = value;
                if (this.pointLightHelper) {
                    this.pointLightHelper.position.z = value;
                    if (this.pointLightHelper instanceof PointLightHelper) {
                        this.pointLightHelper.update();
                    }
                }
            }
        });

        // 初始创建
        if (pointLightConfig.enabled) {
            this.pointLight = new PointLight(
                pointLightConfig.color,
                pointLightConfig.intensity,
                pointLightConfig.distance,
                pointLightConfig.decay
            );
            this.pointLight.position.set(pointLightConfig.position.x, pointLightConfig.position.y, pointLightConfig.position.z);
            this.scene.add(this.pointLight);

            this.pointLightHelper = new PointLightHelper(this.pointLight, 0x00ff00);
            this.scene.add(this.pointLightHelper);
            this.pointLightHelper.update();
            this.lightHelpers.push(this.pointLightHelper);
        }

        pointFolder.close();
    }

    setupDirectionalLightGUI(folder) {
        const directionalLightConfig = config['LightManager'].directionalLight;
        const directionalFolder = folder.addFolder('方向光(模拟太阳光)');
        directionalFolder.add(directionalLightConfig, 'enabled').name('启用').onChange((value) => {
            if (value) {
                // 创建方向光
                this.directionalLight = new DirectionalLight(
                    directionalLightConfig.color,
                    directionalLightConfig.intensity
                );
                this.directionalLight.position.set(directionalLightConfig.position.x, directionalLightConfig.position.y, directionalLightConfig.position.z);
                this.scene.add(this.directionalLight);

                // 创建箭头辅助
                const dir = new Vector3().copy(this.directionalLight.position).normalize();
                this.directionalLightHelper = new DirectionalLightHelper(this.directionalLight, 5);
                this.scene.add(this.directionalLightHelper);
                this.lightHelpers.push(this.directionalLightHelper);
            } else {
                // 移除方向光
                if (this.directionalLight) {
                    this.scene.remove(this.directionalLight);
                    this.directionalLight = null;
                }
                // 移除辅助对象
                if (this.directionalLightHelper) {
                    this.scene.remove(this.directionalLightHelper);
                    const index = this.lightHelpers.indexOf(this.directionalLightHelper);
                    if (index > -1) this.lightHelpers.splice(index, 1);
                    this.directionalLightHelper = null;
                }
            }
        });

        // 颜色控制
        directionalFolder.addColor(directionalLightConfig, 'color').name('颜色').onChange((value) => {
            if (this.directionalLight) {
                this.directionalLight.color.set(value);
            }
        });

        // 强度控制
        directionalFolder.add(directionalLightConfig, 'intensity', 0, 5, 0.1).name('强度').onChange((value) => {
            if (this.directionalLight) {
                this.directionalLight.intensity = value;
            }
        });

        // 位置控制
        directionalFolder.add(directionalLightConfig.position, 'x', -10, 10, 0.1).name('X轴位置').onChange((value) => {
            if (this.directionalLight) {
                this.directionalLight.position.x = value;
                // 更新辅助箭头方向
                if (this.directionalLightHelper) {
                    this.directionalLightHelper.update();
                }
            }
        });
        directionalFolder.add(directionalLightConfig.position, 'y', -10, 10, 0.1).name('Y轴位置').onChange((value) => {
            if (this.directionalLight) {
                this.directionalLight.position.y = value;
                if (this.directionalLightHelper) {
                    this.directionalLightHelper.update();
                }
            }
        });
        directionalFolder.add(directionalLightConfig.position, 'z', -10, 10, 0.1).name('Z轴位置').onChange((value) => {
            if (this.directionalLight) {
                this.directionalLight.position.z = value;
                if (this.directionalLightHelper) {
                    this.directionalLightHelper.update();
                }
            }
        });

        // 初始创建
        if (directionalLightConfig.enabled) {
            this.directionalLight = new DirectionalLight(
                directionalLightConfig.color,
                directionalLightConfig.intensity
            );
            this.directionalLight.position.set(directionalLightConfig.position.x, directionalLightConfig.position.y, directionalLightConfig.position.z);
            this.scene.add(this.directionalLight);

            this.directionalLightHelper = new DirectionalLightHelper(this.directionalLight, 5);
            this.scene.add(this.directionalLightHelper);
            this.directionalLightHelper.update();
            this.lightHelpers.push(this.directionalLightHelper);
        }

        directionalFolder.close();
    }

    setupAmbientLightGUI(folder) {
        if (!config['LightManager'] || !config['LightManager'].ambientLight) {
            console.warn('Ambient light configuration not found in config');
            return;
        }
        const ambientLightConfig = config['LightManager'].ambientLight;
        
        const ambientFolder = folder.addFolder('环境光');
        ambientFolder.add(ambientLightConfig, 'enabled').name('启用').onChange((value) => {
            if (value) {
                this.ambientLight = new AmbientLight(ambientLightConfig.color, ambientLightConfig.intensity);
                this.scene.add(this.ambientLight);
            } else {
                if (this.ambientLight) {
                    this.scene.remove(this.ambientLight);
                    this.ambientLightHelper = null;
                    this.ambientLight = null;
                }
            }
        });
        ambientFolder.addColor(ambientLightConfig, 'color').name('颜色').onChange((value) => {
            if (this.ambientLight) {
                this.ambientLight.color.set(value);
            }
        });
        ambientFolder.add(ambientLightConfig, 'intensity', 0, 1, 0.01).name('强度').onChange((value) => {
            if (this.ambientLight) {
                this.ambientLight.intensity = value;
            }
        });

        // 初始创建环境光
        if (ambientLightConfig.enabled) {
            this.ambientLight = new AmbientLight(ambientLightConfig.color, ambientLightConfig.intensity);
            this.scene.add(this.ambientLight);
        }

        ambientFolder.close();
    }
}