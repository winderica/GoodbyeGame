import { Geom, Physics } from 'phaser';
import { BLOCK_SIZE } from '../config/consts';
import { Body, Group, SceneConfig, Sprite } from '../config/types';
import { MapScene } from '../scenes/map';

export class Enemy extends Physics.Arcade.Sprite implements Sprite {
    isDestroying: boolean;
    body = undefined as unknown as Body;
    private currentScene: MapScene;

    constructor({ scene, x, y, texture, frame }: SceneConfig, group: Group) {
        super(scene, x, y, texture, frame);
        group.add(this);
        this.currentScene = scene;
        this.isDestroying = false;
        this.initSprite();
        this.currentScene.add.existing(this);
    }

    update() {
        if (!Geom.Rectangle.Overlaps(this.currentScene.physics.world.bounds, this.getBounds())) {
            this.destroy();
        } else {
            if (this.body.velocity.x === 0 && this.body.velocity.y === 0 && this.x - this.currentScene.state.player.x < 1200) {
                const motion = this.frame.customData['motion'];
                const type = this.frame.customData['type'];
                if (motion === 'M') {
                    this.body.velocity.x = -70;
                } else if (motion === 'J') {
                    this.body.velocity.y = type === 'dog' ? -300 : -450;
                } else if (motion === 'MJ') {
                    this.body.velocity.x = -70;
                    this.body.velocity.y = type === 'dog' ? -300 : -450;
                }
            }
        }
    }

    private initSprite() {
        this.currentScene.physics.world.enable(this);
        const type = this.frame.customData['type'];
        this.body.setAllowGravity(type !== 'eagle');
        this.y += (BLOCK_SIZE - this.height) / 2;
        this.setBounce(1, 0);
        const motion = this.frame.customData['motion'];
        if (motion === 'LR') {
            this.currentScene.tweens.add({
                targets: this,
                props: { x: '+=140' },
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        } else if (motion === 'UD') {
            this.currentScene.tweens.add({
                targets: this,
                props: { y: '-=140' },
                duration: 1500,
                yoyo: true,
                repeat: -1
            });
        }
    }
}
