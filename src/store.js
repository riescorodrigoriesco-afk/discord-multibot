'use strict';

/* Config y datos por servidor, guardados en un único JSON (data/guilds.json). */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'guilds.json');

let db = {};

function load() {
  try {
    db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (_) {
    db = {};
  }
}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
    } catch (e) {
      console.error('[store] no se pudo guardar:', e.message);
    }
  }, 200);
}

function defaults() {
  return {
    welcomeChannel: null,
    welcomeMessage: '¡Bienvenido/a {user} a **{server}**! Ya somos {membercount} miembros.',
    goodbyeChannel: null,
    goodbyeMessage: '{user} ha salido de **{server}**. Éramos {membercount} miembros.',
    autoRole: null,
    logsChannel: null,
    antilinks: false,
    warnings: {}, // userId -> [{ reason, moderatorId, at }]
  };
}

function guild(id) {
  if (!db[id]) db[id] = defaults();
  // por si se añaden campos nuevos en una versión posterior
  db[id] = { ...defaults(), ...db[id] };
  return db[id];
}

function resetGuild(id) {
  db[id] = defaults();
  save();
  return db[id];
}

load();

module.exports = { guild, save, resetGuild, defaults };
