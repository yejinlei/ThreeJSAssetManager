# ThreeJSAssetManager 技术指南

本指南详细介绍了 `ThreeJSAssetManager` 的架构设计、核心类功能、技术原理以及配置方法，旨在帮助开发者深入理解并扩展该框架。

## 1. 架构概览

`ThreeJSAssetManager` 是一个基于 Three.js 的模块化、事件驱动的 3D 应用开发框架。它采用单例模式（Singleton Pattern）作为整个应用的控制中心，通过管理器模式（Manager Pattern）将复杂功能划分为独立模块，实现了高度的可扩展性和可维护性。

框架的核心设计理念是将 3D 应用的各个方面（场景、相机、灯光、渲染、模型等）解耦为独立的管理器模块，通过中心化的入口进行协调和控制。这种设计使得开发者可以轻松替换或扩展单个功能模块，而不影响其他部分的正常运行。

### 核心架构图

```mermaid
graph TD
    App[App Entry] --> TAM[ThreeJSAssetsManager (Singleton)]
    
    subgraph 核心管理器模块
        TAM --> SM[SceneManager]
        TAM --> LM[LightManager]
        TAM --> CM[CameraManager]
        TAM --> RM[RenderManager]
        TAM --> MM[MeshManager]
    end
    
    subgraph 辅助工具模块
        TAM --> DUI[DebugUI]
        TAM --> Utils[Utils]
        Utils --> Sizes[Sizes]
        Utils --> Time[Time]
        Utils --> Resources[Resources]
        Utils --> AnimationManager[AnimationManager]
    end
    
    subgraph 扩展功能模块
        TAM --> PM[PhysicsManager]
        TAM --> AM[AudioManager]
        TAM --> XR[WebXRManager]
        TAM --> PPM[PostProcessor]
        TAM --> IM[InteractionManager]
        TAM --> SDM[ShaderManager]
        TAM --> PAM[ParticleManager]
        TAM --> PFM[PerformanceManager]
        TAM --> HM[HelperManager]
    end
    
    %% 双向引用
    SM -.-> TAM
    LM -.-> TAM
    CM -.-> TAM
    RM -.-> TAM
    MM -.-> TAM
    
    subgraph 核心更新循环
        TAM -- tick() --> CM
        TAM -- tick() --> MM
        TAM -- tick() --> RM
        TAM -- tick() --> AnimationManager
        TAM -- tick() --> PM
        TAM -- tick() --> PPM
    end
    
    subgraph 事件系统
        Time -- "tick事件" --> TAM
        Sizes -- "resize事件" --> TAM
        Resources -- "ready事件" --> MM
        Resources -- "ready事件" --> SM
    end
```

### 技术架构特点

1. **分层设计**：框架采用清晰的分层结构，将核心功能、辅助工具和扩展功能明确分离
2. **依赖注入**：各个管理器通过构造函数参数接收必要的依赖，便于测试和替换
3. **事件驱动**：基于自定义事件系统实现模块间通信，降低模块间耦合度
4. **配置集中化**：通过 `config.js` 实现全局配置管理，支持运行时动态调整
5. **单例管理**：核心组件采用单例模式，确保全局状态一致性

## 2. 技术原理与设计模式

### 2.1 单例模式（Singleton Pattern）

ThreeJSAssetsManager 核心采用单例模式设计，确保全局只有一个实例存在，避免资源重复创建和状态不一致问题：

```javascript
// 单例模式实现核心代码
let instance = null;

export default class ThreeJSAssetsManager {
  constructor(canvasOrOptions, customConfig = null) {
    // 全局只有一个单例，若实例已存在则直接返回
    if (instance) {
      return instance;
    }
    // 将当前实例赋值给单例变量
    instance = this;
    // 将实例挂载到 window 对象上，防止被垃圾回收
    window.ThreeJSAssetsManagerInstance = this;
    
    // 初始化其他组件...
  }
  
  // 提供静态方法获取实例
  static getInstance() {
    return instance || window.ThreeJSAssetsManagerInstance || null;
  }
}
```

这种设计确保：
- 全局状态统一管理
- 避免重复创建资源密集型对象
- 提供统一的访问入口
- 简化模块间通信

### 2.2 管理器模式（Manager Pattern）

框架使用管理器模式将不同功能领域封装为独立的管理器类，每个管理器负责特定领域的功能：

- **关注点分离**：每个管理器专注于单一职责
- **模块化设计**：便于单独维护和扩展
- **统一接口**：所有管理器遵循相似的初始化和更新模式
- **可替换性**：可以轻松替换特定管理器的实现

### 2.3 事件驱动架构（Event-driven Architecture）

框架实现了轻量级的事件系统，用于模块间通信：

```javascript
// 核心事件系统示例（Time 和 Sizes 类）
this.sizes.on('resize', () => {
  this.resize();
});

this.time.on('tick', () => {
  this.tick();
});

// 资源加载完成事件
this.resources.on('ready', () => {
  // 处理资源...
});
```

事件系统特点：
- **松耦合**：发布者和订阅者之间不需要直接引用
- **可扩展性**：新模块可以轻松监听现有事件或发布新事件
- **异步处理**：支持异步操作流程（如资源加载）
- **可预测性**：事件流清晰，便于调试和维护

### 2.4 依赖注入（Dependency Injection）

