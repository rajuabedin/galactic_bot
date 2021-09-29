const { ShardingManager } = require('discord.js');
require('dotenv').config()



const shard = new ShardingManager('./bot.js', {
    token: process.env.TOKEN,
    respawn: true,
});

shard.spawn(); // Spawns recommended shards!

shard.on('shardCreate', newShard => {
    console.log("Shard created")
    newShard.on('ready', () => {
        console.log('Shard ready')
    })
})

shard.on('launch', shard => console.log(`[SHARD] Shard ${shard.id}/${shard.totalShards}`));

const express = require('express');
const app = express();

const API_SECRET = 'secret';

app.use(express.json({ verify: (req, res, buffer) => { req.rawBody = buffer; } }));

app.get('/commands', async (req, res) => {
    const signature = req.headers['x-api-key'];

    if (signature !== API_SECRET) {
        return res.sendStatus(401);
    }

    const reqs = await shard.fetchClientValues('commands');

    res.type('application/json').status(200).send(JSON.stringify({ "commands": reqs }));
});

app.post('/reload', async (req, res) => {
    const signature = req.headers['x-api-key'];

    if (signature !== API_SECRET) {
        return res.sendStatus(401);
    }




    await shard.broadcastEval(c => {
        const Discord = require('discord.js');
        const fs = require("fs");
        const newCommands = new Discord.Collection();
        // LOAD COMMANDS
        fs.readdirSync(`${process.cwd()}/Commands`).filter(file => file.endsWith(".js")).forEach(file => {
            /**
             *@type {Command}
             */

            Object.keys(require.cache).forEach(function (key) { delete require.cache[key] })
            const command = require(`${process.cwd()}/Commands/${file}`);
            newCommands.set(command.data.name, command)
        });
        c.commands = newCommands;
    })

    const reqs = await shard.fetchClientValues('commands');

    res.type('application/json').status(200).send(JSON.stringify({ "commands": reqs }));
});

app.listen(9000, () => console.log('Node.js server started on port 9000.'));
