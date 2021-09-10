const Event = require('../Structures/Event.js');
const Commands = require('../Structures/Command.js');

module.exports = new Event("interactionCreate", async (client, interaction) => {
    try {
        if (!interaction.isCommand()) return;

<<<<<<< HEAD
        const command = client.commands.find(cmd => cmd.name == interaction.commandName);

        command.run(interaction);
    } catch (error) {
        console.error(error)
    }
=======
	const command = client.commands.find(cmd => cmd.data.name == interaction.commandName);

    command.execute(interaction);
>>>>>>> test
});