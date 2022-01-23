require('dotenv').config();
const fs = require('fs')
const Discord = require('discord.js');

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

        const connection = await message.member.voice.channel.join(); // join users channel

        connection.on('speaking', (user, speaking) => {
            const audio = connection.receiver.createStream(user, { mode: 'pcm' });
        })
    }
});

// login to Discord with app's token
client.login('PUT TOKEN HERE');