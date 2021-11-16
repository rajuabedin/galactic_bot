module.exports = function (app, API_SECRET, shard) {

    app.get('/commands', async (req, res) => {
        const signature = req.headers['x-api-key'];

        if (signature !== API_SECRET) {
            return res.sendStatus(401);
        }

        const reqs = await shard.fetchClientValues('commands');

        res.type('application/json').status(200).send(JSON.stringify({ "commands": reqs }));
    });

    app.post('/reload-command', async (req, res) => {
        const signature = req.headers['x-api-key'];
        const body = req.body;
        let command = null;

        if (signature !== API_SECRET) {
            return res.sendStatus(401);
        }

        if (typeof body.fileName === 'undefined' || body.fileName === '') {
            return res.type('application/json').status(500).send(JSON.stringify({ "status": 500, "error": "file name not specified" }));
        }
        Object.keys(require.cache).forEach(function (key) { delete require.cache[key] })
        try {
            command = require(`${process.cwd()}/Commands/${body.fileName}`);

        } catch (e) {
            return res.type('application/json').status(500).send(JSON.stringify({ "status": 500, "error": e.toString() }));
        }

        function funcName(client, { command }) {
            client.commands.set(command.data.name, command)
        }

        await shard.broadcastEval(funcName, { context: { command: command } });

        return res.type('application/json').status(200).send(JSON.stringify({ "status": 200, "update": "updated" }));

    });

    app.post('/reload', async (req, res) => {
        const signature = req.headers['x-api-key'];

        if (signature !== API_SECRET) {
            return res.sendStatus(401);
        }
        await shard.broadcastEval(client => {
            const Discord = require('discord.js');
            const fs = require("fs");
            const newCommands = new Discord.Collection();
            // LOAD COMMANDS
            fs.readdirSync(`${process.cwd()}/Commands`).filter(file => file.endsWith(".js")).forEach(file => {
                Object.keys(require.cache).forEach(function (key) { delete require.cache[key] })
                /**
                 *@type {Command}
                 */
                const command = require(`${process.cwd()}/Commands/${file}`);
                newCommands.set(command.data.name, command)
            });
            client.commands = newCommands;
        })

        res.type('application/json').status(200).send(JSON.stringify({ "status": 200, "update": "updated" }));
    });
}