import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import Stats from 'three/addons/libs/stats.module.js';
import * as dat from 'lil-gui';

import DebugUI from './ThreeJSAssetsManager/DebugUI.js';
let debugUI = new DebugUI();
let gui = debugUI.gui
let guiFolder = debugUI.guiFolder;

import SceneManager from './ThreeJSAssetsManager/SceneManager.js';
let sceneManagerInstance = new SceneManager(); 
let scene = sceneManagerInstance.scene;

let sky = null; // 天空对象，后续创建
let sun = null; // 太阳位置，用于天空盒
let useSkybox = false; // 控制是否使用天空盒
let pmremGenerator = null; // 预过滤的镜面反射环境贴图生成器
let envMap = null; // 环境贴图

// 光源对象
let ambientLight = null; // 环境光
let directionalLight = null; // 定向光
let hemisphereLight = null; // 半球光

// GUI参数
const parameters = {
    // 渲染参数
    antialias: true, // 控制是否启用抗锯齿
    useSkybox: false,
    useBackground: false, // 默认关闭背景色
    elevation: 2,
    azimuth: 180,
    useNormalMap: true, // 控制是否使用法向贴图
    distortionScale: 0, // 扭曲比例设置为0
    sunColor: 0x000000, // 太阳光颜色设置为黑色
    textureWidth: 2048, // 水面纹理宽度
    textureHeight: 2048, // 水面纹理高度
    backgroundColor: '#000000', // 背景色设置为黑色
    widthSegments: 32, // 水面宽度分段数
    heightSegments: 32, // 水面高度分段数
    
    // 光源参数
    useAmbientLight: true, // 启用环境光
    ambientLightColor: 0xffffff, // 环境光颜色
    ambientLightIntensity: 0.5, // 环境光强度
    
    useDirectionalLight: true, // 启用定向光
    directionalLightColor: 0xffffff, // 定向光颜色
    directionalLightIntensity: 1.0, // 定向光强度
    directionalLightPositionX: 100, // 定向光X位置
    directionalLightPositionY: 100, // 定向光Y位置
    directionalLightPositionZ: 50, // 定向光Z位置
    directionalLightCastShadow: true, // 定向光投射阴影
    
    useHemisphereLight: true, // 启用半球光
    hemisphereLightSkyColor: 0xffffbb, // 半球光天空颜色
    hemisphereLightGroundColor: 0x080820, // 半球光地面颜色
    hemisphereLightIntensity: 0.6 // 半球光强度
};

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000); // 增加远平面距离以显示更远的场景
const renderer = new THREE.WebGLRenderer({ antialias: true }); // 启用抗锯齿
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // 设置背景色为黑色，不透明度为0
renderer.setPixelRatio(window.devicePixelRatio); // 适应设备像素比
//renderer.setAnimationLoop(animate); // 使用 setAnimationLoop 替代 requestAnimationFrame (WebXR 应用推荐)
renderer.toneMapping = THREE.ACESFilmicToneMapping; // 设置色调映射，提高视觉质量
renderer.toneMappingExposure = 0.5; // 调整曝光度
document.body.appendChild(renderer.domElement); // 将渲染器的画布添加到页面

// 添加轨道控制器，实现交互式相机控制
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 100, 200);
controls.update(); // 更新控制器

// 简单的日志函数，将消息输出到控制台并写入文件
function logMessage(message) {
    console.log(message);
    
    // 尝试将日志写入文件
    try {
        // 注意：浏览器环境中无法直接写入文件，此代码仅在Node.js环境中有效
        // 这里我们仅做控制台输出
    } catch (e) {
        // 忽略写入文件失败的错误
    }
}

// 模型可见性状态已移入 SceneManager 类中

