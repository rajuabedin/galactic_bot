const { SlashCommandBuilder } = require('@discordjs/builders');
const errorLog = require('../Utility/logger').logger;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Bot settings for the server!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Edit channels access')
                .addStringOption(option =>
                    option
                        .setName('option')
                        .setDescription('Select an option [ lock - unlock - add - remove ]')
                        .setRequired(true)
                        .addChoice('lock', 'lock')
                        .addChoice('unlock', 'unlock')
                        .addChoice('add', 'add')
                        .addChoice('remove', 'remove'))
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Select the channel')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get all server settings')),


    async execute(interaction, userInfo) {
        try {
            const maxChannels = 10;
            if (interaction.options.getSubcommand() === 'info') {
                var data = await interaction.client.databaseSelcetData(`SELECT * FROM user_daily_log WHERE user_id = '${interaction.user.id}' AND DATE(log_date) = CURDATE()`)
                if (Object.entries(data).length === 0) {
                    await interaction.client.databaseEditData(`insert into user_daily_log (user_id,log) VALUES (${interaction.user.id},'[]')`);
                }
                console.log(data)
                await interaction.reply(`Coming soon`)

            } else if (interaction.options.getSubcommand() === 'channel') {
                var serverSettings = await interaction.client.databaseSelcetData(`select * from server_settings where server_id = '${interaction.guildId}'`)
                var allowedList = JSON.parse(serverSettings[0].allowed_channels);
                var lockedList = JSON.parse(serverSettings[0].locked_channels);

                // check if its a channel
                if (!interaction.options.getChannel('channel').type || interaction.options.getChannel('channel').type != 'GUILD_TEXT') return await interaction.reply({ embeds: [interaction.client.redEmbed("Please specify a channel.", "Error!!")] });
                // check if its a valid option
                if (!(['lock', 'unlock', 'add', 'remove'].includes(interaction.options.getString('option').toLowerCase()))) return await interaction.reply({ embeds: [interaction.client.redEmbed("Please use the correct option.", "Error!!")] });
                if (interaction.options.getString('option').toLowerCase() === "add") {
                    // check if max capacity is reached
                    if (allowedList.length === maxChannels) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Max capacity reached! You can only add ${maxChannels} channels.`)] })
                    // check if is already present
                    if (allowedList.includes(interaction.options.getChannel('channel').id)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Error!! This channel is already present on the allowed list.`)] })

                    allowedList.push(interaction.options.getChannel('channel').id);
                    await interaction.client.databaseEditData(`update server_settings SET allowed_channels = '${JSON.stringify(allowedList)}', last_edit_date = CURRENT_TIMESTAMP, edited_by = ${interaction.user.id} where server_id = '${interaction.guildId}'`);
                    return await interaction.reply({ embeds: [interaction.client.greenEmbed(`Successfull!! ${interaction.options.getChannel('channel')} added to the allowed list.`)] })

                } else if (interaction.options.getString('option').toLowerCase() === "remove") {
                    // check if list empty
                    if (allowedList.length === 0) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Error! Allowed list is empty.`)] })
                    // check if not present
                    if (!allowedList.includes(interaction.options.getChannel('channel').id)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Error!! This channel is not present on the allowed list!`)] })

                    const index = allowedList.indexOf(interaction.options.getChannel('channel').id);
                    if (index > -1) {
                        allowedList.splice(index, 1);
                    }

                    await interaction.client.databaseEditData(`update server_settings SET allowed_channels = '${JSON.stringify(allowedList)}', last_edit_date = CURRENT_TIMESTAMP, edited_by = ${interaction.user.id} where server_id = '${interaction.guildId}'`);
                    return await interaction.reply({ embeds: [interaction.client.greenEmbed(`Successfull!! ${interaction.options.getChannel('channel')} removed from the allowed list!`)] })

                } else if (interaction.options.getString('option').toLowerCase() === "lock") {
                    // check if max capacity is reached
                    if (lockedList.length === maxChannels) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Max capacity reached! You can only add ${maxChannels} channels.`)] })
                    // check if is already present
                    if (lockedList.includes(interaction.options.getChannel('channel').id)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Error!! This channel is already present on the locked list.`)] })

                    lockedList.push(interaction.options.getChannel('channel').id);
                    await interaction.client.databaseEditData(`update server_settings SET locked_channels = '${JSON.stringify(lockedList)}', last_edit_date = CURRENT_TIMESTAMP, edited_by = ${interaction.user.id} where server_id = '${interaction.guildId}'`);
                    return await interaction.reply({ embeds: [interaction.client.greenEmbed(`Successfull!! ${interaction.options.getChannel('channel')} added to the locked list.`)] })

                } else if (interaction.options.getString('option').toLowerCase() === "unlock") {
                    // check if max capacity is reached
                    if (lockedList.length === 0) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Error! Locked list is empty.`)] })
                    // check if is already present
                    if (!lockedList.includes(interaction.options.getChannel('channel').id)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Error!! This channel is not present on the locked list!`)] })

                    const index = lockedList.indexOf(interaction.options.getChannel('channel').id);
                    if (index > -1) {
                        lockedList.splice(index, 1);
                    }
                    await interaction.client.databaseEditData(`update server_settings SET locked_channels = '${JSON.stringify(lockedList)}', last_edit_date = CURRENT_TIMESTAMP, edited_by = ${interaction.user.id} where server_id = '${interaction.guildId}'`);
                    return await interaction.reply({ embeds: [interaction.client.greenEmbed(`Successfull!! ${interaction.options.getChannel('channel')} removed from the locked list.`)] })

                }

            }

            // Update user_daily_log
            // set  log=JSON_ARRAY_APPEND(log, '$', '{"host": "b"}')
            // where user_id='123234'

            // SELECT * FROM user_daily_log WHERE user_id = '123234' AND DATE(log_date) = CURDATE()
        }
        catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed("Please try again later.", "Error!!")], ephemeral: true });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    }
}