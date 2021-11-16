module.exports = function (app, API_SECRET, shard) {
    app.get('/logs', async (req, res) => {
        const signature = req.headers['x-api-key'];
        const body = req.body;
        const fs = require('fs');
        var logFileName;

        if (signature !== API_SECRET) {
            return res.sendStatus(401);
        }

        if (typeof body.date === 'undefined') {
            var todayDate = new Date();
            var dd = String(todayDate.getDate()).padStart(2, '0');
            var mm = String(todayDate.getMonth() + 1).padStart(2, '0');
            var yyyy = todayDate.getFullYear();

            logFileName = 'log-' + dd + '-' + mm + '-' + yyyy + '.log';
        } else {
            logFileName = `log-${body.date}.log`;
        }



        fs.readFile(`./logs/${logFileName}`, 'utf8', (err, jsonString) => {
            if (err || jsonString === '') {
                return res.type('application/json').status(404).send(JSON.stringify({ error: "No logs data available." }));
            }


            if (typeof body.type !== 'undefined' && body.type !== "") {
                if (typeof jsonString == "string") {
                    jsonString = jsonString.split('\n');
                }
                var newJson = [];
                jsonString.forEach((item, index) => {
                    if (index < jsonString.length - 1) {
                        if (typeof item == "string") {
                            var data = JSON.parse(item);
                        } else {
                            var data = iten;
                        }
                        if (data.level == body.type.toLowerCase()) {
                            newJson.push(data);
                        }
                    }
                })
                jsonString = newJson;
            }


            if (typeof body.command !== 'undefined' && body.command !== "") {
                if (typeof jsonString == "string") {
                    jsonString = jsonString.split('\n');
                }
                var newJson = [];
                jsonString.forEach((item, index) => {
                    if (index < jsonString.length - 1) {
                        if (typeof item == "string") {
                            var data = JSON.parse(item);
                        } else {
                            var data = item;
                        }
                        if (data.command_name == body.command.toLowerCase()) {
                            newJson.push(data);
                        }
                    }
                })
                jsonString = newJson;
            }

            if (jsonString === '' || jsonString.length < 1) {
                return res.type('application/json').status(404).send(JSON.stringify({ error: "No logs data available." }));
            }
            res.type('application/json').status(200).send(jsonString);


        })

    });
}