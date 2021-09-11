const Event = require('../Structures/Event.js');
const Commands = require('../Structures/Command.js');

module.exports = new Event("interactionCreate", async (client, interaction) => {
    try {
        if (!interaction.isCommand()) return;

        const command = client.commands.find(cmd => cmd.data.name == interaction.commandName);

        command.execute(interaction);
    } catch (error) {
        await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
        errorLog.error(error.message, { 'command_name': interaction.commandName });
    }
});