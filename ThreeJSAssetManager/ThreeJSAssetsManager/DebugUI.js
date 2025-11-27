import * as dat from 'lil-gui';
import config from "./config.js";
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class DebugUI 
{
    /**
     * 构造函数，用于初始化 DebugUI 实例。
     * 该函数会根据当前 URL 的哈希值判断是否启用调试模式，
     * 若启用则创建一个 lil-gui 调试界面。
     */
    constructor(sceneManager, meshManager)
    {
        // 保存管理器引用
        this.sceneManager = sceneManager;
        this.meshManager = meshManager;
        
        // 打印构造函数启动日志，包含当前 URL 的哈希值，方便调试时确认启动状态
        console.log(`DebugUI 构造函数：${window.location.hash}`);
        // 通过比较 URL 的哈希值是否为 '#debug' 来决定是否开启调试模式，结果存储在实例属性中
        if (config['DebugUI'].enabled === true || window.location.hash === '#debug')
        {
            this.debug = true;
        } else
        {
            this.debug = false;
        }

        // 检查调试模式是否已开启
        this.gui = null;
        if ( this.debug === true )
        {
            // 当调试模式开启时，使用 lil-gui 库创建一个图形用户界面实例
            this.gui = new dat.GUI({
                width: 350
            });

            // 创建模块化文件夹结构
            this.createModuleFolders();
            
            // 初始化拖放功能
            if (config['DebugUI'].DragDropGLB.enabled) {
                this.initDragDropGLB();
            }
            
            // 打印调试界面创建成功的日志，提示用户调试界面已正常加载
            console.log('✅ DebugUI 已加载 - 模块化结构已创建');
        }
    }
    
    /**
     * 创建模块化文件夹结构，包含配置相关分类下的导出config.js和复位参数功能
     */
    createModuleFolders() {
        // 创建配置相关分类文件夹
        if (config['DebugUI'].Utilities.enabled) {
            const utilitiesFolder = this.gui.addFolder('⚙️ 配置相关');
            
            // 添加导出config.js功能
            if (config['DebugUI'].Utilities.exportConfig) {
                const utilityFunctions = {
                    exportConfig: () => this.exportConfig(),
                    resetConfig: () => this.resetConfig()
                };
                utilitiesFolder.add(utilityFunctions, 'exportConfig').name('导出 config.js');
                utilitiesFolder.add(utilityFunctions, 'resetConfig').name('复位参数');
            }
            
            utilitiesFolder.open();
        }
        
        // 预先创建特效系统顶级目录，避免多个管理器重复创建
        if (config['DebugUI'].Effects.enabled !== false) {
            this.effectsFolder = this.gui.addFolder('✨ Effects (特效系统)');
            // 将effectsFolder附加到gui对象上，供其他管理器直接使用
            this.gui.effectsFolder = this.effectsFolder;
            this.effectsFolder.open();
        }
    }
    
    /**
     * 复位参数，恢复到刚加载config.js的初始状态
     */
    resetConfig() {
        // 获取初始配置的深拷贝（从导入的config模块中）
        // 重新加载页面以恢复初始状态
        if (confirm('确定要复位参数吗？这将重新加载页面并恢复到初始配置状态。')) {
            console.log('🔄 正在复位参数...');
            location.reload();
        }
    }
    
    /**
     * 导出当前配置到config.js文件
     */
    exportConfig() {
        // 获取当前时间戳用于文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `config_${timestamp}.js`;
        
        // 创建配置对象的深拷贝，排除DebugUI配置
        const cleanConfig = JSON.parse(JSON.stringify(config));
        delete cleanConfig.DebugUI;
        
        // 自定义格式化函数
        function formatConfig(obj, indent = 4) {
            const spaces = ' '.repeat(indent);
            const nextIndent = indent + 4;
            const nextSpaces = ' '.repeat(nextIndent);
            
            let result = '{' + '\n';
            const keys = Object.keys(obj);
            
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = obj[key];
                let formattedValue = '';
                
                // 处理属性（不使用单引号）
                result += nextSpaces + `${key}: `;
                
                // 特殊处理CameraManager.cameraOptions.aspect
                if (key === 'aspect' && 
                    Object.prototype.hasOwnProperty.call(obj, 'fov') && 
                    Object.prototype.hasOwnProperty.call(obj, 'near') && 
                    Object.prototype.hasOwnProperty.call(obj, 'far')) {
                    formattedValue = 'window.innerWidth / window.innerHeight';
                }
                // 处理Color.value的颜色转换
                else if (key === 'value' && 
                         Object.prototype.hasOwnProperty.call(obj, 'enabled') && 
                         Array.isArray(obj.enabled.toString()) === false && 
                         typeof value === 'number' && Number.isInteger(value)) {
                    formattedValue = '0x' + value.toString(16).padStart(6, '0');
                }
                else if (value === null) {
                    formattedValue = 'null';
                } else if (value === undefined) {
                    formattedValue = 'undefined';
                } else if (typeof value === 'boolean' || typeof value === 'number') {
                    // 检查是否是颜色值（大于等于0x0且小于等于0xffffff的整数）
                    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffff) {
                        // 检查是否在color相关的属性中
                        const keyLower = key.toLowerCase();
                        if (keyLower.includes('color') || keyLower.includes('colour')) {
                            formattedValue = '0x' + value.toString(16).padStart(6, '0');
                        } else {
                            formattedValue = value.toString();
                        }
                    } else {
                        formattedValue = value.toString();
                    }
                } else if (typeof value === 'string') {
                    // 对于颜色字符串使用双引号，其他使用单引号
                    if (value.startsWith('#')) {
                        formattedValue = `"${value}"`;
                    } else {
                        formattedValue = `'${value}'`;
                    }
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        formattedValue = '[]';
                    } else if (value.every(item => typeof item === 'string')) {
                        // 字符串数组使用紧凑格式
                        formattedValue = `['${value.join("', '")}']`;
                    } else if (value.every(item => typeof item === 'number')) {
                        // 数字数组使用紧凑格式
                        formattedValue = `[${value.join(', ')}]`;
                    } else {
                        // 对象数组使用缩进格式
                        formattedValue = '[' + '\n';
                        for (let j = 0; j < value.length; j++) {
                            const arrValue = value[j];
                            if (typeof arrValue === 'object' && arrValue !== null) {
                                formattedValue += formatConfig(arrValue, nextIndent);
                            } else {
                                formattedValue += nextSpaces + arrValue.toString();
                            }
                            if (j < value.length - 1) {
                                formattedValue += ',';
                            }
                            formattedValue += '\n';
                        }
                        formattedValue += spaces + ']';
                    }
                } else if (typeof value === 'object') {
                    // 处理特殊情况：position, lookAt, gravity等应该使用紧凑格式
                    const isCompactObject = ['position', 'lookAt', 'gravity'].includes(key);
                    
                    if (isCompactObject && Object.keys(value).length <= 3) {
                        // 紧凑格式：{ x: 0, y: 0, z: 0 }
                        formattedValue = '{ ';
                        const objKeys = Object.keys(value);
                        for (let j = 0; j < objKeys.length; j++) {
                            const objKey = objKeys[j];
                            const objValue = value[objKey];
                            
                            let valStr = objValue.toString();
                            // 检查是否是颜色值
                            if (typeof objValue === 'number' && Number.isInteger(objValue) && 
                                objValue >= 0 && objValue <= 0xffffff && 
                                (objKey.toLowerCase().includes('color') || objKey.toLowerCase().includes('colour'))) {
                                valStr = '0x' + objValue.toString(16).padStart(6, '0');
                            }
                            
                            formattedValue += `${objKey}: ${valStr}`;
                            if (j < objKeys.length - 1) {
                                formattedValue += ', ';
                            }
                        }
                        formattedValue += ' }';
                    } else {
                        // 递归处理其他嵌套对象
                        formattedValue = formatConfig(value, nextIndent);
                    }
                }
                
                result += formattedValue;
                if (i < keys.length - 1) {
                    result += ',';
                }
                result += '\n';
            }
            
            result += spaces + '}';
            return result;
        }
        
        // 特殊处理cameraOptions中的aspect属性
        if (cleanConfig.CameraManager && cleanConfig.CameraManager.cameraOptions) {
            cleanConfig.CameraManager.cameraOptions.aspect = 'window.innerWidth / window.innerHeight';
        }
        
        // 生成格式化的配置内容
        let configContent = '// Three.js 应用配置文件 - 自动导出\n';
        configContent += 'export default ' + formatConfig(cleanConfig) + ';';
        
        // 创建Blob对象
        const blob = new Blob([configContent], { type: 'application/javascript' });
        
        // 创建下载链接并触发下载
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`✅ 配置已导出到文件: ${fileName}`);
    }
    
    /**
     * 初始化GLB文件拖放功能
     */
    initDragDropGLB() {
        const scene = this.sceneManager ? this.sceneManager.scene : null;
        const loader = new GLTFLoader();
        
        // 创建拖放提示
        const dropArea = document.createElement('div');
        dropArea.style.position = 'fixed';
        dropArea.style.top = '50%';
        dropArea.style.left = '50%';
        dropArea.style.transform = 'translate(-50%, -50%)';
        dropArea.style.zIndex = '1000';
        dropArea.style.background = 'rgba(0, 0, 0, 0.7)';
        dropArea.style.color = 'white';
        dropArea.style.padding = '20px';
        dropArea.style.borderRadius = '10px';
        dropArea.style.fontSize = '16px';
        dropArea.style.display = 'none'; // 默认隐藏
        dropArea.textContent = '拖放 GLB 文件到此处加载';
        document.body.appendChild(dropArea);
        
        // 为document添加拖放事件
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            document.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.style.display = 'block';
        }
        
        function unhighlight() {
            dropArea.style.display = 'none';
        }
        
        // 处理文件拖放
        document.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name.endsWith('.glb')) {
                    handleGLBFile(file);
                }
            }
        }
        
        function handleGLBFile(file) {
            console.log(`📁 开始加载 GLB 文件: ${file.name}`);
            
            const fileURL = URL.createObjectURL(file);
            
            loader.load(
                fileURL,
                (gltf) => {
                    // 处理加载的模型
                    const model = gltf.scene;
                    model.name = file.name.replace('.glb', '');
                    
                    // 将模型添加到场景
                    if (scene) {
                        scene.add(model);
                        console.log(`✅ 模型已成功加载并添加到场景: ${model.name}`);
                        
                        // 调整相机以查看模型
                        const box = new THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new THREE.Vector3());
                        const size = box.getSize(new THREE.Vector3());
                        
                        // 计算模型的对角线长度，用于设置相机位置
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const fov = 75;
                        const cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov * Math.PI / 360));
                        
                        // 如果有相机管理器，调整相机位置
                        if (window.camera && window.controls) {
                            window.camera.position.set(center.x + cameraDistance, center.y + cameraDistance / 2, center.z + cameraDistance);
                            window.camera.lookAt(center);
                            window.controls.target.copy(center);
                            window.controls.update();
                        }
                    }
                    
                    URL.revokeObjectURL(fileURL);
                },
                (xhr) => {
                    // 显示加载进度
                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                    console.log(`⏳ 加载进度: ${Math.round(percentComplete)}%`);
                },
                (error) => {
                    console.error('❌ 加载模型时出错:', error);
                    URL.revokeObjectURL(fileURL);
                }
            );
        }
        
        console.log('✅ GLB 文件拖放功能已初始化');
    }
}