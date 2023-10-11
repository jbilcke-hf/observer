require('dotenv').config({
	path: ".env.local"
})

// Add Deepgram so you can get the transcription
const { Deepgram } = require('@deepgram/sdk')

if (!process.env.STT_ENGINE !== "DEEPGRAM") {
  console.log("Deepgram is not enabled, skipping..")
  process.exit()
}

if (!process.env.STT_DEEPGRAM_TOKEN) {
  console.log("Deepgram token is not defined, skipping..")
  process.exit()
}


console.log("Deepgram is enabled!")

const deepgram = new Deepgram(process.env.STT_DEEPGRAM_TOKEN)

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 3002 })

wss.on('connection', (ws) => {
	const deepgramLive = deepgram.transcription.live({
		interim_results: true,
		punctuate: false,
		endpointing: true,
		vad_turnoff: 500,
		language: "en",
		model: "general",
		tier: "enhanced",
	})

	deepgramLive.addListener('open', () => console.log('deepgram open'))
	deepgramLive.addListener('error', (error) => console.log({ error }))
	ws.onmessage = (event) => deepgramLive.send(event.data)
	ws.onclose = () => deepgramLive.finish()
	deepgramLive.addListener('transcriptReceived', (data) => ws.send(data))
})