// 创建多个模型拓扑树
function createModelTrees() {
    logMessage('开始创建多个模型树...');
    
    // 清理之前创建的模型树文件夹
    if (window.modelTreeFolders && window.modelTreeFolders.length > 0) {
        const gui = guiFolder.__parent;
        window.modelTreeFolders.forEach(folder => {
            try {
                if (folder && gui && typeof gui.removeFolder === 'function') {
                    gui.removeFolder(folder);
                }
            } catch (e) {
                console.warn('清理模型树文件夹时出错:', e);
            }
        });
    }
    
    // 存储所有模型树文件夹
    window.modelTreeFolders = [];
    
    // 创建一个主文件夹用于所有模型树
    const mainModelTreeFolder = guiFolder.addFolder('场景集合');
    window.modelTreeFolders.push(mainModelTreeFolder);
    
    // 为模型拓扑树添加显示/隐藏控制
    mainModelTreeFolder.add({visible: true}, 'visible')
        .name('')
        .onChange(function(value) {
            const mainGroup = scene.children.find(child => child.name === 'MainGLBGroup');
            if (mainGroup) {
                mainGroup.visible = value;
                renderer.render(scene, camera);
            }
        });
    
    // 为每个模型创建拓扑树
    loadedModels.forEach(model => {
        const modelName = model.name;
        logMessage(`创建模型 ${modelName} 的拓扑树...`);
        
        // 创建新的模型树子文件夹
        const modelTreeFolder = mainModelTreeFolder.addFolder(modelName);
        
        // 添加GLB模型整体显示/隐藏控制
        modelTreeFolder.add({visible: true}, 'visible')
            .name('')
            .onChange(function(value) {
                const mainGroup = scene.children.find(child => child.name === 'MainGLBGroup');
                if (mainGroup) {
                    const modelNode = mainGroup.children.find(child => child.name === modelName);
                    if (modelNode) {
                        modelNode.visible = value;
                        renderer.render(scene, camera);
                    }
                }
            });
        
        // 从主组中查找模型
const mainGroup = scene.children.find(child => child.name === 'MainGLBGroup');
const glbParent = mainGroup ? mainGroup.children.find(child => child.name === modelName) : null;
        if (glbParent) {
            // 检查是否有子模型
            const hasChildren = (glbParent.children && glbParent.children.length > 0) || 
                              (glbParent.userData && glbParent.userData.children && glbParent.userData.children.length > 0);
            logMessage(`创建模型 ${modelName} 拓扑树，找到子模型数量: ${hasChildren ? 
                (glbParent.children ? glbParent.children.length : glbParent.userData.children.length) : 0}`);
            
            // 递归创建模型树
            function addModelToTree(obj, folder, prefix = '') {
                if (!obj || !obj.uuid) {
                    console.warn('Invalid model object:', obj);
                    return;
                }
                
                // 为每个模型创建一个可见性控制
                const objName = obj.name || `未命名模型_${obj.uuid.substring(0, 8)}`;
                const displayName = prefix + objName;
                
                // 初始化可见性状态
                if (!SceneManager.modelVisibility) {
                    SceneManager.modelVisibility = {};
                }
                if (sceneManagerInstance.modelVisibility[obj.uuid] === undefined) {
                    sceneManagerInstance.setModelVisibility(obj.uuid, obj.visible !== false);
                }
                
                // 确保初始状态同步
                obj.visible = sceneManagerInstance.getModelVisibility(obj.uuid);
                
                // 创建全局控制器存储
                if (!window.modelTreeControllers) window.modelTreeControllers = {};
                
                // 同步函数（递归处理子对象）
                // 模型状态更新（不触发UI）
                const updateModelState = (obj, visible) => {
                    obj.visible = visible;
                    sceneManagerInstance.setModelVisibility(obj.uuid, visible);
                    
                    // 递归更新子对象状态
                    if (obj.children && obj.children.length > 0) {
                        obj.children.forEach(child => {
                            updateModelState(child, visible);
                        });
                    }
                };
                
                // UI更新（不触发模型状态变更）
                const updateUIState = (obj, visible) => {
                    if (window.modelTreeControllers[obj.uuid]) {
                        const controller = window.modelTreeControllers[obj.uuid];
                        controller.__isUpdating = true;
                        controller.setValue(visible);
                        controller.updateDisplay();
                        controller.__isUpdating = false;
                    }
                };
                
                // 完整同步流程
                const syncTreeVisibility = (obj, visible) => {
                    // 先更新所有模型状态
                    updateModelState(obj, visible);
                    
                    // 然后批量更新UI
                    obj.traverse(child => {
                        if (child.isMesh || child.isGroup) {
                            updateUIState(child, visible);
                        }
                    });
                    
                    renderer.render(scene, camera);
                };
                
                // 创建控制器
                const controller = folder.add({
                    get value() {
                        return sceneManagerInstance.getModelVisibility(obj.uuid);
                    },
                    set value(v) {
                        if (!this.__isUpdating) {
                            // 仅触发模型状态更新
                            updateModelState(obj, v);
                            
                            // 手动触发渲染
                            renderer.render(scene, camera);
                        }
                    }
                }, 'value')
                .name(displayName)
                .setValue(sceneManagerInstance.getModelVisibility(obj.uuid));
                
                // 存储控制器引用
                window.modelTreeControllers[obj.uuid] = controller;
                
                // 强制刷新显示
                controller.updateDisplay();
                
                // 递归处理子对象
                const children = obj.children || (obj.userData && obj.userData.children);
                if (children && children.length > 0) {
                    children.forEach(child => {
                        // 检查是否是集合(Collection)
                        if (child.isGroup || child.type === 'Group' || (child.userData && child.userData.isCollection)) {
                            // 为集合创建单独的文件夹
                            const collectionFolder = folder.addFolder(prefix + child.name || `集合_${child.uuid.substring(0, 8)}`);
                            collectionFolder.open();
                            
                            // 递归处理集合中的子对象
                            const collectionChildren = child.children || (child.userData && child.userData.children);
                            if (collectionChildren && collectionChildren.length > 0) {
                                collectionChildren.forEach(collectionChild => {
                                    addModelToTree(collectionChild, collectionFolder, prefix + '  ');
                                });
                            }
                        } else {
                            // 普通模型对象
                            addModelToTree(child, folder, prefix + '  ');
                        }
                    });
                }
            }
            
            // 为每个顶级子模型创建树节点
            if (hasChildren) {
                const children = glbParent.children || (glbParent.userData && glbParent.userData.children);
                children.forEach(child => {
                    addModelToTree(child, modelTreeFolder);
                });
            }
        } else {
            console.warn(`未找到${modelName}模型或子模型为空`);
            modelTreeFolder.add({ message: `未找到${modelName}模型` }, 'message').name('状态').disable();
        }
    });
    
    // 打开主模型树文件夹
    mainModelTreeFolder.open();
}

