import Phaser from 'phaser';
import { EventBus, EVENTS } from '../EventBus';

const resolutions = [
  { name: '1080p', width: 1920, height: 1080 },
  { name: '720p', width: 1280, height: 720 },
  { name: '540p', width: 960, height: 540 }
];

export class UIScene extends Phaser.Scene {
  private mouseX: number = 0; // 当前鼠标X位置
  private readonly SPAWN_HEIGHT: number = 100; // 固定的生成高度

  constructor() {
    super('UIScene');
  }

  create() {
    // --- 1. Display instructions ---
    const instructions = `操作说明:
空格键 = 在鼠标X位置生成方块
鼠标点击 = 在点击位置生成方块

分辨率切换:
1 = ${resolutions[0].name} (${resolutions[0].width}x${resolutions[0].height})
2 = ${resolutions[1].name} (${resolutions[1].width}x${resolutions[1].height})
3 = ${resolutions[2].name} (${resolutions[2].width}x${resolutions[2].height})

方块上的数字 = 移动的逻辑帧数
绿色数字 = 已停止移动的方块`;

    const helpText = this.add.text(20, 20, instructions, {
      font: '20px Arial',
      color: '#dddddd',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 10, y: 8 }
    });

    // The UI should not be affected by the main camera's zoom or scroll
    helpText.setScrollFactor(0);

    // --- Track mouse position ---
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.mouseX = pointer.x;
    });

    // --- 2. Create keyboard listeners ---
    if (this.input.keyboard) {
      // 空格键监听 - 在鼠标X位置创建方块
      this.input.keyboard.on('keydown-SPACE', () => {
        EventBus.emit(EVENTS.CREATE_BOX_AT_MOUSE, this.mouseX, this.SPAWN_HEIGHT);
      });

      this.input.keyboard.on('keydown-ONE', () => {
        this.changeResolution(resolutions[0].width, resolutions[0].height);
      });

      this.input.keyboard.on('keydown-TWO', () => {
        this.changeResolution(resolutions[1].width, resolutions[1].height);
      });

      this.input.keyboard.on('keydown-THREE', () => {
        this.changeResolution(resolutions[2].width, resolutions[2].height);
      });
    }
  }

  changeResolution(width: number, height: number) {
    // This is the core function for changing resolution.
    // It tells the Scale Manager to resize the game's logical canvas.
    // Because the mode is FIT, Phaser will automatically handle scaling
    // this new logical size into the available space.
    // NOTE: This will trigger a scene restart to apply the new dimensions correctly.
    this.scale.resize(width, height);
  }
}