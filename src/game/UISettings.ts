// UI设置管理器 - 参考Phaser官方示例的缩放管理方式
export class UISettings {
  private static instance: UISettings;
  public userUIScale: number = 1.0; // 用户独立调节的UI缩放

  static getInstance(): UISettings {
    if (!UISettings.instance) {
      UISettings.instance = new UISettings();
    }
    return UISettings.instance;
  }

  setUserUIScale(scale: number) {
    this.userUIScale = scale;
  }

  // 获取UI缩放的字体大小
  getScaledFontSize(baseSize: number): number {
    return Math.round(baseSize * this.userUIScale);
  }

  // 获取UI缩放的间距
  getScaledSpacing(baseSpacing: number): number {
    return Math.round(baseSpacing * this.userUIScale);
  }

  // 获取UI缩放的尺寸
  getScaledSize(baseSize: number): number {
    return Math.round(baseSize * this.userUIScale);
  }
}

// UI缩放选项配置
export const uiScaleOptions = [
  { name: "小", scale: 0.8 },
  { name: "正常", scale: 1.0 },
  { name: "大", scale: 1.2 },
  { name: "特大", scale: 1.5 },
];
