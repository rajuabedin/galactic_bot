const Event = require('../Structures/Event.js');
const Commands = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;

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

        let userInfo = await interaction.client.getUserAccount(interaction.user.id);
        if (typeof userInfo === 'undefined') {
            return await interaction.reply({ embeds: [interaction.client.redEmbed("To be able to play, create an account", "ERROR, USER NOT FOUND!")] });
        }
        command.execute(interaction, userInfo);
    } catch (error) {
        if (interaction.replied) {
            await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
        } else {
            await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")] });
        }
        errorLog.error(error.message, { 'command_name': interaction.commandName });
    }
});