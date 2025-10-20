# config.js 和 sources.js 配置参数文档

本文档详细说明 config.js 和 sources.js 中的所有配置参数，以及它们对 Three.js 特性的影响。

---

## 📋 核心要点总结

### config.js 核心影响

| 配置模块 | Three.js 特性 | 性能影响 | 视觉影响 |
|---------|--------------|---------|---------|
| SceneManager | Scene.background, Fog | ⚡ 低 | ⭐⭐⭐ 中 |
| CameraManager | PerspectiveCamera | ⚡ 低 | ⭐⭐⭐⭐⭐ 高 |
| LightManager | Lights, Shadows | ⚡⚡⚡ 高 | ⭐⭐⭐⭐⭐ 高 |
| RenderManager | Renderer, PostProcessing | ⚡⚡⚡⚡ 很高 | ⭐⭐⭐⭐ 高 |

### sources.js 核心影响

| 配置项 | Three.js 特性 | 关键参数 | 注意事项 |
|-------|--------------|---------|---------|
| environment | Scene.environment | path, intensity | 影响全局光照 |
| glbModel | GLTF Scene | position, scale, rotation | 单位转换问题 |

---

## 1. config.js 关键配置分析

### 1.1 SceneManager - 场景基础

#### 背景色配置
```javascript
Color: {
    enabled: true,
    value: 0xababab  // 灰色
}
```

**Three.js底层：** `scene.background = new THREE.Color(0xababab)`

**影响：**
- ✅ 设置场景背景颜色
- ✅ 在未加载环境贴图时显示
- ✅ 影响透明物体的视觉效果

**建议配置：**
- 产品展示：`0xffffff`（白色）
- 科技场景：`0x000000`（黑色）  
- 室外场景：`0x87ceeb`（天蓝色）

#### 雾效配置
```javascript
fog: {
    enabled: false,
    color: 0xcccccc,
    near: 10,
    far: 50
}
```

**Three.js底层：** `scene.fog = new THREE.Fog(color, near, far)`

**影响：**
- ✅ 增强场景深度感
- ✅ 优化性能（远处物体被雾遮挡）
- ✅ 营造大气氛围

**配置策略：**
```javascript
// 森林场景
fog: {
    enabled: true,
    color: 0x88cc88,  // 绿色调
    near: 20,
    far: 100
}

// 城市场景
fog: {
    enabled: true,
    color: 0xaaaaaa,  // 灰色雾霾
    near: 50,
    far: 300
}
```

---

### 1.2 CameraManager - 相机系统

```javascript
CameraManager: {
    cameraType: 'perspective',
    cameraOptions: {
        fov: 75,      // 视野角度
        near: 0.1,    // 近裁剪面
        far: 2000     // 远裁剪面
    }
}
```

#### FOV（视野角度）深度分析

**Three.js底层：** `new THREE.PerspectiveCamera(fov, aspect, near, far)`

**不同FOV的视觉效果：**
| FOV | 效果 | 适用场景 |
|-----|------|---------|
| 30-45° | 望远镜视角 | 建筑可视化 |
| 50-70° | 正常视角 | 第三人称游戏 |
| 75-90° | 广角视角 | FPS游戏、VR |
| 90+° | 鱼眼效果 | 全景展示 |

**数学原理：**
```javascript
// 可视高度计算
const visibleHeight = 2 * Math.tan((fov * Math.PI/180) / 2) * distance;

// FOV=75°, distance=10
// visibleHeight ≈ 14.3 个单位
```

#### Near/Far 裁剪面

**重要性：** ⭐⭐⭐⭐⭐

**Z-Buffer 精度问题：**
```javascript
// 深度缓冲精度与 far/near 比值相关
const ratio = far / near;

// 推荐配置
near: 0.1,  far: 1000   // ratio = 10000 ✅ 良好
near: 0.01, far: 10000  // ratio = 1000000 ❌ Z-fighting
```

**实际案例：**
```javascript
// 室内场景（推荐）
near: 0.1, far: 100

// 城市场景（推荐）
near: 1, far: 5000

// 错误示例
near: 0.001, far: 100000  // ❌ 严重Z-fighting
```

---

### 1.3 LightManager - 光照系统（核心重点）

#### 1.3.1 环境光（AmbientLight）
```javascript
ambientLight: {
    enabled: true,
    color: 0xffffff,
    intensity: 0.5
}
```

**物理特性：**
- 无方向性
- 均匀照亮所有面
- 无阴影、无高光

