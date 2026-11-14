'use strict';

const { EmbedBuilder } = require('discord.js');

const COLOR = { blue: 0x5865f2, green: 0x57f287, red: 0xed4245, orange: 0xfee75c, gray: 0x99aab5 };

function embed(color, title, desc) {
  const e = new EmbedBuilder().setColor(color).setTimestamp();
  if (title) e.setTitle(title);
  if (desc) e.setDescription(desc);
  return e;
}

function fill(template, vars) {
  return String(template || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/* ¿Puede 'actor' actuar sobre 'target' (ban/kick/timeout/warn)? No sobre el dueño, no sobre alguien
   con un rol igual o más alto, y el bot tiene que poder (su rol más alto por encima del target). */
function canModerate(guild, actorMember, target, me) {
  if (!target) return { ok: false, reason: 'Ese usuario no está en el servidor.' };
  if (target.id === guild.ownerId) return { ok: false, reason: 'No puedo actuar sobre el dueño del servidor.' };
  if (target.id === actorMember.id) return { ok: false, reason: 'No puedes usar esto sobre ti mismo.' };
  if (actorMember.id !== guild.ownerId && target.roles.highest.comparePositionTo(actorMember.roles.highest) >= 0) {
    return { ok: false, reason: 'Ese usuario tiene un rol igual o superior al tuyo.' };
  }
  if (target.roles.highest.comparePositionTo(me.roles.highest) >= 0) {
    return { ok: false, reason: 'Ese usuario tiene un rol igual o superior al mío: no puedo actuar sobre él.' };
  }
  return { ok: true };
}

async function logEvent(client, store, guildId, title, fields, color = COLOR.gray) {
  try {
    const cfg = store.guild(guildId);
    if (!cfg.logsChannel) return;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    const ch = guild.channels.cache.get(cfg.logsChannel);
    if (!ch || !ch.isTextBased()) return;
    const e = embed(color, title, null);
    if (fields && fields.length) e.addFields(fields.map(([name, value]) => ({ name, value: String(value).slice(0, 1024) })));
    await ch.send({ embeds: [e] }).catch(() => {});
  } catch (_) { /* un fallo de logs nunca debe tumbar nada */ }
}

function parseDuration(str, maxMs) {
  const ms = require('ms');
  let n;
  try { n = ms(String(str)); } catch (_) { n = null; }
  if (!n || typeof n !== 'number' || n <= 0) return null;
  if (maxMs && n > maxMs) return null;
  return n;
}

module.exports = { COLOR, embed, fill, canModerate, logEvent, parseDuration };
