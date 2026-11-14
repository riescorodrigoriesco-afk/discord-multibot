'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { embed, COLOR, canModerate, logEvent, parseDuration } = require('../helpers');
const store = require('../store');

const commands = [
  {
    data: new SlashCommandBuilder().setName('ban').setDescription('Banea a un usuario')
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption((o) => o.setName('usuario').setDescription('A quién banear').setRequired(true))
      .addStringOption((o) => o.setName('motivo').setDescription('Motivo').setMaxLength(300))
      .addIntegerOption((o) => o.setName('borrar_mensajes').setDescription('Borrar mensajes de los últimos N días (0-7)').setMinValue(0).setMaxValue(7)),
    async execute(i) {
      const user = i.options.getUser('usuario', true);
      const motivo = i.options.getString('motivo') || 'Sin motivo';
      const dias = i.options.getInteger('borrar_mensajes') || 0;
      const target = await i.guild.members.fetch(user.id).catch(() => null);
      if (target) {
        const chk = canModerate(i.guild, i.member, target, i.guild.members.me);
        if (!chk.ok) return i.reply({ content: '❌ ' + chk.reason, flags: 64 });
      }
      await i.guild.members.ban(user.id, { reason: motivo, deleteMessageSeconds: dias * 86400 });
      await logEvent(i.client, store, i.guildId, '🔨 Usuario baneado', [['Usuario', user.tag + ' (' + user.id + ')'], ['Moderador', i.user.tag], ['Motivo', motivo]], COLOR.red);
      return i.reply({ content: '✅ ' + user.tag + ' baneado. Motivo: ' + motivo });
    },
  },
  {
    data: new SlashCommandBuilder().setName('kick').setDescription('Expulsa a un usuario')
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption((o) => o.setName('usuario').setDescription('A quién expulsar').setRequired(true))
      .addStringOption((o) => o.setName('motivo').setDescription('Motivo').setMaxLength(300)),
    async execute(i) {
      const user = i.options.getUser('usuario', true);
      const motivo = i.options.getString('motivo') || 'Sin motivo';
      const target = await i.guild.members.fetch(user.id).catch(() => null);
      const chk = canModerate(i.guild, i.member, target, i.guild.members.me);
      if (!chk.ok) return i.reply({ content: '❌ ' + chk.reason, flags: 64 });
      await target.kick(motivo);
      await logEvent(i.client, store, i.guildId, '👢 Usuario expulsado', [['Usuario', user.tag + ' (' + user.id + ')'], ['Moderador', i.user.tag], ['Motivo', motivo]], COLOR.orange);
      return i.reply({ content: '✅ ' + user.tag + ' expulsado. Motivo: ' + motivo });
    },
  },
  {
    data: new SlashCommandBuilder().setName('timeout').setDescription('Silencia temporalmente a un usuario')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName('usuario').setDescription('A quién silenciar').setRequired(true))
      .addStringOption((o) => o.setName('duracion').setDescription('Ej: 10m, 1h, 1d (máximo 28 días)').setRequired(true))
      .addStringOption((o) => o.setName('motivo').setDescription('Motivo').setMaxLength(300)),
    async execute(i) {
      const user = i.options.getUser('usuario', true);
      const motivo = i.options.getString('motivo') || 'Sin motivo';
      const ms = parseDuration(i.options.getString('duracion', true), 28 * 24 * 60 * 60 * 1000);
      if (!ms) return i.reply({ content: '❌ Duración no válida (máximo 28 días).', flags: 64 });
      const target = await i.guild.members.fetch(user.id).catch(() => null);
      const chk = canModerate(i.guild, i.member, target, i.guild.members.me);
      if (!chk.ok) return i.reply({ content: '❌ ' + chk.reason, flags: 64 });
      await target.timeout(ms, motivo);
      await logEvent(i.client, store, i.guildId, '🔇 Usuario silenciado', [['Usuario', user.tag + ' (' + user.id + ')'], ['Moderador', i.user.tag], ['Duración', i.options.getString('duracion')], ['Motivo', motivo]], COLOR.orange);
      return i.reply({ content: '✅ ' + user.tag + ' silenciado durante ' + i.options.getString('duracion') + '. Motivo: ' + motivo });
    },
  },
  {
    data: new SlashCommandBuilder().setName('warn').setDescription('Añade una advertencia a un usuario')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName('usuario').setDescription('A quién advertir').setRequired(true))
      .addStringOption((o) => o.setName('motivo').setDescription('Motivo').setRequired(true).setMaxLength(300)),
    async execute(i) {
      const user = i.options.getUser('usuario', true);
      const motivo = i.options.getString('motivo', true);
      const target = await i.guild.members.fetch(user.id).catch(() => null);
      if (target) {
        const chk = canModerate(i.guild, i.member, target, i.guild.members.me);
        if (!chk.ok) return i.reply({ content: '❌ ' + chk.reason, flags: 64 });
      }
      const cfg = store.guild(i.guildId);
      if (!cfg.warnings[user.id]) cfg.warnings[user.id] = [];
      cfg.warnings[user.id].push({ reason: motivo, moderatorId: i.user.id, at: Date.now() });
      store.save();
      await logEvent(i.client, store, i.guildId, '⚠️ Advertencia', [['Usuario', user.tag + ' (' + user.id + ')'], ['Moderador', i.user.tag], ['Motivo', motivo], ['Total', cfg.warnings[user.id].length]], COLOR.orange);
      if (target) await target.send('⚠️ Has recibido una advertencia en **' + i.guild.name + '**. Motivo: ' + motivo).catch(() => {});
      return i.reply({ content: '✅ ' + user.tag + ' advertido (lleva ' + cfg.warnings[user.id].length + '). Motivo: ' + motivo });
    },
  },
  {
    data: new SlashCommandBuilder().setName('warnings').setDescription('Muestra las advertencias de un usuario')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName('usuario').setDescription('De quién').setRequired(true)),
    async execute(i) {
      const user = i.options.getUser('usuario', true);
      const cfg = store.guild(i.guildId);
      const list = cfg.warnings[user.id] || [];
      if (!list.length) return i.reply({ content: user.tag + ' no tiene advertencias.', flags: 64 });
      const e = embed(COLOR.orange, 'Advertencias de ' + user.tag, list.map((w, idx) => '**' + (idx + 1) + '.** ' + w.reason + ' — <@' + w.moderatorId + '> <t:' + Math.floor(w.at / 1000) + ':R>').join('\n'));
      return i.reply({ embeds: [e], flags: 64 });
    },
  },
  {
    data: new SlashCommandBuilder().setName('clear').setDescription('Borra varios mensajes del canal')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((o) => o.setName('cantidad').setDescription('Cuántos mensajes (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(i) {
      const n = i.options.getInteger('cantidad', true);
      await i.deferReply({ flags: 64 });
      const deleted = await i.channel.bulkDelete(n, true).catch(() => null);
      if (!deleted) return i.editReply('❌ No pude borrar mensajes (puede que tengan más de 14 días).');
      await logEvent(i.client, store, i.guildId, '🧹 Mensajes borrados', [['Canal', i.channel.toString()], ['Moderador', i.user.tag], ['Cantidad', deleted.size]], COLOR.gray);
      return i.editReply('✅ Borrados ' + deleted.size + ' mensajes.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('lock').setDescription('Bloquea un canal para que @everyone no pueda escribir')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName('canal').setDescription('Canal (por defecto, este)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    async execute(i) {
      const ch = i.options.getChannel('canal') || i.channel;
      if (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.GuildAnnouncement) return i.reply({ content: '❌ Ese canal no se puede bloquear.', flags: 64 });
      await ch.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: false });
      await logEvent(i.client, store, i.guildId, '🔒 Canal bloqueado', [['Canal', ch.toString()], ['Moderador', i.user.tag]], COLOR.red);
      return i.reply('🔒 ' + ch.toString() + ' bloqueado.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('unlock').setDescription('Desbloquea un canal')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName('canal').setDescription('Canal (por defecto, este)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    async execute(i) {
      const ch = i.options.getChannel('canal') || i.channel;
      if (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.GuildAnnouncement) return i.reply({ content: '❌ Ese canal no se puede desbloquear.', flags: 64 });
      await ch.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: null });
      await logEvent(i.client, store, i.guildId, '🔓 Canal desbloqueado', [['Canal', ch.toString()], ['Moderador', i.user.tag]], COLOR.green);
      return i.reply('🔓 ' + ch.toString() + ' desbloqueado.');
    },
  },
];

module.exports = commands;