**强度配置建议：**
```javascript
// 室外白天
intensity: 0.8

// 室内明亮
intensity: 0.5

// 室内昏暗
intensity: 0.3

// 夜晚场景
intensity: 0.1
```

#### 1.3.2 方向光（DirectionalLight）
```javascript
directionalLight: {
    enabled: false,
    color: 0xffffff,
    intensity: 1.5,
    position: {x: 5, y: 10, z: 5}
}
```

**关键特性：**
- ☀️ 模拟太阳光（平行光）
- ☀️ 产生清晰阴影
- ☀️ 性能友好

**位置配置的物理意义：**
```javascript
// 不同时间的太阳位置
const sunPositions = {
    morning:   {x: -10, y: 5,  z: 0},  // 早晨（东方）
    noon:      {x: 0,   y: 10, z: 0},  // 正午（顶部）
    afternoon: {x: 10,  y: 5,  z: 0},  // 下午（西方）
    sunset:    {x: 10,  y: 2,  z: 0}   // 日落（接近地平线）
};
```

**阴影配置（重要）：**
```javascript
// 框架内部实现
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

// 性能影响
512×512:   基准性能
1024×1024: -6% 性能
2048×2048: -18% 性能
4096×4096: -38% 性能
```

#### 1.3.3 点光源（PointLight）
```javascript
pointLight: {
    color: 0xffccaa,    // 暖色调
    intensity: 0.8,
    distance: 20,       // 光照范围
    decay: 1.5          // 衰减率
}
```

**物理衰减公式：**
```javascript
// Three.js 内部计算
intensity_actual = intensity / (distance² * decay)

// 示例
distance = 10, decay = 2
intensity_actual = 0.8 / (100 * 2) = 0.004
```

**距离配置策略：**
```javascript
// 小型灯具（台灯）
distance: 5-10

// 中型灯具（吊灯）
distance: 15-25

// 大型灯具（路灯）
distance: 30-50
```

#### 1.3.4 聚光灯（SpotLight）
```javascript
spotLight: {
    angle: 30,          // 光锥角度（度）
    penumbra: 0.5,      // 半影柔和度
    decay: 1
}
```

**角度配置：**
```javascript
// Three.js 需要弧度制
const angleInRadians = (30 * Math.PI) / 180;

// 不同效果
angle: Math.PI / 6   // 30° - 聚焦效果
angle: Math.PI / 4   // 45° - 标准聚光
angle: Math.PI / 3   // 60° - 广角
```

**半影效果：**
```javascript
penumbra: 0    // 硬边界（舞台灯）
penumbra: 0.5  // 柔和过渡（推荐）
penumbra: 1    // 极柔和（自然光）
```

#### 1.3.5 矩形区域光（RectAreaLight）
```javascript
rectAreaLight: {
    enabled: false,
    color: 0x00ff7b,
    width: 5.1,
    height: 12.4,
    position: {x: -7, y: 1.3, z: 0.8},
    lookAt: {x: 0.8, y: -9.6, z: 0.8}
}
```

**重要限制：**
- ⚠️ 仅支持 MeshStandardMaterial 和 MeshPhysicalMaterial
- ⚠️ 不产生阴影
- ⚠️ 性能开销大

**适用场景：**
```javascript
// 窗户光照
width: 2.0, height: 3.0

// 显示屏/广告牌
width: 4.0, height: 2.0

// 灯箱
width: 1.0, height: 1.5
```

---

### 1.4 RenderManager - 渲染系统

#### 1.4.1 后处理配置
```javascript
postprocessing: {
    enabled: false,
    bloom: {
        enabled: false,
        strength: 1.5,
        radius: 0.4
    }
}
```

**性能影响分析：**
```
无后处理:        100% 基准性能
抗锯齿(FXAA):    95%  (-5%)
辉光效果:        80%  (-20%)
辉光+抗锯齿:     75%  (-25%)
```

**辉光强度配置：**
```javascript
// 微弱辉光（保留细节）
strength: 0.5, radius: 0.2

// 中等辉光（推荐）
strength: 1.5, radius: 0.4

// 强烈辉光（科幻效果）
strength: 3.0, radius: 0.8
```

#### 1.4.2 阴影配置
```javascript
shadow: {
    enabled: false,
    type: 'PCFSoftShadowMap',
    resolution: 2048
}
```

