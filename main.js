const { app, BrowserWindow, Menu } = require('electron');

// I'm lazy
const LICENSE = `
MIT License

Copyright (c) 2019 winderica

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

----------------------------------

MIT 开源许可协议

版权所有 (c) 2019 winderica

特此向任何得到本软件副本或相关文档的人授权：
被授权人有权使用、复制、修改、合并、出版、发布、散布、再授权和/或贩售软件及软件的副本，
及授予被供应人同等权利，惟服从以下义务：

在软件和软件的所有副本中都必须包含以上版权声明和本许可声明。

该软件是"按原样"提供的，没有任何形式的明示或暗示，
包括但不限于为特定目的和不侵权的适销性和适用性的保证担保。
在任何情况下，作者或版权持有人，都无权要求任何索赔，或有关损害赔偿的其他责任。
无论在本软件的使用上或其他买卖交易中，是否涉及合同，侵权或其他行为。
`;

let window;

function setMainMenu() {

    const template = [
        {
            label: 'File',
            submenu: [
                process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'View on Github',
                    click() {
                        require('electron').shell.openExternalSync('https://github.com/winderica/RushDuck')
                    }
                },
                {
                    label: 'Copyright',
                    click() {
                        require('electron').dialog.showMessageBox({ message: LICENSE })
                    }
                },
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

const createWindow = async () => {
    window = new BrowserWindow({
        width: 1600,
        height: 900,
        icon: __dirname + '/icon/duck.ico'
    });
    window.setResizable(false);
    await window.loadFile('./build/index.html');
    window.on('closed', () => {
        window = null;
    });
    setMainMenu();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', async () => {
    if (window === null) {
        await createWindow();
    }
});
