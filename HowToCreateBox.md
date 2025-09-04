# 如何创建适配任何动态分辨率的物理 Box 和 UI 组件

## 概述

本文档介绍如何在我们的游戏中使用固定的逻辑坐标系统，创建能够自动适配任何屏幕分辨率的物理对象和 UI 组件。

## 核心原理

### 固定逻辑尺寸系统

- **游戏逻辑尺寸**: `GAME_WIDTH = 1920`, `GAME_HEIGHT = 1080`
- **所有游戏对象都基于这个固定的逻辑坐标系统**
- **Phaser 的缩放管理器自动处理到实际屏幕分辨率的转换**

## 创建物理 Box

### 1. 基本物理 Box 创建

```typescript
// 在GameScene中创建物理Box
createDynamicBox(x: number, y: number) {
  const boxSize = 80; // 固定逻辑尺寸，相对于1920x1080

  // 1. 创建Phaser精灵对象
  const box = this.add.sprite(x, y, "box");
  box.setDisplaySize(boxSize, boxSize);

  // 2. 创建RAPIER物理体
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
  rigidBodyDesc.setTranslation(x / PIXELS_PER_METER, y / PIXELS_PER_METER);
  const rigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);

  // 3. 创建碰撞体
  const colliderDesc = RAPIER.ColliderDesc.cuboid(
    boxSize / 2 / PIXELS_PER_METER,
    boxSize / 2 / PIXELS_PER_METER
  );
  colliderDesc.setRestitution(0.7);
  this.rapierWorld.createCollider(colliderDesc, rigidBody);
}
```

### 2. 关键点说明

- **固定尺寸**: `boxSize = 80` 是相对于 1920x1080 的固定逻辑尺寸
- **自动适配**: Phaser 的缩放系统会自动将这个 80 像素的 box 适配到任何屏幕分辨率
- **物理一致性**: 物理计算始终基于逻辑坐标系，保证在任何分辨率下物理行为一致

## 创建 UI 组件

### 1. 游戏内 UI 元素（跟随游戏对象）

```typescript
// 为物理Box添加帧数显示文本
const fontSize = this.uiSettings.getScaledFontSize(16); // 基础字体大小16
const padding = this.uiSettings.getScaledSpacing(4); // 基础间距4

const frameText = this.add.text(x, y, "0", {
  fontSize: `${fontSize}px`,
  fontFamily: "Arial",
  color: "#ffffff",
  backgroundColor: "rgba(0,0,0,0.7)",
  padding: { x: padding, y: Math.round(padding * 0.5) },
});
frameText.setOrigin(0.5); // 居中显示

// 将文本绑定到Box上
box.setData("frameText", frameText);
```

### 2. 界面 UI 元素（固定位置）

```typescript
// 在UIScene中创建固定位置的UI元素
private createInstructionsUI() {
  const fontSize = this.uiSettings.getScaledFontSize(20); // 基础字体大小20
  const padding = this.uiSettings.getScaledSpacing(10);   // 基础间距10

  this.helpText = this.add.text(0, 0, instructions, {
    fontSize: `${fontSize}px`,
    fontFamily: "Arial",
    color: "#dddddd",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: { x: padding, y: Math.round(padding * 0.8) },
  });

  // 左上角锚定 - 使用相对间距
  this.helpText.setPosition(
    this.uiSettings.getScaledSpacing(20), // 距离左边20逻辑像素
    this.uiSettings.getScaledSpacing(20)  // 距离上边20逻辑像素
  );

  // UI不受游戏世界摄像头影响
  this.helpText.setScrollFactor(0);
}
```

## UI 缩放系统

### UISettings 类的使用

```typescript
// 获取UI设置实例
const uiSettings = UISettings.getInstance();

// 基础方法
uiSettings.getScaledFontSize(16); // 获取缩放后的字体大小
uiSettings.getScaledSpacing(10); // 获取缩放后的间距
uiSettings.getScaledSize(80); // 获取缩放后的尺寸

// 用户可以通过Q/E键调整UI缩放
// 小(0.8x) -> 正常(1.0x) -> 大(1.2x) -> 特大(1.5x)
```

## 最佳实践

### 1. 物理对象创建

```typescript
// ✅ 正确：使用固定的逻辑坐标
const boxX = GAME_WIDTH / 2; // 屏幕中央X
const boxY = 150; // 距离顶部150逻辑像素
const boxSize = 80; // 80x80逻辑像素
this.createDynamicBox(boxX, boxY);

// ❌ 错误：使用屏幕像素坐标
const boxX = this.scale.width / 2; // 这会随屏幕尺寸变化
```