// 为了兼容旧代码保留的函数
function createModelTree() {
    console.warn('createModelTree() 函数已被弃用，请使用 createModelTrees()');
    createModelTrees();
}

/**
 * 光照系统设置
 * 使用三种不同类型的光源创建逼真的照明效果：
 * 1. 环境光：提供基础照明
 * 2. 定向光：模拟太阳光，产生阴影
 * 3. 半球光：模拟环境反射光
 */
// 初始化光源函数
function initLights() {
    // 创建环境光 - 提供基础照明
    if (parameters.useAmbientLight) {
        ambientLight = new THREE.AmbientLight(
            parameters.ambientLightColor, 
            parameters.ambientLightIntensity
        );
        scene.add(ambientLight);
    } else {
        if (ambientLight) scene.remove(ambientLight);
    }

    // 创建定向光源模拟太阳光
    if (parameters.useDirectionalLight) {
        directionalLight = new THREE.DirectionalLight(
            parameters.directionalLightColor, 
            parameters.directionalLightIntensity
        );
        directionalLight.position.set(
            parameters.directionalLightPositionX, 
            parameters.directionalLightPositionY, 
            parameters.directionalLightPositionZ
        );
        directionalLight.castShadow = parameters.directionalLightCastShadow;
        directionalLight.shadow.mapSize.width = 1024; // 设置阴影贴图分辨率
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);
    } else {
        if (directionalLight) scene.remove(directionalLight);
    }

    // 创建半球光以模拟环境反射光
    if (parameters.useHemisphereLight) {
        hemisphereLight = new THREE.HemisphereLight(
            parameters.hemisphereLightSkyColor, 
            parameters.hemisphereLightGroundColor, 
            parameters.hemisphereLightIntensity
        );
        scene.add(hemisphereLight);
    } else {
        if (hemisphereLight) scene.remove(hemisphereLight);
    }
}

/**
 * 初始化天空盒
 * 创建Three.js的Sky对象，模拟真实天空效果
 */
    // 创建Sky对象
    sky = new THREE.Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    
    // 初始化环境贴图生成器
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    
    // 定义太阳位置
    sun = new THREE.Vector3();
    
    // 设置Sky的uniforms参数
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    
    // 更新太阳位置
    updateSun();
}

function updateSun() {
    // 只有在启用天空盒时才更新太阳位置
    
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    
    sun.setFromSphericalCoords(1, phi, theta);
    
    sky.material.uniforms['sunPosition'].value.copy(sun);
    
    // 生成环境贴图
    if (pmremGenerator) {
        // 渲染天空到环境贴图
        scene.environment = pmremGenerator.fromScene(scene).texture;
    }
}

