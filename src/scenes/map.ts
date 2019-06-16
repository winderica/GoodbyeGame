import { Geom, Scene } from 'phaser';
import { map as map0 } from '../assets/map/1.json';
import { BACKGROUND, BRONZE, ENEMY, FLAG, GOLD, HEART_EMPTY, HEART_FULL, ITEM, PLATFORM, PLAYER, SCORE, SIZE } from '../config/consts';
import { Group, Image, Sprite, StaticGroup } from '../config/types';
// use require to include resources
require('../utils/importer');

// use require to get path rather than JSON object
const platformJSON = require('../assets/platform/platform.json');
const enemyJSON = require('../assets/enemy/enemy.json');
const itemJSON = require('../assets/item/item.json');

interface Door {
    [index: number]: null | {
        x: number;
        y: number;
    };
}

interface State {
    player: Sprite;
    platforms: StaticGroup;
    movingPlatforms: Group;
    items: StaticGroup;
    enemies: Group;
    lives: number;
    baseSpeed: number;
    cd: boolean;
    score: number;
    jumping: boolean;
    jumpStart: number;
    map: number[][];
    stage: number;
    onBack: boolean;
    onWall: boolean;
    standingPlatform: Sprite | null;
    standingPosition: number;
    door: Door;
    scoreImages: Image[];
    livesImages: Image[];
}

const initState: () => State = () => ({
    player: undefined as unknown as Sprite,
    platforms: undefined as unknown as StaticGroup,
    movingPlatforms: undefined as unknown as Group,
    items: undefined as unknown as StaticGroup,
    enemies: undefined as unknown as Group,
    lives: 3,
    baseSpeed: 100,
    cd: false,
    score: 0,
    jumping: false,
    scoreImages: [] as Image[],
    livesImages: [] as Image[],
    jumpStart: 0,
    standingPlatform: null,
    standingPosition: 0,
    map: map0,
    onBack: false,
    onWall: false,
    door: {
        1: null,
        2: null,
        3: null
    },
    stage: 0
});

export class MapScene extends Scene {

    state = {} as State;

    constructor() {
        super({
            key: "Map"
        });
    }

    init(data: State) {
        this.state = { ...initState(), ...data };
    }

    preload() {
        this.load.multiatlas(PLATFORM, platformJSON, 'src/assets/platform/');
        this.load.multiatlas(ENEMY, enemyJSON, 'src/assets/enemy/');
        this.load.multiatlas(ITEM, itemJSON, 'src/assets/item/');
        this.load.image(PLAYER, 'src/assets/character/character.png');
        this.load.image(BACKGROUND, 'src/assets/background/forest.png');
        [...new Array(10)].map((i, j) => this.load.image(SCORE(j), `src/assets/status/${j}.png`));
        this.load.image(GOLD, 'src/assets/status/gold.png');
        this.load.image(BRONZE, 'src/assets/status/bronze.png');
        this.load.image(HEART_EMPTY, 'src/assets/status/heartEmpty.png');
        this.load.image(HEART_FULL, 'src/assets/status/heartFull.png');
        this.load.spritesheet(FLAG, 'src/assets/item/flag.png', {
            frameHeight: SIZE,
            frameWidth: SIZE
        });
    };

    create() {
        const height = this.state.map.length * SIZE;
        const width = this.state.map[0].length * SIZE;
        const { innerWidth, innerHeight } = window;
        this.state.movingPlatforms = this.physics.add.group();
        this.state.platforms = this.physics.add.staticGroup();
        this.state.items = this.physics.add.staticGroup();
        this.state.enemies = this.physics.add.group();
        this.add.tileSprite(innerWidth / 2, innerHeight / 2, width, height, BACKGROUND).setScrollFactor(0);
        this.state.map.map(this.addTile);
        this.physics.world.setBounds(-200, -1000, width + 400, height + 1000);
        this.physics.add.collider(this.state.enemies, this.state.platforms, this.enemyCollidesPlatform);
        this.physics.add.collider(this.state.player, this.state.movingPlatforms, this.playerCollidesMovingPlatform);
        this.physics.add.collider(this.state.player, this.state.platforms, this.playerCollidesPlatform, this.handlePlatformProcess);
        this.physics.add.overlap(this.state.player, this.state.enemies, this.playerOverlapsEnemy, this.handleEnemyProcess);
        this.physics.add.overlap(this.state.player, this.state.items, this.playerOverlapsItem);
        this.cameras.main.setBounds(-200, 0, width + innerWidth, height);
        this.cameras.main.startFollow(this.state.player, false, 1, 1, -innerWidth / 3, 0);
        this.add.image(innerWidth - 220, 100, GOLD).setScrollFactor(0);
        this.displayLives(this.state.lives);
        this.displayScore(this.state.score);
    }

