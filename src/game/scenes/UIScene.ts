import Phaser from "phaser";
import { EventBus, EVENTS } from "../EventBus";
import { UISettings, uiScaleOptions, resolutions } from "../UISettings";

export class UIScene extends Phaser.Scene {
  private mouseX: number = 0; // 当前鼠标X位置
  private readonly SPAWN_HEIGHT: number = 100; // 固定的生成高度
  private gameScene: Phaser.Scene | null = null; // 游戏场景引用
  private wasdKeys: any = null; // WASD键
  private readonly CAMERA_MOVE_SPEED = 10; // 摄像头移动速度
  private helpText: Phaser.GameObjects.Text | null = null; // UI文本引用
  private uiSettings: UISettings = UISettings.getInstance(); // UI设置管理器
  private uiContainer: Phaser.GameObjects.Container | null = null; // UI容器
  private currentResolutionIndex: number = 0; // 当前分辨率索引
  private currentUIScaleIndex: number = 1; // 当前UI缩放索引（默认为正常）

  constructor() {
    super("UIScene");
  }

  create() {
    // 获取GameScene引用
    this.gameScene = this.scene.get("GameScene");

    // 确保UI场景的摄像头不受渲染缩放影响
    this.cameras.main.setZoom(1);

    // 创建UI容器以便统一管理UI缩放
    this.uiContainer = this.add.container(0, 0);

    this.createUI();
    this.setupControls();
  }

  private createUI() {
    // 使用动态字体渲染和相对布局
    const instructions = this.getInstructionsText();

    // 使用动态字体大小
    const fontSize = this.uiSettings.getScaledFontSize(20);
    const padding = this.uiSettings.getScaledSpacing(10);

    this.helpText = this.add.text(0, 0, instructions, {
      fontSize: `${fontSize}px`,
      fontFamily: "Arial",
      color: "#dddddd",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: { x: padding, y: Math.round(padding * 0.8) },
    });

    // 使用锚点布局：左上角固定
    this.helpText.setPosition(
      this.uiSettings.getScaledSpacing(20),
      this.uiSettings.getScaledSpacing(20)
    );

    // 将UI元素添加到容器中
    if (this.uiContainer) {
      this.uiContainer.add(this.helpText);
    }

    // UI不受游戏世界摄像头影响
    this.helpText.setScrollFactor(0);

    // 添加状态显示UI（右上角锚点）
    this.createStatusUI();

    this.updateUIScale();
  }

  private createStatusUI() {
    // 创建状态显示文本（右上角锚定）
    const statusText = this.add.text(0, 0, "", {
      fontSize: `${this.uiSettings.getScaledFontSize(16)}px`,
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.8)",
      padding: {
        x: this.uiSettings.getScaledSpacing(8),
        y: this.uiSettings.getScaledSpacing(4),
      },
    });

    // 右上角锚点布局
    statusText.setOrigin(1, 0); // 右上角为原点
    statusText.setPosition(
      this.scale.width - this.uiSettings.getScaledSpacing(20),
      this.uiSettings.getScaledSpacing(20)
    );

    statusText.setScrollFactor(0);
    statusText.setData("isStatusText", true);

    if (this.uiContainer) {
      this.uiContainer.add(statusText);
    }