// 初始化GUI控制面板
function initGUI() {
    
    // 添加几何体文件夹
    guiFolder = gui.addFolder('模型管理');
    
    // // 添加模型拓扑树功能
    // let modelTreeFolder = modelFolder.addFolder('模型拓扑树');
    // // 将模型树文件夹添加到全局作用域，以便在函数间共享
    // window.modelTreeFolder = modelTreeFolder;
    
    // // 存储模型可见性状态的对象


    
    
    
    // 添加全选/全不选按钮
    const selectionControls = {
        selectAll: function() {
            try {
                const mainGroup = scene.children.find(child => child.name === 'MainGLBGroup');
                if (mainGroup) {
                    // 递归更新所有模型可见性
                    const updateAllVisibility = (obj) => {
                        obj.visible = true;
                        sceneManagerInstance.setModelVisibility(obj.uuid, true); // 强制更新所有模型状态
                        if (obj.children && obj.children.length > 0) {
                            obj.children.forEach(child => updateAllVisibility(child));
                        }
                        console.log(`更新模型可见性: ${obj.name || obj.uuid}`, obj.visible);
                    };
                    
                    // 更新主组及其所有子模型
                    updateAllVisibility(mainGroup);
                    
                    // 强制刷新模型树和UI
                    setTimeout(() => {
                        console.log('开始刷新模型树...');
                        
                        // 先更新所有父级文件夹状态
                        if (window.modelTreeFolders) {
                            window.modelTreeFolders.forEach(folder => {
                                if (folder && folder.__controllers) {
                                    folder.__controllers.forEach(ctrl => {
                                        if (ctrl.property === 'visible') {
                                            ctrl.updateDisplay();
                                        }
                                    });
                                }
                            });
                        }
                        
                        // 重新创建模型树
                        createModelTrees();
                        console.log('模型树刷新完成');
                        renderer.render(scene, camera);
                        
                        // 完全重建模型树并同步状态
                        let refreshModelTree = () => {
                            // 重新创建模型树
                            createModelTrees();
                            
                            // 强制同步所有状态
                            //sceneManagerInstance.syncAllModelVisibility(scene);
                            
                            // 确保场景集合状态
                            if (gui.__folders && gui.__folders['场景集合']) {
                                const allSelected = Object.values(modelVisibility).every(v => v === true);
                                gui.__folders['场景集合'].__controllers[0].setValue(allSelected);
                                gui.__folders['场景集合'].__controllers[0].updateDisplay();
                            }
                            
                            renderer.render(scene, camera);
                        };
                        
                        // 执行刷新
                        refreshModelTree();
                    }, 50); // 优化延迟时间
                }
            } catch (e) {
                console.error('全选功能出错:', e);
            }
        },
        deselectAll: function() {
            const glbParent = scene.children.find(child => child.name === window.currentModelName);
            if (glbParent) {
                const updateVisibility = (obj, visible) => {
                    obj.visible = visible;
                    if (modelVisibility[obj.uuid] !== undefined) {
                        sceneManagerInstance.setModelVisibility(obj.uuid, visible);
                    }
                    if (obj.children && obj.children.length > 0) {
                        obj.children.forEach(child => updateVisibility(child, visible));
                    }
                };
                
                glbParent.children.forEach(child => updateVisibility(child, false));
                createModelTree(); // 刷新树以更新UI状态
                renderer.render(scene, camera);
            }
        }
    };
    
    guiFolder.add(selectionControls, 'selectAll').name('全选');
    guiFolder.add(selectionControls, 'deselectAll').name('全不选');
    
    // 添加模型过滤功能
    const filterOptions = {
        pattern: '',  // 用于存储正则表达式模式
        applyFilter: function() {
            const glbParent = scene.children.find(child => child.name === window.currentModelName);
            if (glbParent && glbParent.children.length > 0) {
                const pattern = filterOptions.pattern.trim();
                if (!pattern) {
                    // 如果没有输入过滤条件，显示所有模型
                    glbParent.children.forEach(child => {
                        child.visible = true;
                        // 更新可见性状态
                        if (modelVisibility[child.uuid] !== undefined) {
                            modelVisibility[child.uuid] = true;
                        }
                    });
                } else {
                    // 判断是否是排除模式（以!开头）
                    const isExcludeMode = pattern.startsWith('!');
                    const actualPattern = isExcludeMode ? pattern.substring(1) : pattern;
                    
                    try {
                        const regex = new RegExp(actualPattern, 'i');  // 不区分大小写
                        
                        glbParent.children.forEach(child => {
                            // 递归检查子模型名称
                            const checkChildren = (obj) => {
                                const nameMatches = regex.test(obj.name || '');
                                const newVisibility = isExcludeMode ? !nameMatches : nameMatches;
                                obj.visible = newVisibility;
                                
                                // 更新可见性状态
                                if (modelVisibility[obj.uuid] !== undefined) {
                                    modelVisibility[obj.uuid] = newVisibility;
                                }
                                
                                // 递归处理子对象
                                if (obj.children && obj.children.length > 0) {
                                    obj.children.forEach(checkChildren);
                                }
                            };
                            checkChildren(child);
                        });
                        
                        console.log(`已${isExcludeMode ? '排除' : '筛选'}模型，模式: ${actualPattern}`);
                    } catch (e) {
                        console.error('正则表达式无效:', e);
                        // 正则表达式无效时，显示所有模型
                        glbParent.children.forEach(child => {
                            child.visible = true;
                            // 更新可见性状态
                            if (modelVisibility[child.uuid] !== undefined) {
                                modelVisibility[child.uuid] = true;
                            }
                        });
                    }
                }
                // 刷新拓扑树以更新UI状态
                createModelTree();
                
                // 强制触发重绘
                controls.update();
                renderer.render(scene, camera);
                // 确保动画循环继续运行
                animate();
            }
        }
    };
    
    // 添加过滤输入框 - 使用onChange而不是onFinishChange，实现实时过滤
    guiFolder.add(filterOptions, 'pattern').name('模型名称过滤').onChange(filterOptions.applyFilter);
    
    // // 添加模型显示控制
    // const showModels = { show: true };
    // modelFolder.add(showModels, 'show').name('显示模型').onChange(function(value) {
    //     // 控制模型的显示/隐藏逻辑
    //     console.log('模型显示状态:', value);
    //     const glbModels = scene.children.filter(child => child.name === window.currentModelName);
    //     if (glbModels.length > 0) {
    //         glbModels.forEach(model => {
    //             if (model) model.visible = value;
    //         });
    //         if (renderer && scene && camera) {
    //             renderer.render(scene, camera); // 强制渲染一帧
    //         }
    //     } else {
    //         console.warn(`未找到${window.currentModelName}模型`);
    //     }
    // });

    // 添加平铺功能
    const tileFunctions = {
        tileXY: function() {
            const glbParent = scene.children.find(child => child.name === window.currentModelName);
            if (glbParent && glbParent.children.length > 0) {
                console.log(`找到${window.currentModelName}模型父节点及其子模型:`, glbParent.children);
                const spacing = 10; // 子模型之间的间距
                let x = 0, y = 0;
                
                // 只处理可见的子模型
                const visibleChildren = glbParent.children.filter(child => child.visible);
                
                visibleChildren.forEach((child, index) => {
                    // 重置旋转和缩放，确保原点对齐
                    child.rotation.set(0, 0, 0);
                    child.scale.set(1, 1, 1);
                    child.position.set(x, y, 0);
                    x += spacing;
                    if (x > 10000) { // 每行最多显示10个模型
                        x = 0;
                        y += spacing;
                    }
                });
                renderer.render(scene, camera);
            } else {
                console.warn(`未找到${window.currentModelName}模型父节点或子模型:`, glbParent);
            }
        },
        tileXZ: function() {
            const glbParent = scene.children.find(child => child.name === window.currentModelName);
            if (glbParent && glbParent.children.length > 0) {
                console.log(`找到${window.currentModelName}模型父节点及其子模型:`, glbParent.children);
                const spacing = 10; // 子模型之间的间距
                let x = 0, z = 0;
                
                // 只处理可见的子模型
                const visibleChildren = glbParent.children.filter(child => child.visible);
                
                visibleChildren.forEach((child, index) => {
                    // 重置旋转和缩放，确保原点对齐
                    child.rotation.set(0, 0, 0);
                    child.scale.set(1, 1, 1);
                    child.position.set(x, 0, z);
                    x += spacing;
                    if (x > 100) { // 每行最多显示10个模型
                        x = 0;
                        z += spacing;
                    }
                });
                renderer.render(scene, camera);
            } else {
                console.warn(`未找到${window.currentModelName}模型父节点或子模型:`, glbParent);
            }
        },
        tileYZ: function() {
            const glbParent = scene.children.find(child => child.name === window.currentModelName);
            if (glbParent && glbParent.children.length > 0) {
                console.log(`找到${window.currentModelName}模型父节点及其子模型:`, glbParent.children);
                const spacing = 10; // 子模型之间的间距
                let y = 0, z = 0;
                
                // 只处理可见的子模型
                const visibleChildren = glbParent.children.filter(child => child.visible);
                
                visibleChildren.forEach((child, index) => {
                    // 重置旋转和缩放，确保原点对齐
                    child.rotation.set(0, 0, 0);
                    child.scale.set(1, 1, 1);
                    child.position.set(0, y, z);
                    y += spacing;
                    if (y > 100) { // 每行最多显示10个模型
                        y = 0;
                        z += spacing;
                    }
                });
                renderer.render(scene, camera);
            } else {
                console.warn(`未找到${window.currentModelName}模型父节点或子模型:`, glbParent);
            }
        },
        reset: function() {
            const glbParent = scene.children.find(child => child.name === window.currentModelName);
            if (glbParent && glbParent.children.length > 0) {
                console.log('恢复子模型初始状态:', glbParent.children);
                
                // 只处理可见的子模型
                const visibleChildren = glbParent.children.filter(child => child.visible);
                
                visibleChildren.forEach((child) => {
                    const initial = modelInitialPositions[child.uuid];
                    if (initial) {
                        child.position.copy(initial.position);
                        child.rotation.copy(initial.rotation);
                        child.scale.copy(initial.scale);
                    } else {
                        // 如果没有记录初始位置，则重置为默认值
                        child.position.set(0, 0, 0);
                        child.rotation.set(0, 0, 0);
                        child.scale.set(1, 1, 1);
                    }
                });
                renderer.render(scene, camera);
            } else {
                console.warn(`未找到${window.currentModelName}模型父节点或子模型:`, glbParent);
            }
        }
    };

    // 添加平铺按钮
    guiFolder.add(tileFunctions, 'tileXY').name('XY平铺');
    guiFolder.add(tileFunctions, 'tileXZ').name('XZ平铺');
    guiFolder.add(tileFunctions, 'tileYZ').name('YZ平铺');
    
    // 添加恢复按钮
    guiFolder.add(tileFunctions, 'reset').name('恢复');
    
    // 添加渲染参数控制
    const renderFolder = gui.addFolder('渲染参数');
    renderFolder.add(parameters, 'antialias').name('启用抗锯齿').onChange((value) => {
        console.log('抗锯齿状态:', value ? '启用' : '禁用');
        renderer.antialias = value;
        renderer.setPixelRatio(window.devicePixelRatio); // 重新设置像素比以应用抗锯齿
        renderer.render(scene, camera); // 强制渲染一帧
    });
    
    //预留 
    
    // 添加天空盒参数控制
    const skyFolder = gui.addFolder('天空参数');
    
    // 添加天空盒切换控制
        useSkybox = value;
        parameters.useSkybox = value; // 确保两个变量保持同步
        
        // 强制清除渲染器状态，确保之前的设置不会影响新的设置
        renderer.clear();
        
        if (useSkybox) {
            // 如果天空盒未初始化，则初始化
            if (!sky) {
                initSky();
            } else if (!scene.children.includes(sky)) {
                // 如果天空盒已初始化但不在场景中，则添加到场景
                scene.add(sky);
            }
            
            // 使用天空盒时不需要背景色
            renderer.setClearColor(0x000000, 0);
            
            // 更新环境贴图
            if (pmremGenerator) {
                scene.environment = pmremGenerator.fromScene(scene).texture;
            }
        } else {
            // 不使用天空盒时，背景色设置为黑色
            renderer.setClearColor(0x000000, 1);
            
            // 清除环境贴图
            scene.environment = null;
            
            // 如果天空盒存在，从场景中移除
            if (sky && scene.children.includes(sky)) {
                scene.remove(sky);
            }
            
            // 强制更新渲染器的清除状态
            renderer.clear();
        }
        
        // 更新太阳控制器的启用状态
        updateSunControllers();
        
        // 立即渲染一帧以刷新显示
        renderer.render(scene, camera);
    });
    
    // 添加背景色启用控制
    skyFolder.add(parameters, 'useBackground').name('使用背景色').onChange(function(value) {
        // 只有在不使用天空盒时才考虑背景色设置
        if (!useSkybox) {
            if (value) {
                // 启用背景色
                renderer.setClearColor(parameters.backgroundColor, 1);
            } else {
                // 禁用背景色 - 使用透明背景
                renderer.setClearColor(0x000000, 0);
            }
            
            // 强制更新渲染器的清除状态
            renderer.clear();
            
            // 立即渲染一帧以刷新显示
            renderer.render(scene, camera);
        }
    });
    
    // 添加背景色控制 - 作为独立参数
    skyFolder.addColor(parameters, 'backgroundColor').name('背景色').onChange(function(value) {
        // 只有在不使用天空盒且启用背景色时才应用背景色
        if (!useSkybox && parameters.useBackground) {
            renderer.setClearColor(value, 1); // 设置不透明度为1，确保完全覆盖
            
            // 强制更新渲染器的清除状态
            renderer.clear();
            
            // 立即渲染一帧以刷新显示
            renderer.render(scene, camera);
        }
    });
    
    // 创建太阳控制子文件夹，只在启用天空盒时可用
    const sunFolder = skyFolder.addFolder('太阳控制');
    
    // 添加太阳高度控制
    const elevationController = sunFolder.add(parameters, 'elevation', 0, 90, 0.1).name('太阳高度').onChange(updateSun);
    
    // 添加太阳方位控制
    const azimuthController = sunFolder.add(parameters, 'azimuth', -180, 180, 0.1).name('太阳方位').onChange(updateSun);
    
    // 根据天空盒启用状态更新控制器
    function updateSunControllers() {
        const enabled = useSkybox;
        elevationController.enable(enabled);
        azimuthController.enable(enabled);
        if (enabled) {
            sunFolder.open();
        } else {
            sunFolder.close();
        }
    }
    
    // 初始更新控制器状态
    updateSunControllers();
    
    skyFolder.open();
    
    // 添加灯光参数控制
    const lightFolder = gui.addFolder('灯参数');
    
    // 环境光控制
    ambientLightFolder.add(parameters, 'useAmbientLight').name('启用环境光').onChange(function(value) {
        if (value) {
            if (!ambientLight) {
                ambientLight = new THREE.AmbientLight(
                    parameters.ambientLightColor, 
                    parameters.ambientLightIntensity
                );
                scene.add(ambientLight);
            } else {
                // 如果环境光已存在但被移除，重新添加到场景
                if (!scene.children.includes(ambientLight)) {
                    scene.add(ambientLight);
                }
            }
        } else {
            if (ambientLight) {
                scene.remove(ambientLight);
            }
        }
        // 强制清除渲染器状态，确保更新生效
        renderer.clear();
        // 立即渲染一帧以刷新显示
        renderer.render(scene, camera);
    });
    
    ambientLightFolder.addColor(parameters, 'ambientLightColor').name('颜色').onChange(function(value) {
        if (ambientLight) {
            ambientLight.color.set(value);
            renderer.render(scene, camera);
        }
    });
    
    ambientLightFolder.add(parameters, 'ambientLightIntensity', 0, 3, 0.1).name('强度').onChange(function(value) {
        if (ambientLight) {
            ambientLight.intensity = value;
            renderer.render(scene, camera);
        }
    });
    
    // 定向光控制
    const directionalLightFolder = lightFolder.addFolder('定向光');
    directionalLightFolder.add(parameters, 'useDirectionalLight').name('启用定向光').onChange(function(value) {
        if (value) {
            if (!directionalLight) {
                directionalLight = new THREE.DirectionalLight(
                    parameters.directionalLightColor, 
                    parameters.directionalLightIntensity
                );
                directionalLight.position.set(
                    parameters.directionalLightPositionX, 
                    parameters.directionalLightPositionY, 
                    parameters.directionalLightPositionZ
                );
                directionalLight.castShadow = parameters.directionalLightCastShadow;
                directionalLight.shadow.mapSize.width = 1024;
                directionalLight.shadow.mapSize.height = 1024;
                scene.add(directionalLight);
            } else {
                // 如果定向光已存在但被移除，重新添加到场景
                if (!scene.children.includes(directionalLight)) {
                    scene.add(directionalLight);
                }
            }
        } else {
            if (directionalLight) {
                scene.remove(directionalLight);
            }
        }
        // 强制清除渲染器状态，确保更新生效
        renderer.clear();
        // 立即渲染一帧以刷新显示
        renderer.render(scene, camera);
    });
    
    directionalLightFolder.addColor(parameters, 'directionalLightColor').name('颜色').onChange(function(value) {
        if (directionalLight) {
            directionalLight.color.set(value);
            renderer.render(scene, camera);
        }
    });
    
    directionalLightFolder.add(parameters, 'directionalLightIntensity', 0, 3, 0.1).name('强度').onChange(function(value) {
        if (directionalLight) {
            directionalLight.intensity = value;
            renderer.render(scene, camera);
        }
    });
    
    directionalLightFolder.add(parameters, 'directionalLightPositionX', -200, 200, 10).name('X位置').onChange(function(value) {
        if (directionalLight) {
            directionalLight.position.x = value;
            renderer.render(scene, camera);
        }
    });
    
    directionalLightFolder.add(parameters, 'directionalLightPositionY', -200, 200, 10).name('Y位置').onChange(function(value) {
        if (directionalLight) {
            directionalLight.position.y = value;
            renderer.render(scene, camera);
        }
    });
    
    directionalLightFolder.add(parameters, 'directionalLightPositionZ', -200, 200, 10).name('Z位置').onChange(function(value) {
        if (directionalLight) {
            directionalLight.position.z = value;
            renderer.render(scene, camera);
        }
    });
    
    directionalLightFolder.add(parameters, 'directionalLightCastShadow').name('投射阴影').onChange(function(value) {
        if (directionalLight) {
            directionalLight.castShadow = value;
            renderer.render(scene, camera);
        }
    });
    
    // 半球光控制
    const hemisphereLightFolder = lightFolder.addFolder('半球光');
    hemisphereLightFolder.add(parameters, 'useHemisphereLight').name('启用半球光').onChange(function(value) {
        if (value) {
            if (!hemisphereLight) {
                hemisphereLight = new THREE.HemisphereLight(
                    parameters.hemisphereLightSkyColor, 
                    parameters.hemisphereLightGroundColor, 
                    parameters.hemisphereLightIntensity
                );
                scene.add(hemisphereLight);
            } else {
                // 如果半球光已存在但被移除，重新添加到场景
                if (!scene.children.includes(hemisphereLight)) {
                    scene.add(hemisphereLight);
                }
            }
        } else {
            if (hemisphereLight) {
                scene.remove(hemisphereLight);
            }
        }
        // 强制清除渲染器状态，确保更新生效
        renderer.clear();
        // 立即渲染一帧以刷新显示
        renderer.render(scene, camera);
    });
    
    hemisphereLightFolder.addColor(parameters, 'hemisphereLightSkyColor').name('天空颜色').onChange(function(value) {
        if (hemisphereLight) {
            hemisphereLight.color.set(value);
            renderer.render(scene, camera);
        }
    });
    
    hemisphereLightFolder.addColor(parameters, 'hemisphereLightGroundColor').name('地面颜色').onChange(function(value) {
        if (hemisphereLight) {
            hemisphereLight.groundColor.set(value);
            renderer.render(scene, camera);
        }
    });
    
    hemisphereLightFolder.add(parameters, 'hemisphereLightIntensity', 0, 3, 0.1).name('强度').onChange(function(value) {
        if (hemisphereLight) {
            hemisphereLight.intensity = value;
            renderer.render(scene, camera);
        }
    });
    
    // 打开灯光文件夹
    lightFolder.open();
}