    update() {
        const { standingPlatform, player, enemies, baseSpeed, jumping, standingPosition } = this.state;
        enemies.children.each((child) => {
            const enemy = child as Sprite;
            if (!Geom.Rectangle.Overlaps(this.physics.world.bounds, enemy.getBounds())) {
                enemy.destroy();
            } else {
                if (enemy.body.velocity.x === 0 && enemy.body.velocity.y === 0 && enemy.x - player.x < 1200) {
                    const motion = enemy.frame.customData['motion'];
                    if (motion === 'M') {
                        enemy.body.velocity.x = -70;
                    } else if (motion === 'J') {
                        enemy.body.velocity.y = -300;
                    } else if (motion === 'MJ') {
                        enemy.body.velocity.x = -70;
                        enemy.body.velocity.y = -300;
                    }
                }
            }
        });
        if (!Geom.Rectangle.Overlaps(this.physics.world.bounds, player.getBounds())) {
            this.setLives(0);
        }
        const cursors = this.input.keyboard.createCursorKeys();
        if (cursors.left!.isDown) {
            player.setVelocityX(baseSpeed - Math.abs(baseSpeed / 2));
        } else if (cursors.right!.isDown) {
            player.setVelocityX(baseSpeed + Math.abs(baseSpeed / 2));
        } else {
            player.setVelocityX(baseSpeed);
        }
        if (!player.body.touching.right) {
            player.body.setAllowGravity(true);
        }
        cursors.up!.on('down', () => {
            if (this.state.onWall && !this.state.player.body.touching.up) {
                this.state.onWall = false;
                this.add.tween({
                    targets: player,
                    y: '-=140',
                    duration: 500
                });
                this.state.jumpStart = +new Date();
                this.state.jumping = false;
            } else if (!jumping && this.state.player.body.touching.down) {
                this.state.jumpStart = +new Date();
            }
        });
        cursors.up!.on('up', () => {
            this.state.jumpStart = 0;
            this.state.jumping = true;
        });
        if (cursors.up!.isDown && !jumping) {
            this.checkJump();
        }
        if (standingPlatform) {
            if (cursors.up!.isDown) {
                this.state.standingPlatform = null;
            } else {
                player.x = standingPlatform.x + standingPosition;
                player.y = standingPlatform.y - SIZE;
            }
        }
    }

    private checkJump = () => {
        if (+new Date() - this.state.jumpStart < 500) {
            this.state.baseSpeed = this.state.onBack ? -200 : 200;
            this.state.player.setVelocityY(-300);
        }
    };

    private displayLives = (lives: number) => {
        this.state.livesImages.map((i) => i.destroy());
        this.state.livesImages = [lives >= 1, lives >= 2, lives >= 3].map((i, j) =>
            this.add.image(window.innerWidth - 160 + j * 60, 40, i ? HEART_FULL : HEART_EMPTY).setScrollFactor(0)
        );
    };

    private displayScore = (score: number) => {
        this.state.scoreImages.map((i) => i.destroy());
        this.state.scoreImages = [...`${score}`.padStart(5, '0')].map((i, j) =>
            this.add.image(window.innerWidth - 170 + j * 35, 100, SCORE(+i)).setScrollFactor(0)
        );
    };

    private setLives = (lives: number) => {
        this.state.lives = Math.min(lives, 3);
        this.displayLives(lives);
        if (this.state.lives <= 0) {
            const next = Math.min(this.state.stage, 49);
            localStorage.setItem('currentStage', `${next}`);
            this.scene.start('Main');
        }
    };

    private setScore = async (score: number) => {
        let prevScore = this.state.score;
        this.state.score = score;
        while (prevScore < score) {
            prevScore += 10;
            this.displayScore(prevScore);
            await new Promise((resolve) => setTimeout(resolve, 40));
        }
    };

    private playerOverlapsEnemy: any = (player: Sprite, enemy: Sprite) => {
        if (this.state.cd || enemy.isDestroying) {
            return;
        }
        if (player.body.touching.down && enemy.body.touching.up && player.body.velocity.y > 0) {
            this.state.player.setVelocityY(-200);
            this.state.jumping = false;
            this.state.jumpStart = +new Date();
            this.enemyDieTween(enemy);
        } else {
            this.injured(player);
        }
    };

    private injured = (player: Sprite) => {
        this.setLives(this.state.lives - 1);
        this.state.baseSpeed = -this.state.baseSpeed;
        this.state.player.setVelocityY(-200);
        this.state.cd = true;
        this.playerInjuredTween(player);
    };

    private handleEnemyProcess: any = (player: Sprite, enemy: Sprite) => {
        return !enemy.isDestroying;
    };

