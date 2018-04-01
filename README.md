

# Astral-TERA
[![Discord](https://discordapp.com/api/guilds/385946679733518338/widget.png)](https://discord.gg/dzB7xZK)

![Wonderholme](https://i.imgur.com/dlHdbmC.jpg)

- [Astral-TERA](#astral-tera)
  - [What this mod does](#what-this-mod-does)
  - [How to:](#how-to)
  - [Config](#config)
  - [In-game Commands](#in-game-commands)
  - [Chat Commands/Features](#chat-commandsfeatures)
  - [Discord commands](#discord-commands)
  - [Astral Projection/Zones](#astral-projectionzones)
    - [List of zones](#list-of-zones)
    - [List of NPC names](#list-of-npc-names)
  - [FAQ/Errors:](#faqerrors)




***
[Please funnel money into my mouth to support development and server costs](https://ko-fi.com/codeagon)

## What this mod does
Astral-TERA shares your character (if enabled) and chat (if enabled) across regions and servers, and [also discord](https://discord.gg/9aP6RJ3).  In addition to this it allows for:
- Links to be sent in chat and opened with the in-game browser
- Players to visit previously inaccessible areas together through "Astral Projection" (see: [Astral Projection/Zones](#astral-projectionzones))
- NPCs, campfires and other objects to be spawned in with easy to use chat commands
- A lot more
## How to: 
- Download and install [Caali's Proxy](https://discord.gg/maqBmJV)
- Click the "Clone or download" button on this page, then download as zip
- Extract/paste contents of the .zip into your `tera-proxy/bin/node_modules`.
- Start TERA-Proxy however you would normally

**NOTE:** Due to current unmapped packets, some features (webbrowser support) will not work. The opcode required is `S_SHOW_AWESOMIUMWEB_SHOP`. `21587` for NA, `53369` for EU.

If this doesn't work or isn't clear, send a message in [this discord](https://discord.gg/uhDAXWQ)'s help channel. 
## Config
Nearly every feature of this module can be disabled within the config file that is generate on first run. By default no features are disabled. 
Option | Default | Description
---|---|---|---
Online | True |Toggles whether or not the mod will connect to the server. No idea why you would want to disable this
discordMessages | True | Toggles displaying of messages from discord users.
allowAstralProjection | True | Toggles whether or not you can visit fake-zones.
allowWebLinks | True | Toggles whether or not you can visit websites.
spawnFires | True | Toggles whether or not campfires will be spawned in for you.
spawnNpcs | True | Toggles whether or not NPCs will be spawned in for you.
key | 0 | Used for verification of users.
showMe | False | Toggles displaying a copy of your character as it appears to others.
Id | A big number. | Your unique ID.
serverHost | 158.69.215.229 | The server IP that Astral-TERA connects to.
serverPort | 3454 | The port.

## Astral Projection/Zones
This mod comes with a feature called "Astral Projection", which allows users to visit an area together, cut off from the rest of the world. When clicking on a chat link to an area, you are frozen on the server, and will appear to be AFK to users not using the mod(until either using `.at leave` or the server changing your zone).  Skills and mounts cannot be used while projecting(I'll add a command for changing movement speed later along with other stuff).

## In-game Commands
Typed into /proxy chat.
Command | Argument(s) |  Description
---|---|---|---
**at** | disconnect | Disconnects you from the server
**at** | connect/reconnect | Reconnects you to the server
**at** | leave | Returns you to the real world at the location you were previously.
**at** | join | If for some reason you get kicked from the chat channel in game, you can use this to join it.
**at** | user/username/name | Changes your username

## Chat Commands/Features
Typed into /Astral chat.
Command | Argument(s) | Description
---|---|---|---
**.list** | | Shows how many people are currently online
**.zone** | name | Sends a chat linking to the specified zone(list below).
**.zone** | name | Sends a chat linking to the specified zone(list below).
**.fire** |  red/blue/purple/santa | Spawns a bonfire of that type to all players. Currently admin only due to lack of despawning capabilities.
**.dfire** | index# | Despawns a fire spawned with that index number.
**.npc** | name | Spawns an NPC with that name(NPC names found [here](#list-of-npc-names). Max 5 for normal users.
**.dnpc** | index# | Despawns an NPC with that index number
**[any link]** | | Any linked typed into chat starting with `www.` will be converted to a link and become clickable in chat, eg `www.google.com`.
**dognose** |  |  If you type `dognose` in chat, it will be replaced with an image of a random dognose image (ground-breaking feature).
**tm** |  | When tm is sent in chat surrounded by colons `:tm:` it will be replaced with :tm:.
**#999999/:color:** |  | Any hexadecimal colour code sent in chat or any common colour name will colour the proceeding message that colour. e.g.: `:red:` or `#ff0000` will turn the rest of the text red.

## Discord commands
More coming soon!
Command | Argument(s) |  Description
---|---|---|---
**!ping** |  |  Checks if the bot is online
**!list** |  |  Prints how many people are connected to the server

### List of zones
More to be added when I can be bothered
alias | Zone Name 
---|---|---|---
**woodland** | Woodland Path
**arena** | Dreadspire arena
**sigil** | Sigil Adstringo
**dvelika** | Destroyed Velika
**ca/celestial** | Celestial Arena
**wondeholme/wh** | Wonderholme

### List of NPC names
To be updated soon.
alias | Access level|NPC Name
---|---|---|---
**Chef** | All | Woodland Path

## FAQ/Errors: 

`Script no work` Please make sure you're using an updated version before messaging me, and have read the readme (and I mean actually have read the readme).

`Dependancy errors` You will either need to download them manually or downloading [This file](release) and extracting to your `tera-proxy/` folder. (NOT bin/node_modules).

`Skills don't work in zones` I currently don't emulate players skills across servers due to the amount of packets that would have to be broadcast, this may change in the future.

***