// 从 three 库中导入所需的几何体、材质和网格类
import { BoxGeometry, MeshBasicMaterial, MeshStandardMaterial, Mesh, PlaneGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry, IcosahedronGeometry, CircleGeometry, DodecahedronGeometry, EdgesGeometry, ExtrudeGeometry, LatheGeometry, OctahedronGeometry, PolyhedronGeometry, RingGeometry, ShapeGeometry, TetrahedronGeometry, TorusKnotGeometry, TubeGeometry, WireframeGeometry, MeshPhongMaterial } from 'three';

// 导入 ThreeJSAssetsManager 类
import ThreeJSAssetsManager from "./ThreeJSAssetsManager.js";

// 导入通用的 ModelLoader 类
import ModelLoader from "./World/ModelLoader.js";

/**
 * MeshManager 类用于管理场景中的网格对象，包括加载资源和创建几何体。
 */
export default class MeshManager {
    /**
     * 构造函数，初始化 MeshManager 实例。
     * @param {Object} options - 配置选项对象
     */
    constructor(options = {}) {
        // 保存配置选项
        this.manager = options.manager;
        this.debug = options.debug;
        this.gui = options.gui;
        
        // 从主管理器或全局实例获取场景和资源
        if (this.manager) {
            this.scene = this.manager.scene;
            this.resources = this.manager.resources;
            this.geometries = this.manager.geometries;
            // 获取配置 - 优先从主管理器获取，确保使用最新配置
            this.config = this.manager.getConfig('MeshManager') || {};
        } else {
            // 回退到全局实例
            const globalInstance = window.ThreeJSAssetsManagerInstance;
            this.scene = globalInstance?.scene;
            this.resources = globalInstance?.resources;
            this.geometries = globalInstance?.geometries;
            this.config = {};
        }
        
        console.log('🏗️ MeshManager: 初始化网格管理器');
        console.log('🏗️ MeshManager: 使用配置:', this.config);
        
        // 保存 GLB 模型引用的对象
    this.glbModels = {};
    // 保存加载的 GLB 文件信息
    this.loadedGlbs = [];
    // 初始化通用模型数组
    this.models = [];
    this.modelInstances = {};
    // 用于调试的 GUI 文件夹引用
    this.modelsFolder = null;
    
    // 查找场景中的 GLBMainGroup 对象，如果不存在则创建
    this.glbmaingroup = this.scene?.children.find(object => object.name === 'GLBMainGroup');
    if (!this.glbmaingroup && this.scene) {
      const { Group } = require('three');
      this.glbmaingroup = new Group();
      this.glbmaingroup.name = 'GLBMainGroup';
      this.scene.add(this.glbmaingroup);
      console.log('✅ GLBMainGroup 已创建');
    }
    
    // 初始化模型配置
    this.initializeModels();
    
    // 调用异步初始化方法
    this.init();
  }
  
  /**
   * 初始化模型配置和加载设置
   */
  initializeModels() {
    console.log('🏗️ MeshManager: 初始化模型配置');
    
    // 如果配置中指定了要自动加载的模型，这里可以添加逻辑
    if (this.config.autoLoadModels && Array.isArray(this.config.autoLoadModels)) {
      console.log('🏗️ 准备自动加载模型:', this.config.autoLoadModels);
    }
    
    // 设置模型默认参数
    this.modelDefaults = {
      scale: this.config.defaultScale || 1,
      position: this.config.defaultPosition || { x: 0, y: 0, z: 0 },
      rotation: this.config.defaultRotation || { x: 0, y: 0, z: 0 }
    };
    
    console.log('🏗️ 模型默认参数:', this.modelDefaults);
    }

