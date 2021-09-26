const Event = require('../Structures/Event.js');
const Commands = require('../Structures/Command.js');

module.exports = new Event("interactionCreate", async (client, interaction) => {
    try {
        if (!interaction.isCommand()) return;

        // check if channel is allowed
        const serverSettings = await interaction.client.databaseSelcetData(`select * from server_settings where server_id = '${interaction.guildId}'`)
        const allowedList = await JSON.parse(serverSettings[0].allowed_channels);
        const lockedList = await JSON.parse(serverSettings[0].locked_channels);

        if (lockedList.includes(interaction.channelId)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Server admins have locked this channel`)], ephemeral: true })
        if (Object.entries(allowedList).length !== 0 && !allowedList.includes(interaction.channelId)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Server admins have locked this channel`)], ephemeral: true })

        const command = client.commands.find(cmd => cmd.data.name == interaction.commandName);

        command.execute(interaction);
    } catch (error) {
        await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
        errorLog.error(error.message, { 'command_name': interaction.commandName });
    }
});