// 存储模型初始位置的变量
const modelInitialPositions = {};

// 存储所有加载的模型
const loadedModels = [];

// 初始化场景设置
function initScene() {
    // 加载 GLB 文件
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://gcore.jsdelivr.net/npm/three@0.132.2/examples/js/libs/draco/');
    loader.setDRACOLoader(dracoLoader);
    
    // 模型文件路径数组 - 可以添加多个模型
    const modelPaths = [
        'models/戴珍珠耳环的黑人少女.glb',
        'models/Horse.glb'
    ];
    
    // 创建一个主组，用于包含所有GLB模型
    const mainGroup = new THREE.Group();
    mainGroup.name = 'MainGLBGroup';
    
    // 将第一个模型名称存储为全局变量，以便其他函数使用
    const firstModelName = modelPaths[0].split('/').pop().replace('.glb', '');
    window.currentModelName = firstModelName;
    
    // 加载所有模型
    modelPaths.forEach((modelPath, index) => {
        // 从路径中提取文件名（不含扩展名）
        const modelName = modelPath.split('/').pop().replace('.glb', '');
        
        loader.load(
            modelPath,
            function (gltf) {
                logMessage(`原始模型名称 ${index + 1}: ${gltf.scene.name}`);
                gltf.scene.name = modelName;
                
                // 将GLB模型添加到主组中
                mainGroup.add(gltf.scene);
                
                // 记录所有子模型的初始位置
                gltf.scene.children.forEach(child => {
                    modelInitialPositions[child.uuid] = {
                        position: child.position.clone(),
                        rotation: child.rotation.clone(),
                        scale: child.scale.clone()
                    };
                });

                // 存储加载的模型
                loadedModels.push({
                    name: modelName,
                    scene: gltf.scene,
                    index: index
                });

                logMessage(`GLB 文件 ${index + 1} 加载成功: ${modelName}`);

                // 在所有模型加载完成后创建模型树
                if (loadedModels.length === modelPaths.length) {
                    createModelTrees();
                }
            },
            undefined,
            function (error) {
                console.error(`GLB 文件 ${index + 1} 加载失败:`, error);
            }
        );
    });
    
    // 将主组添加到场景中
    scene.add(mainGroup);
    // 确保useSkybox和parameters.useSkybox保持一致
    useSkybox = parameters.useSkybox;
    
    // 初始化光源
    initLights();
    
    // 强制清除渲染器状态，确保初始设置正确
    renderer.clear();
    useSkybox = parameters.useSkybox;
    // 根据useSkybox设置正确的背景
    if (useSkybox) {
        // 初始化天空盒
        initSky();
        // 使用天空盒时不需要背景色
        renderer.setClearColor(0x000000, 0);
        
        // 更新环境贴图
            scene.environment = pmremGenerator.fromScene(scene).texture;
        }
        
        // 确保太阳控制器可用
        if (typeof updateSunControllers === 'function') {
            updateSunControllers();
        }
    } else {
        // 不使用天空盒时，设置背景色
        renderer.setClearColor(parameters.backgroundColor, 1); // 设置不透明度为1，确保完全覆盖
        
        // 确保没有环境贴图
        scene.environment = null;
        
        // 强制更新渲染器的清除状态
        renderer.clear();
        
        // 确保太阳控制器被禁用
        if (typeof updateSunControllers === 'function') {
            updateSunControllers();
        }
    }
    
    // 立即渲染一帧以应用初始设置
    renderer.render(scene, camera);
}