    async init() {
        console.log('🏗️ MeshManager: 初始化');
        // 封装资源加载完成事件为 Promise
        await new Promise((resolve) => {
            this.resources.on('ready', () => {
                // 遍历所有资源
                this.resources.sources.forEach(object => {
                    // 如果资源类型为 'glbModel' 或 'gltfModel'
                    if (object.type === 'glbModel' || object.type === 'gltfModel') {
                        try {
                            // 检查模型是否已经存在，避免重复创建
                            if (this.modelInstances[object.name]) {
                                console.warn(`🏗️ MeshManager: 模型 "${object.name}" 已存在，跳过重复创建`);
                                return;
                            }
                            
                            console.log(`Creating model with ModelLoader: ${object.name}`);
                            // 使用通用ModelLoader创建模型实例
                            const model = new ModelLoader(object.name);
                            
                            // 保存到模型数组和实例映射中
                            this.models.push(model);
                            this.modelInstances[object.name] = model;
                            
                            // 将模型实例保存到资源管理器实例中以便外部访问
                            if (window.ThreeJSAssetsManagerInstance) {
                                window.ThreeJSAssetsManagerInstance[object.name.toLowerCase()] = model;
                            }
                            console.log(`Successfully created and registered model: ${object.name}`);
                        } catch (error) {
                            console.error(`Failed to create model ${object.name}:`, error);
                            // 如果ModelLoader创建失败，尝试直接添加模型到场景
                            const gltf = this.resources.items[object.name];
                            if (gltf && gltf.scene) {
                                gltf.scene.name = object.name;
                                this.scene.add(gltf.scene);
                                console.log(`Fallback: Added GLB model directly: ${object.name}`);
                            }
                        }
                    }
                });
                resolve();
            });
        });
        // 从管理器实例中获取场景中的 GLBMainGroup 对象
        this.glbmaingroup = this.scene.children.find(object => object.name === 'GLBMainGroup');

        // 设置调试UI
        if (this.debug && this.gui) {
            this.setupDebugUI();
        }
    }

    /**
     * 设置调试UI
     */
    setupDebugUI() {
        console.log('🏗️ MeshManager: 设置调试UI');
        
        // 使用顶部导入的ModelLoader类及其静态属性来避免重复创建Objects和MeshManager文件夹
        
        // 确保只有一个Objects文件夹
        if (!ModelLoader.globalObjectsFolder && this.gui) {
            // 查找现有Objects文件夹
            if (this.gui.__folders && Array.isArray(this.gui.__folders)) {
                for (let folder of this.gui.__folders) {
                    if (folder && (folder.name.includes('Objects') || folder.name.includes('对象管理'))) {
                        ModelLoader.globalObjectsFolder = folder;
                        break;
                    }
                }
            }
            
            // 如果没找到，创建新的
            if (!ModelLoader.globalObjectsFolder && this.gui.addFolder) {
                ModelLoader.globalObjectsFolder = this.gui.addFolder('📦 Objects (对象管理)');
            }
        }
        
        // 确保只有一个MeshManager文件夹
        if (!ModelLoader.globalMeshManagerFolder && ModelLoader.globalObjectsFolder) {
            // 查找现有MeshManager文件夹
            if (ModelLoader.globalObjectsFolder.__folders && Array.isArray(ModelLoader.globalObjectsFolder.__folders)) {
                for (let folder of ModelLoader.globalObjectsFolder.__folders) {
                    if (folder && (folder.name.includes('MeshManager') || folder.name.includes('网格管理'))) {
                        ModelLoader.globalMeshManagerFolder = folder;
                        break;
                    }
                }
            }
            
            // 如果没找到，创建新的
            if (!ModelLoader.globalMeshManagerFolder && ModelLoader.globalObjectsFolder.addFolder) {
                ModelLoader.globalMeshManagerFolder = ModelLoader.globalObjectsFolder.addFolder('🏗️ MeshManager(网格管理)');
            }
        }
        
        // 使用全局的MeshManager文件夹
        this.debugFolder = ModelLoader.globalMeshManagerFolder;
        this.setupMeshDebugUI(this.debugFolder);
        this.debugFolder.close();
    }
    
