import Phaser from "phaser";

// 全局事件总线，用于场景间通信
export const EventBus = new Phaser.Events.EventEmitter();

// 定义事件常量
export const EVENTS = {
  CREATE_BOX_AT_MOUSE: "createBoxAtMouse",
  UI_SCALE_CHANGED: "uiScaleChanged",
};
