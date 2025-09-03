// UI设置管理器 - 单例模式，在GameScene和UIScene之间共享
export class UISettings {
  private static instance: UISettings;
  public renderScale: number = 1.0; // 渲染分辨率缩放
  public userUIScale: number = 1.0; // 用户独立调节的UI缩放
  public currentResolution: { width: number; height: number } = {
    width: 1920,
    height: 1080,
  };

  static getInstance(): UISettings {
    if (!UISettings.instance) {
      UISettings.instance = new UISettings();
    }
    return UISettings.instance;
  }

  setRenderScale(scale: number) {
    this.renderScale = scale;
  }

  setUserUIScale(scale: number) {
    this.userUIScale = scale;
  }

  setResolution(width: number, height: number) {
    this.currentResolution = { width, height };
  }

  // 获取UI界面元素的缩放（保持清晰，不受渲染分辨率影响）
  getUIScale(): number {
    return this.userUIScale;
  }

  // 获取游戏内UI元素的缩放（考虑渲染缩放以保持相对大小）
  getGameUIScale(): number {
    // 游戏内UI元素需要补偿渲染缩放的影响
    return this.userUIScale / this.renderScale;
  }

  // 获取基于UI缩放的字体大小
  getScaledFontSize(baseSize: number): number {
    return Math.round(baseSize * this.getUIScale());
  }

  // 获取基于UI缩放的间距
  getScaledSpacing(baseSpacing: number): number {
    return Math.round(baseSpacing * this.getUIScale());
  }

  // 获取基于UI缩放的尺寸
  getScaledSize(baseSize: number): number {
    return Math.round(baseSize * this.getUIScale());
  }
}

// UI缩放选项配置
export const uiScaleOptions = [
  { name: "小", scale: 0.8 },
  { name: "正常", scale: 1.0 },
  { name: "大", scale: 1.2 },
  { name: "特大", scale: 1.5 },
];

// 渲染分辨率选项配置
export const resolutions = [
  { name: "1080p", width: 1920, height: 1080 },
  { name: "720p", width: 1280, height: 720 },
  { name: "540p", width: 960, height: 540 },
];
