# GLBModelLoader 使用指南

## 简介

`GLBModelLoader` 是一个通用的 GLB/GLTF 模型加载器，用于在 Three.js 项目中轻松加载、显示和管理 3D 模型。它提供了丰富的功能，包括：

- 自动加载和设置模型
- 自动检测和播放动画
- 模型位置、旋转、缩放控制
- 阴影设置
- 模型居中和大小标准化
- 调试面板集成
- 动画控制（播放、暂停、速度调整）

## 基本用法

### 1. 导入加载器

```javascript
import GLBModelLoader from './World/GLBModelLoader.js';
```

### 2. 创建加载器实例

```javascript
const model = new GLBModelLoader({
  modelName: 'Horse', // 必须与 resources.items 中的键名匹配
  scale: 0.02,
  autoPlayAnimation: true
});
```

### 3. 在动画循环中更新模型

```javascript
// 在你的动画循环中
function animate() {
  requestAnimationFrame(animate);
  model.update();
  renderer.render(scene, camera);
}
animate();
```

## 配置选项

创建 `GLBModelLoader` 实例时，可以传入以下配置选项：

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `modelName` | string | null | **必需**。模型资源名称（在 resources.items 中的键名） |
| `debugName` | string | modelName | 调试面板中显示的名称 |
| `position` | Object | {x:0,y:0,z:0} | 模型位置 |
| `rotation` | Object | {x:0,y:0,z:0} | 模型旋转（弧度） |
| `scale` | Number/Object | null | 模型缩放，可以是单一数值或 {x,y,z} 对象 |
| `castShadow` | boolean | true | 是否投射阴影 |
| `receiveShadow` | boolean | false | 是否接收阴影 |
| `autoPlayAnimation` | boolean | true | 是否自动播放第一个动画 |
| `defaultAnimation` | string | null | 默认播放的动画名称，如果为 null 则播放第一个 |
| `centerModel` | boolean | false | 是否将模型居中 |
| `normalizeScale` | boolean | false | 是否标准化模型大小 |
| `normalizedSize` | number | 1 | 标准化后的模型大小 |

## 方法

### update()

在每一帧调用，更新模型动画。

```javascript
model.update();
```

### show()

显示模型。

```javascript
model.show();
```

### hide()

隐藏模型。

```javascript
model.hide();
```

### dispose()

销毁模型和相关资源，释放内存。

```javascript
model.dispose();
```

### 动画控制

播放特定动画：

```javascript
// 播放名为 "run" 的动画
model.animation.play('run');
```

调整动画速度：

```javascript
// 设置动画速度为原速度的 1.5 倍
model.animation.timeScale = 1.5;
```

暂停/恢复动画：

```javascript
// 暂停动画
model.animation.paused = true;

// 恢复动画
model.animation.paused = false;
```

## 完整示例

```javascript
import GLBModelLoader from './World/GLBModelLoader.js';

export default class Game {
  constructor() {
    // 假设你已经设置了 ThreeJSAssetsManager 并加载了资源
    
    // 创建马模型
    this.horse = new GLBModelLoader({
      modelName: 'Horse',
      position: { x: 0, y: 0, z: 0 },
      scale: 0.02,
      autoPlayAnimation: true
    });
    
    // 创建角色模型
    this.character = new GLBModelLoader({
      modelName: 'Character',
      position: { x: 2, y: 0, z: 0 },
      centerModel: true,
      normalizeScale: true,
      normalizedSize: 1.8,
      defaultAnimation: 'idle'
    });
  }
  
  update() {
    // 更新所有模型
    this.horse.update();
    this.character.update();
  }
  
  // 示例：切换角色动画
  makeCharacterRun() {
    this.character.animation.play('run');
  }
  
  // 示例：隐藏马模型
  hideHorse() {
    this.horse.hide();
  }
  
  // 示例：清理资源
  dispose() {
    this.horse.dispose();
    this.character.dispose();
  }
}
```

## 注意事项

1. 确保在使用 `GLBModelLoader` 之前已经通过 `ThreeJSAssetsManager` 加载了模型资源
2. `modelName` 参数必须与 `resources.items` 中的键名完全匹配
3. 如果模型没有动画，`setAnimation` 方法不会报错，但不会创建动画控制器
4. 使用 `dispose()` 方法清理不再需要的模型，以避免内存泄漏