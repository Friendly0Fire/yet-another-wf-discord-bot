'use strict';

// Load libraries
const axios = require('axios').default;
const cheerio = require('cheerio');
const misc = require('./misc');

const dayjs = require('dayjs');
const dayjs_customParseFormat = require('dayjs/plugin/customParseFormat');
const dayjs_utc = require('dayjs/plugin/utc');
const dayjs_timezone = require('dayjs/plugin/timezone');

dayjs.extend(dayjs_customParseFormat);
dayjs.extend(dayjs_utc);
dayjs.extend(dayjs_timezone);

class WarframeStreams {
    static instance = undefined;

    constructor() {
        if(WarframeStreams.instance != undefined)
            throw "Instance already exists!";

        WarframeStreams.instance = this;
    }

    setupClient(client) { }

    async _loadNextStreamTime() {

        const response = await axios.get(`https://www.twitch.tv/warframe/schedule`, {
            headers: {
                'Cache-Control': 'max-age=0',
                'Accept': 'text/html,application/xhtml+xml,application/xml'
            }
        });

        if(response.status !== 200)
            throw "Could not reach Twitch!";

        const $ = cheerio.load(response.data);
        const text = $(".stream-schedule__header h2").next().text().trim();
        const regex = /The next stream is on ([a-zA-Z]+) at (.+)\./;

        const match = text.match(regex);

        const dayOfWeek = match[1];
        const time = match[2];

        const timeMap = {
            "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
        };

        let parsedTime = dayjs(time, 'h:mm A [EDT]', 'en', true);
        let parsedTimeWithTZ = dayjs(new Date(parsedTime.toDate().toLocaleString('en-US', { timeZone: "America/Toronto" })));
        let finalTime = parsedTimeWithTZ.day(timeMap[dayOfWeek]);

        return finalTime;
    }
}

module.exports = { WarframeStreams };