    // 更新状态显示
    this.updateStatusDisplay(statusText);
  }

  private updateStatusDisplay(statusText: Phaser.GameObjects.Text) {
    const renderScale = this.uiSettings.renderScale;
    const uiScale = this.uiSettings.getUIScale();
    const gameUIScale = this.uiSettings.getGameUIScale();

    const status = `渲染: ${resolutions[this.currentResolutionIndex].name}
渲染缩放: ${renderScale.toFixed(2)}x
UI界面缩放: ${uiScale.toFixed(2)}x (${
      uiScaleOptions[this.currentUIScaleIndex].name
    })
游戏内UI缩放: ${gameUIScale.toFixed(2)}x
帧率: ${Math.round(this.game.loop.actualFps)} FPS`;
    statusText.setText(status);
  }

  private getInstructionsText(): string {
    return `操作说明:
空格键 = 在鼠标X位置生成方块
鼠标点击 = 在点击位置生成方块

渲染分辨率切换 (UI界面保持清晰):
1 = ${resolutions[0].name} (${resolutions[0].width}x${resolutions[0].height}) ${
      this.currentResolutionIndex === 0 ? "[当前]" : ""
    }
2 = ${resolutions[1].name} (${resolutions[1].width}x${resolutions[1].height}) ${
      this.currentResolutionIndex === 1 ? "[当前]" : ""
    }
3 = ${resolutions[2].name} (${resolutions[2].width}x${resolutions[2].height}) ${
      this.currentResolutionIndex === 2 ? "[当前]" : ""
    }

UI独立缩放调节:
Q/E = 减小/放大UI (当前: ${uiScaleOptions[this.currentUIScaleIndex].name})
界面UI缩放: ${this.uiSettings.getUIScale().toFixed(2)}x

摄像头控制:
WASD = 移动摄像头

方块上的数字 = 移动的逻辑帧数
绿色数字 = 已停止移动的方块`;
  }

  private setupControls() {
    // --- Track mouse position ---
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      // 转换鼠标坐标到世界坐标
      if (this.gameScene) {
        const gameCamera = this.gameScene.cameras.main;
        const worldPoint = gameCamera.getWorldPoint(pointer.x, pointer.y);
        this.mouseX = worldPoint.x;
      } else {
        this.mouseX = pointer.x;
      }
    });

    // --- 2. Create keyboard listeners ---
    if (this.input.keyboard) {
      // 设置WASD键
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };

      // 空格键监听 - 在鼠标X位置创建方块
      this.input.keyboard.on("keydown-SPACE", () => {
        EventBus.emit(
          EVENTS.CREATE_BOX_AT_MOUSE,
          this.mouseX,
          this.SPAWN_HEIGHT
        );
      });

      // 渲染分辨率切换（不影响UI缩放）
      this.input.keyboard.on("keydown-ONE", () => {
        this.changeRenderResolution(0);
      });

      this.input.keyboard.on("keydown-TWO", () => {
        this.changeRenderResolution(1);
      });

      this.input.keyboard.on("keydown-THREE", () => {
        this.changeRenderResolution(2);
      });

      // 独立UI缩放控制
      this.input.keyboard.on("keydown-Q", () => {
        this.changeUIScale(-1); // 减小UI
      });

      this.input.keyboard.on("keydown-E", () => {
        this.changeUIScale(1); // 放大UI
      });
    }
  }

  // 更新UI缩放，重新渲染所有UI元素
  private updateUIScale() {
    // 更新帮助文本
    if (this.helpText) {
      // 重新设置字体大小以保证清晰度（矢量化渲染）
      const fontSize = this.uiSettings.getScaledFontSize(20);
      const padding = this.uiSettings.getScaledSpacing(10);

      this.helpText.setStyle({
        fontSize: `${fontSize}px`,
        fontFamily: "Arial",
        color: "#dddddd",
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: { x: padding, y: Math.round(padding * 0.8) },
      });

      // 重新计算位置以保持锚点布局
      this.helpText.setPosition(
        this.uiSettings.getScaledSpacing(20),
        this.uiSettings.getScaledSpacing(20)
      );

      // 更新指令文本内容
      this.helpText.setText(this.getInstructionsText());
    }

    // 更新所有UI容器中的状态文本
    if (this.uiContainer) {
      this.uiContainer.list.forEach((child: any) => {
        if (child.getData && child.getData("isStatusText")) {
          const statusText = child as Phaser.GameObjects.Text;

          // 更新状态文本的样式
          const fontSize = this.uiSettings.getScaledFontSize(16);
          const padding = this.uiSettings.getScaledSpacing(8);

          statusText.setStyle({
            fontSize: `${fontSize}px`,
            fontFamily: "Arial",
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: { x: padding, y: Math.round(padding * 0.5) },
          });

          // 重新计算右上角锚点位置
          statusText.setPosition(
            this.scale.width - this.uiSettings.getScaledSpacing(20),
            this.uiSettings.getScaledSpacing(20)
          );

          // 更新状态显示内容
          this.updateStatusDisplay(statusText);
        }
      });
    }
  }

  // 改变渲染分辨率（同步缩放UI基础尺寸）
  private changeRenderResolution(index: number) {
    if (index < 0 || index >= resolutions.length) return;

    this.currentResolutionIndex = index;
    const resolution = resolutions[index];

    if (this.gameScene) {
      const gameCamera = this.gameScene.cameras.main;

      // 计算渲染缩放比例
      const baseWidth = 1920;
      const baseHeight = 1080;
      const scaleX = resolution.width / baseWidth;
      const scaleY = resolution.height / baseHeight;
      const renderScale = Math.min(scaleX, scaleY);

      // 影响游戏世界的渲染精度
      gameCamera.setZoom(renderScale);

      // 同步设置UI基础缩放（会影响UI元素大小）
      this.uiSettings.setRenderScale(renderScale);
      this.uiSettings.setResolution(resolution.width, resolution.height);

      // 调整游戏显示尺寸
      this.scale.resize(resolution.width, resolution.height);

      console.log(
        `渲染分辨率切换到 ${resolution.name} (${resolution.width}x${
          resolution.height
        })，渲染缩放: ${renderScale.toFixed(2)}，UI界面缩放: ${this.uiSettings
          .getUIScale()
          .toFixed(2)}x`
      );
    }

    // 更新UI文本显示（会同步缩放）
    this.updateUIScale();

    // 通知其他场景UI缩放已变化
    EventBus.emit(EVENTS.UI_SCALE_CHANGED);
  }

  // 改变UI缩放（独立于渲染分辨率）
  private changeUIScale(direction: number) {
    const newIndex = this.currentUIScaleIndex + direction;
    if (newIndex < 0 || newIndex >= uiScaleOptions.length) return;

    this.currentUIScaleIndex = newIndex;
    const newUserUIScale = uiScaleOptions[newIndex].scale;

    this.uiSettings.setUserUIScale(newUserUIScale);
    this.updateUIScale();

    // 通知其他场景UI缩放已变化
    EventBus.emit(EVENTS.UI_SCALE_CHANGED);

    console.log(
      `UI独立缩放调整到: ${
        uiScaleOptions[newIndex].name
      } (${newUserUIScale}x)，UI界面缩放: ${this.uiSettings
        .getUIScale()
        .toFixed(2)}x`
    );
  }

  update() {
    // 处理WASD摄像头移动
    if (this.wasdKeys && this.gameScene) {
      const gameCamera = this.gameScene.cameras.main;

      if (this.wasdKeys.W.isDown) {
        gameCamera.scrollY -= this.CAMERA_MOVE_SPEED;
      }
      if (this.wasdKeys.S.isDown) {
        gameCamera.scrollY += this.CAMERA_MOVE_SPEED;
      }
      if (this.wasdKeys.A.isDown) {
        gameCamera.scrollX -= this.CAMERA_MOVE_SPEED;
      }
      if (this.wasdKeys.D.isDown) {
        gameCamera.scrollX += this.CAMERA_MOVE_SPEED;
      }
    }

    // 更新状态显示
    if (this.uiContainer) {
      this.uiContainer.list.forEach((child: any) => {
        if (child.getData && child.getData("isStatusText")) {
          this.updateStatusDisplay(child as Phaser.GameObjects.Text);
        }
      });
    }
  }

  // 重写resize事件处理器以保持UI布局
  resize(_gameSize: any, _baseSize: any, _displaySize: any, _resolution: any) {
    // 保持UI元素的相对位置和缩放
    this.updateUIScale();
  }
}
