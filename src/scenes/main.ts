import { Scene } from 'phaser';
import { MAPS_COUNT, TITLE } from '../config/consts';

export class MainScene extends Scene {

    currentStage = 0;
    clearedUntil = 0;

    constructor() {
        super({
            key: 'Main'
        });
    }

    preload() {
        this.load.image(TITLE, 'src/assets/title/title.png');
    }

    create() {
        const title = this.add.image(window.innerWidth / 2, window.innerHeight / 2 - 100, TITLE).setScrollFactor(0);
        title.setScale(0.5);
        this.currentStage = +(localStorage.getItem('currentStage') || '');
        this.clearedUntil = +(localStorage.getItem('clearedUntil') || '');
        const button = document.createElement('button');
        button.innerHTML = 'START!';
        button.className = 'button';
        button.addEventListener('click', async () => {
            const stage = this.currentStage;
            const { map } = await import(`../assets/map/${stage}.json`);
            this.scene.start('Map', { stage, map });
        });
        const select = document.createElement('select');
        select.className = 'select';
        [...new Array(Math.min(this.clearedUntil + 1, MAPS_COUNT))].map((i, j) => {
            const option = document.createElement('option');
            option.innerHTML = `${j + 1}`;
            option.value = `${j + 1}`;
            if (j + 1 === this.currentStage) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        select.addEventListener('change', ({ target }) => {
            this.currentStage = +(target as HTMLSelectElement).value;
        });
        this.add.dom(window.innerWidth / 2, window.innerHeight / 2, select);
        this.add.dom(window.innerWidth / 2, window.innerHeight / 2 + 100, button);
    }
}
