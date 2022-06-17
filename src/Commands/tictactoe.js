const Command = require('../Structures/Command.js');
const errorLog = require('../Utility/logger').logger;
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const utility = require('../Utility/utils');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Tic-tac-toe game!')
        .addUserOption(option => option
            .setName('player')
            .setDescription('Player to play with')
            .setRequired(true)),

    async execute(interaction, userInfo, serverSettings) {
        String.prototype.format = function () {
            var i = 0, args = arguments;
            return this.replace(/{}/g, function () {
                return typeof args[i] != 'undefined' ? args[i++] : '';
            });
        };

        try {
            var secondPlayer = interaction.options.getUser('player');
            if (secondPlayer.id == interaction.user.id) {
                return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ERROR_SAME_USER'))] });
            }
            if (secondPlayer.bot) {
                return await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'ERROR_BOT_USER'))] });
            }
            var players = { "X": interaction.user.id, "O": secondPlayer.id };
            var board = new Array(9).fill("⬜");
            var turnShape = '❌';
            var id = new Date().getTime() + "t";
            var timer = 30000;
            const rowYesNo = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(id + 'yes')
                        .setLabel('YES')
                        .setStyle('SUCCESS'),
                    new MessageButton()
                        .setCustomId(id + 'no')
                        .setLabel('NO')
                        .setStyle('DANGER'),
                );
            await interaction.reply({
                content: `<@${players['O']}>`,
                embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TICTACTOE_INVITE').format(players[(turnShape == '❌') ? 'X' : 'O']))],
                components: [rowYesNo]
            });

            var accepted = false;
            // check if want to play
            const filter1 = i => {
                i.customId.startsWith(id) && i.member.id === players['O'];
            }

            const collector1 = interaction.channel.createMessageComponentCollector({ filter1, time: timer });
            collector1.on('collect', async (i) => {
                if (i.component.customId == id + 'yes' && i.member.id === players['O']) {
                    accepted = true;
                    collector1.stop();
                    await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TICTACTOE_TURN').format(players[(turnShape == '❌') ? 'X' : 'O']))], components: toComponents(false, board, id) });
                }
            });

            var awaitConfirmation = true;

            collector1.on('end', async i => {
                awaitConfirmation = false;
            });

            while (awaitConfirmation) {
                await new Promise(r => setTimeout(r, 1000));
            }

            if (!accepted) {
                return await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TICTACTOE_DECLINE').format(players['O']))], components: [] });
            }
            const filter = i => i.customId.startsWith(id) && i.member.id === players[(turnShape == '❌') ? 'X' : 'O'];

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: timer });
            var draw,
                won,
                completed = false;
            collector.on('collect', async (i) => {
                board[Number(i.customId.split(";")[1])] = turnShape;
                if (isDraw(board)) {
                    collector1.stop();
                    draw = true;
                    completed = true;
                    await i.update({ embeds: [interaction.client.yellowEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TICTACTOE_DRAW'))], components: toComponents(true, board, id) });
                } else if (hasWinner(board)) {
                    collector1.stop();
                    won = true;
                    completed = true;
                    changeColourBoard(board);
                    await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TICTACTOE_WON').format(players[(turnShape == '❌') ? 'X' : 'O']))], components: toComponents(true, board, id) });
                } else {
                    turnShape = turnShape === "❌" ? "⭕" : "❌";
                    collector.resetTimer({ time: timer });
                    await i.update({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TICTACTOE_TURN').format(players[(turnShape == '❌') ? 'X' : 'O']))], components: toComponents(false, board, id) });
                }
            });
            collector.on('end', async i => {
                if (!completed) {
                    await interaction.editReply({ embeds: [interaction.client.greenEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'TICTACTOE_WON_T').format(players[(turnShape == '❌') ? 'O' : 'X']))], components: toComponents(true, board, id) });
                }
            });
        } catch (error) {
            if (interaction.replied) {
                await interaction.editReply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [interaction.client.redEmbed(interaction.client.getWordLanguage(serverSettings.lang, 'catchError'), "Error!!")], ephemeral: true });
            }

            errorLog.error(error.message, { 'command_name': interaction.commandName });
        }
    }
}

function isDraw(array) {
    return !array.includes("⬜") && !hasWinner(array);
}

function hasWinner(array) {
    var lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const turn of ["❌", "⭕"]) {
        for (const line of lines) {
            if (array[line[0]] === array[line[1]]
                && array[line[1]] === array[line[2]]
                && array[line[2]] === turn) {
                return turn;
            }
        }
    }
    return false;
}

function changeColourBoard(array) {
    var lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const turn of ["❌", "⭕"]) {
        for (const line of lines) {
            if (array[line[0]] === array[line[1]]
                && array[line[1]] === array[line[2]]
                && array[line[2]] === turn) {
                array[line[0]] = "v" + turn;
                array[line[1]] = "v" + turn;
                array[line[2]] = "v" + turn;
                return array;
            }
        }
    }
    return array;
}

function toComponents(disabled, board, id) {
    const components = [];
    for (let i = 0; i < 3; i++) {
        components[i] = new MessageActionRow();
        for (let j = 0; j < 3; j++) {
            components[i].addComponents(
                new MessageButton()
                    .setCustomId(`${id};${i * 3 + j} `)
                    .setStyle((board[i * 3 + j].startsWith('v')) ? "SUCCESS" : "SECONDARY")
                    .setLabel((board[i * 3 + j].startsWith('v') ? board[i * 3 + j].slice(1) : board[i * 3 + j]))
                    .setDisabled(disabled || (!disabled && board[i * 3 + j] !== "⬜"))
            );
        }
    }
    return components;
}

