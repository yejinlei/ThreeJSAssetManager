/**
 * Pic2GLBManager - 图片转GLB管理器 (浏览器端)
 * 基于Gitee AI API实现图片到3D模型的转换
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export default class Pic2GLBManager {
    constructor(sceneManager, config = null) {
        this.sceneManager = sceneManager;
        this.apiUrl = 'https://ai.gitee.com/v1/async/image-to-3d';
        this.currentTaskId = null;
        this.currentGLBUrl = null;
        this.currentModel = null;
        this.isProcessing = false;
        this.statusCallback = null;
        
        // 动态获取token，支持运行时更新
        Object.defineProperty(this, 'apiToken', {
            get: function() {
                return window.GITEE_AI_TOKEN || '';
            },
            set: function(value) {
                window.GITEE_AI_TOKEN = value;
            }
        });
        
        // GLTFLoader
        this.gltfLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://gcore.jsdelivr.net/npm/three@0.179.1/examples/jsm/libs/draco/');
        this.gltfLoader.setDRACOLoader(dracoLoader);
        
        // 生成参数
        this.params = {
            model: 'Hunyuan3D-2',
            texture: true,
            seed: 1234,
            num_inference_steps: 5,
            octree_resolution: 128,
            guidance_scale: 5
        };
        
        console.log('✅ Pic2GLBManager 已初始化', this.apiToken ? '(Token已配置)' : '(Token未配置)');
    }

    updateStatus(msg) {
        console.log(msg);
        if (this.statusCallback) this.statusCallback(msg);
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
                    return result.output.file_url;
                }
                throw new Error('未找到输出文件');
            } else if (status === 'failed' || status === 'cancelled') {
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
                
                // 移除旧模型
                if (this.currentModel) {
                    this.sceneManager.scene.remove(this.currentModel);
                }
                
                this.currentModel = model;
                this.sceneManager.scene.add(model);
                
                // 调整相机
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                model.position.sub(center);
                
                if (this.sceneManager.camera) {
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const dist = maxDim * 2;
                    this.sceneManager.camera.position.set(dist, dist, dist);
                    this.sceneManager.camera.lookAt(0, 0, 0);
                    
                    if (this.sceneManager.controls) {
                        this.sceneManager.controls.target.set(0, 0, 0);
                        this.sceneManager.controls.update();
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
}
