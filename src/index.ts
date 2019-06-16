import { Types, Game, AUTO } from 'phaser';
import { MainScene } from './scenes/main';
import { MapScene } from './scenes/map';

type GameConfig = Types.Core.GameConfig;

const config: GameConfig = {
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
                y: 400
            },
            debug: true
        }
    }
};

class App extends Game {
    constructor(config: GameConfig) {
        super(config);
    }
}

window.addEventListener('load', () => {
    new App(config);
});
