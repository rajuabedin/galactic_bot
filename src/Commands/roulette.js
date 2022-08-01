const Command = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;
const { SlashCommandBuilder } = require('@discordjs/builders');
const utility = require('../Utility/utils');
const { MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Roulette minigame')
        .addSubcommand(subcommand => subcommand
            .setName('colour')
            .setDescription('Roulette minigame with colour')
            .addStringOption(option => option
                .setName('colour')
                .setDescription('The colour where you want to bet')
                .setRequired(true)
                .addChoice('red', 'red')
                .addChoice('black', 'black'))
            .addIntegerOption(option => option
                .setName('bet')
                .setDescription('Amount of credits to bet')))
        .addSubcommand(subcommand => subcommand
            .setName('number')
            .setDescription('Roulette minigame with number')
            .addIntegerOption(option => option
                .setName('number')
                .setRequired(true)
                .setDescription('The number where you want to bet'))
            .addIntegerOption(option => option
                .setName('bet')
                .setDescription('Amount of credits to bet'))),

    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            let canWin = utility.weightedRandom([true, false], [0.3, 0.7]);
            let maxBet = 500;
            let bet = interaction.options.getInteger('bet');

            if (bet == null) {
                bet = 1
            }

            if (bet > maxBet) {
                return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'BET_LIMIT_ERROR').format(maxBet))] });
            }

            if (bet < 1) {
                return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ERROR_VALUE_LOWER_1').format('bet'))] });
            }

            let rouletteNumber = utility.getRandomNumberBetween(0, 36);


            if (interaction.options.getSubcommand() == 'colour') {
                let colour = interaction.options.getString('colour');

                if (!canWin) {
                    let keepRunning = true;
                    while (keepRunning) {
                        if (rouletteNumber % 2 == 0 && colour == 'red') {
                            rouletteNumber = getRandomNumberBetween(0, 36);
                        } else if (rouletteNumber % 2 == 1 && colour == 'black') {
                            rouletteNumber = getRandomNumberBetween(0, 36);
                        } else {
                            keepRunning = false;
                        }
                    }
                }

                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setAuthor({ name: interaction.client.getWordLanguage(serverSettings.lang, 'ROULETTE_TITLE').format(interaction.user.username), iconURL: interaction.user.avatarURL() })
                    .setThumbnail('https://obelisk.club/npc/casino-roulette.gif')
                    .setDescription(interaction.client.getWordLanguage(serverSettings.lang, 'ROULETTE_DESCRIPTION_C').format(bet, colour))

                await interaction.reply({ embeds: [embed] });
                await new Promise(r => setTimeout(r, 2000));

                if (rouletteNumber % 2 == 0 && colour == 'red') {
                    return await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ROULETTE_WON').format(bet * 2, rouletteNumber, (rouletteNumber % 2 == 0) ? 'red' : 'black'))] });
                }

                if (rouletteNumber % 2 != 0 && colour == 'black') {
                    return await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ROULETTE_WON').format(bet * 2, rouletteNumber, (rouletteNumber % 2 == 0) ? 'red' : 'black'))] });
                }

                return await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ROULETTE_LOST').format(bet, rouletteNumber, (rouletteNumber % 2 == 0) ? 'red' : 'black'))] });

            } else if (interaction.options.getSubcommand() == 'number') {
                let selectedNumber = interaction.options.getInteger('number');
                if (selectedNumber < 0 || selectedNumber > 36) {
                    return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ERROR_VALUE_BETWEEN').format('number', 0, 36))] });
                }
                if (!canWin) {
                    let keepRunning = true;
                    while (keepRunning) {
                        if (rouletteNumber == selectedNumber) {
                            rouletteNumber = getRandomNumberBetween(0, 36);
                        } else {
                            keepRunning = false;
                        }
                    }
                }
                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setAuthor({ name: interaction.client.getWordLanguage(serverSettings.lang, 'ROULETTE_TITLE').format(interaction.user.username), iconURL: interaction.user.avatarURL() })
                    .setThumbnail('https://obelisk.club/npc/casino-roulette.gif')
                    .setDescription(interaction.client.getWordLanguage(serverSettings.lang, 'ROULETTE_DESCRIPTION_N').format(bet, selectedNumber))

                await interaction.reply({ embeds: [embed] });
                await new Promise(r => setTimeout(r, 2000));

                if (selectedNumber == rouletteNumber) {
                    return await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ROULETTE_WON').format(bet * 2, rouletteNumber, (rouletteNumber % 2 == 0) ? 'red' : 'black'))] });
                }
                return await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ROULETTE_LOST').format(bet, rouletteNumber, (rouletteNumber % 2 == 0) ? 'red' : 'black'))] });
            }

        } catch (error) {
            let errorID = await errorLog.error(error, interaction);
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID))], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError').format(errorID), "Error!!")], ephemeral: true });
            }
        }
    }
}