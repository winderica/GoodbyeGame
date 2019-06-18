import { Game } from 'phaser';
import { config } from './config/game';
import { GameConfig } from './config/types';

class App extends Game {
    constructor(gameConfig: GameConfig) {
        super(gameConfig);
    }
}

window.addEventListener('load', () => {
    new App(config);
});
