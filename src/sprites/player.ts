import { Physics, Tweens } from 'phaser';
import { BLOCK_SIZE, BRONZE, FLAG, GOLD, HEART_FULL, SE_BOUNCE, SE_GET_ITEM, SE_INJURED, SE_KILL } from '../config/consts';
import { Body, PlatformSprite, SceneConfig, Sprite } from '../config/types';
import { MapScene } from '../scenes/map';

export class Player extends Physics.Arcade.Sprite implements Sprite {
    isDestroying = false;
    body = undefined as unknown as Body;
    lives = 3;
    cd = false;
    onBack = false;
    onWall = false;
    baseSpeed = 200;
    ended = false;
    bounceTween = undefined as unknown as Tweens.Tween | undefined;
    private currentScene: MapScene;

    constructor({ scene, x, y, texture, frame }: SceneConfig) {
        super(scene, x, y, texture, frame);
        this.currentScene = scene;
        this.initSprite();
        this.currentScene.add.existing(this);
    }

    setLives(lives: number) {
        this.lives = Math.min(lives, 3);
        this.currentScene.displayLives(lives);
        if (this.lives <= 0 && !this.ended) {
            this.ended = true;
            this.currentScene.failure();
        }
    }

    slowDown() {
        this.setVelocityX(this.baseSpeed - Math.abs(this.baseSpeed / 2));
    }

    speedUp() {
        this.setVelocityX(this.baseSpeed + Math.abs(this.baseSpeed / 2));
    }

    resetSpeed() {
        this.setVelocityX(this.baseSpeed);
    }

    jump() {
        if (+new Date() - this.currentScene.state.jumpStart < 500) {
            this.baseSpeed = this.onBack ? -200 : Math.max(200, this.baseSpeed);
            this.setVelocityY(-300);
        }
    }

    overlapsEnemy: any = (player: Sprite, enemy: Sprite) => {
        if (enemy.isDestroying) {
            return;
        }
        if (player.body.touching.down && enemy.body.touching.up && player.body.velocity.y > 0) {
            this.setVelocityY(-300);
            this.cd = true;
            this.currentScene.sound.play(SE_KILL);
            this.currentScene.time.delayedCall(50, () => this.cd = false, [], null);
            this.currentScene.state.jumping = false;
            this.currentScene.state.jumpStart = +new Date();
            this.currentScene.setScore(this.currentScene.state.score + 50).then();
            this.currentScene.dieTween(enemy);
        } else if (!this.cd) {
            this.injured();
        }
    };

    collidesPlatform: any = (player: Sprite, platform: PlatformSprite) => {
        if (platform.isDestroying || this.ended) {
            return;
        }
        const type = platform.frame.customData['type'];
        const direction = platform.frame.customData['direction'] || 'U';
        const { up: u1, down: d1, left: l1, right: r1 } = player.body.touching;
        const { up: u2, down: d2, left: l2, right: r2 } = platform.body.touching;
        this.onBack = type === 'back';
        if (d1 && u2) {
            this.currentScene.state.jumping = false;
            if (!this.cd) {
                this.baseSpeed = 200;
                if (type === 'slowDown') {
                    this.baseSpeed /= 2;
                }
                if (type === 'speedUp') {
                    this.baseSpeed *= 2;
                }
                if (type === 'stay') {
                    this.baseSpeed = 0;
                }
                if (type === 'damage') {
                    this.injured();
                }
            }
            if (type === 'jump' && direction === 'U') {
                this.currentScene.sound.play(SE_BOUNCE);
                this.currentScene.state.jumpStart = +new Date();
                this.setVelocityY(-900);
                this.currentScene.state.jumping = true;
            }
        } else if (u1 && d2) {
            if (type === 'jump' && direction === 'D') {
                this.currentScene.sound.play(SE_BOUNCE);
                this.currentScene.state.jumping = true;
                this.currentScene.state.jumpStart = +new Date();
                this.setVelocityY(600);
            } else if (type === 'getBronze') {
                this.getItemTween(platform, BRONZE, () => this.currentScene.setScore(this.currentScene.state.score + 100).then());
            } else if (type === 'getGold') {
                this.getItemTween(platform, GOLD, () => this.currentScene.setScore(this.currentScene.state.score + 500).then());
            } else if (type === 'getLife') {
                this.getItemTween(platform, HEART_FULL, () => this.setLives(this.lives + 1));
            }
            if (!this.cd && type === 'damage') {
                this.injured();
            }
        } else if (l1 && r2) {
            if (type === 'jump' && direction === 'R') {
                this.bounce(500);
            }
            if (!this.cd && type === 'damage') {
                this.injured();
            }
            if (this.bounceTween) {
                this.baseSpeed = 200;
                this.bounceTween.remove();
                this.bounceTween = undefined;
            }
        } else if (r1 && l2) {
            if (type === 'jump' && direction === 'L') {
                this.bounce(-500);
            } else if (type === 'damage') {
                !this.cd && this.injured();
            } else if (platform.isWall && !u1 && player.y - platform.y < 20) {
                this.onWall = true;
                this.setVelocityY(0);
                this.body.setAllowGravity(false);
            }
        }
    };

