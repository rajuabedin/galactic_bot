/**
 * Configurations of logger.
 */
class NewLogger {

    async log(exception, interaction) {
        return await interaction.client.databaseEditDataReturnID('insert into bot_log (exceptionType, exceptionMessage, fullException, commandName, userID) values (?,?,?,?,?)', ['log', exception.message, exception.stack, interaction.commandName, interaction.user.id]);
    }

    async error(exception, interaction) {
        return await interaction.client.databaseEditDataReturnID('insert into bot_log (exceptionType, exceptionMessage, fullException, commandName, userID) values (?,?,?,?,?)', ['error', exception.message, exception.stack, interaction.commandName, interaction.user.id]);
    }

    async warn(exception, interaction) {
        return await interaction.client.databaseEditDataReturnID('insert into bot_log (exceptionType, exceptionMessage, fullException, commandName, userID) values (?,?,?,?,?)', ['warn', exception.message, exception.stack, interaction.commandName, interaction.user.id]);
    }

}

module.exports = {
    'logger': new NewLogger()
};