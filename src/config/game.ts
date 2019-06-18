import { AUTO } from 'phaser';

import { MainScene } from '../scenes/main';
import { MapScene } from '../scenes/map';
import { GameConfig } from './types';

export const config: GameConfig = {
    type: AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'root',
    scene: [MainScene, MapScene],
    backgroundColor: '#fff',
    dom: {
        createContainer: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 700
            },
            debug: false
        }
    }
};
