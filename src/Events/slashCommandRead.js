const Event = require('../Structures/Event.js');
const Commands = require('../Structures/Command.js');

module.exports = new Event("interactionCreate", async(client,interaction) => {
    if (!interaction.isCommand()) return;

	const command = client.commands.find(cmd => cmd.data.name == interaction.commandName);

    command.execute(interaction);
});