**阴影类型对比：**
| 类型 | 质量 | 性能 | 适用场景 |
|------|------|------|---------|
| BasicShadowMap | ⭐ | ⚡⚡⚡⚡ | 低端设备 |
| PCFShadowMap | ⭐⭐⭐ | ⚡⚡⚡ | 标准质量 |
| PCFSoftShadowMap | ⭐⭐⭐⭐ | ⚡⚡ | 高质量（推荐） |
| VSMShadowMap | ⭐⭐⭐⭐⭐ | ⚡ | 极致质量 |

---

## 2. sources.js 资源配置分析

### 2.1 环境贴图配置

```javascript
{
    name: 'environment',
    type: 'rgbeLoader',
    file: {
        name: 'environment',
        path: 'ThreeJSAssetsManager/textures/envmap.hdr'
    }
}
```

#### HDR 格式的物理意义

**为什么使用 HDR？**
```
传统图片（LDR）：
- 亮度范围：0-255
- 无法表现真实光照差异
- 太阳 = 255，灯泡 = 255 ❌

HDR 图片：
- 亮度范围：0-无限大
- 真实记录光照强度
- 太阳 = 100000，灯泡 = 100 ✅
```

**对 Three.js 的影响：**

1. **环境光照（IBL）**
```javascript
scene.environment = hdrTexture;

// 效果：
// - 物体自动接收环境光照
// - 金属产生真实反射
// - 粗糙表面产生漫反射
```

2. **场景背景**
```javascript
scene.background = hdrTexture;

// 效果：
// - 360度全景背景
// - 与环境光照一致
```

3. **色调映射**
```javascript
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// 将 HDR 高动态范围压缩到显示范围
```

**性能影响：**
```javascript
// 文件大小
envmap_512.hdr:   ~500KB   // 低分辨率
envmap_1024.hdr:  ~2MB     // 标准（推荐）
envmap_2048.hdr:  ~8MB     // 高分辨率
envmap_4096.hdr:  ~32MB    // 超高分辨率
```

---

### 2.2 GLB 模型配置

```javascript
{
    name: 'Horse',
    type: 'glbModel',
    file: {
        name: 'Horse',
        path: 'ThreeJSAssetsManager/World/models/horse.glb',
        position: {x: 0, y: 1, z: 0},
        scale: 0.01,
        rotation: {x: 0.1, y: 0.01, z: 0.01}
    }
}
```

#### 2.2.1 Position（位置）

**Three.js 坐标系：**
```
右手坐标系：
     Y (上)
     |
     |
     +------ X (右)
    /
   /
  Z (前)
```

**配置策略：**
```javascript
// 模型原点在底部
position: {x: 0, y: 0, z: 0}  // 站在地面

// 模型原点在中心
position: {x: 0, y: 1, z: 0}  // 抬高一半

// 多模型布局
[
    {position: {x: -5, y: 0, z: 0}},  // 左
    {position: {x: 0,  y: 0, z: 0}},  // 中
    {position: {x: 5,  y: 0, z: 0}}   // 右
]
```

#### 2.2.2 Scale（缩放）

**为什么需要 scale: 0.01？**
```
原因：
1. 建模软件单位不统一
   Blender: 1单位 = 1米
   3ds Max: 1单位 = 1厘米

2. 导出设置问题
   未勾选"自动缩放"

3. 场景比例设计
   游戏：1单位 = 1米
   建筑：1单位 = 1毫米
```

**计算方法：**
```javascript
// 原始高度：200 单位（建模软件中）
// 期望高度：2 米（Three.js中）
// scale = 2 / 200 = 0.01

model.scale.set(0.01, 0.01, 0.01);
```

**应用范围：**
```javascript
// 微型物体（昆虫）
scale: 0.001 - 0.01

// 正常物体（人、家具）
scale: 0.01 - 0.1

// 大型物体（建筑）
scale: 1.0 - 10.0
```

#### 2.2.3 Rotation（旋转）

**弧度制理解：**
```javascript
// 角度 → 弧度
radians = degrees * (Math.PI / 180)

// 示例
rotation: {
    x: 0.1,    // ≈ 5.7°
    y: 0.01,   // ≈ 0.57°
    z: 0.01    // ≈ 0.57°
}
```

**常用旋转值：**
```javascript
// 90度
rotation: {x: Math.PI / 2, y: 0, z: 0}

// 180度
rotation: {x: Math.PI, y: 0, z: 0}

// 45度
rotation: {x: Math.PI / 4, y: 0, z: 0}
```

