const events = require('events')
const electron = require('electron')
const fs = require('fs'); // Wow this too can be bloated now!!!!!!!!
const path = require('path');

const CHANNEL_NAME = 'astral-tera'

const debug = false;


class Window extends events.EventEmitter {
    constructor() {
        super()
        this.window = null
    }

    show() {
        if (this.window) {
            this.window.show()
            return
        }

        this.window = new electron.BrowserWindow({
            title: 'AT',
            width: 960,
            height: 540,
            frame: false,
            resizable: true,
            webPreferences: {
                nodeIntegration: true
            }
        })

        const listener = (event, ...args) => {
            if (event.sender === this.window.webContents) {
                this.emit(...args)
            }
        }

        electron.ipcMain.on(CHANNEL_NAME, listener)

        this.window.webContents.on('did-finish-load', () => {
            this.emit('opened')
        })

        this.window.on('closed', () => {
            this.emit('closed')
            electron.ipcMain.removeListener(CHANNEL_NAME, listener)
            this.window = null
        })

        this.window.setMenu(null)
        this.window.loadURL(`file://${__dirname}/ui/index.html`)
        this.window.webContents.openDevTools()
    }

    send(...args) {
        if (!this.window)
            return
        this.window.webContents.send(CHANNEL_NAME, ...args)
    }

    close() {
        if (this.window)
            this.window.close()
    }
}

module.exports = Window
