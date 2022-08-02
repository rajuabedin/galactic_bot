const Event = require('../Structures/Event.js');
const Commands = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;
const { MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed, MessageAttachment, WebhookClient } = require('discord.js');
const { createCanvas } = require('canvas')

module.exports = new Event("interactionCreate", async (client, interaction) => {
    String.prototype.format = function () {
        var i = 0, args = arguments;
        return this.replace(/{}/g, function () {
            return typeof args[i] != 'undefined' ? args[i++] : '';
        });
    };

    try {
        if (!interaction.isCommand()) return;

        // check if channel is allowed
        let serverSettings = await interaction.client.databaseSelectData(`select * from server_settings where server_id = '${interaction.guildId}'`)
        if (serverSettings.length == 0) {
            await client.databaseEditData(`INSERT INTO server_settings (server_id, allowed_channels, locked_channels, edited_by, last_edit_date) VALUES ('${interaction.guildId}', JSON_ARRAY(), JSON_ARRAY(), JSON_ARRAY(), CURRENT_TIMESTAMP)`)
            serverSettings = {
                server_id: interaction.guildId,
                allowed_channels: [],
                locked_channels: [],
                lang: "eng",
            }
        } else {
            serverSettings = serverSettings[0]
        }

        var initialCommand = "tutorial"
        const allowedList = await JSON.parse(serverSettings.allowed_channels);
        const lockedList = await JSON.parse(serverSettings.locked_channels);

        if (lockedList.includes(interaction.channelId)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Server admins have locked this channel`)], ephemeral: true })
        if (Object.entries(allowedList).length !== 0 && !allowedList.includes(interaction.channelId)) return await interaction.reply({ embeds: [interaction.client.redEmbed(`Server admins have locked this channel`)], ephemeral: true })

        let userInfo = await interaction.client.getUserAccount(interaction.user.id);
        if (typeof userInfo === 'undefined' && interaction.commandName !== initialCommand) {
            return await interaction.reply({ embeds: [interaction.client.redEmbed("To be able to play, start the tutorial.", "ERROR, USER NOT FOUND!")], ephemeral: true });
        }

        if (interaction.commandName !== initialCommand) {
            if (userInfo.discord_image !== interaction.user.avatarURL()) {
                userInfo.discord_image = interaction.user.avatarURL();
                await interaction.client.databaseEditData('update users set discord_image = ? where user_id = ?', [interaction.user.avatarURL(), interaction.user.id]);
            }
        }


        if (typeof userInfo === 'undefined') {
            const serverRankLoger = await interaction.client.databaseSelectData("SELECT * FROM server_rank WHERE user_id = ? and server_id = ? and DATE(`date`) = CURDATE()", [interaction.user.id, interaction.guildId]);
            if (serverRankLoger.length === 0) {
                await interaction.client.databaseEditData("insert into server_rank (user_id, server_id) values (?,?)", [interaction.user.id, interaction.guildId]);
            }
        }

        // check if user is banned
        const bannedData = await interaction.client.databaseSelectData("SELECT * FROM banned_users WHERE user_id = ?", [interaction.user.id]);
        if (bannedData.length !== 0) {
            let embed = new MessageEmbed()
                .setColor('0xe1143d')
                .setAuthor({ name: "You are banned!", imageUrl: interaction.client.user.avatarURL() })
                .setThumbnail(interaction.user.avatarURL())
                .setDescription(`You were banned by <@!${bannedData[0].banned_by}>.\n**Reason**: \`\`\`\n${bannedData[0].reason}\`\`\``)
                .setTimestamp(bannedData[0].ban_time)
                .setFooter({ text: "Banned since " });
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // check if need to show captcha
        var captchaData = await interaction.client.databaseSelectData("select * from captcha_counter where user_id = ?", [interaction.user.id]);
        captchaData = captchaData[0]

        var captchaReturn = await generateMacroDetector(captchaData, interaction, serverSettings);

        if (captchaReturn) {
            const command = client.commands.find(cmd => cmd.data.name == interaction.commandName);
            command.execute(interaction, userInfo, serverSettings);
        }
    } catch (error) {
        let errorID = await errorLog.error(error, interaction);
        if (interaction.replied) {
            await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage('eng', 'catchError').format(errorID))], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage('eng', 'catchError').format(errorID), "Error!!")], ephemeral: true });
        }
    }
});

