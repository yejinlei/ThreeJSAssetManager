/**
 * AIManager - 人工智能管理器
 * 集成图片转3D等AI功能
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export default class AIManager {
    constructor(options = {}) {
        // 从 options 中获取必要参数
        this.debug = options.debug || false;
        this.gui = options.gui || null;
        
        // 基础配置
        this.enabled = true;
        this.apiUrl = 'https://ai.gitee.com/v1/async/image-to-3d';
        this.currentTaskId = null;
        this.currentGLBUrl = null;
        this.currentModel = null;
        this.isProcessing = false;
        this.statusCallback = null;
        
        // 获取配置
        this.config = window.ThreeJSAssetsManagerInstance?.config?.AIManager || {};
        
        // Token 设置
        this._apiToken = this.config.apiToken || window.GITEE_AI_TOKEN || '';
        this._tokenUpdateCallbacks = [];
        
        Object.defineProperty(this, 'apiToken', {
            get: function() {
                return this._apiToken;
            },
            set: function(value) {
                this._apiToken = value;
                // 通知所有回调token已更新
                this._tokenUpdateCallbacks.forEach(callback => callback(value));
            }
        });
        
        // GLTFLoader
        this.gltfLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://gcore.jsdelivr.net/npm/three@0.179.1/examples/jsm/libs/draco/');
        this.gltfLoader.setDRACOLoader(dracoLoader);
        
        // 获取默认模型（配置中的第一个模型或默认值）
        const availableModels = this.config.models || {};
        const defaultModel = Object.keys(availableModels).length > 0 ? 
            Object.keys(availableModels)[0] : 'Hunyuan3D-2';
        
        // 生成参数
        this.params = {
            model: defaultModel,
            texture: true,
            seed: 1234,
            num_inference_steps: 5,
            octree_resolution: 128,
            guidance_scale: 5
        };
        
        // 状态信息
        this.status = '等待上传图片...';
        this.fileInput = null;
        this.selectedFile = null;
        
        // 初始化DebugUI
        if (this.debug && this.gui && this.config.enabled) {
            this.createDebugUI();
        }
        
        console.log('✅ AIManager 已初始化', this.apiToken ? '(Token已配置)' : '(Token未配置)');
    }

    /**
     * 创建DebugUI界面
     */
    createDebugUI() {
        // 创建AI顶层文件夹
        const aiFolder = this.gui.aiFolder || this.gui.addFolder('🤖 AI (人工智能)');
        this.gui.aiFolder = aiFolder;
        
        // 创建Pic2GLB子文件夹
        const folder = aiFolder.addFolder('🖼️ Pic2GLB (图片转GLB)');
        
        // API Token设置
        const tokenObject = {
            _displayToken: this.maskToken(this.apiToken),
            setToken: () => {
                const newToken = prompt('请输入Gitee AI API Token:', this.apiToken);
                if (newToken !== null) {
                    this.apiToken = newToken;
                    window.GITEE_AI_TOKEN = newToken;
                    this.updateStatus('✅ API Token已更新');
                }
            }
        };
        
        // 添加token更新回调
        this._tokenUpdateCallbacks.push((newToken) => {
            tokenObject._displayToken = this.maskToken(newToken);
        });
        
        folder.add(tokenObject, '_displayToken').name('API Token').listen();
        folder.add(tokenObject, 'setToken').name('🔑 设置Token');
        
        // 文件上传区域
        const fileObject = {
            uploadImage: () => this.selectImageFile(),
            selectedFileName: this.selectedFile ? this.selectedFile.name : '未选择文件'
        };
        
        folder.add(fileObject, 'uploadImage').name('📤 选择图片文件');
        folder.add(fileObject, 'selectedFileName').name('当前文件').listen();
        
        // 生成参数控制
        const paramsFolder = folder.addFolder('⚙️ 生成参数');
        
        // 模型选择 - 使用配置中的模型选项
        const modelOptions = this.config.models || {
            'Hunyuan3D-2': 'Hunyuan3D-2'
        };
        paramsFolder.add(this.params, 'model', modelOptions).name('模型类型');
        
        // 贴图开关
        paramsFolder.add(this.params, 'texture').name('生成贴图');
        
        // 随机种子
        const seedObject = {
            seed: this.params.seed,
            randomSeed: () => {
                this.params.seed = Math.floor(Math.random() * 10000);
                this.updateStatus(`🎲 随机种子: ${this.params.seed}`);
            }
        };
        paramsFolder.add(seedObject, 'seed').min(0).max(9999).step(1).name('随机种子').onChange((value) => {
            this.params.seed = value;
        });
        paramsFolder.add(seedObject, 'randomSeed').name('🎲 随机种子');
        
        // 推理步数
        paramsFolder.add(this.params, 'num_inference_steps').min(1).max(20).step(1).name('推理步数');
        
        // 八叉树分辨率
        paramsFolder.add(this.params, 'octree_resolution').min(64).max(256).step(32).name('八叉树分辨率');
        
        // 引导比例
        paramsFolder.add(this.params, 'guidance_scale').min(1).max(10).step(0.5).name('引导比例');
        
        // 操作按钮
        const actionsFolder = folder.addFolder('🎯 操作');
        
        const actionsObject = {
            generateGLB: () => this.generateFromSelectedFile(),
            downloadGLB: () => this.downloadGLB(),
            clearModel: () => this.clearCurrentModel(),
            isProcessing: this.isProcessing
        };
        
        actionsFolder.add(actionsObject, 'generateGLB').name('🚀 生成GLB');
        actionsFolder.add(actionsObject, 'downloadGLB').name('📥 下载GLB');
        actionsFolder.add(actionsObject, 'clearModel').name('🗑️ 清除模型');
        actionsFolder.add(actionsObject, 'isProcessing').name('处理中').listen();
        
        // 状态显示
        const statusFolder = folder.addFolder('📊 状态');
        const statusObject = {
            status: this.status,
            currentTaskId: this.currentTaskId || '无',
            hasGLB: this.currentGLBUrl ? '是' : '否'
        };
        
        statusFolder.add(statusObject, 'status').name('状态').listen();
        statusFolder.add(statusObject, 'currentTaskId').name('任务ID').listen();
        statusFolder.add(statusObject, 'hasGLB').name('已生成GLB').listen();
        
        // 打开文件夹
        folder.open();
        paramsFolder.open();
        
        // 创建隐藏的文件输入元素
        this.createFileInput();
        
        // 保存状态对象引用
        this.debugStatus = statusObject;
        this.debugFile = fileObject;
        this.debugActions = actionsObject;
    }
    
    /**
     * 创建隐藏的文件输入元素
     */
    createFileInput() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*';
        this.fileInput.style.display = 'none';
        
        this.fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.selectedFile = file;
                this.debugFile.selectedFileName = file.name;
                this.updateStatus(`✅ 已选择文件: ${file.name}`);
            }
        });
        
        document.body.appendChild(this.fileInput);
    }
    
    /**
     * 选择图片文件
     */
    selectImageFile() {
        if (this.isProcessing) {
            this.updateStatus('⚠️ 正在处理中，请等待...');
            return;
        }
        this.fileInput.click();
    }
    
    /**
     * 从选择的文件生成GLB
     */
    async generateFromSelectedFile() {
        if (!this.selectedFile) {
            this.updateStatus('❌ 请先选择图片文件');
            return;
        }
        return await this.uploadAndGenerate(this.selectedFile);
    }
    
    /**
     * 清除当前模型
     */
    clearCurrentModel() {
        const instance = window.ThreeJSAssetsManagerInstance;
        if (this.currentModel && instance?.scene) {
            instance.scene.remove(this.currentModel);
            this.currentModel = null;
            this.currentGLBUrl = null;
            this.currentTaskId = null;
            this.updateStatus('🗑️ 模型已清除');
            
            // 更新DebugUI状态
            if (this.debugStatus) {
                this.debugStatus.hasGLB = '否';
                this.debugStatus.currentTaskId = '无';
            }
        }
    }

    updateStatus(msg) {
        console.log(msg);
        this.status = msg;
        if (this.statusCallback) this.statusCallback(msg);
        
        // 更新DebugUI状态显示
        if (this.debugStatus) {
            this.debugStatus.status = msg;
        }
        
        // 更新处理状态
        if (this.debugActions) {
            this.debugActions.isProcessing = this.isProcessing;
        }
    }

    async uploadAndGenerate(file) {
        if (!this.apiToken) {
            this.updateStatus('❌ 请先设置API Token');
            return null;
        }
        if (this.isProcessing) {
            this.updateStatus('⚠️ 正在处理中...');
            return null;
        }
        
        this.isProcessing = true;
        this.updateStatus('📤 上传图片中...');
        
        try {
            const formData = new FormData();
            formData.append('image', file, file.name);
            formData.append('type', 'glb');
            formData.append('model', this.params.model);
            formData.append('texture', this.params.texture);
            formData.append('seed', this.params.seed);
            formData.append('num_inference_steps', this.params.num_inference_steps);
            formData.append('octree_resolution', this.params.octree_resolution);
            formData.append('guidance_scale', this.params.guidance_scale);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.apiToken}` },
                body: formData
            });
            
            const result = await response.json();
            if (!result.task_id) {
                throw new Error(result.message || '创建任务失败');
            }
            
            this.currentTaskId = result.task_id;
            this.updateStatus(`🚀 任务已创建: ${this.currentTaskId}`);
            
            // 更新DebugUI任务ID
            if (this.debugStatus) {
                this.debugStatus.currentTaskId = this.currentTaskId;
            }
            
            // 轮询任务状态
            const glbUrl = await this.pollTask(this.currentTaskId);
            if (glbUrl) {
                this.currentGLBUrl = glbUrl;
                await this.loadGLB(glbUrl);
            }
            return glbUrl;
        } catch (error) {
            this.updateStatus(`❌ 错误: ${error.message}`);
            return null;
        } finally {
            this.isProcessing = false;
        }
    }

    async pollTask(taskId) {
        const statusUrl = `https://ai.gitee.com/v1/task/${taskId}`;
        const maxAttempts = 180; // 30分钟
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            this.updateStatus(`⏳ 检查状态 [${attempt}]...`);
            
            const response = await fetch(statusUrl, {
                headers: { 'Authorization': `Bearer ${this.apiToken}` }
            });
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.message || '任务查询失败');
            }
            
            const status = result.status || 'unknown';
            
            if (status === 'success') {
                if (result.output?.file_url) {
                    this.updateStatus('✅ 生成完成!');
                    
                    // 更新DebugUI状态
                    if (this.debugStatus) {
                        this.debugStatus.hasGLB = '是';
                    }
                    
                    return result.output.file_url;
                }
                throw new Error('未找到输出文件');
            } else if (status === 'failed' || status === 'cancelled') {
                // 更新DebugUI状态
                if (this.debugStatus) {
                    this.debugStatus.hasGLB = '否';
                }
                throw new Error(`任务${status}`);
            }
            
            // 等待10秒后重试
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        throw new Error('任务超时');
    }

    async loadGLB(url) {
        this.updateStatus('📦 加载GLB模型...');
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(url, (gltf) => {
                const model = gltf.scene;
                model.name = 'AI_Generated_Model';
                
                const instance = window.ThreeJSAssetsManagerInstance;
                
                // 移除旧模型
                if (this.currentModel && instance?.scene) {
                    instance.scene.remove(this.currentModel);
                }
                
                this.currentModel = model;
                if (instance?.scene) {
                    instance.scene.add(model);
                }
                
                // 调整相机
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                model.position.sub(center);
                
                if (instance?.camera) {
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const dist = maxDim * 2;
                    instance.camera.position.set(dist, dist, dist);
                    instance.camera.lookAt(0, 0, 0);
                    
                    if (instance.cameraManagerInstance?.controls) {
                        instance.cameraManagerInstance.controls.target.set(0, 0, 0);
                        instance.cameraManagerInstance.controls.update();
                    }
                }
                
                this.updateStatus('✅ 模型已加载到场景');
                resolve(model);
            }, undefined, (error) => {
                this.updateStatus(`❌ 加载失败: ${error.message}`);
                reject(error);
            });
        });
    }

    downloadGLB() {
        if (!this.currentGLBUrl) {
            this.updateStatus('❌ 没有可下载的GLB');
            return;
        }
        
        const a = document.createElement('a');
        a.href = this.currentGLBUrl;
        a.download = 'ai_generated_model.glb';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.updateStatus('📥 开始下载GLB...');
    }
    
    /**
     * 遮蔽Token显示
     */
    maskToken(token) {
        if (!token || token.length === 0) {
            return '';
        }
        if (token.length <= 8) {
            return '*'.repeat(token.length);
        }
        // 保留前4位和后4位，中间用*号代替
        const start = token.substring(0, 4);
        const end = token.substring(token.length - 4);
        const middle = '*'.repeat(token.length - 8);
        return start + middle + end;
    }

    /**
     * 更新管理器状态
     */
    update() {
        // AIManager 通常不需要每帧更新
        // 但如果需要状态检查或自动处理，可以在这里添加
    }

    /**
     * 销毁管理器，清理资源
     */
    destroy() {
        // 清除文件输入元素
        if (this.fileInput && this.fileInput.parentNode) {
            this.fileInput.parentNode.removeChild(this.fileInput);
        }
        
        // 清除当前模型
        this.clearCurrentModel();
        
        console.log('🗑️ AIManager 已销毁');
    }
}