import { Scene } from 'phaser';

export class MainScene extends Scene {

    currentStage = 0;
    clearedUntil = 0;

    constructor() {
        super({
            key: "Main"
        });
    }

    create() {
        this.currentStage = +(localStorage.getItem('currentStage') || '');
        this.clearedUntil = +(localStorage.getItem('clearedUntil') || '');
        const button = document.createElement('button');
        button.innerHTML = 'Select';
        button.addEventListener('click', async () => {
            const stage = this.currentStage;
            const { map } = await import(`../assets/map/${stage}.json`);
            this.scene.start('Map', { stage, map });
        });
        const select = document.createElement('select');
        [...new Array(Math.min(this.clearedUntil + 1, 50))].map((i, j) => {
            const option = document.createElement('option');
            option.innerHTML = `${j}`;
            option.value = `${j}`;
            if (j === this.currentStage) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        select.addEventListener('change', ({ target }) => {
            this.currentStage = +(<HTMLSelectElement> target).value;
        });
        this.add.dom(window.innerWidth / 2, window.innerHeight / 2, select);
        this.add.dom(window.innerWidth / 2, window.innerHeight / 2 + 100, button);
    }
}
