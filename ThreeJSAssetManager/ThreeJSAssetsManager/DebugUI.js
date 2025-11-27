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
                width: 350
            });

            // 创建模块化文件夹结构
            this.createModuleFolders();
            
            // 打印调试界面创建成功的日志，提示用户调试界面已正常加载
            console.log('✅ DebugUI 已加载 - 模块化结构已创建');
        }
    }
    
    /**
     * 创建模块化文件夹结构，目前不创建任何分类文件夹
     */
    createModuleFolders() {
        // 移除所有分类文件夹，保持界面简洁
        // 可以根据需要动态添加控制项
    }
}