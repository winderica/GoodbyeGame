import { Physics } from 'phaser';
import { BLOCK_SIZE } from '../config/consts';
import { Body, Group, SceneConfig } from '../config/types';
import { MapScene } from '../scenes/map';

export class MovingPlatform extends Physics.Arcade.Sprite {
    body = undefined as unknown as Body;
    private currentScene: MapScene;

    constructor({ scene, x, y, texture, frame }: SceneConfig, group: Group) {
        super(scene, x, y, texture, frame);
        group.add(this);
        this.currentScene = scene;
        this.initSprite();
        this.currentScene.add.existing(this);
    }

    private initSprite() {
        this.currentScene.physics.world.enable(this);
        const moving = this.frame.customData['moving'];
        if (moving) {
            this.body.setImmovable(true);
            this.body.setAllowGravity(false);
            moving === 'LR' && (this.x -= BLOCK_SIZE);
            this.currentScene.tweens.add({
                targets: this,
                props: moving === 'LR' ? { x: '+=200' } : { y: '-=200' },
                duration: 2000,
                yoyo: true,
                repeat: -1
            });
        }
    }
}