    collidesMovingPlatform: any = (player: Sprite, platform: Sprite) => {
        if (platform.body.touching.up && player.body.touching.down) {
            this.onBack = false;
            this.currentScene.state.jumping = false;
            if (!this.currentScene.state.standingPlatform) {
                this.currentScene.state.standingPlatform = platform;
                this.currentScene.state.standingPosition = player.x - platform.x;
                this.baseSpeed = 0;
                this.body.velocity.y = 0;
            }
        }
    };

    overlapsItem: any = async (player: Sprite, item: Sprite) => {
        if (item.isDestroying || this.ended) {
            return;
        }
        if (item.frame.texture.key === FLAG) {
            this.ended = true;
            this.currentScene.success();
            return;
        }
        switch (item.frame.customData['type']) {
            case 'bronzeCoin':
                this.currentScene.setScore(this.currentScene.state.score + 100).then();
                this.itemDestroyTween(item);
                break;
            case 'goldCoin':
                this.currentScene.setScore(this.currentScene.state.score + 500).then();
                this.itemDestroyTween(item);
                break;
            case 'speedUp':
                this.baseSpeed *= 1.25;
                this.itemDestroyTween(item);
                break;
            case 'slowDown':
                this.baseSpeed *= 0.75;
                this.itemDestroyTween(item);
                break;
            case 'life':
                this.setLives(this.lives + 1);
                this.itemDestroyTween(item);
                break;
            case 'doorIn1':
                this.x = this.currentScene.state.door[1]!.x;
                this.y = this.currentScene.state.door[1]!.y;
                break;
            case 'doorIn2':
                this.x = this.currentScene.state.door[2]!.x;
                this.y = this.currentScene.state.door[2]!.y;
                break;
            case 'doorIn3':
                this.x = this.currentScene.state.door[3]!.x;
                this.y = this.currentScene.state.door[3]!.y;
                break;
            default:
        }
    };

    private initSprite() {
        this.currentScene.physics.world.enable(this);
        this.setScale((BLOCK_SIZE - 4) / this.width);
    }

    private injured() {
        if (!this.ended) {
            this.currentScene.sound.play(SE_INJURED);
            this.setLives(this.lives - 1);
            this.baseSpeed *= -1;
            this.setVelocityY(-200);
            this.cd = true;
            this.playerInjuredTween();
        }
    }

    private playerInjuredTween() {
        this.currentScene.add.tween({
            targets: this,
            props: {
                alpha: {
                    value: 0,
                    duration: 50,
                    repeat: 15,
                },
            },
            onComplete: (tween, targets) => {
                targets.map((target: Sprite) => target.alpha = 1);
                this.baseSpeed = 100;
                this.cd = false;
            }
        });
    }

    private bounce(speed: number) {
        this.currentScene.sound.play(SE_BOUNCE);
        this.bounceTween = this.currentScene.tweens.add({
            targets: this.body.velocity,
            ease: 'Cubic',
            x: speed,
            duration: 1000,
            onStart: () => {
                this.body.velocity.x = speed;
                this.baseSpeed = 0;
                this.currentScene.state.jumpStart = +new Date();
            },
            onComplete: () => {
                this.baseSpeed = 200;
            }
        });
    }

    private getItemTween(platform: Sprite, item: string, callback: () => void) {
        this.currentScene.sound.play(SE_GET_ITEM);
        this.currentScene.add.tween({
            targets: platform,
            duration: 300,
            props: {
                alpha: 0
            },
            onStart: () => {
                platform.isDestroying = true;
                const itemObject = this.currentScene.add.image(platform.x, platform.y, item);
                this.currentScene.add.tween({
                    targets: itemObject,
                    duration: 300,
                    props: {
                        y: '-=100'
                    },
                    onComplete: () => {
                        callback();
                        itemObject.destroy();
                    }
                });
            },
            onComplete: () => {
                platform.isDestroying = false;
                platform.destroy();
            }
        });
    }

    private itemDestroyTween(item: Sprite) {
        this.currentScene.sound.play(SE_GET_ITEM);
        this.currentScene.destroySprite(item, { alpha: 0 }, 300);
    }

}