    private playerCollidesPlatform: any = (player: Sprite, platform: Sprite) => {
        if (platform.isDestroying) {
            return;
        }
        const type = platform.frame.customData['type'];
        const direction = platform.frame.customData['direction'] || 'U';
        const { up: u1, down: d1, left: l1, right: r1 } = player.body.touching;
        const { up: u2, down: d2, left: l2, right: r2 } = platform.body.touching;
        if (d1 && u2) {
            this.state.jumping = false;
            if (!this.state.cd) {
                this.state.baseSpeed = 150;
                if (type === 'slowDown') {
                    this.state.baseSpeed = 100;
                }
                if (type === 'speedUp') {
                    this.state.baseSpeed = 250;
                }
                if (type === 'stay') {
                    this.state.baseSpeed = 0;
                }
                if (type === 'damage') {
                    this.injured(player);
                }
            }
            if (type === 'jump' && direction === 'U') {
                this.state.jumpStart = +new Date();
                this.state.player.setVelocityY(-700);
            }
            this.state.onBack = type === 'back';
        } else if (u1 && d2) {
            if (type === 'jump' && direction === 'D') {
                this.state.jumping = false;
                this.state.jumpStart = +new Date();
                this.state.player.setVelocityY(600);
            } else if (type === 'getBronze') {
                this.getItemTween(platform, BRONZE, () => this.setScore(this.state.score + 100).then());
            } else if (type === 'getGold') {
                this.getItemTween(platform, GOLD, () => this.setScore(this.state.score + 500).then());
            } else if (type === 'getLife') {
                this.getItemTween(platform, HEART_FULL, () => this.setLives(this.state.lives + 1));
            }
        } else if (l1 && r2) {
            if (type === 'jump' && direction === 'R') {
                this.tweens.add({
                    targets: this.state.player,
                    x: '+=1000',
                    duration: 1000,
                    ease: 'Cubic',
                });
            }
        } else if (r1 && l2) {
            if (type === 'jump' && direction === 'L') {
                this.tweens.add({
                    targets: this.state.player.body.velocity,
                    x: -500,
                    duration: 1000,
                    onStart: () => {
                        this.state.player.body.velocity.x = -500;
                    }
                });
            } else if (type === 'back') {
                this.state.onBack = true;
            } else {
                this.state.onWall = true;
                this.state.player.body.setAllowGravity(false);
            }
        }
    };

    private playerCollidesMovingPlatform: any = (player: Sprite, platform: Sprite) => {
        if (platform.body.touching.up && player.body.touching.down) {
            this.state.jumping = false;
            if (!this.state.standingPlatform) {
                this.state.standingPlatform = platform;
                this.state.standingPosition = player.x - platform.x;
                this.state.baseSpeed = 0;
                player.body.velocity.y = 0;
            }
        }
    };

    private handlePlatformProcess: any = (player: Sprite, platform: Sprite) => {
        if (platform.frame.customData['type'] === 'thin' && player.body.velocity.y < 0) {
            return false;
        } else if (platform.frame.customData['type'] === 'enemyBarrier') {
            return false;
        }
        return true;
    };

    private playerOverlapsItem: any = async (player: Sprite, item: Sprite) => {
        if (item.isDestroying) {
            return;
        }
        if (item.frame.texture.key === FLAG) {
            item.isDestroying = true;
            const next = Math.min(this.state.stage + 1, 49);
            localStorage.setItem('currentStage', `${next}`);
            const clearUntil = +(localStorage.getItem('clearedUntil') || '');
            localStorage.setItem('clearedUntil', `${Math.max(clearUntil, next)}`);
            this.scene.start('Main');
            return;
        }
        switch (item.frame.customData['type']) {
            case 'bronzeCoin':
                this.setScore(this.state.score + 100).then();
                this.itemDestroyTween(item);
                break;
            case 'goldCoin':
                this.setScore(this.state.score + 500).then();
                this.itemDestroyTween(item);
                break;
            case 'speedUp':
                this.state.baseSpeed *= 1.25;
                this.itemDestroyTween(item);
                break;
            case 'slowDown':
                this.state.baseSpeed *= 0.75;
                this.itemDestroyTween(item);
                break;
            case 'life':
                this.setLives(this.state.lives + 1);
                this.itemDestroyTween(item);
                break;
            case 'doorIn1':
                this.state.player.x = this.state.door[1]!.x;
                this.state.player.y = this.state.door[1]!.y;
                break;
            case 'doorIn2':
                this.state.player.x = this.state.door[2]!.x;
                this.state.player.y = this.state.door[2]!.y;
                break;
            case 'doorIn3':
                this.state.player.x = this.state.door[3]!.x;
                this.state.player.y = this.state.door[3]!.y;
                break;
            default:
        }
    };