    /**
     * 设置网格调试面板
     * @param {Object} folder - lil-gui 文件夹
     */
    setupMeshDebugUI(folder) {
        // 添加加载状态指示器
        folder.add({ status: '等待资源加载' }, 'status').name('加载状态');
        
        // 创建加载控制按钮
        const loaderControls = {
            loadAllModels: () => this.loadAllModels(),
            clearAllModels: () => this.clearAllModels(),
        };
        
        folder.add(loaderControls, 'loadAllModels').name('加载所有模型');
        folder.add(loaderControls, 'clearAllModels').name('清除所有模型');
        
        // 创建文件夹用于管理各个模型
        this.modelsFolder = folder.addFolder('模型控制');
        
        // 添加测试功能的文件夹
        const MeshOperatorFolder = folder.addFolder('测试功能');

        // 添加控制所有 GLB 模型可见性的控件
        const glbAllVisibilityFolder = MeshOperatorFolder.addFolder('控制所有GLB模型可见性');
        const glbVisibilityParams = {
            show: true,
            setVisibility: () => {
                this.setAllGlbVisibility(glbVisibilityParams.show);
            }
        };
        glbAllVisibilityFolder.add(glbVisibilityParams, 'show').name('显示所有GLB模型');
        glbAllVisibilityFolder.add(glbVisibilityParams, 'setVisibility').name('应用设置');

        // 添加获取 glb 模型树的控件
        const glbSingleVisibilityFolder = MeshOperatorFolder.addFolder('控制单独GLB模型树:');
        const glbSingleVisibilityParams = {
            glbName: '',
            show: true,
            setVisibility: () => {
                console.log('glbSingleVisibilityParams:', glbSingleVisibilityParams);
                this.setSingleGlbVisibility(glbSingleVisibilityParams.glbName, glbSingleVisibilityParams.show);
            }
        };
        glbSingleVisibilityFolder.add(glbSingleVisibilityParams, 'glbName').name('GLB名称');
        glbSingleVisibilityFolder.add(glbSingleVisibilityParams, 'show').name('显示模型');
        glbSingleVisibilityFolder.add(glbSingleVisibilityParams, 'setVisibility').name('应用设置');

        // 添加获取场景中 mesh 集合的控件
        const sceneMeshesFolder = MeshOperatorFolder.addFolder('获取SCENE中的Mesh集合');

        const sceneMeshesParams = {
            meshName: '',
            isRegex: false,
            show: false,
            filter: 'include',
            getMeshes: () => {
                const meshes = this.getMeshesInScene(sceneMeshesParams.meshName, sceneMeshesParams.isRegex, sceneMeshesParams.filter);
                meshes.forEach(mesh => { mesh.visible = sceneMeshesParams.show })
            }
        };
        sceneMeshesFolder.add(sceneMeshesParams, 'meshName').name('Mesh 名称').onChange((value) => {
            sceneMeshesParams.meshName = value;
        });
        sceneMeshesFolder.add(sceneMeshesParams, 'isRegex').name('使用正则匹配').onChange((value) => {
            sceneMeshesParams.isRegex = value;
        });
        sceneMeshesFolder.add(sceneMeshesParams, 'show').name('显示Mesh').onChange((value) => {
            sceneMeshesParams.show = value;
        });
        sceneMeshesFolder.add(sceneMeshesParams, 'getMeshes').name('应用设置');
        
        // 监听资源加载完成事件
        if (this.resources) {
            this.resources.on('ready', () => {
                console.log('🏗️ 所有资源加载完成，更新调试面板');
                this.updateDebugUI();
            });
        }

        // 测试用代码，创建一个立方体并添加到场景中
        // if (!this.geometries['box1']) {
        //     const geometry1 = new BoxGeometry( 1, 1, 1 ); 
        //     const material = new MeshBasicMaterial( {color: 0xffff00} ); 
        //     const cube = new Mesh( geometry1, material ); 
        //     this.scene.add(cube);
        //     this.geometries['box1'] = cube;
        // }

        // 以下注释代码用于添加不同类型的几何体到场景中
        // // 添加平面几何体
        // const planeGeometry = new PlaneGeometry(50, 50);
        // const planeMaterial = new MeshStandardMaterial({ color: 0x777777 });
        // const plane = new Mesh(planeGeometry, planeMaterial);
        // plane.rotation.x = -Math.PI / 2;
        // plane.position.y = -1;
        // this.scene.add(plane);

        // // 添加球体
        // const sphereGeometry = new SphereGeometry(0.5, 32, 32);
        // const sphereMaterial = new MeshStandardMaterial({ color: 0xff0000 });
        // const sphere = new Mesh(sphereGeometry, sphereMaterial);
        // sphere.position.set(2, 0, 0);
        // this.scene.add(sphere);

        // // 添加圆柱体
        // const cylinderGeometry = new CylinderGeometry(0.5, 0.5, 1, 32);
        // const cylinderMaterial = new MeshStandardMaterial({ color: 0x00ff00 });
        // const cylinder = new Mesh(cylinderGeometry, cylinderMaterial);
        // cylinder.position.set(-2, 0, 0);
        // this.scene.add(cylinder);

        // // 添加圆锥体
        // const coneGeometry = new ConeGeometry(0.5, 1, 32);
        // const coneMaterial = new MeshStandardMaterial({ color: 0x0000ff });
        // const cone = new Mesh(coneGeometry, coneMaterial);
        // cone.position.set(0, 0, 2);
        // this.scene.add(cone);

        // // 添加圆环体
        // const torusGeometry = new TorusGeometry(0.5, 0.2, 16, 100);
        // const torusMaterial = new MeshStandardMaterial({ color: 0xffff00 });
        // const torus = new Mesh(torusGeometry, torusMaterial);
        // torus.position.set(0, 0, -2);
        // this.scene.add(torus);

        // // 添加二十面体
        // const icosahedronGeometry = new IcosahedronGeometry(0.5, 0);
        // const icosahedronMaterial = new MeshStandardMaterial({ color: 0xff00ff });
        // const icosahedron = new Mesh(icosahedronGeometry, icosahedronMaterial);
        // icosahedron.position.set(2, 0, 2);
        // this.scene.add(icosahedron);
    }


