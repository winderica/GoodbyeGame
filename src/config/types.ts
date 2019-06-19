import { GameObjects, Physics, Types } from 'phaser';
import { MapScene } from '../scenes/map';
import { Player } from '../sprites/player';

export type StaticGroup = Physics.Arcade.StaticGroup;
export const StaticGroup = Physics.Arcade.StaticGroup;
export type Group = Physics.Arcade.Group;
export const Group = Physics.Arcade.Group;
export type StaticBody = Physics.Arcade.StaticBody;
export const StaticBody = Physics.Arcade.StaticBody;
export type Body = Physics.Arcade.Body;
export const Body = Physics.Arcade.Body;
export type Image = GameObjects.Image;
export const Image = GameObjects.Image;
export type GameConfig = Types.Core.GameConfig;
export type CursorKeys = Types.Input.Keyboard.CursorKeys;

export interface Sprite extends Physics.Arcade.Sprite {
    isDestroying: boolean;
    body: Body;
}

export interface PlatformSprite extends Sprite {
    isWall: boolean;
}

interface Door {
    [index: number]: null | {
        x: number;
        y: number;
    };
}

export interface State {
    player: Player;
    platforms: StaticGroup;
    movingPlatforms: Group;
    items: StaticGroup;
    enemies: Group;
    cursors: CursorKeys;
    startTime: number;
    score: number;
    jumping: boolean;
    jumpStart: number;
    map: number[][];
    stage: number;
    standingPlatform: Sprite | null;
    standingPosition: number;
    door: Door;
    scoreImages: Image[];
    livesImages: Image[];
    timeImages: Image[];
}

export interface SceneConfig {
    scene: MapScene;
    x: number;
    y: number;
    texture: string;
    frame?: string;
}

export interface MapData {
    time: number;
    score: number;
}
