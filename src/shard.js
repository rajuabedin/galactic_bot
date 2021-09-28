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

app.listen(9000, () => console.log('Node.js server started on port 9000.'));
