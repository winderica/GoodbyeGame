import { Physics } from 'phaser';
import { BLOCK_SIZE } from '../config/consts';
import { Body, PlatformSprite, SceneConfig, StaticGroup } from '../config/types';
import { MapScene } from '../scenes/map';

export class Platform extends Physics.Arcade.Sprite implements PlatformSprite {
    isWall = false;
    isDestroying = false;
    body = undefined as unknown as Body;
    private currentScene: MapScene;

    constructor({ scene, x, y, texture, frame }: SceneConfig, group: StaticGroup) {
        super(scene, x, y, texture, frame);
        group.add(this);
        this.currentScene = scene;
        this.initSprite();
        this.currentScene.add.existing(this);
    }

    setIsWall(isWall: boolean) {
        this.isWall = isWall;
    }

    private initSprite() {
        this.currentScene.physics.world.enable(this);
        const type = this.frame.customData['type'];
        if (type === 'thin') {
            this.body.setSize(BLOCK_SIZE, 1);
        }
        const direction = this.frame.customData['direction'];
        if (direction === 'D') {
            this.angle = -180;
        } else if (direction === 'L') {
            this.angle = -90;
        } else if (direction === 'R') {
            this.angle = 90;
        }
    }
}
