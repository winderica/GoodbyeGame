import { Geom, Scene } from 'phaser';
import {
    BACKGROUND_AFTERNOON,
    BACKGROUND_EVENING,
    BACKGROUND_FAILURE,
    BACKGROUND_MORNING,
    BACKGROUND_NOON,
    BACKGROUND_SUCCESS,
    BGM,
    BLOCK_SIZE,
    BRONZE,
    CLOCK,
    DOT,
    ENEMY,
    FLAG,
    GOLD,
    HEART_EMPTY,
    HEART_FULL,
    ITEM,
    MAPS_COUNT,
    NUMBER,
    PLATFORM,
    PLAYER,
    SE_BOUNCE,
    SE_GET_ITEM,
    SE_INJURED,
    SE_JUMP, SE_KILL
} from '../config/consts';
import { CursorKeys, Group, Image, MapData, Sprite, State, StaticGroup } from '../config/types';
import { Enemy } from '../sprites/enemy';
import { Item } from '../sprites/item';
import { MovingPlatform } from '../sprites/movingPlatform';
import { Platform } from '../sprites/platform';
import { Player } from '../sprites/player';

// use require to include resources
require('../utils/importer');
// use require to get path rather than JSON object
const platformJSON = require('../assets/platform/platform.json');
const enemyJSON = require('../assets/enemy/enemy.json');
const itemJSON = require('../assets/item/item.json');