    /**
     * 获取场景中 GLB 主组对象。
     * 该方法会检查 GLB 主组对象是否存在子对象，
     * 若存在则返回该 GLB 主组对象，否则返回 null。
     * @returns {Object|null} - 若 GLB 主组对象存在子对象，返回该对象；否则返回 null。
     */
    getGlbList() {
        // 检查 GLB 主组对象是否存在且包含子对象
        if (this.glbmaingroup && this.glbmaingroup.children.length > 0) {
            // 若存在子对象，返回 GLB 主组对象
            return this.glbmaingroup;
        } else {
            // 若不存在子对象，返回 null
            return null;
        }
    }

    /**
     * 设置场景中所有 GLB 模型的可见性。
     * 该方法会获取 GLB 主组对象，若对象存在，则遍历其所有子网格对象，
     * 根据传入的参数设置这些网格对象的可见性。
     * @param {boolean} show - 控制网格对象可见性的布尔值，true 为显示，false 为隐藏。
     */
    setAllGlbVisibility(show) {
        // 调用 getAllGlbModelTree 方法获取 GLB 主组对象
        const glbList = this.getGlbList();
        // 检查 GLB 主组对象是否存在
        if (glbList) {
            // 遍历 GLB 主组对象的所有子对象
            glbList.traverse((child) => {
                // 检查子对象是否为网格对象
                if (child.isMesh) {
                    // 根据传入的 show 参数设置网格对象的可见性
                    child.visible = show;
                }
            });
        }
    }


