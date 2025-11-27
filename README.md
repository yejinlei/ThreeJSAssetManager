# Three.js 配置化框架 (ThreeJSAssetManager)

一个基于 Three.js 的配置化 3D 开发框架，让您**通过配置文件而非代码**来构建 3D 场景。旨在简化 Three.js 项目的初始化、资源加载、场景配置和调试过程。

## 💡 核心理念

**配置即代码** - 修改配置文件即可控制整个 3D 场景

```javascript
// 传统方式：编写大量代码
const scene = new THREE.Scene();
const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);
// ...

// 本框架：修改配置文件
// config.js
export default {
  'LightManager': {
    ambientLight: { enabled: true, color: 0xffffff, intensity: 0.5 }
  }
}
```

## 📂 目录结构

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

## 🎯 两个核心配置文件

### 📄 config.js - 场景配置
控制场景、相机、灯光、渲染器等基础参数

```javascript
export default {
  'SceneManager': { Color: { enabled: true, value: 0xababab } },
  'CameraManager': { cameraType: 'perspective', cameraOptions: { fov: 75 } },
  'LightManager': { ambientLight: { enabled: true, intensity: 0.5 } }
}
```

### 📄 sources.js - 资源配置
声明需要加载的 3D 模型、纹理、环境贴图等资源

```javascript
export default [
  {
    name: 'environment',
    type: 'rgbeLoader',
    file: { path: 'textures/envmap.hdr' }
  },
  {
    name: 'Horse',
    type: 'glbModel',
    file: { path: 'models/horse.glb', scale: 0.01 }
  }
]
```

## ✨ 核心特性

### 🔧 配置驱动
所有 Three.js 特性通过配置文件控制，无需编写底层代码

### 🎮 实时调试
URL 添加 `#debug` 即可启用可视化调试面板
```
http://localhost:5173/index.html#debug
```

### 📦 模块化架构
- **SceneManager** - 场景、背景、雾效
- **CameraManager** - 相机、控制器
- **LightManager** - 6 种光源类型
- **RenderManager** - 渲染器、阴影
- **PostProcessor** - 后期处理（Bloom等效果）
- **Resources** - 资源加载（GLB、纹理、HDR）
- **MeshManager** - 模型管理
- **InteractionManager** - 鼠标交互、拖拽
- **ParticleManager** - 粒子系统
- **PerformanceManager** - 性能优化（InstancedMesh、LOD）
- **ShaderManager** - 自定义着色器
- **PhysicsManager** - 物理引擎（Cannon.js）
- **AudioManager** - 3D空间音效
- **WebXRManager** - VR/AR支持
- **HelperManager** - 调试辅助工具

### 🌐 资源类型支持
- `glbModel` - GLB/GLTF 3D 模型（自动配置 DRACO 压缩）
- `rgbeLoader` - HDR 环境贴图（PBR 材质）
- `texture` - 普通纹理
- `cubeTexture` - 立方体贴图

## 🚀 快速开始

### 1. 安装依赖

本项目依赖 `three` 和 `lil-gui`。通常通过 CDN 或 npm 安装。

**使用 npm:**
```bash
npm install three lil-gui
```

### 2. 最小示例 (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
  {
    "imports": {
      "three": "https://gcore.jsdelivr.net/npm/three@0.165.0/build/three.module.js",
      "three/addons/": "https://gcore.jsdelivr.net/npm/three@0.165.0/examples/jsm/",
      "lil-gui": "https://cdn.jsdelivr.net/npm/lil-gui@0.18.1/+esm"
    }
  }
  </script>
</head>
<body>
  <canvas id="webgl"></canvas>
  <script type="module">
    import ThreeJSAssetsManager from './ThreeJSAssetsManager/ThreeJSAssetsManager.js';
    const app = new ThreeJSAssetsManager(document.querySelector('#webgl'));
  </script>
