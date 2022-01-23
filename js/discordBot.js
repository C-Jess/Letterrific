require('dotenv').config();
const fs = require('fs')
const Discord = require('discord.js');
const fetch = require('node-fetch');
const WebSocket = require('ws');


// create a new Discord client
const client = new Discord.Client();

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
});

client.on("message", async message => {
    if(message.author.bot) return; // Ignore other bots
    if(!message.content.startsWith('!')) return;

    if (message.content == '!join'){
        if (!message.member.voice.channel) return message.reply('Please join a voice channel first!');
        if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size > 0)) return message.reply(`I'm already in your voice channel!`);

        // get token for AssemblyAI
        const response = await fetch('http://localhost:5000'); // get temp session token from server.js (backend)
        const data = await response.json();
        if(data.error){alert(data.error)}
    
        const { token } = data;
        socket = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=48000&token=${token}`); // connect to AssemblyAI with token

        const connection = await message.member.voice.channel.join(); // join users channel
        message.channel.send('Connected')

        socket.onopen = () => {
            connection.on('speaking', (user, speaking) => {
                const audio = connection.receiver.createStream(user, { mode: 'pcm' });
                const audioFileName = './recordings/' + user.id + '_' + Date.now() + '.pcm';

                audio.pipe(fs.createWriteStream(audioFileName));

                audio.on('end', async () => {
                    fs.stat(audioFileName, async (err, stat) => { // For some reason, Discord.JS gives two audio files for one user speaking. Check if the file is empty before proceeding
                        if (!err && stat.size > 7680) {
                            console.log(stat.size);
                            const file = fs.readFileSync(audioFileName);
                            const audioBytes = file.toString('base64');
                            if (socket) {
                                socket.send(JSON.stringify({ audio_data: audioBytes }));
                            }
                        }
                    })
                })
            })
        }

        socket.onmessage = (response) => {
            const res = JSON.parse(response.data);
            console.log(res);
            if (res.message_type == 'FinalTranscript'){
                if (res.text != ''){message.channel.send(res.text);}
            }
        }
        socket.onerror = (event) => {
            console.error(event);
            socket.close();
          }
          
          socket.onclose = event => {
            console.log(event);
            socket = null;
            connection.disconnect();
          }
    }
});

// login to Discord with app's token
client.login('PUT TOKEN HERE');