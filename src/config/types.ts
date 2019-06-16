import { GameObjects, Physics } from 'phaser';

export type StaticGroup = Physics.Arcade.StaticGroup;
export type Group = Physics.Arcade.Group;
export type StaticBody = Physics.Arcade.StaticBody;
export type Body = Physics.Arcade.Body;
export type Image = GameObjects.Image;

export interface Sprite extends Physics.Arcade.Sprite {
    isDestroying: boolean;
    body: Body;
}