框架使用依赖注入模式管理组件间依赖关系：

```javascript
// 在构造函数中注入必要的依赖
constructor(options = {}) {
  this.manager = options.manager;
  this.debug = options.debug;
  this.gui = options.gui;
  
  // 从主管理器获取其他依赖
  if (this.manager) {
    this.scene = this.manager.scene;
    this.resources = this.manager.resources;
  }
}
```

依赖注入优势：
- **可测试性**：便于模拟依赖进行单元测试
- **灵活性**：依赖可以在运行时替换
- **清晰的依赖关系**：依赖关系显式声明，便于理解

### 2.5 工厂模式（Factory Pattern）

在 MeshManager 中使用工厂模式创建和管理模型实例：

```javascript
// 使用 ModelLoader（工厂类）创建模型实例
const model = new ModelLoader(object.name);
this.models.push(model);
this.modelInstances[object.name] = model;
```

### 2.6 组合模式（Composite Pattern）

SceneManager 使用组合模式管理场景对象层次结构：

```javascript
this.scene = new Scene();
this.mainGroup = new Group();
this.mainGroup.name = 'GLBMainGroup';
this.scene.add(this.mainGroup);
```

### 2.7 命令模式（Command Pattern）

DebugUI 中通过命令模式封装用户界面操作：

```javascript
const loaderControls = {
    loadAllModels: () => this.loadAllModels(),
    clearAllModels: () => this.clearAllModels(),
};

folder.add(loaderControls, 'loadAllModels').name('加载所有模型');
```

## 3. 核心类详解

### 3.1 ThreeJSAssetsManager (核心入口类)
- **路径**: `ThreeJSAssetsManager/ThreeJSAssetsManager.js`
- **技术原理**：作为整个框架的核心控制器，实现单例模式，统一管理所有子模块
- **核心功能**: 
    - 应用程序的入口点和中枢神经系统
    - 维护全局单例 `instance`，确保状态一致性
    - 按特定顺序初始化所有子管理器和工具类
    - 管理应用程序的生命周期（初始化、更新、调整大小）
    - 提供全局访问点，方便子模块相互引用
- **关键实现细节**:
  - **单例实现**: 通过静态实例变量和构造函数检查确保全局唯一
  - **事件转发**: 集中处理 `resize` 和 `tick` 等全局事件，并分发给相应管理器
  - **依赖传递**: 在初始化过程中，将必要的引用（如 debug、gui）传递给子管理器
  - **配置合并**: 支持自定义配置覆盖默认配置
- **关键属性**:
    - `canvas`: 渲染画布元素
    - `scene`: Three.js 场景对象引用
    - `camera`: 主相机对象引用
    - `debug`: 调试模式标志
    - `gui`: 调试界面实例引用
    - 各种管理器实例（sceneManagerinstance, cameraManagerInstance 等）

### 3.2 SceneManager (场景管理)
- **路径**: `ThreeJSAssetsManager/SceneManager.js`
- **技术原理**：负责创建和管理 Three.js 场景对象及其相关属性，实现场景状态的集中管理
- **核心功能**:
    - 创建和配置 `THREE.Scene` 对象
    - 管理场景背景、雾效和环境贴图
    - 维护场景对象层次结构（通过 mainGroup）
    - 提供场景切换和模型可见性控制
    - 根据配置文件动态应用场景设置
- **关键实现细节**:
  - **配置驱动**: 从 config.js 读取场景配置并应用
  - **资源监听**: 监听资源加载完成事件，自动应用环境贴图
  - **调试控制**: 提供丰富的 GUI 控件用于实时调整场景参数
  - **资源释放**: 实现 dispose 方法，确保资源正确清理
- **设计特点**:
  - 遵循单一职责原则，专注于场景相关功能
  - 通过组合模式管理场景对象层次结构

### 3.3 LightManager (灯光管理)
- **路径**: `ThreeJSAssetsManager/LightManager.js`
- **技术原理**：负责创建、配置和管理场景中的各种光源，实现光照效果的集中控制
- **核心功能**:
    - 根据配置创建多种类型的光源
    - 支持的光源类型：环境光、平行光、点光源、聚光灯、半球光、平面光
    - 管理光源的属性（颜色、强度、位置、方向等）
    - 控制光源阴影的生成和质量
    - 提供光源辅助对象用于可视化调试
- **设计特点**:
  - 工厂模式：根据配置动态创建不同类型的光源
  - 可扩展设计：易于添加新类型的光源或光照效果
  - 调试友好：为每种光源提供详细的 GUI 控制参数

### 3.4 CameraManager (相机管理)
- **路径**: `ThreeJSAssetsManager/CameraManager.js`
- **技术原理**：负责创建、配置和控制相机对象，实现场景视角的管理和交互
- **核心功能**:
    - 创建和配置主相机（支持透视相机和正交相机）
    - 初始化 `OrbitControls` 提供用户交互控制
    - 处理窗口尺寸变化时的相机参数调整
    - 实现相机状态的每帧更新
- **关键实现细节**:
  - **相机类型切换**: 支持在透视相机和正交相机之间切换
  - **自动调整**: 窗口大小变化时自动更新相机投影矩阵
  - **平滑控制**: 通过控制器阻尼效果实现平滑的相机移动
  - **全局引用**: 从 ThreeJSAssetsManager 获取必要的引用（如 scene、canvas）

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
