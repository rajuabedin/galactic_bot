const Client = require('./Structures/Client.js')
const client = new Client();
require('dotenv').config()
client.start(process.env.TOKEN)


// catcha all discord.js issues
client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.on("debug", (e) => console.info(e));



