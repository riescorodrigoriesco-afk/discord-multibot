# Bot Discord multifunción

Bot para servidores de Discord con configuración independiente por servidor.

## Funciones incluidas

- Bienvenida en canal y mensaje privado al nuevo miembro.
- Despedida en canal.
- Autorol automático.
- Canal de logs para eventos importantes.
- Logs de entradas, salidas, mensajes editados/eliminados, cambios de roles/canales y moderación.
- Moderación: `ban`, `kick`, `timeout`, `warn`, `warnings`, `clear`, `lock` y `unlock`.
- Utilidades: `help`, `ping`, `server`, `user`, `avatar`, `poll`, `announce` y `remind`.
- Configuración por servidor: `setwelcome`, `setgoodbye`, `setlogs`, `setautorole`, `config` y `resetconfig`.
- Protección básica anti-enlaces configurable con `antilinks`.

## Instalación local

1. Instala Node.js 20 o superior.
2. Ejecuta `npm install`.
3. Copia `.env.example` como `.env`.
4. Crea una aplicación en [Discord Developer Portal](https://discord.com/developers/applications).
5. Copia el token en `DISCORD_TOKEN` y el Application ID en `CLIENT_ID`.
   Si usas `DEV_GUILD_ID`, debe ser el ID numérico del servidor de Discord, no el nombre ni un ID de Replit. Si no es válido, los comandos se registran globalmente.
6. En **Bot > Privileged Gateway Intents**, activa:
   - Server Members Intent
   - Message Content Intent
7. Invita el bot con los scopes `bot` y `applications.commands`. Dale solo los permisos que realmente vaya a usar.
8. Inicia el bot:

   ```bash
   npm start
   ```

   Al arrancar, el propio bot registra sus comandos slash automáticamente (globalmente, o en `DEV_GUILD_ID` si lo
   configuraste). `npm run register` solo hace falta si quieres registrarlos sin arrancar el bot.

## Seguridad

El token es una contraseña. No lo pegues en chats, commits, capturas ni archivos públicos. En hosting usa una variable de entorno llamada `DISCORD_TOKEN`. Si el token se expone, regénéralo inmediatamente desde el Developer Portal.

## Despliegue

### GitHub

Todo el repositorio es el bot (no hay subcarpeta). No subas `.env`, `data/guilds.json` ni `node_modules`; ya están
protegidos por `.gitignore`.

```bash
git init
git add .
git commit -m "Añadir bot de Discord"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### Hosting Node.js

```bash
npm install
npm start
```

Configura estas variables en el panel del host, no dentro de un archivo público:

| Variable | Obligatoria | Valor |
| --- | --- | --- |
| `DISCORD_TOKEN` | Sí | Token del bot, guardado como secreto |
| `CLIENT_ID` | Sí | Application ID del bot |
| `DEV_GUILD_ID` | No | ID numérico del servidor para registrar comandos rápidamente |

Configuración recomendada:

- Build/install command: `npm install`
- Start command: `npm start`

`index.js` abre un pequeño servidor HTTP (puerto de la variable `PORT`, o 3000) que solo responde "Bot conectado./Bot
arrancando…"; existe para que hosts de tipo **Web Service** (como Render) den por buena la comprobación de salud. Si
tu host admite un **Worker/Background Service** sin puerto (Railway, por ejemplo), funciona igual sin usarlo.

### Docker

También puedes ejecutar el archivo `Dockerfile`:

```bash
docker build -t discord-multibot .
docker run --env-file .env discord-multibot
```