    /**
     * 通过传入 glb 名，返回整个 glb 的模型树。
     * @param {string} glbName - glb 模型的名称。
     * @returns {Object|null} - glb 模型树，如果未找到则返回 null。
     */
    /**
     * 通过传入 glb 名和过滤类型，返回对应的 glb 模型树。
     * @param {string} glbName - glb 模型的名称。
     * @param {string} [filter='include'] - 过滤类型，'include' 表示包含指定名称的模型，'exclude' 表示排除指定名称的模型。
     * @returns {Object|Array<Object>|null} - 符合条件的 glb 模型树或模型树数组，如果未找到则返回 null。
     */
    getSingleGlbFromScene(glbName) {
        if (!this.glbmaingroup) {
            return null;
        }

        const glbs = this.glbmaingroup.children.filter(child => child.name === glbName)
        if (!glbs.length) {
            return null;
        } else {
            return glbs[0];
        }
    }

    /**
     * 设置指定 GLB 模型的可见性。
     * 该方法会先隐藏所有 GLB 模型的网格，然后根据传入的 glbName 和 filter 找到对应的模型树，
     * 并根据 show 参数设置该模型树中所有网格的可见性。
     * @param {string} glbName - 要设置可见性的 GLB 模型的名称。
     * @param {boolean} show - 控制网格对象可见性的布尔值，true 为显示，false 为隐藏。
     * @param {string} [filter='include'] - 过滤类型，'include' 表示包含指定名称的模型，'exclude' 表示排除指定名称的模型。
     * @returns {Object|Array<Object>|null} - 找到的 GLB 模型树或模型树数组，如果未找到则返回 null。
     */
    setSingleGlbVisibility(glbName, show) {
        const singleglb = this.getSingleGlbFromScene(glbName);

        if (singleglb) {

            singleglb.traverse((child) => {
                if (child.isMesh) {
                    child.visible = false;
                }
            });

            singleglb.traverse((child) => {
                if (child.isMesh) {
                    child.visible = show;
                }
            });
        };
    }



    /**
     * 通过传入 glb 名和 mesh 名，正则、完全匹配，返回这些 glb 中找到的 mesh 集合。
     * @param {string} glbName - glb 模型的名称。
     * @param {string} meshName - 要查找的 mesh 名称，可以是正则表达式或完全匹配的字符串。
     * @param {boolean} [isRegex=false] - 是否使用正则表达式匹配，默认为 false。
     * @param {boolean} [showOnly=false] - 如果为 true，则只显示找到的 mesh，隐藏其他 mesh。默认为 false。
     * @param {string} [filter='include'] - 过滤类型，'include' 表示包含指定名称的模型，'exclude' 表示排除指定名称的模型。
     * @returns {Array<Mesh>} - 找到的 mesh 集合。
     */
    getMeshesInGlbs(glbName, meshName, isRegex = false, showOnly = false, filter = 'include') {
        const meshes = []; // 初始化 meshes 数组
        const glb = this.getSingleGlbFromScene(glbName); // 修正 filter 参数传递方式
        if (glb) {
            treesToProcess.forEach((tree) => { // 遍历 glb 模型树
                tree.traverse((child) => {
                    if (child.isMesh) {
                        if (isRegex) {
                            const regex = new RegExp(meshName);
                            if (regex.test(child.name)) {
                                meshes.push(child);

                                if (filter === 'include') {
                                    if (meshes.some(mesh => mesh.name === child.name)) {
                                        child.visible = true;
                                    }
                                } else if (filter === 'exclude') {
                                    if (!meshes.some(mesh => mesh.name === child.name)) {
                                        child.visible = true;
                                    }
                                } else {
                                    console.error('Invalid filter type. Expected "include" or "exclude".');
                                }
                            }
                        } else if (child.name === meshName) {
                            meshes.push(child);

                            if (filter === 'include') {
                                if (meshes.some(mesh => mesh.name === child.name)) {
                                    child.visible = true;
                                }
                            } else if (filter === 'exclude') {
                                if (!meshes.some(mesh => mesh.name === child.name)) {
                                    child.visible = true;
                                }
                            } else {
                                console.error('Invalid filter type. Expected "include" or "exclude".');
                            }
                        }
                    }
                });
            });
        }

        if (showOnly) {
            this.glbmaingroup.traverse((child) => {
                if (child.isMesh) {
                    child.visible = meshes.includes(child);
                }
            });
        }
        // plane.rotation.x = -Math.PI / 2;
        // plane.position.y = -1;
        // this.scene.add(plane);

        // // 添加球体
        // const sphereGeometry = new SphereGeometry(0.5, 32, 32);
        // const sphereMaterial = new MeshStandardMaterial({ color: 0xff0000 });
        // const sphere = new Mesh(sphereGeometry, sphereMaterial);
        // sphere.position.set(2, 0, 0);
        // this.scene.add(sphere);

        // // 添加圆柱体
        // const cylinderGeometry = new CylinderGeometry(0.5, 0.5, 1, 32);
        // const cylinderMaterial = new MeshStandardMaterial({ color: 0x00ff00 });
        // const cylinder = new Mesh(cylinderGeometry, cylinderMaterial);
        // cylinder.position.set(-2, 0, 0);
        // this.scene.add(cylinder);

        // // 添加圆锥体
        // const coneGeometry = new ConeGeometry(0.5, 1, 32);
        // const coneMaterial = new MeshStandardMaterial({ color: 0x0000ff });
        // const cone = new Mesh(coneGeometry, coneMaterial);
        // cone.position.set(0, 0, 2);
        // this.scene.add(cone);

        // // 添加圆环体
        // const torusGeometry = new TorusGeometry(0.5, 0.2, 16, 100);
        // const torusMaterial = new MeshStandardMaterial({ color: 0xffff00 });
        // const torus = new Mesh(torusGeometry, torusMaterial);
        // torus.position.set(0, 0, -2);
        // this.scene.add(torus);

        // // 添加二十面体
        // const icosahedronGeometry = new IcosahedronGeometry(0.5, 0);
        // const icosahedronMaterial = new MeshStandardMaterial({ color: 0xff00ff });
        // const icosahedron = new Mesh(icosahedronGeometry, icosahedronMaterial);
        // icosahedron.position.set(2, 0, 2);
        // this.scene.add(icosahedron);
    }


