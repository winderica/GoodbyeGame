import { Scene } from 'phaser';
import { TITLE } from '../config/consts';
import { MapData } from '../config/types';

export class MainScene extends Scene {

    currentStage = 0;
    dataDiv = document.createElement('div');
    mapData = [] as MapData[];

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
        this.currentStage = +(localStorage.getItem('currentStage') || '1');
        const mapData = localStorage.getItem('mapData');
        if (!mapData) {
            localStorage.setItem('mapData', JSON.stringify([]));
        } else {
            this.mapData = JSON.parse(mapData);
        }
        const select = document.createElement('select');
        select.className = 'select';
        [...this.mapData, {}].forEach((i, j) => {
            const option = document.createElement('option');
            option.innerHTML = `${j + 1}`;
            option.value = `${j + 1}`;
            if (j + 1 === this.currentStage) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        this.dataDiv.className = 'data';
        this.showData();
        select.addEventListener('change', ({ target }) => {
            this.currentStage = +(target as HTMLSelectElement).value;
            this.showData();
        });
        const button = document.createElement('button');
        button.innerHTML = 'START!';
        button.className = 'button';
        button.addEventListener('click', async () => {
            const stage = this.currentStage;
            const { map } = await import(`../assets/map/${stage}.json`);
            this.scene.start('Map', { stage, map });
        });
        const container = document.createElement('div');
        container.className = 'container';
        container.appendChild(select);
        container.appendChild(this.dataDiv);
        container.appendChild(button);
        this.add.dom(window.innerWidth / 2, window.innerHeight / 2 + 50, container);
    }

    showData = () => {
        while (this.dataDiv.firstChild) { // faster
            this.dataDiv.firstChild.remove();
        }
        const currentMapData = this.mapData[this.currentStage - 1];
        if (currentMapData) {
            const score = document.createElement('p');
            const time = document.createElement('p');
            score.innerHTML = `score: ${currentMapData.score}`;
            time.innerHTML = `time: ${currentMapData.time / 1000}s`;
            this.dataDiv.appendChild(score);
            this.dataDiv.appendChild(time);
        }
    }
}
