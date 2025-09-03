import Phaser from "phaser";
import RAPIER from "@dimforge/rapier2d-deterministic";
import { EventBus, EVENTS } from "../EventBus";
import { UISettings } from "../UISettings";

// The conversion ratio between Rapier's meters and Phaser's pixels.
const PIXELS_PER_METER = 100;

interface PhysicsObject {
  phaserObj: Phaser.GameObjects.Sprite;
  rapierBody: any; // Using any for RAPIER types to avoid import issues
  frameCount: number; // 已经过去的逻辑帧数
  isMoving: boolean; // 是否还在移动
  lastPosition: { x: number; y: number }; // 上一帧的位置
  stoppedFrameCount: number; // 静止帧数计数器
}

export class GameScene extends Phaser.Scene {
  private rapierWorld: any;
  private gameObjects: PhysicsObject[] = [];
  private readonly MOVEMENT_THRESHOLD: number = 0.1; // 移动阈值（像素）
  private readonly STOP_FRAME_THRESHOLD: number = 10; // 连续静止多少帧后认为完全停止
  private uiSettings: UISettings = UISettings.getInstance(); // UI设置管理器

  constructor() {
    super("GameScene");
  }

  preload() {
    // Create a simple texture for our boxes dynamically.
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xff4444, 1);
    graphics.fillRect(0, 0, 100, 100);
    graphics.generateTexture("box", 100, 100);
    graphics.destroy();
  }

  async create() {
    try {
      // Dynamic import of RAPIER
      this.rapierWorld = new RAPIER.World(new RAPIER.Vector2(0.0, 9.81));

      this.cameras.main.setBackgroundColor(0x87ceeb);

      // --- Create Ground ---
      const groundHeight = 50;

      // We create a Rapier rigid body with a collider for the ground
      const groundRigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
      groundRigidBodyDesc.setTranslation(
        this.scale.width / 2 / PIXELS_PER_METER,
        (this.scale.height - groundHeight / 2) / PIXELS_PER_METER
      );

      const groundRigidBody =
        this.rapierWorld.createRigidBody(groundRigidBodyDesc);

      // We create a ColliderDesc with a cuboid shape
      const groundColliderDesc = RAPIER.ColliderDesc.cuboid(
        this.scale.width / 2 / PIXELS_PER_METER,
        groundHeight / 2 / PIXELS_PER_METER
      );

      // Finally, we create a collider with the colliderDesc and the rigid body
      this.rapierWorld.createCollider(groundColliderDesc, groundRigidBody);

      // Phaser visualization for the ground
      this.add.rectangle(
        this.scale.width / 2,
        this.scale.height - groundHeight / 2,
        this.scale.width,
        groundHeight,
        0x44ff44
      );

      // --- Allow creating boxes on click ---
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // 转换屏幕坐标为世界坐标
        const worldPoint = this.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y
        );
        this.createDynamicBox(worldPoint.x, worldPoint.y);
      });

      // --- Listen to EventBus for spacebar box creation ---
      EventBus.on(EVENTS.CREATE_BOX_AT_MOUSE, (x: number, y: number) => {
        this.createDynamicBox(x, y);
      });

      // 监听UI缩放变化事件
      EventBus.on(EVENTS.UI_SCALE_CHANGED, () => {
        this.updateGameObjectsUI();
      });

      // Create an initial box
      this.createDynamicBox(this.scale.width / 2, 150);
    } catch (error) {
      console.error("Failed to initialize RAPIER:", error);
      // Fallback to simple physics if RAPIER fails
      this.createFallbackPhysics();
    }
  }

  createFallbackPhysics() {
    this.cameras.main.setBackgroundColor(0x87ceeb);

    // Create a simple ground rectangle
    const groundHeight = 50;
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - groundHeight / 2,
      this.scale.width,
      groundHeight,
      0x44ff44
    );

    // Allow creating boxes on click
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // 转换屏幕坐标为世界坐标
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.createSimpleBox(worldPoint.x, worldPoint.y);
    });

    // Create an initial box
    this.createSimpleBox(this.scale.width / 2, 150);
  }

  createSimpleBox(x: number, y: number) {
    const boxSize = 80;
    const box = this.add.sprite(x, y, "box");
    box.setDisplaySize(boxSize, boxSize);

    // 创建帧数显示文本（使用游戏内UI缩放）
    const fontSize = Math.round(16 * this.uiSettings.getGameUIScale());
    const padding = Math.round(4 * this.uiSettings.getGameUIScale());

    const frameText = this.add.text(x, y, "0", {
      fontSize: `${fontSize}px`,
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: { x: padding, y: Math.round(padding * 0.5) },
    });
    frameText.setOrigin(0.5);

    // 简单物理模拟变量
    let frameCount = 0;
    let isMoving = true;
    let velocity = { x: 0, y: 0 };
    const gravity = 0.5;
    const groundY = this.scale.height - 75; // Ground level
    const bounce = 0.7;

    const updateBox = () => {
      if (isMoving) {
        // 应用重力
        velocity.y += gravity;

        // 更新位置
        box.y += velocity.y;
        box.x += velocity.x;

        // 检查地面碰撞
        if (box.y >= groundY) {
          box.y = groundY;
          velocity.y *= -bounce; // 反弹
          velocity.x *= 0.9; // 摩擦力

          // 如果速度很小，停止移动
          if (Math.abs(velocity.y) < 0.5 && Math.abs(velocity.x) < 0.1) {
            isMoving = false;
            console.log(`简单物理方块停止！总共移动了 ${frameCount} 逻辑帧`);
            frameText.setStyle({ color: "#00ff00" }); // 绿色表示已停止
          }
        }

        // 更新帧数
        frameCount++;
        frameText.setText(frameCount.toString());
      }

      // 更新文本位置
      frameText.x = box.x;
      frameText.y = box.y;
    };

    this.time.addEvent({
      delay: 16, // ~60fps
      callback: updateBox,
      loop: true,
    });
  }

  createDynamicBox(x: number, y: number) {
    if (!this.rapierWorld || !RAPIER) {
      // 如果 RAPIER 没有初始化，使用简单物理
      this.createSimpleBox(x, y);
      return;
    }

    const boxSize = 80;

    // We create a phaser game object and a Rapier rigid body with a collider
    const box = this.add.sprite(x, y, "box");
    box.setDisplaySize(boxSize, boxSize);

    // We create a Rapier rigid body with a collider
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
    rigidBodyDesc.setTranslation(x / PIXELS_PER_METER, y / PIXELS_PER_METER);

    // This step is important we need store the phaser game object in the rigid body user data to update the game object position and rotation.
    rigidBodyDesc.setUserData(box);

    // We create a Rapier rigid body with a collider
    const rigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);

    // We create a ColliderDesc with a cuboid shape and set the restitution to 0.7
    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      boxSize / 2 / PIXELS_PER_METER,
      boxSize / 2 / PIXELS_PER_METER
    );

    colliderDesc.setRestitution(0.7);

    // Finally, we create a collider with the colliderDesc and the rigid body
    this.rapierWorld.createCollider(colliderDesc, rigidBody);

    // 创建带有统计信息的物理对象
    const physicsObject: PhysicsObject = {
      phaserObj: box,
      rapierBody: rigidBody,
      frameCount: 0,
      isMoving: true,
      lastPosition: { x: x, y: y },
      stoppedFrameCount: 0,
    };

    this.gameObjects.push(physicsObject);

    // 为box添加一个文本显示帧数（使用游戏内UI缩放）
    const fontSize = Math.round(16 * this.uiSettings.getGameUIScale());
    const padding = Math.round(4 * this.uiSettings.getGameUIScale());

    const frameText = this.add.text(x, y, "0", {
      fontSize: `${fontSize}px`,
      fontFamily: "Arial",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: { x: padding, y: Math.round(padding * 0.5) },
    });
    frameText.setOrigin(0.5); // 居中显示

    // 将文本存储在sprite的数据中
    box.setData("frameText", frameText);
  }

  update() {
    // We need to check if the Rapier world is initialized
    if (this.rapierWorld !== undefined) {
      // Step the physics world
      this.rapierWorld.step();

      // Update the Phaser game objects with the physics world
      this.gameObjects.forEach((physicsObj) => {
        const gameObject = physicsObj.phaserObj;
        const rigidBody = physicsObj.rapierBody;

        if (gameObject && rigidBody) {
          const position = rigidBody.translation();
          const angle = rigidBody.rotation();

          const newX = position.x * PIXELS_PER_METER;
          const newY = position.y * PIXELS_PER_METER;

          gameObject.x = newX;
          gameObject.y = newY;
          gameObject.setRotation(angle);

          // 检测是否还在移动
          if (physicsObj.isMoving) {
            const deltaX = Math.abs(newX - physicsObj.lastPosition.x);
            const deltaY = Math.abs(newY - physicsObj.lastPosition.y);
            const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (totalMovement < this.MOVEMENT_THRESHOLD) {
              physicsObj.stoppedFrameCount++;
              if (physicsObj.stoppedFrameCount >= this.STOP_FRAME_THRESHOLD) {
                physicsObj.isMoving = false;
                console.log(
                  `物块停止！总共移动了 ${physicsObj.frameCount} 逻辑帧`
                );

                // 更新文本颜色表示已停止
                const frameText = gameObject.getData(
                  "frameText"
                ) as Phaser.GameObjects.Text;
                if (frameText) {
                  frameText.setStyle({ color: "#00ff00" }); // 绿色表示已停止
                }
              }
            } else {
              physicsObj.stoppedFrameCount = 0; // 重置停止计数器
            }

            physicsObj.frameCount++; // 增加帧数
          }

          // 更新位置记录
          physicsObj.lastPosition.x = newX;
          physicsObj.lastPosition.y = newY;

          // 更新帧数显示
          const frameText = gameObject.getData(
            "frameText"
          ) as Phaser.GameObjects.Text;
          if (frameText) {
            frameText.setText(physicsObj.frameCount.toString());
            frameText.x = gameObject.x;
            frameText.y = gameObject.y;
          }
        }
      });
    }
  }

  // 更新所有游戏对象的UI元素以响应UI缩放变化
  updateGameObjectsUI() {
    this.gameObjects.forEach((physicsObj) => {
      const frameText = physicsObj.phaserObj.getData(
        "frameText"
      ) as Phaser.GameObjects.Text;
      if (frameText) {
        // 使用游戏内UI缩放来补偿渲染缩放的影响
        const fontSize = Math.round(16 * this.uiSettings.getGameUIScale());
        const padding = Math.round(4 * this.uiSettings.getGameUIScale());

        frameText.setStyle({
          fontSize: `${fontSize}px`,
          fontFamily: "Arial",
          color: frameText.style.color, // 保持当前颜色
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: { x: padding, y: Math.round(padding * 0.5) },
        });
      }
    });
  }

  destroy() {
    // 清理 EventBus 监听器
    EventBus.off(EVENTS.CREATE_BOX_AT_MOUSE);
    EventBus.off(EVENTS.UI_SCALE_CHANGED);
  }
}
