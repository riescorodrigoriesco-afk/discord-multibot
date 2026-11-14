'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { embed, COLOR } = require('../helpers');

const NUMS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

const commands = [
  {
    data: new SlashCommandBuilder().setName('help').setDescription('Muestra todos los comandos del bot'),
    async execute(i) {
      const e = embed(COLOR.blue, '📖 Comandos', null)
        .addFields(
          { name: 'Utilidades', value: '`/help` `/ping` `/server` `/user` `/avatar` `/poll` `/announce` `/remind`' },
          { name: 'Moderación', value: '`/ban` `/kick` `/timeout` `/warn` `/warnings` `/clear` `/lock` `/unlock`' },
          { name: 'Configuración', value: '`/setwelcome` `/setgoodbye` `/setlogs` `/setautorole` `/config` `/resetconfig` `/antilinks`' },
        );
      return i.reply({ embeds: [e], flags: 64 });
    },
  },
  {
    data: new SlashCommandBuilder().setName('ping').setDescription('Muestra la latencia del bot'),
    async execute(i) {
      const sent = await i.reply({ content: '🏓 Calculando…', fetchReply: true });
      const rt = sent.createdTimestamp - i.createdTimestamp;
      await i.editReply('🏓 Pong! Latencia: **' + rt + 'ms** · WebSocket: **' + i.client.ws.ping + 'ms**');
    },
  },
  {
    data: new SlashCommandBuilder().setName('server').setDescription('Información del servidor'),
    async execute(i) {
      const g = i.guild;
      const owner = await g.fetchOwner().catch(() => null);
      const e = embed(COLOR.blue, g.name, null)
        .setThumbnail(g.iconURL() || null)
        .addFields(
          { name: 'Dueño', value: owner ? owner.user.tag : '—', inline: true },
          { name: 'Miembros', value: String(g.memberCount), inline: true },
          { name: 'Creado', value: '<t:' + Math.floor(g.createdTimestamp / 1000) + ':D>', inline: true },
          { name: 'Canales', value: String(g.channels.cache.size), inline: true },
          { name: 'Roles', value: String(g.roles.cache.size), inline: true },
          { name: 'Nivel de boost', value: 'Nivel ' + g.premiumTier + ' (' + g.premiumSubscriptionCount + ' boosts)', inline: true },
        );
      return i.reply({ embeds: [e] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('user').setDescription('Información de un usuario')
      .addUserOption((o) => o.setName('usuario').setDescription('A quién mirar (por defecto, tú)')),
    async execute(i) {
      const user = i.options.getUser('usuario') || i.user;
      const member = await i.guild.members.fetch(user.id).catch(() => null);
      const e = embed(COLOR.blue, user.tag, null).setThumbnail(user.displayAvatarURL());
      e.addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Cuenta creada', value: '<t:' + Math.floor(user.createdTimestamp / 1000) + ':D>', inline: true },
      );
      if (member) {
        e.addFields(
          { name: 'Entró al servidor', value: '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':D>', inline: true },
          { name: 'Rol más alto', value: member.roles.highest.toString(), inline: true },
          { name: 'Roles', value: String(member.roles.cache.size - 1), inline: true },
        );
      }
      return i.reply({ embeds: [e] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('avatar').setDescription('Muestra el avatar de un usuario')
      .addUserOption((o) => o.setName('usuario').setDescription('De quién (por defecto, tú)')),
    async execute(i) {
      const user = i.options.getUser('usuario') || i.user;
      const e = embed(COLOR.blue, 'Avatar de ' + user.tag, null).setImage(user.displayAvatarURL({ size: 512 }));
      return i.reply({ embeds: [e] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('poll').setDescription('Crea una votación con reacciones')
      .addStringOption((o) => o.setName('pregunta').setDescription('La pregunta de la votación').setRequired(true).setMaxLength(200))
      .addStringOption((o) => o.setName('opcion1').setDescription('Opción 1 (si no pones opciones, es sí/no)').setMaxLength(80))
      .addStringOption((o) => o.setName('opcion2').setDescription('Opción 2').setMaxLength(80))
      .addStringOption((o) => o.setName('opcion3').setDescription('Opción 3').setMaxLength(80))
      .addStringOption((o) => o.setName('opcion4').setDescription('Opción 4').setMaxLength(80)),
    async execute(i) {
      const pregunta = i.options.getString('pregunta', true);
      const opts = [1, 2, 3, 4].map((n) => i.options.getString('opcion' + n)).filter(Boolean);
      const e = embed(COLOR.blue, '📊 ' + pregunta, opts.length ? opts.map((o, idx) => NUMS[idx] + ' ' + o).join('\n') : null)
        .setFooter({ text: 'Votación de ' + i.user.tag });
      await i.reply({ embeds: [e] });
      const msg = await i.fetchReply();
      const emojis = opts.length ? NUMS.slice(0, opts.length) : ['👍', '👎'];
      for (const em of emojis) await msg.react(em).catch(() => {});
    },
  },
  {
    data: new SlashCommandBuilder().setName('announce').setDescription('Envía un anuncio a un canal')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((o) => o.setName('canal').setDescription('Canal destino').setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
      .addStringOption((o) => o.setName('mensaje').setDescription('Texto del anuncio').setRequired(true).setMaxLength(1900)),
    async execute(i) {
      const ch = i.options.getChannel('canal', true);
      const mensaje = i.options.getString('mensaje', true);
      if (!ch.isTextBased()) return i.reply({ content: '❌ Ese canal no sirve para mensajes.', flags: 64 });
      await ch.send({ content: mensaje }).catch((e) => { throw new Error('No pude enviarlo ahí: ' + e.message); });
      return i.reply({ content: '✅ Anuncio enviado en ' + ch.toString() + '.', flags: 64 });
    },
  },
  {
    data: new SlashCommandBuilder().setName('remind').setDescription('Te recuerda algo pasado un tiempo')
      .addStringOption((o) => o.setName('tiempo').setDescription('Ej: 10m, 2h, 1d (máximo 7 días)').setRequired(true))
      .addStringOption((o) => o.setName('mensaje').setDescription('Qué recordar').setRequired(true).setMaxLength(500)),
    async execute(i) {
      const { parseDuration } = require('../helpers');
      const ms = parseDuration(i.options.getString('tiempo', true), 7 * 24 * 60 * 60 * 1000);
      if (!ms) return i.reply({ content: '❌ Formato de tiempo no válido (ejemplos: `10m`, `2h`, `1d`; máximo 7 días).', flags: 64 });
      const mensaje = i.options.getString('mensaje', true);
      const channelId = i.channelId;
      await i.reply({ content: '⏰ Vale, te lo recuerdo <t:' + Math.floor((Date.now() + ms) / 1000) + ':R>.', flags: 64 });
      setTimeout(() => {
        const ch = i.client.channels.cache.get(channelId);
        if (ch && ch.isTextBased()) ch.send({ content: i.user.toString() + ' ⏰ Recordatorio: ' + mensaje }).catch(() => {});
      }, ms);
    },
  },
];

module.exports = commands;
