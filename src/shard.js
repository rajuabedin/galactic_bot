const { ShardingManager } = require('discord.js');
require('dotenv').config()


const express = require('express');
const app = express();

const API_SECRET = 'secret';


const shard = new ShardingManager('./bot.js', {
    token: process.env.TOKEN,
    respawn: true,
});


app.use(express.json({ verify: (req, res, buffer) => { req.rawBody = buffer; } }));
app.listen(9000, () => console.log('Node.js server started on port 9000.'));

shard.spawn(); // Spawns recommended shards!

shard.on('shardCreate', newShard => {
    console.log("Shard created")
    newShard.on('ready', () => {
        console.log('Shard ready')
    })
    Object.keys(require.cache).forEach(function (key) { delete require.cache[key] })
    require('./WebHook/CommandsWebHook.js')(app, API_SECRET, shard);
})

shard.on('launch', shard => console.log(`[SHARD] Shard ${shard.id}/${shard.totalShards}`));