### 2. UI 元素定位

```typescript
// ✅ 正确：使用锚点和相对位置
// 左上角锚定
element.setPosition(
  this.uiSettings.getScaledSpacing(20), // 固定边距
  this.uiSettings.getScaledSpacing(20)
);

// 右上角锚定
element.setOrigin(1, 0);
element.setPosition(
  this.scale.gameSize.width - this.uiSettings.getScaledSpacing(20),
  this.uiSettings.getScaledSpacing(20)
);

// ❌ 错误：使用硬编码像素位置
element.setPosition(100, 50); // 在不同分辨率下位置会错乱
```

### 3. 字体和尺寸

```typescript
// ✅ 正确：使用缩放方法
const fontSize = this.uiSettings.getScaledFontSize(16); // 基础16px
const padding = this.uiSettings.getScaledSpacing(8); // 基础8px间距

// ❌ 错误：使用硬编码尺寸
const fontSize = 16; // 不会响应UI缩放
```

## 缩放系统架构

### 游戏世界缩放

- **GameScene**: 使用`Phaser.Structs.Size`管理缩放
- **固定逻辑尺寸**: 1920x1080，所有游戏逻辑基于此尺寸
- **自动适配**: 根据屏幕尺寸自动计算最佳缩放比例

### UI 缩放系统

- **UIScene**: 始终保持 1:1 像素比例，不会模糊
- **独立缩放**: 用户可以通过 Q/E 键调整 UI 大小
- **锚点布局**: UI 元素使用相对定位，适配任何屏幕尺寸

## 示例：创建完整的 Box 系统

```typescript
// 在GameScene中创建带UI的物理Box
createBoxWithUI(logicalX: number, logicalY: number) {
  // 1. 创建物理Box（使用逻辑坐标）
  const boxSize = 80; // 相对于1920x1080的固定尺寸
  const box = this.add.sprite(logicalX, logicalY, "box");
  box.setDisplaySize(boxSize, boxSize);

  // 2. 设置物理属性
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
  rigidBodyDesc.setTranslation(logicalX / PIXELS_PER_METER, logicalY / PIXELS_PER_METER);
  const rigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(
    boxSize / 2 / PIXELS_PER_METER,
    boxSize / 2 / PIXELS_PER_METER
  );
  this.rapierWorld.createCollider(colliderDesc, rigidBody);

  // 3. 添加响应式UI文本
  const fontSize = this.uiSettings.getScaledFontSize(16);
  const padding = this.uiSettings.getScaledSpacing(4);

  const frameText = this.add.text(logicalX, logicalY, "0", {
    fontSize: `${fontSize}px`,
    fontFamily: "Arial",
    color: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: { x: padding, y: Math.round(padding * 0.5) },
  });
  frameText.setOrigin(0.5);

  // 4. 绑定UI到游戏对象
  box.setData("frameText", frameText);

  return { box, rigidBody, frameText };
}

// 调用示例
this.createBoxWithUI(GAME_WIDTH / 2, 200); // 屏幕中央，距顶部200像素
```

## 响应 UI 缩放变化

```typescript
// 当用户调整UI缩放时，自动更新所有UI元素
updateGameObjectsUI() {
  this.gameObjects.forEach((physicsObj) => {
    const frameText = physicsObj.phaserObj.getData("frameText");
    if (frameText) {
      // 重新计算字体大小和间距
      const fontSize = this.uiSettings.getScaledFontSize(16);
      const padding = this.uiSettings.getScaledSpacing(4);

      frameText.setStyle({
        fontSize: `${fontSize}px`,
        fontFamily: "Arial",
        color: frameText.style.color,
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: { x: padding, y: Math.round(padding * 0.5) },
      });
    }
  });
}
```

## 总结

通过使用固定的逻辑坐标系统（1920x1080）和 Phaser 的缩放管理器，您可以：

1. **使用固定数字**创建游戏对象，无需考虑屏幕分辨率
2. **自动适配**任何屏幕尺寸，保持游戏体验一致
3. **独立控制**UI 缩放，提供无障碍支持
4. **保持清晰度**，UI 文本在任何分辨率下都不会模糊

这种设计符合现代游戏开发的最佳实践，提供了灵活性和用户友好性的完美平衡。
