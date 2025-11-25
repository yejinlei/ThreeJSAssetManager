# ThreeJSAssetManager 技术指南

本指南详细介绍了 `ThreeJSAssetManager` 的架构设计、核心类功能以及配置方法，旨在帮助开发者深入理解并扩展该框架。

## 1. 架构概览

`ThreeJSAssetManager` 采用单例模式（Singleton Pattern）作为整个应用的控制中心。它初始化并持有所有子管理器的实例，确保各个模块（场景、灯光、相机、渲染等）能够相互访问并保持状态同步。

### 核心架构图

```mermaid
graph TD
    App[App Entry] --> TAM[ThreeJSAssetsManager (Singleton)]
    TAM --> SM[SceneManager]
    TAM --> LM[LightManager]
    TAM --> CM[CameraManager]
    TAM --> RM[RenderManager]
    TAM --> MM[MeshManager]
    TAM --> DUI[DebugUI]
    TAM --> Utils[Utils (Sizes, Time, Resources)]
    
    SM -.-> TAM
    LM -.-> TAM
    CM -.-> TAM
    RM -.-> TAM
    MM -.-> TAM
    
    subgraph Core Loop
        TAM -- tick() --> CM
        TAM -- tick() --> MM
        TAM -- tick() --> RM
    end
```

## 2. 核心类详解

### 2.1 ThreeJSAssetsManager (入口类)
- **路径**: `ThreeJSAssetsManager/ThreeJSAssetsManager.js`
- **职责**: 
    - 应用程序的入口点。
    - 维护全局单例 `instance`。
    - 初始化所有子管理器 (`SceneManager`, `LightManager`, `CameraManager`, `RenderManager`, `MeshManager`)。
    - 初始化工具类 (`Sizes`, `Time`, `Resources`, `DebugUI`)。
    - 管理主循环 (`tick`) 和窗口调整 (`resize`) 事件。
- **关键属性**:
    - `canvas`: 渲染画布。
    - `scene`: Three.js 场景对象。
    - `camera`: 主相机对象。
    - `debug`: 调试模式标志。

### 2.2 SceneManager (场景管理)
- **路径**: `ThreeJSAssetsManager/SceneManager.js`
- **职责**:
    - 创建和配置 `THREE.Scene`。
    - 管理背景颜色 (`background`)。
    - 管理雾效 (`fog`)。
    - 管理环境贴图 (`environment`)。
    - 提供 GUI 控制面板用于实时调整场景参数。
- **扩展**: 可在此类中添加更多场景级的全局效果，如天空盒等。

### 2.3 LightManager (灯光管理)
- **路径**: `ThreeJSAssetsManager/LightManager.js`
- **职责**:
    - 根据配置创建各种类型的光源。
    - 支持的光源类型：
        - `AmbientLight` (环境光)
        - `DirectionalLight` (平行光/太阳光)
        - `PointLight` (点光源)
        - `SpotLight` (聚光灯)
        - `HemisphereLight` (半球光)
        - `RectAreaLight` (平面光)
    - 为每种光源提供详细的 GUI 调试参数（颜色、强度、位置、阴影等）。
    - 管理光源辅助对象 (`Helper`) 的显示与隐藏。

### 2.4 CameraManager (相机管理)
- **路径**: `ThreeJSAssetsManager/CameraManager.js`
- **职责**:
    - 创建主相机（默认为 `PerspectiveCamera`，支持 `OrthographicCamera`）。
    - 初始化并配置 `OrbitControls` 用于交互视角控制。
    - 处理窗口大小变化时的相机投影矩阵更新 (`resize`)。
    - 在每帧更新控制器状态 (`update`)。

### 2.5 RenderManager (渲染管理)
- **路径**: `ThreeJSAssetsManager/RenderManager.js`
- **职责**:
    - 创建和配置 `THREE.WebGLRenderer`。
    - 设置渲染参数：
        - 抗锯齿 (`antialias`)
        - 物理正确光照 (`physicallyCorrectLights`)
        - 色彩空间 (`outputColorSpace`)
        - 色调映射 (`toneMapping`, `toneMappingExposure`)
        - 阴影贴图 (`shadowMap`)
    - 执行最终的渲染调用 (`renderer.render(scene, camera)`)。

### 2.6 MeshManager (网格/模型管理)
- **路径**: `ThreeJSAssetsManager/MeshManager.js`
- **职责**:
    - 监听资源加载完成事件 (`ready`)。
    - 实例化和管理场景中的物体（如 GLB 模型、自定义几何体）。
    - 提供方法查找和控制场景中的 Mesh 可见性 (`getMeshesInScene`, `setAllGlbVisibility`)。
    - 包含用于测试的几何体创建逻辑。

### 2.7 DebugUI (调试界面)
- **路径**: `ThreeJSAssetsManager/DebugUI.js`
- **职责**:
    - 封装 `lil-gui` 库。
    - 根据 `config.js` 或 URL hash (`#debug`) 决定是否实例化 GUI。
    - 为其他管理器提供统一的 GUI 挂载点。

## 3. 配置系统 (config.js)

项目使用 `config.js` 进行集中式配置管理。各管理器在初始化时会读取相应的配置项。

### 配置示例

```javascript
export default {
    // 调试界面配置
    DebugUI: {
        enabled: true // 是否默认开启 GUI
    },
    // 场景配置
    SceneManager: {
        enabled: true,
        Color: { enabled: true, value: '#000000' }, // 背景色
        fog: { enabled: true, color: '#000000', near: 10, far: 100 } // 雾效
    },
    // 渲染器配置
    RenderManager: {
        toneMappingExposure: 1.75, // 曝光度
        clearColor: '#211d20' // 清除颜色
    },
    // 灯光配置
    LightManager: {
        ambientLight: { 
            enabled: true, 
            color: '#ffffff', 
            intensity: 0.5 
        },
        directionalLight: { 
            enabled: true, 
            color: '#ffffff', 
            intensity: 1, 
            position: { x: 5, y: 10, z: 7.5 },
            castShadow: true
        }
        // ... 更多灯光配置
    }
}
```

## 4. 扩展指南

### 添加新的管理器
1. 在 `ThreeJSAssetsManager` 目录下创建新的管理器类文件（例如 `PhysicsManager.js`）。
2. 在 `ThreeJSAssetsManager.js` 中引入该类。
3. 在 `ThreeJSAssetsManager` 的 `constructor` 中实例化该类，并传入必要的参数（如 `scene`, `debug` 等）。
4. 如果需要每帧更新，在 `tick()` 方法中调用该管理器的 `update()` 方法。

### 添加新的资源
1. 修改 `World/sources.js`（假设存在），添加新的资源描述对象。
2. 在 `MeshManager.js` 或其他逻辑类中监听 `resources.on('ready')` 事件，并处理新加载的资源。

## 5. 常见问题

- **如何开启调试模式？**
  在 URL 后加上 `#debug`，或者在 `config.js` 中将 `DebugUI.enabled` 设置为 `true`。

- **为什么修改了 config.js 没生效？**
  请确保相应的管理器代码中正确读取了该配置项。部分配置可能仅在初始化时生效，修改后需刷新页面。
