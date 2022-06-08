require('dotenv').config();
const fetch = require("node-fetch");

/**
 * 
 * @param {Integer} channelID - The channel ID to send the message to
 * @param {Dictionary} requestBody - Request body to send, need to be a dictionary
 */
function sendMSG(channelID, requestBody) {

    var data = await fetch(`https://discord.com/api/v9/channels/${channelID}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${process.env.TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
        .then(response => response.json())
        .then(data => { return data });
}

/**
 * 
 * @param {Integer} userID - The user ID to send the message to
 * @param {Any} interaction - For db connection
 * @returns {Dictionary} - 'code' value is null if successful, otherwise it contains the error code
 */
function getDMChannel(userID, interaction) {
    var data = await fetch(`https://discord.com/api/v9/channels/${channelID}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${process.env.TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
        .then(response => {
            response = response.json();
            if (response.status == 200) {
                response['code'] = null;
                await interaction.client.databaseEditData('update users set dm_channel = ? where user_id = ?', [response.id, userID]);
            }
            return response.json();
        })
        .then(data => { return data });

    return data;
}

module.exports = {
    sendMSG,
    getDMChannel
}