    private enemyCollidesPlatform: any = async (enemy: Sprite, platform: Sprite) => {
        if (enemy.body.touching.right && platform.body.touching.left) {
            enemy.setFlipX(false);
        }
        if (enemy.body.touching.left && platform.body.touching.right) {
            enemy.setFlipX(true);
        }
    };

    private addTile = (row: number[], i: number) => {
        row.map((index, j) => {
            const y = i * SIZE;
            const x = j * SIZE;
            if (index > 0 && index <= 20 || index === 30) {
                const platform: Sprite = this.state.platforms.create(x, y, PLATFORM, `${index}.png`);
                const direction = platform.frame.customData['direction'];
                const type = platform.frame.customData['type'];
                if (type === 'thin') {
                    platform.body.setSize(SIZE, 1);
                }
                if (direction === 'D') {
                    platform.angle = -180;
                } else if (direction === 'L') {
                    platform.angle = -90;
                } else if (direction === 'R') {
                    platform.angle = 90;
                }
            } else if (index > 20 && index < 30) {
                const platform: Sprite = this.state.movingPlatforms.create(x, y, PLATFORM, `${index}.png`);
                const moving = platform.frame.customData['moving'];
                if (moving) {
                    platform.setImmovable(true);
                    platform.body.setAllowGravity(false);
                    this.tweens.add({
                        targets: platform,
                        props: moving === 'LR' ? { x: '+=200' } : { y: '+=200' },
                        duration: 2000,
                        yoyo: true,
                        repeat: -1
                    });
                }
            } else if (index >= 50 && index < 60) {
                this.state.items.create(x, y, ITEM, `${index}.png`);
            } else if (index >= 60 && index < 90) {
                const item: Sprite = this.state.items.create(x, y + SIZE, ITEM, `${index}.png`);
                const type = item.frame.customData['type'];
                if (type.includes('doorOut')) {
                    this.state.door[+type.slice(-1)] = { x, y };
                }
            } else if (index === 90) {
                this.anims.create({
                    key: 'flutter',
                    frames: this.anims.generateFrameNumbers(FLAG, {
                        start: 2,
                        end: 0
                    }),
                    frameRate: 5,
                    repeat: -1
                });
                const item: Sprite = this.state.items.create(x, y + 2 * SIZE, ITEM, `${index}.png`);
                item.anims.play('flutter');
            } else if (index === 99) {
                this.state.player = this.physics.add.sprite(x, y - 100, PLAYER) as Sprite;
                this.state.player.setScale(SIZE / this.state.player.height);
            } else if (index >= 100) {
                const enemy: Sprite = this.state.enemies.create(x, y, ENEMY, `${index}.png`);
                const type = enemy.frame.customData['type'];
                enemy.body.setAllowGravity(type !== 'eagle');
                enemy.y += (SIZE - enemy.height) / 2;
                enemy.setBounce(1, 0);
                const motion = enemy.frame.customData['motion'];
                if (motion === 'LR') {
                    this.tweens.add({
                        targets: enemy,
                        props: { x: '+=140' },
                        duration: 1000,
                        yoyo: true,
                        repeat: -1
                    });
                } else if (motion === 'UD') {
                    this.tweens.add({
                        targets: enemy,
                        props: { y: '+=140' },
                        duration: 1000,
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        });
    };

    private playerInjuredTween = (player: Sprite) => {
        this.add.tween({
            targets: player,
            props: {
                alpha: {
                    value: 0,
                    duration: 50,
                    repeat: 15,
                },
            },
            onComplete: (tween, targets) => {
                targets.map((target: Sprite) => target.alpha = 1);
                this.state.baseSpeed = 100;
                this.state.cd = false;
            }
        });
    };

    private getItemTween = (platform: Sprite, item: string, callback: () => void) => {
        this.add.tween({
            targets: platform,
            duration: 300,
            props: {
                alpha: 0
            },
            onStart: () => {
                platform.isDestroying = true;
                const itemObject = this.add.image(platform.x, platform.y, item);
                this.add.tween({
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
    };

    private enemyDieTween = (enemy: Sprite) => {
        this.destroySprite(enemy, { y: '+=1000' }, 3000);
    };

    private itemDestroyTween = (item: Sprite) => {
        this.destroySprite(item, { alpha: 0 }, 300);
    };

    private destroySprite = (sprite: Sprite, props: {}, duration: number) => {
        this.add.tween({
            targets: sprite,
            ease: 'Cubic',
            props,
            duration,
            onStart: () => {
                sprite.isDestroying = true;
            },
            onComplete: () => {
                sprite.isDestroying = false;
                sprite.destroy();
            }
        });
    };
}
