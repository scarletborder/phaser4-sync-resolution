import Phaser from 'phaser';
import { PreloaderScene } from './scenes/PreloaderScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

// Base logical resolution. All game logic is built for this size.
const LOGICAL_WIDTH = 1920;
const LOGICAL_HEIGHT = 1080;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  // The parent div in index.html
  parent: 'game-container',
  // Set the game's logical size.
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT,
  // Physics is handled by Rapier, so we don't need Phaser's built-in physics.
  physics: {},
  // Configure the Scale Manager
  scale: {
    // This is the key: FIT mode maintains the aspect ratio (16:9)
    // and scales the canvas to fit the parent container.
    mode: Phaser.Scale.FIT,
    // Center the canvas horizontally and vertically within the parent.
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // List of all scenes in the game
  scene: [PreloaderScene, GameScene, UIScene],
};

// Instantiate the game
const game = new Phaser.Game(config);

export default game;