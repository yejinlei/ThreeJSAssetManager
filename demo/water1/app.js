/**
 * Three.js 游泳池水效果演示
 * 
 * 本示例展示了如何使用 Three.js 创建一个带有逼真水面效果的游泳池场景。
 * 主要特点包括：
 * - 使用 Water 对象创建动态水面效果
 * - 模拟游泳池结构（池边和池内）
 * - 多种光源组合提供逼真照明
 * - 交互式相机控制
 * - 响应式设计，适应窗口大小变化
 */
// 从全局对象中引入 CDN 加载的模块
const THREE = window.THREE;
const { OrbitControls } = window.THREE;
const { Sky } = window.THREE;
const GUI = lil.GUI; // 正确引用 lil-gui 库

// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
let water = null; // 水面对象，后续创建
let sky = null; // 天空对象，后续创建
let sun = null; // 太阳位置，用于天空盒
let useSkybox = false; // 控制是否使用天空盒
let pmremGenerator = null; // 预过滤的镜面反射环境贴图生成器
let envMap = null; // 环境贴图
let waterNormalMap = 'textures/waternormals.jpg'; // 水面法向贴图路径
let waterNormalTexture = null; // 水面法向贴图对象

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
    waterColor: 0x000000, // 水面颜色设置为黑色
    distortionScale: 0, // 扭曲比例设置为0
    sunColor: 0x000000, // 太阳光颜色设置为黑色
    textureWidth: 2048, // 水面纹理宽度
    textureHeight: 2048, // 水面纹理高度
    backgroundColor: 0x000000, // 背景色设置为黑色
    widthSegments: 32, // 水面宽度分段数
    heightSegments: 32, // 水面高度分段数
    
    // 光源参数
    useAmbientLight: false, // 默认关闭环境光
    ambientLightColor: 0xffffff, // 环境光颜色
    ambientLightIntensity: 0.0, // 环境光强度设置为0
    
    useDirectionalLight: false, // 默认关闭定向光
    directionalLightColor: 0xffffff, // 定向光颜色
    directionalLightIntensity: 0.0, // 定向光强度设置为0
    directionalLightPositionX: 100, // 定向光X位置
    directionalLightPositionY: 100, // 定向光Y位置
    directionalLightPositionZ: 50, // 定向光Z位置
    directionalLightCastShadow: false, // 定向光不投射阴影
    
    useHemisphereLight: false, // 默认关闭半球光
    hemisphereLightSkyColor: 0xffffbb, // 半球光天空颜色
    hemisphereLightGroundColor: 0x080820, // 半球光地面颜色
    hemisphereLightIntensity: 0.0 // 半球光强度设置为0
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
const controls = new THREE.OrbitControls(camera, renderer.domElement);
// 调整相机位置以更好地观察游泳池
camera.position.set(0, 100, 200);
controls.update(); // 更新控制器

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
function initSky() {
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

// 更新太阳位置和天空效果
function updateSun() {
    // 只有在启用天空盒时才更新太阳位置
    if (!useSkybox || !sky) return;
    
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    
    sun.setFromSphericalCoords(1, phi, theta);
    
    sky.material.uniforms['sunPosition'].value.copy(sun);
    
    // 只有在水面和天空盒都存在时才更新水面的太阳方向
    if (water && water.material) {
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();
    }
    
    // 生成环境贴图
    if (pmremGenerator) {
        // 渲染天空到环境贴图
        scene.environment = pmremGenerator.fromScene(scene).texture;
        
        // 更新水面的环境贴图
        if (water && water.material) {
            water.material.envMap = scene.environment;
            water.material.needsUpdate = true;
            // 强制渲染一帧以确保材质更新生效
            renderer.render(scene, camera);
        }
    }
}

// 初始化GUI控制面板
function initGUI() {
    const gui = new GUI();
    
    // 添加几何体文件夹
    const geometryFolder = gui.addFolder('几何体');
    
    // 添加泳池显示控制
    const showPool = { show: true };
    geometryFolder.add(showPool, 'show').name('显示泳池').onChange(function(value) {
        // 控制泳池几何体的显示/隐藏逻辑
        console.log('泳池显示状态:', value);
        if (typeof poolEdge !== 'undefined' && poolEdge && typeof poolInner !== 'undefined' && poolInner) {
            poolEdge.visible = value;
            poolInner.visible = value;
            if (renderer && scene && camera) {
                renderer.render(scene, camera); // 强制渲染一帧
            }
        }
    });
    
    // 添加渲染参数控制
    const renderFolder = gui.addFolder('渲染参数');
    renderFolder.add(parameters, 'antialias').name('启用抗锯齿').onChange((value) => {
        console.log('抗锯齿状态:', value ? '启用' : '禁用');
        renderer.antialias = value;
        renderer.setPixelRatio(window.devicePixelRatio); // 重新设置像素比以应用抗锯齿
        renderer.render(scene, camera); // 强制渲染一帧
    });
    
    // 添加水参数控制
    const waterFolder = gui.addFolder('水参数');
    
    // 添加法向贴图控制
    waterFolder.add(parameters, 'useNormalMap').name('使用法向贴图').onChange(function(value) {
        // 需要重新创建水面以应用新设置
        if (water) {
            scene.remove(water);
            water = new THREE.Water(
                waterGeometry,
                {
                    textureWidth: parameters.textureWidth,
                    textureHeight: parameters.textureHeight,
                    waterNormals: value ? new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    }) : null,
                    sunDirection: new THREE.Vector3(0, 1, 0),
                    sunColor: parameters.sunColor,
                    waterColor: parameters.waterColor,
                    distortionScale: value ? parameters.distortionScale : 0,
                    fog: scene.fog !== undefined,
                    envMap: scene.environment
                }
            );
            water.rotation.x = -Math.PI / 2;
            scene.add(water);
        }
    });
    
    // 添加水颜色控制
    waterFolder.addColor(parameters, 'waterColor').name('水面颜色').onChange(function(value) {
        if (water && water.material) {
            water.material.uniforms['waterColor'].value.set(value);
        }
    });
    
    // 添加太阳光颜色控制
    waterFolder.addColor(parameters, 'sunColor').name('太阳光颜色').onChange(function(value) {
        if (water && water.material) {
            water.material.uniforms['sunColor'].value.set(value);
        }
    });
    
    // 添加扭曲比例控制
    waterFolder.add(parameters, 'distortionScale', 0, 10, 0.1).name('扭曲比例').onChange(function(value) {
        if (water && water.material) {
            water.material.uniforms['distortionScale'].value = value;
        }
    });
    
    // 添加纹理尺寸控制
    waterFolder.add(parameters, 'textureWidth', 512, 4096, 512).name('纹理宽度');
    waterFolder.add(parameters, 'textureHeight', 512, 4096, 512).name('纹理高度');
    
    // 在 waterFolder 中添加 depthWrite 控制
    waterFolder.add({ depthWrite: true }, 'depthWrite').name('深度写入').onChange(function(value) {
        if (water && water.material) {
            water.material.depthWrite = value;
            water.material.needsUpdate = true; // 确保材质更新
            renderer.render(scene, camera); // 强制渲染一帧
        }
    });
    
    waterFolder.open();
    
    // 添加天空盒参数控制
    const skyFolder = gui.addFolder('天空参数');
    
    // 添加天空盒切换控制
    skyFolder.add(parameters, 'useSkybox').name('使用天空盒').onChange(function(value) {
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
                
                // 确保水面材质使用环境贴图
                if (water && water.material) {
                    water.material.envMap = scene.environment;
                    water.material.needsUpdate = true;
                }
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
    const ambientLightFolder = lightFolder.addFolder('环境光');
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

// 初始化场景设置
function initScene() {
    // 确保useSkybox和parameters.useSkybox保持一致
    useSkybox = parameters.useSkybox;
    
    // 初始化光源
    initLights();
    
    // 强制清除渲染器状态，确保初始设置正确
    renderer.clear();
    
    // 根据useSkybox设置正确的背景
    if (useSkybox) {
        // 初始化天空盒
        initSky();
        // 使用天空盒时不需要背景色
        renderer.setClearColor(0x000000, 0);
        
        // 更新环境贴图
        if (pmremGenerator) {
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
initGUI();
initScene();

/**
 * 游泳池结构创建
 * 包括：
 * 1. 水面几何体
 * 2. 池边结构
 * 3. 池内结构（半透明）
 */
// 定义游泳池尺寸
const poolWidth = 100;
const poolLength = 200;
const poolDepth = 5;
// 使用PlaneGeometry创建一个平面作为水面，这样可以避免中间出现线条
const waterGeometry = new THREE.PlaneGeometry(poolWidth, poolLength, parameters.widthSegments, parameters.heightSegments);

// 创建游泳池边缘（外框）
const poolEdgeGeometry = new THREE.BoxGeometry(poolWidth + 10, poolDepth, poolLength + 10);
const poolEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const poolEdge = new THREE.Mesh(poolEdgeGeometry, poolEdgeMaterial);
poolEdge.position.y = -poolDepth/2; // 将池边放置在适当位置
scene.add(poolEdge);

// 创建游泳池内部（半透明蓝色）
const poolInnerGeometry = new THREE.BoxGeometry(poolWidth, poolDepth, poolLength);
const poolInnerMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0088ff,
    transparent: true,
    opacity: 0.3, // 增加不透明度，使其在任何背景下都更加可见
    emissive: 0x003366, // 添加自发光属性，使其在没有光照时也可见
    emissiveIntensity: 0.2 // 控制自发光强度
});
const poolInner = new THREE.Mesh(poolInnerGeometry, poolInnerMaterial);
poolInner.position.y = -poolDepth/2;
scene.add(poolInner);

/**
 * 水面效果创建
 * 使用 Three.js 的 Water 对象创建动态水面
 * 配置包括：
 * - 水面法线贴图
 * - 太阳光方向
 * - 水面颜色
 * - 扭曲比例
 * - 环境贴图支持
 */
water = new THREE.Water(
    waterGeometry,
    {
        textureWidth: parameters.textureWidth, // 使用参数中的水面纹理宽度
        textureHeight: parameters.textureHeight, // 使用参数中的水面纹理高度
        waterNormals: parameters.useNormalMap ? new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
           texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 设置纹理重复模式
            // 以下是一些可选的纹理设置，目前已注释
            // texture.repeat.set(10, 10); // 减少重复次数，避免出现明显的横条纹
            // texture.minFilter = THREE.LinearMipmapLinearFilter;
            // texture.magFilter = THREE.LinearFilter;
            // texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            // texture.offset.set(0.5, 0.5); // 添加偏移，打破重复模式的规律性
        }) : null,
        sunDirection: new THREE.Vector3(0, 1, 0), // 太阳光方向，将在天空盒启用时更新
        sunColor: parameters.sunColor, // 使用参数中的太阳光颜色
        waterColor: parameters.waterColor, // 使用参数中的水面颜色
        distortionScale: parameters.useNormalMap ? parameters.distortionScale : 0, // 使用参数中的扭曲比例
        fog: scene.fog !== undefined, // 如果场景有雾，则水面也应考虑雾效果
        envMap: scene.environment // 添加环境贴图支持
    }
);
// 显式设置 depthWrite
water.material.depthWrite = true;
// 旋转水面使其水平放置
water.rotation.x = -Math.PI / 2; // 旋转90度，使平面水平
scene.add(water);

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
    
    // 更新水面动画
    if (water) {
        const time = performance.now() * 0.001; // 获取当前时间（秒）
        
        // 更新水面动画时间
        water.material.uniforms[ 'time' ].value += 1.0 / 60.0; // 以60帧/秒的速率更新水面
    }
    
    // 更新天空盒状态
    if (useSkybox && sky) {
        // 确保天空盒可见
        if (!scene.children.includes(sky)) {
            scene.add(sky);
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
});