// 调用初始化函数
initScene();
if (debugUI.debug === true) initGUI();

// 确保在GUI初始化后，如果有模型已加载则创建模型树
if (loadedModels.length > 0) {
    logMessage('页面刷新，已有模型加载，重新创建模型树...');
    createModelTrees();
}

/**
 * 动画循环函数
 * 负责：
 * 1. 更新水面动画
 * 2. 渲染场景
 * 3. 更新控制器
 * 4. 更新环境贴图
 */
function animate() {
    requestAnimationFrame(animate); // 请求下一帧动画
   
    //预留
    
    // 更新天空盒状态
    if (useSkybox && sky) {
        // 确保天空盒可见
        if (!scene.children.includes(sky)) {
            // 使用天空盒时不需要背景色
            renderer.setClearColor(0x000000, 0);
        }
        // 天空盒可能需要的动态更新
        // 这里可以添加天空盒的动态效果，如日落日出等
    } else if (sky && scene.children.includes(sky)) {
        // 如果天空盒不应该显示但仍在场景中，则移除它
        scene.remove(sky);
        // 根据背景色启用设置决定是否应用背景色
        if (parameters.useBackground) {
            renderer.setClearColor(parameters.backgroundColor, 1);
        } else {
            renderer.setClearColor(0x000000, 0); // 透明背景
        }
    }
    
    renderer.render(scene, camera); // 渲染场景
    controls.update(); // 更新轨道控制器
}
animate(); // 启动动画循环

/**
 * 窗口大小调整处理
 * 确保场景在窗口大小变化时保持正确的宽高比
 */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; // 更新相机宽高比
    camera.updateProjectionMatrix(); // 更新相机投影矩阵
    renderer.setSize(window.innerWidth, window.innerHeight); // 调整渲染器大小