**旋转顺序：**
```javascript
// Three.js 默认：XYZ
model.rotation.order = 'XYZ';

// 可选顺序
'XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX'
```

---

## 3. 两者协同作用机制

### 3.1 环境光照链路

```
sources.js (environment)
         ↓
Resources 加载 HDR
         ↓
scene.environment = hdrTexture
         ↓
config.js (LightManager.ambientLight)
         ↓
组合产生最终光照效果
```

**代码流程：**
```javascript
// 1. 加载环境贴图（sources.js）
resources.on('ready', () => {
    scene.environment = resources.items['environment'];
});

// 2. 配置环境光（config.js）
ambientLight = new AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 3. 最终效果
// = HDR环境光照 + 环境光 + 其他光源
```

### 3.2 模型变换链路

```
sources.js (glbModel配置)
         ↓
Resources 加载模型
         ↓
Horse 类应用变换参数
         ↓
最终模型位置/旋转/缩放
```

**代码实现：**
```javascript
// Horse.js
const sourceConfig = sources.find(s => s.name === this.modelName);
this.model.position.set(
    sourceConfig.file.position.x,
    sourceConfig.file.position.y,
    sourceConfig.file.position.z
);
this.model.scale.set(
    sourceConfig.file.scale,
    sourceConfig.file.scale,
    sourceConfig.file.scale
);
```

---

## 4. 性能优化建议

### 4.1 光照优化

**推荐配置（移动端）：**
```javascript
LightManager: {
    ambientLight: { enabled: true, intensity: 0.6 },
    directionalLight: { enabled: true, intensity: 1.0 },
    // 关闭其他光源
    pointLight: { enabled: false },
    spotLight: { enabled: false },
    rectAreaLight: { enabled: false }
}
```

**推荐配置（桌面端）：**
```javascript
LightManager: {
    ambientLight: { enabled: true, intensity: 0.5 },
    directionalLight: { enabled: true, intensity: 1.5 },
    pointLight: { enabled: true, intensity: 0.8 },
    // 根据需要启用
}
```

### 4.2 阴影优化

```javascript
// 低端设备
shadow: {
    enabled: true,
    type: 'BasicShadowMap',
    resolution: 512
}

// 中端设备
shadow: {
    enabled: true,
    type: 'PCFShadowMap',
    resolution: 1024
}

// 高端设备
shadow: {
    enabled: true,
    type: 'PCFSoftShadowMap',
    resolution: 2048
}
```

### 4.3 资源优化

```javascript
// 环境贴图分辨率
// 移动端
envmap_512.hdr or envmap_1024.hdr

// 桌面端
envmap_1024.hdr or envmap_2048.hdr

// 模型优化
// - 使用 DRACO 压缩
// - 合理设置 LOD
// - 减少多边形数量
```

---

## 5. 实战配置案例

### 案例1：室内产品展示

**config.js:**
```javascript
{
    SceneManager: {
        Color: { value: 0xffffff },  // 白色背景
        fog: { enabled: false }
    },
    LightManager: {
        ambientLight: { enabled: true, intensity: 0.4 },
        directionalLight: { 
            enabled: true, 
            intensity: 1.2,
            position: {x: 3, y: 5, z: 3}
        },
        rectAreaLight: {
            enabled: true,
            width: 2, height: 3,
            position: {x: -3, y: 2, z: 0}
        }
    }
}
```

**sources.js:**
```javascript
[
    {
        name: 'environment',
        type: 'rgbeLoader',
        file: { path: 'textures/studio.hdr' }
    },
    {
        name: 'Product',
        type: 'glbModel',
        file: {
            path: 'models/product.glb',
            position: {x: 0, y: 0, z: 0},
            scale: 1.0,
            rotation: {x: 0, y: 0, z: 0}
        }
    }
]
```

### 案例2：室外场景

**config.js:**
```javascript
{
    SceneManager: {
        Color: { value: 0x87ceeb },  // 天蓝色
        fog: { 
            enabled: true,
            color: 0xaaccff,
            near: 50,
            far: 300
        }
    },
    LightManager: {
        ambientLight: { enabled: true, intensity: 0.6 },
        directionalLight: { 
            enabled: true, 
            intensity: 1.5,
            position: {x: 50, y: 100, z: 50}
        },
        hemiLight: {
            enabled: true,
            color: 0xffffbb,
            groundColor: 0x080820,
            intensity: 0.5
        }
    }
}
```

---

**文档版本：** v1.0  
**最后更新：** 2025-10-20