</body>
</html>
```

### 3. 修改配置

编辑 [`config.js`](ThreeJSAssetsManager/ThreeJSAssetsManager/config.js)：

```javascript
export default {
  'SceneManager': {
    Color: { enabled: true, value: 0x87ceeb }  // 天蓝色背景
  },
  'LightManager': {
    ambientLight: { enabled: true, intensity: 0.8 }  // 提高环境光
  }
}
```

## 🎨 高级特性 (Dev Branch)

### 后期处理 (Post-processing)
```javascript
'PostProcessing': {
    enabled: true,
    bloom: {
        enabled: true,
        strength: 1.5,
        radius: 0.4,
        threshold: 0.85
    }
}
```

### 交互系统 (Interaction)
```javascript
'Interaction': {
    enabled: true,
    enableDrag: true,  // 启用拖拽
    highlightOnHover: true  // 悬停高亮
}
```

### 粒子系统 (Particles)
```javascript
'Particles': {
    systems: [{
        enabled: true,
        name: 'Snow',
        count: 1000,
        size: 0.1,
        spread: 20,
        animate: true
    }]
}
```

### 物理引擎 (Physics)
```javascript
'Physics': {
    enabled: true,
    gravity: { x: 0, y: -9.82, z: 0 },
    createGround: true
}
```
**注意**: 需要安装 `cannon-es`: `npm install cannon-es`

### 性能优化 (Performance)
- **InstancedMesh**: 渲染数千个重复对象
- **LOD**: 根据距离自动切换模型精度

### 自定义着色器 (Shaders)
```javascript
manager.shaderManager.createWaveShader('myWave');
manager.shaderManager.createAnimatedShader('myShader');
```

### 音频系统 (Audio)
```javascript
manager.audioManager.loadPositionalAudio('sound1', 'path/to/sound.mp3', {x: 0, y: 0, z: 0});
```

### WebXR (VR/AR)
```javascript
'WebXR': {
    enabled: true,
    createVRButton: true,
    createARButton: true
}
```

## 🧪 功能测试

打开 `feature-test.html` 查看所有功能的交互式演示。


### 4. 配置资源

编辑 [`sources.js`](ThreeJSAssetsManager/ThreeJSAssetsManager/World/sources.js)：

```javascript
export default [
  {
    name: 'myModel',
    type: 'glbModel',
    file: {
      path: 'models/mymodel.glb',
      position: {x: 0, y: 0, z: 0},
      scale: 1.0
    }
  }
]
```

## 📚 主要 API

### ThreeJSAssetsManager

```javascript
const app = new ThreeJSAssetsManager(canvas);

// 主要属性
app.scene                    // Three.js 场景对象
app.camera                   // 相机对象
app.resources                // 资源管理器
app.meshManagerInstance      // 模型管理器
app.time                     // 时间管理器
app.sizes                    // 尺寸管理器
```

### 事件系统

```javascript
// 窗口尺寸变化
app.sizes.on('resize', () => {
  console.log('窗口尺寸:', app.sizes.width, app.sizes.height);
});

// 每帧更新
app.time.on('tick', () => {
  console.log('帧间隔:', app.time.delta, 'ms');
});

// 资源加载完成
app.resources.on('ready', () => {
  console.log('所有资源已加载');
});
```

## 📖 文档导航

- **[USER_GUIDE.md](USER_GUIDE.md)** - 使用指南，如何通过配置快速构建 3D 场景
- **[TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md)** - 技术指南，架构设计与核心类详解
- **[CONFIG_ANALYSIS.md](CONFIG_ANALYSIS.md)** - 配置参数详解，深度剖析每个配置项的作用
- **[UPDATE_NOTES.md](UPDATE_NOTES.md)** - 版本更新日志

## 💡 使用技巧

### 调试模式
URL 添加 `#debug` 启用可视化调试面板，实时调整所有参数

### 资源加载监听
```javascript
app.resources.on('ready', () => {
  console.log('资源已加载:', app.resources.items);
});
```

### 模型管理
```javascript
// 获取所有加载的 GLB 模型
const models = app.meshManagerInstance.glbObjects;

// 控制模型可见性
app.meshManagerInstance.setGLBVisibility('Horse', false);
```

## ❓ 常见问题

**Q: 模型加载后看不见？**
A: 检查 `sources.js` 中的 scale 和 position 配置，调整相机位置，确保有光源

**Q: 如何提高性能？**
A: 在 `config.js` 中减少光源数量、禁用阴影、降低渲染质量

**Q: 如何自定义相机位置？**
A: 修改 `CameraManager.js` 中的 `camera.position.set(x, y, z)`

## 📝 待办事项 (TODO)

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

## 📄 许可证

MIT License
