# Three.js 配置化框架 - 使用指南

本框架是 **Three.js 的封装框架**，核心理念是**以配置的形式便于使用 Three.js**，无需编写复杂的底层代码。

## 💡 核心概念

### 配置驱动，而非代码驱动

**传统 Three.js 方式：**
```javascript
// 创建场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// 创建相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(6, 4, 8);

// 创建灯光
const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

// 创建渲染器
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
```

**本框架方式：**
```javascript
// 只需修改 config.js 配置文件
export default {
  'SceneManager': {
    Color: { enabled: true, value: 0x87ceeb }
  },
  'CameraManager': {
    cameraOptions: { fov: 75, near: 0.1, far: 2000 }
  },
  'LightManager': {
    ambientLight: { enabled: true, color: 0xffffff, intensity: 0.5 }
  }
}

// 然后一行代码初始化
const app = new ThreeJSAssetsManager(canvas);
```

## 📁 两个核心配置文件

### config.js - 场景、相机、灯光、渲染器配置

位置：[`ThreeJSAssetsManager/ThreeJSAssetsManager/config.js`](ThreeJSAssetsManager/ThreeJSAssetsManager/config.js)

```javascript
export default {
  'SceneManager': {
    Color: { enabled: true, value: 0xababab },  // 场景背景色
    fog: { enabled: false, color: 0xcccccc, near: 10, far: 50 }  // 雾效
  },
  'CameraManager': {
    cameraType: 'perspective',  // 相机类型
    cameraOptions: { fov: 75, near: 0.1, far: 2000 }  // 相机参数
  },
  'LightManager': {
    ambientLight: { enabled: true, color: 0xffffff, intensity: 0.5 },
    directionalLight: { enabled: false, color: 0xffffff, intensity: 1.5 },
    // ... 更多光源
  }
}
```

### sources.js - 资源加载配置

位置：[`ThreeJSAssetsManager/ThreeJSAssetsManager/World/sources.js`](ThreeJSAssetsManager/ThreeJSAssetsManager/World/sources.js)

```javascript
export default [
  {
    name: 'environment',
    type: 'rgbeLoader',  // HDR 环境贴图
    file: { path: 'ThreeJSAssetsManager/textures/envmap.hdr' }
  },
  {
    name: 'Horse',
    type: 'glbModel',  // GLB 3D 模型
    file: {
      path: 'ThreeJSAssetsManager/World/models/horse.glb',
      position: {x: 0, y: 1, z: 0},
      scale: 0.01,
      rotation: {x: 0.1, y: 0.01, z: 0.01}
    }
  }
]
```

## 🚀 快速开始

### 第一步：HTML 页面

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

### 第二步：配置场景（修改 config.js）

```javascript
export default {
  'SceneManager': {
    Color: { enabled: true, value: 0x87ceeb }  // ✅ 天蓝色背景
  },
  'LightManager': {
    ambientLight: { enabled: true, intensity: 0.8 }  // ✅ 提高环境光
  }
}
```

### 第三步：配置资源（修改 sources.js）

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

### 第四步：启用调试

URL 添加 `#debug`：
```
http://localhost:5173/index.html#debug
```

实时调整所有参数，找到最佳配置后，将其写回 `config.js`。

## 📝 配置式开发实战

### 场景 1：改变背景色

**配置方式**（推荐）：
```javascript
// config.js
'SceneManager': {
  Color: { enabled: true, value: 0x87ceeb }  // 天蓝色
}
```

**代码方式**（不推荐）：
```javascript
import { Color } from 'three';
app.scene.background = new Color(0x87ceeb);
```

### 场景 2：添加雾效

**配置方式**（推荐）：
```javascript
// config.js
'SceneManager': {
  fog: { enabled: true, color: 0xcccccc, near: 10, far: 50 }
}
```

**代码方式**（不推荐）：
```javascript
import { Fog } from 'three';
app.scene.fog = new Fog(0xcccccc, 10, 50);
```

### 场景 3：调整相机视野

**配置方式**（推荐）：
```javascript
// config.js
'CameraManager': {
  cameraOptions: {
    fov: 45,      // 窄视野，适合建筑可视化
    near: 0.1,
    far: 1000
  }
}
```

### 场景 4：配置多种光源

**配置方式**（推荐）：
```javascript
// config.js
'LightManager': {
  ambientLight: { enabled: true, intensity: 0.3 },           // 环境光
  directionalLight: {                                         // 方向光（太阳）
    enabled: true,
    color: 0xffffff,
    intensity: 1.5,
    position: {x: 5, y: 10, z: 5}
  },
  pointLight: {                                               // 点光源（灯泡）
    enabled: true,
    color: 0xffaa00,
    intensity: 1.0,
    position: {x: 0, y: 5, z: 0}
  }
}
```

### 场景 5：加载 3D 模型

**配置方式**（推荐）：
```javascript
// sources.js
export default [
  {
    name: 'Car',
    type: 'glbModel',
    file: {
      path: 'models/car.glb',
      position: {x: 0, y: 0, z: 0},
      scale: 2.0,  // 放大 2 倍
      rotation: {x: 0, y: Math.PI / 4, z: 0}  // 旋转 45°
    }
  }
]
```

### 场景 6：配置环境光照（PBR）

**配置方式**（推荐）：
```javascript
// sources.js
export default [
  {
    name: 'environment',
    type: 'rgbeLoader',  // HDR 环境贴图
    file: { path: 'textures/studio.hdr' }
  }
]
```

## 🎮 调试模式的配置化工作流

### 推荐工作流程

1. **启用调试模式**
   - URL 添加 `#debug`：`http://localhost:5173/index.html#debug`
   
