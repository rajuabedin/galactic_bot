const Event = require('../Structures/Event.js');
const Commands = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;

module.exports = new Event("interactionCreate", async (client, interaction) => {
    try {
        if (!interaction.isCommand()) return;

        var initialCommand = "tutorial"

        // check if channel is allowed
        const serverSettings = await interaction.client.databaseSelcetData(`select * from server_settings where server_id = '${interaction.guildId}'`)
        const allowedList = await JSON.parse(serverSettings[0].allowed_channels);
        const lockedList = await JSON.parse(serverSettings[0].locked_channels);

        if (lockedList.includes(interaction.channelId)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Server admins have locked this channel`)], ephemeral: true })
        if (Object.entries(allowedList).length !== 0 && !allowedList.includes(interaction.channelId)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Server admins have locked this channel`)], ephemeral: true })

        let userInfo = await interaction.client.getUserAccount(interaction.user.id);
        if (typeof userInfo === 'undefined' && interaction.commandName !== initialCommand) {
            return await interaction.reply({ embeds: [interaction.client.redEmbed("To be able to play, start the tutorial.", "ERROR, USER NOT FOUND!")], ephemeral: true });
        }


        if (typeof userInfo === 'undefined') {
            const serverRankLoger = await interaction.client.databaseSelcetData("SELECT * FROM server_rank WHERE user_id = ? and server_id = ? and DATE(`date`) = CURDATE()", [interaction.user.id, interaction.guildId]);
            if (serverRankLoger.length === 0) {
                await interaction.client.databaseEditData("insert into server_rank (user_id, server_id) values (?,?)", [interaction.user.id, interaction.guildId]);
            }
        }
        const command = client.commands.find(cmd => cmd.data.name == interaction.commandName);
        command.execute(interaction, userInfo, serverSettings[0]);
    } catch (error) {
        if (interaction.replied) {
            await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
        }
        errorLog.error(error.message, { 'command_name': interaction.commandName });
    }
});