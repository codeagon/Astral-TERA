const net = require('net')
const tls = require('tls')
const events = require('events')
const readline = require('readline')

class Networking extends events.EventEmitter {
	constructor() {
		super()
		this.socket = null
	}

	connect(options = {}) {
		this.socket = (options.secure ? tls : net).connect(options, () => {
			this.emit('connect')
			console.log('[ASTRAL TERA] - CONNECTED TO CHAT')
			readline.createInterface({ input: this.socket }).on('line', (line) => {
				try {
					this.emit(...JSON.parse(line))
				} catch (err) {
					this.emit('error', err)
				}
			})
		}).on('error', (err) => {
			this.emit('error', err)
		}).on('close', () => {
			this.emit('close')
			this.socket = null
		})
	}

	send(...data) {
		if (this.socket) this.socket.write(JSON.stringify(data) + '\n')
	}

	close() {
		console.log('CHAT- CONNECTION CLOSED')
		if (this.socket) {
			this.socket.end()
			this.socket.unref()
		}
	}
}

module.exports = Networking