async function generateMacroDetector(captchaData, interaction, serverSettings) {
    String.prototype.format = function () {
        var i = 0, args = arguments;
        return this.replace(/{}/g, function () {
            return typeof args[i] != 'undefined' ? args[i++] : '';
        });
    };
    if (captchaData === undefined) {
        return true;
    } else if (captchaData.count > 1) {
        await interaction.client.databaseEditData("update captcha_counter set count = count - 1 where user_id = ?", [interaction.user.id]);
        return true;
    } else {
        // START MACRO DETECTOR
        const width = 500
        const height = 80
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        const canvas = createCanvas(width, height)
        const context = canvas.getContext('2d')
        context.fillStyle = '#00000'
        context.fillRect(0, 0, width, height)

        async function generateString(length) {
            let result = ' ';
            const charactersLength = characters.length;
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }

            return result;
        }

        const text = await generateString(8);
        const textWidth = context.measureText(text).width
        context.fillRect(600 - textWidth / 2 - 10, 170 - 5, textWidth + 20, 120)
        context.textBaseline = 'middle';
        context.font = 'bold 20px Arial'
        context.textAlign = 'center'
        context.fillStyle = '#fff'
        context.fillText(text, 250, 40)

        const attachment = new MessageAttachment(canvas.toBuffer(), 'Never_gonna_give_you_up_Never_gonna_let_you_down_Never_gonna_run_around_and_desert_you_Never_gonna_make_you_cry_Never_gonna_say_goodbye_Never_gonna_tell_a_lie_and_hurt_you.png');

        const max_options = 5;

        var options = []

        var rightAnswerIndex = getRandomNumberBetween(0, 4)

        for (var i = 0; i < max_options; i++) {
            if (i !== rightAnswerIndex) {
                var tempData = await generateString(8);
                options.push({
                    label: tempData,
                    value: tempData
                })
            } else {
                options.push({
                    label: text,
                    value: text
                })
            }
        }

        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('select')
                    .setPlaceholder('Nothing selected')
                    .addOptions(options),
            );


        var textToEmbed = new MessageEmbed()
            .setColor('0x009dff')
            .setAuthor({ name: "Captcha", iconURL: interaction.user.avatarURL() })
            .setImage('attachment://Never_gonna_give_you_up_Never_gonna_let_you_down_Never_gonna_run_around_and_desert_you_Never_gonna_make_you_cry_Never_gonna_say_goodbye_Never_gonna_tell_a_lie_and_hurt_you.png')
            .setDescription(interaction.client.getWordLanguage(serverSettings.lang, "CAPTCHA_MSG"))


        let msg = interaction.reply({ embeds: [textToEmbed], components: [row], files: [attachment], fetchReply: true });

        let selected = false;

        const collector = msg.createMessageComponentCollector({ time: 25000 });

        let collectorRunning = true;
        var response = true;

        collector.on('collect', async i => {
            if (i.user.id === interaction.user.id) {
                selected = true;
                if (i.values[0] !== text) {
                    selected = true;
                    await interaction.client.databaseEditData("update captcha_counter set fail_count = fail_count + 1 where user_id = ?", [interaction.user.id]);
                    //await userDailyLogger(interaction, interaction.user, "captcha", `Selected wrong captcha. Selected [${i.values[0]}] instead of [${text}]`);
                    await interaction.editReply({
                        embeds: [interaction.client.redEmbedImage(interaction.client.getWordLanguage(serverSettings.lang, "CAPTCHA_FAILED"), interaction.client.getWordLanguage(serverSettings.lang, "CAPTCHA_FAILED_TITLE"), i.user)], components: [], files: []
                    });
                    collector.stop();
                    if (captchaData.fail_count + 1 > 4) {
                        const webhookClient = new WebhookClient({ id: process.env.webhookId, token: process.env.webhookToken });

                        const embed = new MessageEmbed()
                            .setAuthor({ name: `${interaction.client.user.username} banned ${interaction.user.username}`, iconURL: interaction.client.user.avatarURL() })
                            .addField("User ID:", `\`${interaction.user.id}\``)
                            .addField("Reason:", `\`Selected wrong captcha text\``)
                            .setFooter({ text: "Ban Time" })
                            .setTimestamp()
                            .setColor('#0xed4245')
                            .setThumbnail(interaction.user.avatarURL());

                        webhookClient.send({
                            content: `<@!${interaction.user.id}>`,
                            username: 'Obelisk Logger',
                            embeds: [embed],
                        });
                        await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, "COMMAND_STOP_BAN").format(interaction.client.getWordLanguage(serverSettings.lang, "CAPTCHA_FAILED")), interaction.client.getWordLanguage(serverSettings.lang, "CM_LOCKED"))] })
                        await interaction.client.databaseEditData("insert into banned_users (user_id, banned_by, reason) values (?, ?, ?)", [interaction.user.id, `881243621293170738`, "Captcha validation failed. You have selected the wrong captcha text."])
                    }
                    response = false;

                } else {
                    selectedRightCapthca = true;
                    captchaRequired = false;
                    await interaction.client.databaseEditData("update captcha_counter set fail_count = 0, count = FLOOR(RAND()*(50-40+1))+40 where user_id = ?", [interaction.user.id]);
                    await interaction.editReply({ embeds: [interaction.client.greenEmbedImage(interaction.client.getWordLanguage(serverSettings.lang, "CAPTCHA_SUCCESSFUL"), interaction.client.getWordLanguage(serverSettings.lang, "CAPTCHA_SUCCESSFUL_TITLE"), i.user)], components: [], files: [] })
                    collector.stop();
                    response = false;
                }
            }
            else
                await i.update({});
        });
        collector.on('end', async collected => {
            collectorRunning = false;
            if (!selected) {
                selectedRightCapthca = false;
                await interaction.client.databaseEditData("update captcha_counter set fail_count = fail_count + 1 where user_id = ?", [interaction.user.id]);
                await interaction.editReply({ embeds: [interaction.client.redEmbed("**Interaction time out**")], components: [], files: [] });
                response = false;
            }
        });

        while (collectorRunning) {
            await new Promise(r => setTimeout(r, 1000));
        }

        return response;
    }

}

function getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}