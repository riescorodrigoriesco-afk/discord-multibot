'use strict';

const { PermissionFlagsBits } = require('discord.js');
const store = require('./store');
const { fill, logEvent, COLOR } = require('./helpers');

const LINK_RE = /https?:\/\/\S+|discord\.gg\/\S+/i;

function attachEvents(client) {
  client.on('guildMemberAdd', async (member) => {
    try {
      const cfg = store.guild(member.guild.id);
      const vars = { user: member.toString(), username: member.user.username, server: member.guild.name, membercount: member.guild.memberCount };
      if (cfg.welcomeChannel) {
        const ch = member.guild.channels.cache.get(cfg.welcomeChannel);
        if (ch && ch.isTextBased()) await ch.send(fill(cfg.welcomeMessage, vars)).catch(() => {});
      }
      if (cfg.welcomeChannel) await member.send(fill(cfg.welcomeMessage, vars)).catch(() => {});
      if (cfg.autoRole) {
        const role = member.guild.roles.cache.get(cfg.autoRole);
        if (role) await member.roles.add(role).catch(() => {});
      }
      await logEvent(client, store, member.guild.id, '📥 Entró al servidor', [['Usuario', member.user.tag + ' (' + member.id + ')'], ['Miembros', member.guild.memberCount]], COLOR.green);
    } catch (e) { console.error('[events] guildMemberAdd:', e.message); }
  });

  client.on('guildMemberRemove', async (member) => {
    try {
      const cfg = store.guild(member.guild.id);
      const vars = { user: member.user.tag, username: member.user.username, server: member.guild.name, membercount: member.guild.memberCount };
      if (cfg.goodbyeChannel) {
        const ch = member.guild.channels.cache.get(cfg.goodbyeChannel);
        if (ch && ch.isTextBased()) await ch.send(fill(cfg.goodbyeMessage, vars)).catch(() => {});
      }
      await logEvent(client, store, member.guild.id, '📤 Salió del servidor', [['Usuario', member.user.tag + ' (' + member.id + ')'], ['Miembros', member.guild.memberCount]], COLOR.gray);
    } catch (e) { console.error('[events] guildMemberRemove:', e.message); }
  });

  client.on('messageCreate', async (msg) => {
    try {
      if (!msg.guild || msg.author.bot) return;
      const cfg = store.guild(msg.guild.id);
      if (!cfg.antilinks || !LINK_RE.test(msg.content)) return;
      if (msg.member && msg.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
      await msg.delete().catch(() => {});
      const warn = await msg.channel.send(msg.author.toString() + ' no se permiten enlaces aquí.').catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);
      await logEvent(client, store, msg.guild.id, '🔗 Enlace borrado (antilinks)', [['Usuario', msg.author.tag], ['Canal', msg.channel.toString()]], COLOR.orange);
    } catch (e) { console.error('[events] messageCreate:', e.message); }
  });

  client.on('messageDelete', async (msg) => {
    try {
      if (!msg.guild || (msg.author && msg.author.bot)) return;
      await logEvent(client, store, msg.guild.id, '🗑️ Mensaje borrado', [
        ['Autor', msg.author ? msg.author.tag : 'desconocido'],
        ['Canal', msg.channel.toString()],
        ['Contenido', msg.content || '(sin texto / no se pudo leer)'],
      ], COLOR.gray);
    } catch (e) { console.error('[events] messageDelete:', e.message); }
  });

  client.on('messageUpdate', async (oldMsg, newMsg) => {
    try {
      if (!newMsg.guild || (newMsg.author && newMsg.author.bot)) return;
      if (oldMsg.content === newMsg.content) return;
      await logEvent(client, store, newMsg.guild.id, '✏️ Mensaje editado', [
        ['Autor', newMsg.author ? newMsg.author.tag : 'desconocido'],
        ['Canal', newMsg.channel.toString()],
        ['Antes', (oldMsg.content || '(vacío)').slice(0, 500)],
        ['Después', (newMsg.content || '(vacío)').slice(0, 500)],
      ], COLOR.gray);
    } catch (e) { console.error('[events] messageUpdate:', e.message); }
  });

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
      const added = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
      const removed = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));
      if (!added.size && !removed.size) return;
      const fields = [['Usuario', newMember.user.tag]];
      if (added.size) fields.push(['Roles añadidos', added.map((r) => r.toString()).join(', ')]);
      if (removed.size) fields.push(['Roles quitados', removed.map((r) => r.toString()).join(', ')]);
      await logEvent(client, store, newMember.guild.id, '🎭 Roles actualizados', fields, COLOR.blue);
    } catch (e) { console.error('[events] guildMemberUpdate:', e.message); }
  });

  client.on('channelCreate', async (ch) => {
    if (!ch.guild) return;
    await logEvent(client, store, ch.guild.id, '📁 Canal creado', [['Canal', ch.toString() || ('#' + ch.name)], ['Tipo', String(ch.type)]], COLOR.green);
  });

  client.on('channelDelete', async (ch) => {
    if (!ch.guild) return;
    await logEvent(client, store, ch.guild.id, '📁 Canal borrado', [['Canal', '#' + ch.name], ['Tipo', String(ch.type)]], COLOR.red);
  });
}

module.exports = { attachEvents };
