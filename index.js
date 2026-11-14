'use strict';

require('dotenv').config();
const http = require('http');
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const commands = require('./src/commands');
const { attachEvents } = require('./src/events');

/* Render (igual que otros hosts tipo "web service") espera que el proceso escuche un puerto;
   esta página mínima solo sirve para que el health check pase, el bot en sí funciona por el gateway. */
let ready = false;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(ready ? 'Bot conectado.' : 'Bot arrancando…');
}).listen(process.env.PORT || 3000, () => {
  console.log('[bot] Servidor de salud escuchando en el puerto ' + (process.env.PORT || 3000));
});

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('[bot] Falta DISCORD_TOKEN en las variables de entorno.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection();
for (const c of commands) client.commands.set(c.data.name, c);

client.on('interactionCreate', async (i) => {
  if (!i.isChatInputCommand()) return;
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(i);
  } catch (e) {
    console.error('[bot] Error en /' + i.commandName + ':', e);
    const payload = { content: '⚠️ Algo falló: ' + e.message.slice(0, 300), flags: 64 };
    try {
      if (i.deferred || i.replied) await i.followUp(payload);
      else await i.reply(payload);
    } catch (_) { /* nada que hacer si ni eso funciona */ }
  }
});

attachEvents(client);

client.once('clientReady', async (c) => {
  ready = true;
  console.log('[bot] Conectado como ' + c.user.tag + ' · ' + c.guilds.cache.size + ' servidor(es) · ' + client.commands.size + ' comandos cargados');
  // Registra los comandos slash solo al arrancar (no en cada reconexión), para no gastar la cuota de la API sin necesidad.
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    const body = commands.map((cmd) => cmd.data.toJSON());
    const guildId = process.env.DEV_GUILD_ID;
    if (guildId && /^\d+$/.test(guildId)) {
      await rest.put(Routes.applicationGuildCommands(c.user.id, guildId), { body });
      console.log('[bot] ' + body.length + ' comandos registrados en el servidor ' + guildId + ' (al instante).');
    } else {
      await rest.put(Routes.applicationCommands(c.user.id), { body });
      console.log('[bot] ' + body.length + ' comandos registrados globalmente.');
    }
  } catch (e) {
    console.error('[bot] No se pudieron registrar los comandos:', e.message);
  }
});

client.on('error', (e) => console.error('[bot] Error del cliente:', e.message));
client.on('shardError', (e) => console.error('[bot] Error del shard:', e.message));

client.login(TOKEN);
