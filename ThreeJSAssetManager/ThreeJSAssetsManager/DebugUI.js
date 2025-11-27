import * as dat from 'lil-gui';
import config from "./config.js";

export default class DebugUI 
{
    /**
     * 构造函数，用于初始化 DebugUI 实例。
     * 该函数会根据当前 URL 的哈希值判断是否启用调试模式，
     * 若启用则创建一个 lil-gui 调试界面。
     */
    constructor()
    {
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
                title: '🎮 ThreeJS Assets Manager',
                width: 350
            });

            // 创建模块化文件夹结构
            this.createModuleFolders();
            
            // 打印调试界面创建成功的日志，提示用户调试界面已正常加载
            console.log('✅ DebugUI 已加载 - 模块化结构已创建');
        }
    }
    
    /**
     * 创建模块化文件夹结构，按照ThreeJS功能分类组织调试选项
     */
    createModuleFolders() {
        // 1. 核心系统 - 基础框架功能
        this.coreFolder = this.gui.addFolder('🔧 Core Systems (核心系统)');
        
        // 2. 相机与渲染 - 相机控制和渲染设置
        this.cameraFolder = this.gui.addFolder('📷 Camera & Rendering (相机与渲染)');
        
        // 3. 场景与对象 - 场景管理和对象控制
        this.sceneFolder = this.gui.addFolder('🏞️ Scene & Objects (场景与对象)');
        // 为MeshManager创建子文件夹
        this.objectsFolder = this.sceneFolder.addFolder('📦 Objects (对象管理)');
        
        // 4. 灯光系统 - 所有灯光相关控制
        this.lightingFolder = this.gui.addFolder('💡 Lighting System (灯光系统)');
        
        // 5. 动画系统 - 所有动画相关控制
        this.animationFolder = this.gui.addFolder('🎬 Animation System (动画系统)');
        
        // 6. 交互系统 - 交互和物理相关
        this.interactionFolder = this.gui.addFolder('🖱️ Interaction (交互系统)');
        this.physicsFolder = this.interactionFolder.addFolder('⚡ Physics (物理系统)');
        
        // 7. 特效系统 - 后期处理和粒子效果
        this.effectsFolder = this.gui.addFolder('✨ Effects (特效系统)');
        this.postProcessingFolder = this.effectsFolder.addFolder('🌈 Post Processing (后期处理)');
        this.particleFolder = this.effectsFolder.addFolder('🎆 Particles (粒子系统)');
        this.shaderFolder = this.effectsFolder.addFolder('🔮 Shaders (着色器)');
        
        // 8. 音频系统
        this.audioFolder = this.gui.addFolder('🔊 Audio System (音频系统)');
        
        // 9. WebXR系统
        this.xrFolder = this.gui.addFolder('🥽 WebXR (XR系统)');
        
        // 10. 辅助工具 - 性能监控和调试工具
        this.utilitiesFolder = this.gui.addFolder('🛠️ Utilities (辅助工具)');
        this.helperFolder = this.utilitiesFolder.addFolder('🧰 Helpers (辅助对象)');
        this.performanceFolder = this.utilitiesFolder.addFolder('⚡ Performance (性能监控)');
        
        // 默认关闭所有文件夹，用户可以根据需要展开
        this.coreFolder.close();
        this.cameraFolder.close();
        this.sceneFolder.close();
        this.lightingFolder.close();
        this.animationFolder.close();
        this.interactionFolder.close();
        this.effectsFolder.close();
        this.audioFolder.close();
        this.xrFolder.close();
        this.utilitiesFolder.close();
    }
}