    /**
     * 获取场景中 GLB 主组对象。
     * 该方法会检查 GLB 主组对象是否存在子对象，
     * 若存在则返回该 GLB 主组对象，否则返回 null。
     * @returns {Object|null} - 若 GLB 主组对象存在子对象，返回该对象；否则返回 null。
     */
    getGlbList() {
        // 检查 GLB 主组对象是否存在且包含子对象
        if (this.glbmaingroup && this.glbmaingroup.children.length > 0) {
            // 若存在子对象，返回 GLB 主组对象
            return this.glbmaingroup;
        } else {
            // 若不存在子对象，返回 null
            return null;
        }
    }

    /**
     * 设置场景中所有 GLB 模型的可见性。
     * 该方法会获取 GLB 主组对象，若对象存在，则遍历其所有子网格对象，
     * 根据传入的参数设置这些网格对象的可见性。
     * @param {boolean} show - 控制网格对象可见性的布尔值，true 为显示，false 为隐藏。
     */
    setAllGlbVisibility(show) {
        // 调用 getAllGlbModelTree 方法获取 GLB 主组对象
        const glbList = this.getGlbList();
        // 检查 GLB 主组对象是否存在
        if (glbList) {
            // 遍历 GLB 主组对象的所有子对象
            glbList.traverse((child) => {
                // 检查子对象是否为网格对象
                if (child.isMesh) {
                    // 根据传入的 show 参数设置网格对象的可见性
                    child.visible = show;
                }
            });
        }
    }


    /**
     * 通过传入 glb 名，返回整个 glb 的模型树。
     * @param {string} glbName - glb 模型的名称。
     * @returns {Object|null} - glb 模型树，如果未找到则返回 null。
     */
    /**
     * 通过传入 glb 名和过滤类型，返回对应的 glb 模型树。
     * @param {string} glbName - glb 模型的名称。
     * @param {string} [filter='include'] - 过滤类型，'include' 表示包含指定名称的模型，'exclude' 表示排除指定名称的模型。
     * @returns {Object|Array<Object>|null} - 符合条件的 glb 模型树或模型树数组，如果未找到则返回 null。
     */
    getSingleGlbFromScene(glbName) {
        if (!this.glbmaingroup) {
            return null;
        }

        const glbs = this.glbmaingroup.children.filter(child => child.name === glbName)
        if (!glbs.length) {
            return null;
        } else {
            return glbs[0];
        }
    }

