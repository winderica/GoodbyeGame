import { Physics } from 'phaser';
import { BLOCK_SIZE, FLAG } from '../config/consts';
import { Body, SceneConfig, Sprite, StaticGroup } from '../config/types';
import { MapScene } from '../scenes/map';

export class Item extends Physics.Arcade.Sprite implements Sprite {
    isDestroying: boolean;
    body: Body;
    private currentScene: MapScene;

    constructor({ scene, x, y, texture, frame }: SceneConfig, group: StaticGroup) {
        super(scene, x, y, texture, frame);
        group.add(this);
        this.body = super.body as Body;
        this.currentScene = scene;
        this.isDestroying = false;
        this.initSprite();
        this.currentScene.add.existing(this);
    }

    private initSprite() {
        this.currentScene.anims.create({
            key: 'flutter',
            frames: this.currentScene.anims.generateFrameNumbers(FLAG, { start: 2, end: 0 }),
            frameRate: 5,
            repeat: -1
        });
        this.currentScene.physics.world.enable(this);
        this.body.setAllowGravity(false);
        this.body.setSize(BLOCK_SIZE, BLOCK_SIZE);
    }
}
