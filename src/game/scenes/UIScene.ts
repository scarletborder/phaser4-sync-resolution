import Phaser from "phaser";
import { EventBus, EVENTS } from "../EventBus";
import { UISettings, uiScaleOptions } from "../UISettings";

export class UIScene extends Phaser.Scene {
  private mouseX: number = 0; // 当前鼠标X位置
  private readonly SPAWN_HEIGHT: number = 100; // 固定的生成高度
  private gameScene: any = null; // 游戏场景引用
  private wasdKeys: any = null; // WASD键
  private readonly CAMERA_MOVE_SPEED = 10; // 摄像头移动速度
  private helpText: Phaser.GameObjects.Text | null = null; // UI文本引用
  private statusText: Phaser.GameObjects.Text | null = null; // 状态文本引用
  private uiSettings: UISettings = UISettings.getInstance(); // UI设置管理器
  private currentUIScaleIndex: number = 1; // 当前UI缩放索引（默认为正常）

  constructor() {
    super("UIScene");
  }

  create() {
    // 获取GameScene引用
    this.gameScene = this.scene.get("GameScene");

    this.createUI();
    this.setupControls();
  }

  private createUI() {
    // 创建操作说明（左上角锚定）
    this.createInstructionsUI();

    // 创建状态显示（右上角锚定）
    this.createStatusUI();

    this.updateUIScale();
  }

  private createInstructionsUI() {
    const instructions = this.getInstructionsText();
    const fontSize = this.uiSettings.getScaledFontSize(20);
    const padding = this.uiSettings.getScaledSpacing(10);

    this.helpText = this.add.text(0, 0, instructions, {
      fontSize: `${fontSize}px`,
      fontFamily: "Arial",
      color: "#dddddd",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: { x: padding, y: Math.round(padding * 0.8) },
    });

    // 左上角锚定
    this.helpText.setPosition(
      this.uiSettings.getScaledSpacing(20),
      this.uiSettings.getScaledSpacing(20)
    );

    // UI不受游戏世界摄像头影响
    this.helpText.setScrollFactor(0);
  }

  private createStatusUI() {
    const fontSize = this.uiSettings.getScaledFontSize(16);
    const padding = this.uiSettings.getScaledSpacing(8);

    this.statusText = this.add.text(0, 0, "", {
      fontSize: `${fontSize}px`,
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.8)",
      padding: {
        x: padding,
        y: Math.round(padding * 0.5),
      },
    });

    // 右上角锚定
    this.statusText.setOrigin(1, 0);
    this.statusText.setPosition(
      this.scale.gameSize.width - this.uiSettings.getScaledSpacing(20),
      this.uiSettings.getScaledSpacing(20)
    );

    this.statusText.setScrollFactor(0);
    this.updateStatusDisplay();
  }

  private updateStatusDisplay() {
    if (!this.statusText) return;

    const zoom = this.gameScene?.getZoom() || 1;
    const screenSize = `${this.scale.gameSize.width}x${this.scale.gameSize.height}`;

    const status = `屏幕尺寸: ${screenSize}
游戏缩放: ${zoom.toFixed(2)}x
UI缩放: ${
      uiScaleOptions[this.currentUIScaleIndex].name
    } (${this.uiSettings.userUIScale.toFixed(2)}x)
帧率: ${Math.round(this.game.loop.actualFps)} FPS`;

    this.statusText.setText(status);
  }

  private getInstructionsText(): string {
    return `操作说明:
空格键 = 在鼠标X位置生成方块
鼠标点击 = 在点击位置生成方块

UI独立缩放:
Q/E = 减小/放大UI (当前: ${uiScaleOptions[this.currentUIScaleIndex].name})

摄像头控制:
WASD = 移动摄像头

方块上的数字 = 移动的逻辑帧数
绿色数字 = 已停止移动的方块

分辨率自动适配屏幕尺寸`;
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

    // --- Create keyboard listeners ---
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

    // 更新状态文本
    if (this.statusText) {
      const fontSize = this.uiSettings.getScaledFontSize(16);
      const padding = this.uiSettings.getScaledSpacing(8);

      this.statusText.setStyle({
        fontSize: `${fontSize}px`,
        fontFamily: "Arial",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.8)",
        padding: { x: padding, y: Math.round(padding * 0.5) },
      });

      // 重新计算右上角锚点位置
      this.statusText.setPosition(
        this.scale.gameSize.width - this.uiSettings.getScaledSpacing(20),
        this.uiSettings.getScaledSpacing(20)
      );

      this.updateStatusDisplay();
    }
  }

  // 改变UI缩放（独立缩放控制）
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
      `UI缩放调整到: ${uiScaleOptions[newIndex].name} (${newUserUIScale}x)`
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
    this.updateStatusDisplay();
  }

  // 参考示例的摄像头更新方式
  updateCamera() {
    // UI场景的摄像头始终保持1:1，不受游戏场景缩放影响
    const camera = this.cameras.main;
    camera.setZoom(1);
    camera.centerOn(
      this.scale.gameSize.width / 2,
      this.scale.gameSize.height / 2
    );
  }

  // 重写resize事件处理器
  resize(_gameSize: any) {
    this.updateCamera();
    this.updateUIScale();
  }
}