const initState: () => State = () => ({
    player: undefined as unknown as Player,
    platforms: undefined as unknown as StaticGroup,
    movingPlatforms: undefined as unknown as Group,
    items: undefined as unknown as StaticGroup,
    enemies: undefined as unknown as Group,
    cursors: undefined as unknown as CursorKeys,
    startTime: +new Date(),
    score: 0,
    jumping: false,
    scoreImages: [] as Image[],
    livesImages: [] as Image[],
    timeImages: [] as Image[],
    jumpStart: 0,
    standingPlatform: null,
    standingPosition: 0,
    map: [] as number[][],
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
            key: 'Map'
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
        this.load.image(BACKGROUND_MORNING, 'src/assets/background/forest_morning.png');
        this.load.image(BACKGROUND_AFTERNOON, 'src/assets/background/forest_afternoon.png');
        this.load.image(BACKGROUND_EVENING, 'src/assets/background/forest_evening.png');
        this.load.image(BACKGROUND_NOON, 'src/assets/background/forest_noon.png');
        this.load.image(BACKGROUND_FAILURE, 'src/assets/background/failure.png');
        this.load.image(BACKGROUND_SUCCESS, 'src/assets/background/success.png');
        [...new Array(10)].map((i, j) => this.load.image(NUMBER(j), `src/assets/status/${j}.png`));
        this.load.image(CLOCK, 'src/assets/status/clock.png');
        this.load.image(DOT, 'src/assets/status/dot.png');
        this.load.image(GOLD, 'src/assets/status/gold.png');
        this.load.image(BRONZE, 'src/assets/status/bronze.png');
        this.load.image(HEART_EMPTY, 'src/assets/status/heartEmpty.png');
        this.load.image(HEART_FULL, 'src/assets/status/heartFull.png');
        this.load.audio(BGM, 'src/assets/audio/bgm.mp3');
        this.load.audio(SE_BOUNCE, 'src/assets/audio/bounce.mp3');
        this.load.audio(SE_GET_ITEM, 'src/assets/audio/getItem.mp3');
        this.load.audio(SE_INJURED, 'src/assets/audio/injured.mp3');
        this.load.audio(SE_JUMP, 'src/assets/audio/jump.mp3');
        this.load.audio(SE_KILL, 'src/assets/audio/killEnemy.mp3');
        this.load.spritesheet(FLAG, 'src/assets/item/flag.png', { frameHeight: BLOCK_SIZE, frameWidth: BLOCK_SIZE });
    }

    create() {
        this.physics.world.setFPS(40);
        const height = this.state.map.length * BLOCK_SIZE;
        const width = this.state.map[0].length * BLOCK_SIZE;
        const { innerWidth, innerHeight } = window;
        this.state.movingPlatforms = this.physics.add.group({ runChildUpdate: true });
        this.state.platforms = this.physics.add.staticGroup({ runChildUpdate: true });
        this.state.items = this.physics.add.staticGroup({ runChildUpdate: true });
        this.state.enemies = this.physics.add.group({ runChildUpdate: true });
        const background = [BACKGROUND_MORNING, BACKGROUND_NOON, BACKGROUND_AFTERNOON, BACKGROUND_EVENING][this.state.stage % 4];
        this.add.image(innerWidth / 2, innerHeight / 2, background).setScrollFactor(0).setDisplaySize(innerWidth, innerHeight);
        this.state.map.map(this.addTile);
        this.sound.add(BGM).play('', { loop: true });
        this.physics.world.setBounds(-200, -1000, width + 400, height + 1000);
        const { player, enemies, platforms, movingPlatforms, items, score } = this.state;
        this.physics.add.collider(enemies, platforms, this.enemyCollidesPlatform);
        this.physics.add.collider(player, movingPlatforms, player.collidesMovingPlatform);
        this.physics.add.collider(player, platforms, player.collidesPlatform, this.handlePlatformProcess);
        this.physics.add.overlap(player, enemies, player.overlapsEnemy, this.handleEnemyProcess);
        this.physics.add.overlap(player, items, player.overlapsItem);
        this.cameras.main.setBounds(-200, 0, width + innerWidth, height);
        this.cameras.main.startFollow(player, false, 1, 1, -innerWidth / 3, 0);
        this.displayLives(player.lives);
        this.displayScore(score);
        this.state.cursors = this.input.keyboard.createCursorKeys();
        this.state.cursors.up!.on('down', this.preJump.bind(this));
        this.state.cursors.up!.on('up', () => {
            this.state.jumpStart = 0;
            this.state.jumping = true;
        });
    }

    update() {
        const { standingPlatform, player, jumping, standingPosition, cursors, startTime } = this.state;
        this.displayTime(+new Date() - startTime);
        if (!Geom.Rectangle.Overlaps(this.physics.world.bounds, player.getBounds())) {
            player.setLives(0);
        }
        if (cursors.left!.isDown) {
            player.slowDown();
        } else if (cursors.right!.isDown) {
            player.speedUp();
        } else {
            player.resetSpeed();
        }
        if (cursors.up!.isDown && !jumping) {
            player.jump();
        }
        if (!player.body.touching.right) {
            player.body.setAllowGravity(true);
        }
        if (standingPlatform) {
            if (cursors.up!.isDown) {
                this.state.standingPlatform = null;
                this.state.jumpStart = +new Date();
                this.sound.play(SE_JUMP);
                player.jump();
            } else {
                player.x = standingPlatform.x + standingPosition;
                player.y = standingPlatform.y - BLOCK_SIZE;
            }
        }
    }

    displayLives = (lives: number) => {
        this.state.livesImages.map((i) => i.destroy());
        this.state.livesImages = [lives >= 1, lives >= 2, lives >= 3].map((i, j) =>
            this.add.image(window.innerWidth - 160 + j * 60, 40, i ? HEART_FULL : HEART_EMPTY).setScrollFactor(0)
        );
    };

    dieTween = (sprite: Sprite) => {
        this.destroySprite(sprite, { y: '+=1000' }, 3000);
    };

    success = () => {
        const { innerWidth, innerHeight } = window;
        const background = this.add.image(innerWidth / 2, innerHeight * 3 / 2, BACKGROUND_SUCCESS).setScrollFactor(0);
        background.setScale(innerWidth / background.width);
        background.depth = 100;
        const { startTime, score } = this.state;
        this.add.tween({
            targets: background,
            duration: 1000,
            props: {
                y: innerHeight / 2
            },
            onComplete: () => {
                this.returnMain({ time: +new Date() - startTime, score });
            }
        });
    };

    failure = () => {
        const { innerWidth, innerHeight } = window;
        const background = this.add.image(innerWidth / 2, -innerHeight / 2, BACKGROUND_FAILURE).setScrollFactor(0);
        background.setScale(innerWidth / background.width);
        background.depth = 100;
        this.add.tween({
            targets: background,
            duration: 1000,
            props: {
                y: innerHeight / 2
            },
            onComplete: () => {
                this.returnMain();
            }
        });
    };

    setScore = async (score: number) => {
        let prevScore = this.state.score;
        this.state.score = score;
        while (prevScore < score) {
            prevScore += 10;
            this.displayScore(prevScore);
            await new Promise((resolve) => setTimeout(resolve, 40));
        }
    };

    destroySprite = (sprite: Sprite, props: {}, duration: number) => {
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

    private preJump() {
        // tslint:disable-next-line:no-shadowed-variable
        const { player } = this.state; // To get avoid of scope loss
        if (player.onWall) {
            this.sound.play(SE_JUMP);
            this.state.jumping = false;
            this.state.player.onWall = false;
            if (player.onBack) {
                this.state.jumpStart = +new Date();
                player.baseSpeed = 0;
                player.setVelocityY(0);
            } else {
                this.add.tween({
                    targets: player.body.velocity,
                    y: 0,
                    duration: 400,
                    onStart: () => {
                        player.baseSpeed = 0;
                        player.setVelocityY(-450);
                    },
                    onComplete: () => {
                        player.baseSpeed = 200;
                    }
                });
            }
        } else if (player.onBack) {
            this.state.jumpStart = +new Date();
        }
        if (!this.state.jumping && player.body.touching.down) {
            this.sound.play(SE_JUMP);
            this.state.jumpStart = +new Date();
        }
    }

    private returnMain(mapData?: MapData) {
        this.sound.stopAll();
        this.time.delayedCall(
            2000,
            () => {
                const { stage } = this.state;
                if (mapData) {
                    const nextStage = Math.min(stage + 1, MAPS_COUNT);
                    localStorage.setItem('currentStage', `${nextStage}`);
                    const mapDataArray = JSON.parse(localStorage.getItem('mapData') as string) as MapData[];
                    const currentMapData = mapDataArray[stage - 1];
                    if (currentMapData) {
                        const { time, score } = currentMapData;
                        mapDataArray[stage - 1] = {
                            time: Math.min(time, mapData.time),
                            score: Math.max(score, mapData.score)
                        };
                    } else {
                        mapDataArray[stage - 1] = mapData;
                    }
                    localStorage.setItem('mapData', JSON.stringify(mapDataArray));
                } else {
                    localStorage.setItem('currentStage', `${stage}`);
                }
                this.scene.start('Main');
                this.state.cursors.up!.destroy();
                this.state.cursors.down!.destroy();
                this.state.cursors.left!.destroy();
                this.state.cursors.right!.destroy();
            },
            [],
            null
        );
    }

    private displayScore = (score: number) => {
        this.state.scoreImages.map((i) => i.destroy());
        this.state.scoreImages = [...`${score}`.padStart(5, '0')].map((i, j) =>
            this.add.image(window.innerWidth - 170 + j * 35, 100, NUMBER(+i)).setScrollFactor(0)
        ).concat(this.add.image(innerWidth - 220, 100, GOLD).setScrollFactor(0));
    };

    private displayTime = (time: number) => {
        this.state.timeImages.map((i) => i.destroy());
        const second = [...`${~~(time / 1000)}`.padStart(3, '0')].reverse();
        const centisecond = [...`${~~(time % 1000 / 10)}`.padStart(2, '0')].reverse();
        let x = window.innerWidth + 5;
        this.state.timeImages = [
            ...centisecond.map((i) =>
                this.add.image(x -= 35, 160, NUMBER(+i)).setScrollFactor(0)
            ),
            this.add.image(x -= 35, 170, DOT).setScrollFactor(0),
            ...second.map((i) =>
                this.add.image(x -= 35, 160, NUMBER(+i)).setScrollFactor(0)
            ),
            this.add.image(x -= 50, 160, CLOCK).setScrollFactor(0).setScale(0.65)
        ];
    };

    private handlePlatformProcess: any = (player: Sprite, platform: Sprite) => {
        if (platform.frame.customData['type'] === 'thin' && player.body.velocity.y < 0) {
            return false;
        } else if (platform.frame.customData['type'] === 'enemyBarrier') {
            return false;
        }
        return true;
    };

    private handleEnemyProcess: any = (player: Sprite, enemy: Sprite) => {
        return !enemy.isDestroying;
    };

    private enemyCollidesPlatform: any = async (enemy: Sprite, platform: Sprite) => {
        if (enemy.body.touching.right && platform.body.touching.left) {
            enemy.setFlipX(false);
        }
        if (enemy.body.touching.left && platform.body.touching.right) {
            enemy.setFlipX(true);
        }
    };

    private addTile = (row: number[], i: number, array: number[][]) => {
        row.map((index, j) => {
            const y = i * BLOCK_SIZE;
            const x = j * BLOCK_SIZE;
            if (index > 0 && index <= 20 || index === 30) {
                const platform = new Platform({ scene: this, x, y, texture: PLATFORM, frame: `${index}.png` }, this.state.platforms);
                platform.setIsWall(i > 0 && array[i - 1][j] <= 30 && array[i - 1][j] > 0);
            } else if (index > 20 && index < 30) {
                new MovingPlatform({ scene: this, x, y, texture: PLATFORM, frame: `${index}.png` }, this.state.movingPlatforms);
            } else if (index >= 50 && index < 60) {
                new Item({ scene: this, x, y, texture: ITEM, frame: `${index}.png` }, this.state.items);
            } else if (index >= 60 && index < 90) {
                const item = new Item({ scene: this, x, y: y + BLOCK_SIZE, texture: ITEM, frame: `${index}.png` }, this.state.items);
                const type = item.frame.customData['type'];
                if (type.includes('doorOut')) {
                    this.state.door[+type.slice(-1)] = { x, y };
                }
            } else if (index === 90) {
                const item = new Item({ scene: this, x, y: y + BLOCK_SIZE * 2, texture: ITEM, frame: `${index}.png` }, this.state.items);
                item.anims.play('flutter');
            } else if (index === 99) {
                this.state.player = new Player({ scene: this, x, y: y - 100, texture: PLAYER });
            } else if (index >= 100) {
                new Enemy({ scene: this, x, y, texture: ENEMY, frame: `${index}.png` }, this.state.enemies);
            }
        });
    };
}
