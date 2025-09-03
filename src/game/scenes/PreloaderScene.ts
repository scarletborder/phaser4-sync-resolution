import Phaser from 'phaser';

export class PreloaderScene extends Phaser.Scene {
  constructor() {
    super('PreloaderScene');
  }

  preload() {
    // Display a loading message
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Loading Physics...', {
      font: '48px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  create() {
    // Start the main game scenes.
    this.scene.start('GameScene');
    // 'launch' runs the UI scene in parallel to the GameScene.
    this.scene.launch('UIScene');
  }
}