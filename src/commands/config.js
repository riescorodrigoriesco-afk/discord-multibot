'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { embed, COLOR } = require('../helpers');
const store = require('../store');

const commands = [
  {
    data: new SlashCommandBuilder().setName('setwelcome').setDescription('Configura el canal y mensaje de bienvenida')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((o) => o.setName('canal').setDescription('Canal de bienvenida').setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
      .addStringOption((o) => o.setName('mensaje').setDescription('Usa {user} {server} {membercount} (opcional)').setMaxLength(500)),
    async execute(i) {
      const ch = i.options.getChannel('canal', true);
      const cfg = store.guild(i.guildId);
      cfg.welcomeChannel = ch.id;
      if (i.options.getString('mensaje')) cfg.welcomeMessage = i.options.getString('mensaje');
      store.save();
      return i.reply({ content: '✅ Bienvenidas en ' + ch.toString() + '.\nMensaje: ' + cfg.welcomeMessage, flags: 64 });
    },
  },
  {
    data: new SlashCommandBuilder().setName('setgoodbye').setDescription('Configura el canal y mensaje de despedida')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((o) => o.setName('canal').setDescription('Canal de despedida').setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
      .addStringOption((o) => o.setName('mensaje').setDescription('Usa {user} {server} {membercount} (opcional)').setMaxLength(500)),
    async execute(i) {
      const ch = i.options.getChannel('canal', true);
      const cfg = store.guild(i.guildId);
      cfg.goodbyeChannel = ch.id;
      if (i.options.getString('mensaje')) cfg.goodbyeMessage = i.options.getString('mensaje');
      store.save();
      return i.reply({ content: '✅ Despedidas en ' + ch.toString() + '.\nMensaje: ' + cfg.goodbyeMessage, flags: 64 });
    },
  },
  {
    data: new SlashCommandBuilder().setName('setlogs').setDescription('Configura el canal de logs')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((o) => o.setName('canal').setDescription('Canal de logs').setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
    async execute(i) {
      const ch = i.options.getChannel('canal', true);
      const cfg = store.guild(i.guildId);
      cfg.logsChannel = ch.id;
      store.save();
      return i.reply({ content: '✅ Logs en ' + ch.toString() + '.', flags: 64 });
    },
  },
  {
    data: new SlashCommandBuilder().setName('setautorole').setDescription('Rol que se da automáticamente al entrar')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addRoleOption((o) => o.setName('rol').setDescription('Rol a dar automáticamente').setRequired(true)),
    async execute(i) {
      const role = i.options.getRole('rol', true);
      if (role.managed) return i.reply({ content: '❌ Ese rol lo gestiona una integración, no puedo darlo.', flags: 64 });
      if (role.comparePositionTo(i.guild.members.me.roles.highest) >= 0) return i.reply({ content: '❌ Ese rol está por encima del mío: muévelo por debajo para poder dártelo.', flags: 64 });
      const cfg = store.guild(i.guildId);
      cfg.autoRole = role.id;
      store.save();
      return i.reply({ content: '✅ Autorol: ' + role.toString() + '.', flags: 64 });
    },
  },
  {
    data: new SlashCommandBuilder().setName('config').setDescription('Muestra la configuración actual del servidor')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(i) {
      const cfg = store.guild(i.guildId);
      const ch = (id) => (id ? '<#' + id + '>' : '—');
      const e = embed(COLOR.blue, '⚙️ Configuración de ' + i.guild.name, null).addFields(
        { name: 'Bienvenida', value: ch(cfg.welcomeChannel), inline: true },
        { name: 'Despedida', value: ch(cfg.goodbyeChannel), inline: true },
        { name: 'Logs', value: ch(cfg.logsChannel), inline: true },
        { name: 'Autorol', value: cfg.autoRole ? '<@&' + cfg.autoRole + '>' : '—', inline: true },
        { name: 'Antilinks', value: cfg.antilinks ? 'Activado' : 'Desactivado', inline: true },
      );
      return i.reply({ embeds: [e], flags: 64 });
    },
  },
  {
    data: new SlashCommandBuilder().setName('resetconfig').setDescription('Restablece toda la configuración del servidor')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(i) {
      store.resetGuild(i.guildId);
      return i.reply({ content: '✅ Configuración restablecida a los valores por defecto.', flags: 64 });
    },
  },
  {
    data: new SlashCommandBuilder().setName('antilinks').setDescription('Activa o desactiva el borrado automático de enlaces')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addBooleanOption((o) => o.setName('activado').setDescription('Encender o apagar').setRequired(true)),
    async execute(i) {
      const on = i.options.getBoolean('activado', true);
      const cfg = store.guild(i.guildId);
      cfg.antilinks = on;
      store.save();
      return i.reply({ content: on ? '✅ Antilinks activado: se borrarán enlaces de quien no tenga «Gestionar mensajes».' : '🔴 Antilinks desactivado.', flags: 64 });
    },
  },
];

module.exports = commands;