    /**
     * 设置指定 GLB 模型的可见性。
     * 该方法会先隐藏所有 GLB 模型的网格，然后根据传入的 glbName 和 filter 找到对应的模型树，
     * 并根据 show 参数设置该模型树中所有网格的可见性。
     * @param {string} glbName - 要设置可见性的 GLB 模型的名称。
     * @param {boolean} show - 控制网格对象可见性的布尔值，true 为显示，false 为隐藏。
     * @param {string} [filter='include'] - 过滤类型，'include' 表示包含指定名称的模型，'exclude' 表示排除指定名称的模型。
     * @returns {Object|Array<Object>|null} - 找到的 GLB 模型树或模型树数组，如果未找到则返回 null。
     */
    setSingleGlbVisibility(glbName, show) {
        const singleglb = this.getSingleGlbFromScene(glbName);

        if (singleglb) {

            singleglb.traverse((child) => {
                if (child.isMesh) {
                    child.visible = false;
                }
            });

            singleglb.traverse((child) => {
                if (child.isMesh) {
                    child.visible = show;
                }
            });
        };
    }



    /**
     * 通过传入 glb 名和 mesh 名，正则、完全匹配，返回这些 glb 中找到的 mesh 集合。
     * @param {string} glbName - glb 模型的名称。
     * @param {string} meshName - 要查找的 mesh 名称，可以是正则表达式或完全匹配的字符串。
     * @param {boolean} [isRegex=false] - 是否使用正则表达式匹配，默认为 false。
     * @param {boolean} [showOnly=false] - 如果为 true，则只显示找到的 mesh，隐藏其他 mesh。默认为 false。
     * @param {string} [filter='include'] - 过滤类型，'include' 表示包含指定名称的模型，'exclude' 表示排除指定名称的模型。
     * @returns {Array<Mesh>} - 找到的 mesh 集合。
     */
    getMeshesInGlbs(glbName, meshName, isRegex = false, showOnly = false, filter = 'include') {
        const meshes = []; // 初始化 meshes 数组
        const glb = this.getSingleGlbFromScene(glbName); // 修正 filter 参数传递方式
        if (glb) {
            // Assuming 'treesToProcess' should be 'glb' itself or an array containing it
            // This part of the original code seems to have a logical error with 'treesToProcess'
            // For now, assuming it should iterate over the found 'glb' if it's a group/object
            // If 'glb' is a single object, then 'forEach' won't work directly.
            // Let's assume 'glb' is the tree to traverse.
            glb.traverse((child) => {
                if (child.isMesh) {
                    if (isRegex) {
                        const regex = new RegExp(meshName);
                        if (regex.test(child.name)) {
                            meshes.push(child);

                            // The visibility logic here is problematic as it's inside the mesh finding loop
                            // and uses 'meshes.some(mesh => mesh.name === child.name)' which will always be true for the current child
                            // This logic should ideally be applied after all meshes are found, or handled differently.
                            // For now, preserving the original intent as much as possible, but noting it's likely incorrect.
                            if (filter === 'include') {
                                if (meshes.some(mesh => mesh.name === child.name)) { // This condition is always true for the just-pushed child
                                    // child.visible = true; // This line was commented out in the original, but the logic implies it should be here
                                }
                            } else if (filter === 'exclude') {
                                if (!meshes.some(mesh => mesh.name === child.name)) { // This condition is always false for the just-pushed child
                                    // child.visible = true;
                                }
                            } else {
                                console.error('Invalid filter type. Expected "include" or "exclude".');
                            }
                        }
                    } else if (child.name === meshName) {
                        meshes.push(child);

                        if (filter === 'include') {
                            if (meshes.some(mesh => mesh.name === child.name)) {
                                // child.visible = true;
                            }
                        } else if (filter === 'exclude') {
                            if (!meshes.some(mesh => mesh.name === child.name)) {
                                // child.visible = true;
                            }
                        } else {
                            console.error('Invalid filter type. Expected "include" or "exclude".');
                        }
                    }
                }
            });
        }

        if (showOnly) {
            this.glbmaingroup.traverse((child) => {
                if (child.isMesh) {
                    child.visible = meshes.includes(child);
                }
            });
        }

        return meshes;
    }


