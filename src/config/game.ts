import Phaser, { Scale, Types } from 'phaser';
// import GameScene from '../scenes/game';

export const gameConfig: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: 1600,
        height: 900,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    parent: 'game',
    // scene: [GameScene] // Bug here. See https://github.com/photonstorm/phaser/issues/4522
};
