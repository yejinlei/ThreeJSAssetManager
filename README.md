# ThreeJSAssetManager

ThreeJSAssetManager 是一个基于 Three.js 的模块化资源和场景管理器。它旨在简化 Three.js 项目的初始化、资源加载、场景配置和调试过程。通过采用单例模式和模块化设计，它提供了一个结构清晰、易于扩展的开发框架。

## 主要特性

- **单例管理**: `ThreeJSAssetsManager` 作为核心入口，统一管理所有子模块，确保全局状态的一致性。
- **模块化架构**:
    - **SceneManager**: 负责场景背景、雾效、环境光等基础环境配置。
    - **LightManager**: 支持多种光源（环境光、平行光、点光源、聚光灯、半球光、面光源）的创建和调试。
    - **CameraManager**: 管理相机（透视/正交）及轨道控制器（OrbitControls）。
    - **RenderManager**: 封装 WebGLRenderer，支持色调映射、阴影贴图和自适应窗口调整。
    - **MeshManager**: 负责几何体创建、GLB 模型加载及可见性管理。
    - **DebugUI**: 集成 `lil-gui`，支持通过 URL 参数或配置开启调试面板。
- **配置驱动**: 通过 `config.js` 集中管理各项参数，无需修改核心代码即可调整场景效果。
- **资源管理**: 内置资源加载器，支持 GLB/GLTF 模型、纹理等资源的预加载。

## 目录结构

```
ThreeJSAssetManager/
├── ThreeJSAssetsManager/       # 核心源码目录
│   ├── ThreeJSAssetsManager.js # 入口文件 (单例)
│   ├── SceneManager.js         # 场景管理
│   ├── LightManager.js         # 灯光管理
│   ├── CameraManager.js        # 相机管理
│   ├── RenderManager.js        # 渲染管理
│   ├── MeshManager.js          # 网格/模型管理
│   ├── DebugUI.js              # 调试界面
│   ├── Utils/                  # 工具类 (Sizes, Time, Resources, etc.)
│   └── World/                  # 场景具体内容 (sources.js, etc.)
├── app.js                      # 项目主入口
├── config.js                   # 配置文件
├── index.html                  # HTML 模板
└── ...
```

## 快速开始

### 1. 安装依赖

本项目依赖 `three` 和 `lil-gui`。通常通过 CDN 或 npm 安装。如果使用 npm：

```bash
npm install three lil-gui
```

### 2. 引入和初始化

在你的入口文件（如 `app.js`）中引入并初始化 `ThreeJSAssetsManager`：

```javascript
import ThreeJSAssetsManager from './ThreeJSAssetsManager/ThreeJSAssetsManager.js';

// 获取 canvas 元素
const canvas = document.querySelector('canvas.webgl');

// 初始化管理器
const assetsManager = new ThreeJSAssetsManager(canvas);
```

### 3. 配置文件 (config.js)

你可以通过修改 `config.js` 来调整场景设置，例如开启调试模式或修改灯光参数：

```javascript
export default {
    DebugUI: {
        enabled: true // 开启调试面板
    },
    SceneManager: {
        enabled: true,
        Color: { enabled: true, value: '#000000' },
        fog: { enabled: true, color: '#000000', near: 10, far: 100 }
    },
    LightManager: {
        ambientLight: { enabled: true, color: '#ffffff', intensity: 0.5 },
        directionalLight: { enabled: true, color: '#ffffff', intensity: 1, position: { x: 5, y: 10, z: 7.5 } }
        // ... 其他灯光配置
    },
    // ...
}
```

## 调试模式

可以通过以下两种方式开启调试模式：
1. 在 `config.js` 中设置 `DebugUI.enabled = true`。
2. 在 URL 后添加 `#debug` 哈希，例如 `http://localhost:3000/#debug`。

开启后，右上角将显示 GUI 面板，可实时调整场景、灯光、渲染等参数。

## 待办事项 (TODO)

以下是计划在未来版本中集成的 Three.js 特性：

- [ ] **后期处理 (Post-processing)**: 集成 `EffectComposer`，支持 Bloom、Depth of Field (DOF)、SSAO 等后期特效。
- [ ] **物理引擎 (Physics)**: 集成 Cannon.js、Ammo.js 或 Rapier 实现物理碰撞和模拟。
- [ ] **交互系统 (Interaction)**: 封装 `Raycaster`，实现鼠标拾取 (Picking)、点击事件和拖拽 (Drag & Drop) 功能。
- [ ] **粒子系统 (Particles)**: 封装 `Points` 和 `PointsMaterial`，支持自定义粒子效果和发射器。
- [ ] **音频系统 (Audio)**: 封装 `AudioListener` 和 `PositionalAudio`，支持 3D 空间音效。
- [ ] **WebXR 支持**: 增加 VR (虚拟现实) 和 AR (增强现实) 设备的支持。
- [ ] **性能优化**:
    - 支持 `InstancedMesh` 以优化大量重复物体的渲染性能。
    - 集成 `LOD` (Level of Detail) 系统，根据距离自动切换模型精度。
- [ ] **自定义着色器 (Shaders)**: 提供更便捷的 `ShaderMaterial` 和 `RawShaderMaterial` 管理与热更新支持。
- [ ] **动画系统增强**: 支持更复杂的动画混合 (Animation Blending)、状态机和骨骼动画控制。
- [ ] **辅助工具 (Helpers)**: 增加 GridHelper, AxesHelper, CameraHelper 等更多调试辅助工具的统一管理。

## 许可证

MIT License
