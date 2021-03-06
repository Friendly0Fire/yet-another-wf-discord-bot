import * as fs from 'fs';
import * as path from 'path';
import * as Commando from 'discord.js-commando';
import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';
import * as bsqlite from 'better-sqlite3';
import { WarframeProfileManager } from './modules/profile';
import { WarframeGuildManager } from './modules/guild';
import { FallbackCommand } from './fallbackCommand';

function indentedLog(txt: string): string {
    return txt.split("\n").map((line, i) => {
        if(i > 0) {
            line = "    " + line;
        }
        return line;
    }).join("\n");
}

process.on('uncaughtException', function(error) {
    console.error(error);
    process.exit(1);
   });

interface Configuration {
    token: string;
    owner: string;

    dataPath: string;
}

// Load settings
let config: Configuration = {} as Configuration;
config.dataPath = path.join(process.cwd(), "data/");

{
    let rawConfig = fs.readFileSync(path.join(config.dataPath, 'config.json')).toString();
    Object.assign(config, JSON.parse(rawConfig));

    if(!config.token) {
        console.error('No token found, cannot proceed.');
        process.exit(1);
    }
}

const client = new Commando.Client({
    'owner': config.owner || ''
});

// Commando configuration
client.registry
    .registerGroups([
        ['wf', 'Warframe-related commands'],
        ['general', 'General bot commands']
    ])
    .registerDefaults()
    .registerCommandsIn({
        dirname: path.join(__dirname, 'commands'),
        filter: /^(.+)\.(j|t)s$/
    });
client.registry.unknownCommand = new FallbackCommand(client);

(async () => {
    const db = await sqlite.open({ filename: path.join(config.dataPath, 'settings.db'),
                                    driver: sqlite3.Database });
    client.setProvider(new Commando.SQLiteProvider(db));
})();

client.on('debug', x => console.log("Discord.js debug: " + indentedLog(x)));

// Profile Manager initialization
const db = bsqlite(path.join(config.dataPath, 'wf.db'), { verbose: x => console.log("SQL statement: " + indentedLog(x)) });
const profileManager = new WarframeProfileManager(db, client);
const guildManager = new WarframeGuildManager(db, client);

client.on('ready', () => {
    console.log('Bot initialized.');
    client.owners.forEach(u => u.send("Restarted!"));
});
client.on('error', console.error);

client.login(config.token);

console.log("Gracefully shutting down...");