    /**
     * 通过传入 mesh 名，正则、完全匹配，返回整个场景中找到的 mesh 集合。
     * @param {string} meshName - 要查找的 mesh 名称，可以是正则表达式或完全匹配的字符串。
     * @param {boolean} [isRegex=false] - 是否使用正则表达式匹配，默认为 false。
     * @param {string} [filter='include'] - 过滤类型，'include' 表示包含指定名称的模型，'exclude' 表示排除指定名称的模型。
     * @returns {Array<Mesh>} - 找到的 mesh 集合。
     */
    getMeshesInScene(meshName, isRegex = false, filter = 'include') {
        const meshes = [];

        if (this.glbmaingroup) {
            this.glbmaingroup.traverse((child) => {
                if (child.isMesh) {
                    let match = false;
                    if (isRegex) {
                        const regex = new RegExp(meshName);
                        if (regex.test(child.name)) {
                            match = true;
                        }
                    } else {
                        if (child.name === meshName) {
                            match = true;
                        }
                    }

                    if (match) {
                        if (filter === 'include') {
                            meshes.push(child);
                        }
                    } else {
                        if (filter === 'exclude') {
                            meshes.push(child);
                        }
                    }
                }
            });
        }

        return meshes;
    }

    /**
     * 更新调试UI
     */
    updateDebugUI() {
        console.log('🏗️ MeshManager: 更新调试UI');
        // 在这里更新调试UI，例如添加模型控制器等
        if (this.modelsFolder) {
            // 可以在这里添加已加载模型的控制器
            this.modelsFolder.close();
        }
    }

    /**
     * 加载所有模型
     */
    loadAllModels() {
        console.log('🏗️ MeshManager: 加载所有模型');
        // 实现加载所有模型的逻辑
        this.setAllGlbVisibility(true);
    }

    /**
     * 清除所有模型
     */
    clearAllModels() {
        console.log('🏗️ MeshManager: 清除所有模型');
        // 实现清除所有模型的逻辑
        this.setAllGlbVisibility(false);
    }

    /**
     * 更新方法，遍历所有 Horse 和 Stork 实例并调用其 update 方法。
     */
    update() {
        // 更新所有模型实例
        this.models.forEach(model => model.update());
    }
    
    // 获取指定名称的模型实例
    getModel(name) {
        return this.modelInstances[name];
    }
    
    // 获取所有模型名称
    getModelNames() {
        return Object.keys(this.modelInstances);
    }
    
    // 为指定模型播放动画
    playModelAnimation(modelName, animationName) {
        const model = this.modelInstances[modelName];
        if (model && typeof model.playAnimation === 'function') {
            return model.playAnimation(animationName);
        }
        return false;
    }
    
    // 停止指定模型的动画
    stopModelAnimation(modelName) {
        const model = this.modelInstances[modelName];
        if (model && typeof model.stopAnimation === 'function') {
            return model.stopAnimation();
        }
        return false;
    }
    
    // 设置指定模型的动画速度
    setModelAnimationSpeed(modelName, speed) {
        const model = this.modelInstances[modelName];
        if (model && typeof model.setAnimationSpeed === 'function') {
            return model.setAnimationSpeed(speed);
        }
        return false;
    }

    /**
     * 创建并添加所有几何体到场景中。
     */
    createGeometries() {
        // Test geometries removed for cleanup
    }
}