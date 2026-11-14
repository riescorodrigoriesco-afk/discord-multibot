'use strict';

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('./src/commands');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.DEV_GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Faltan DISCORD_TOKEN y/o CLIENT_ID en las variables de entorno.');
  process.exit(1);
}

(async () => {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const body = commands.map((c) => c.data.toJSON());
  try {
    if (GUILD_ID && /^\d+$/.test(GUILD_ID)) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
      console.log('✅ ' + body.length + ' comandos registrados en el servidor ' + GUILD_ID + ' (al instante).');
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
      console.log('✅ ' + body.length + ' comandos registrados globalmente (puede tardar hasta 1 hora en aparecer la primera vez).');
    }
  } catch (e) {
    console.error('❌ No se pudieron registrar los comandos:', e.message);
    process.exit(1);
  }
})();
