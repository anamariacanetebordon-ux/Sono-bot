const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function SonoBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ["Ubuntu","Chrome","20.0"]
  })
  sock.ev.on('creds.update', saveCreds)

  if (!sock.authState.creds.registered) {
    const num = process.env.PHONE_NUMBER || "595981123456"
    console.log(`Pidiendo codigo para: ${num}`)
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(num.replace(/[^0-9]/g,''))
        console.log(`\nTU CODIGO ES: ${code}\n`)
      } catch(e){ console.log(e) }
    }, 3000)
  }

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u
    if (connection === 'open') console.log('CONECTADO')
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) SonoBot()
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m?.message || m.key.fromMe) return
    const from = m.key.remoteJid
    const body = m.message.conversation || m.message.extendedTextMessage?.text || ""
    const cmd = body.split(' ')[0].toLowerCase()

    if (cmd === '.menu') {
      await sock.sendMessage(from, { text: '*SONO BOT*\n\n.s = sticker\n.todos = menciona\n.link = link grupo\n.menu = menu' })
    }
    if (cmd === '.todos' && from.endsWith('@g.us')) {
      const meta = await sock.groupMetadata(from)
      await sock.sendMessage(from, { text: 'Atencion', mentions: meta.participants.map(p=>p.id) })
    }
  })
}
SonoBot()