2. **实时调整参数**
   - 在调试面板中调整灯光、相机、雾效等参数
   - 观察实时效果
   
3. **记录最佳配置**
   - 找到满意的参数后，查看控制台输出的值
   
4. **写回配置文件**
   - 将最佳参数写入 `config.js`
   - 移除 `#debug`，生产环境使用

### 示例：调试灯光

```javascript
// 1. 初始配置（config.js）
'LightManager': {
  ambientLight: { enabled: true, intensity: 0.5 }
}

// 2. 在调试面板中调整，发现 intensity: 0.8 效果更好

// 3. 写回配置文件（config.js）
'LightManager': {
  ambientLight: { enabled: true, intensity: 0.8 }  // ✅ 更新
}
```

## 🔌 事件系统

框架内置事件系统，方便响应式开发：

### 资源加载事件

```javascript
// 资源加载完成
app.resources.on('ready', () => {
  console.log('所有资源已加载');
  console.log('资源列表:', app.resources.items);
});
```

### 窗口尺寸变化

```javascript
app.sizes.on('resize', () => {
  console.log('窗口尺寸:', app.sizes.width, app.sizes.height);
});
```

### 每帧更新

```javascript
app.time.on('tick', () => {
  console.log('帧间隔:', app.time.delta, 'ms');
  console.log('总时长:', app.time.elapsed, 'ms');
});
```

## 📦 访问底层 API（高级用法）

虽然推荐使用配置，但框架也提供了底层 Three.js API 的访问：

### 访问场景对象

```javascript
const app = new ThreeJSAssetsManager(canvas);

// 访问 Three.js 原生对象
app.scene                    // THREE.Scene
app.camera                   // THREE.PerspectiveCamera
app.renderManagerInstance.webGLRenderer  // THREE.WebGLRenderer
```

### 手动添加对象

```javascript
import { BoxGeometry, MeshStandardMaterial, Mesh } from 'three';

const cube = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: 0xff0000 })
);
app.scene.add(cube);

// 添加动画
app.time.on('tick', () => {
  cube.rotation.y += 0.01;
});
```

### 访问加载的资源

```javascript
app.resources.on('ready', () => {
  // 访问 HDR 环境贴图
  const envMap = app.resources.items.environment;
  
  // 访问 GLB 模型
  const horseModel = app.resources.items.Horse;
});
```

### 管理 GLB 模型

```javascript
// 获取所有加载的 GLB 模型
const models = app.meshManagerInstance.glbObjects;

// 控制模型可见性
app.meshManagerInstance.setGLBVisibility('Horse', false);  // 隐藏
app.meshManagerInstance.setGLBVisibility('Horse', true);   // 显示
```

## 📊 配置参数速查表

### SceneManager（场景）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| Color.enabled | Boolean | true | 是否启用背景色 |
| Color.value | Hex | 0xababab | 背景色 |
| fog.enabled | Boolean | false | 是否启用雾效 |
| fog.near | Number | 10 | 雾效起始距离 |
| fog.far | Number | 50 | 雾效结束距离 |

### CameraManager（相机）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| cameraType | String | 'perspective' | 相机类型 |
| cameraOptions.fov | Number | 75 | 视野角度（度） |
| cameraOptions.near | Number | 0.1 | 近裁剪面 |
| cameraOptions.far | Number | 2000 | 远裁剪面 |

### LightManager（光源）

| 光源类型 | 主要参数 | 适用场景 |
|---------|---------|----------|
| ambientLight | intensity | 全局基础光照 |
| directionalLight | intensity, position | 模拟太阳光 |
| pointLight | intensity, distance, decay | 模拟灯泡 |
| spotLight | angle, penumbra | 聚光灯效果 |
| hemiLight | skyColor, groundColor | 室外环境光 |
| rectAreaLight | width, height | 窗户、条形灯 |

### sources.js（资源）

| 资源类型 | 主要参数 | 说明 |
|---------|---------|------|
| glbModel | path, position, scale, rotation | GLB/GLTF 3D 模型 |
| rgbeLoader | path | HDR 环境贴图（PBR） |
| texture | path | 普通纹理图片 |
| cubeTexture | paths (数组) | 立方体贴图（天空盒） |

## ❓ 常见问题

### 模型加载后看不见？

**解决方案：调整 sources.js 配置**
```javascript
{
  name: 'myModel',
  type: 'glbModel',
  file: {
    path: 'models/model.glb',
    scale: 10.0,  // ✅ 尝试放大
    position: {x: 0, y: 0, z: 0}
  }
}
```

同时检查 config.js 中的相机和光源配置。

### 如何提高性能？

**解决方案：优化 config.js 配置**
```javascript
'LightManager': {
  ambientLight: { enabled: true, intensity: 0.5 },
  // ❌ 禁用不必要的光源
  directionalLight: { enabled: false },
  pointLight: { enabled: false }
},
'RenderManager': {
  shadow: { enabled: false }  // ❌ 禁用阴影提升性能
}
```

### 调试面板不显示？

确保 URL 包含 `#debug`：
```
http://localhost:5173/index.html#debug
```

### 如何改变相机初始位置？

修改 `CameraManager.js` 中的位置：
```javascript
this.camera.position.set(10, 5, 10);  // 自定义位置
```

## 📚 相关文档

- **[README.md](README.md)** - 项目概述和快速开始
- **[CONFIG_ANALYSIS.md](CONFIG_ANALYSIS.md)** - 配置参数详解，每个配置项对 Three.js 的影响
- **[Three.js 官方文档](https://threejs.org/docs/)** - Three.js 底层 API 文档

---

**最后更新：** 2025-10-20
