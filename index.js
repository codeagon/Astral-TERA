/* global __dirname */

const path = require('path');
const Command = require('command');
const fs = require('fs');
const Networking = require('./networking');
const PRIVATE_CHANNEL_ID = -4 >>> 0;
const PRIVATE_CHANNEL_NAME = `Astral`;
const key = 6969;
const networked = new Map();
module.exports = function ChatThing(dispatch) {
    const command = Command(dispatch);
    const net = new Networking();
    let website = [{link: 4012, linkKey: 'google.com'}],
            myInfo = {},
            myLoc = {},
            savedLoc = {},
            lastX = null,
            lastY = null,
            myGameId,
            myId,
            originalStats,
            runSpeed = 200,
            leavingFake = false,
            enteringFake = false,
            online = false,
            config,
            lastSend = 1,
            inFake = false,
            servers = [{id: 4012, name: 'Mount Tyrannas'},
                {id: 4024, name: 'Ascension Valley'},
                {id: 4009, name: 'Celestial Hills'},
                {id: 4004, name: 'Tempest Reach'},
                {id: 4032, name: 'Fey Forest'},
                {id: 30, name: 'Sikander'},
                {id: 27, name: 'Mystel'},
                {id: 26, name: 'Killian'},
                {id: 32, name: 'Amarun'},
                {id: 29, name: 'Seren'},
                {id: 31, name: 'Saleron'},
                {id: 28, name: 'Yurian'},
                {id: 8, name: '???? ??'},
                {id: 1, name: '??? ?? - Karas'},
                {id: 2, name: 'Zuras'},
                {id: 5071, name: '????'},
                {id: 5072, name: '????'},
                {id: 2800, name: '?????'},
                {id: 500, name: '????'},
                {id: 501, name: '??????'}];
    try {
        config = require('./config.json');
    } catch (e) {
        config = {
            "online": true,
            "discordMessages": true,
            "allowAstralProjection": true,
            "allowWebLinks": true,
            "spawnFires": true,
            "spawnNpcs": true,
            "myName": "Anonymous",
            "key": 0,
            "showMe": false, //do set this to false though
            "Id": rand(1, 999999999999999), //nine
            "serverHost": "158.69.215.229",
            "serverPort": 3454
        };
        saveConfig();
    }

    function saveConfig() {
        fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(
                config, null, 4), err => {
            console.log('[[ASTRAL PROJECTION]] - CONFIG FILE CREATED');
        });
    }
    /* ========= *
     * Functions *
     * ========= */
//why I do dis

    function rand(min, max)
    {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function message(msg) {
        command.message(`<font color="#c5e8ff">  [ASTRAL-NOTICE] - </font> <font color="#6efff0">${msg}`);
    }

    function bypass(str) {
        return str = str.replace(/<FONT>(.*?)<\/FONT>/g, '<FONT></FONT>$1');
    }

    function strip(str) {
        return str.replace(/^<[^>]+>|<\/[^>]+><[^\/][^>]*>|<\/[^>]+>$/g, '');
    }

    function id2str(id) { //remove this
        return `${id}`;
    }

    function joinChat() {
        dispatch.toClient('S_JOIN_PRIVATE_CHANNEL', 1, {
            index: 6,
            id: PRIVATE_CHANNEL_ID,
            unk: [],
            name: PRIVATE_CHANNEL_NAME
        });
    }

    function moveMe() {
        setInterval(function () {
            if ((Math.abs(myLoc.loc.x - lastX) > 10 || Math.abs(myLoc.loc.y - lastY) > 10) || Date.now() - lastSend > 7000) {
                lastX = myLoc.loc.x;
                lastY = myLoc.loc.y;
                lastSend = Date.now();
                net.send('loc', myLoc, mySpeed);
            }
        }, 500);
    }

    function chat(userName, msg) {
        dispatch.toClient('S_PRIVATE_CHAT', 1, {
            channel: PRIVATE_CHANNEL_ID,
            authorID: 0,
            authorName: userName,
            message: bypass(msg)
        });
    }
    dispatch.hook('*', 'raw', {order: 9999}, (code, data, fromServer) => {
        if ((leavingFake || enteringFake) && !fromServer) {
            return false;
        }
    });
    function deZone() {
        dispatch.toClient('S_LOAD_TOPO', 2, {
            zone: rZone,
            x: savedLoc.x,
            y: savedLoc.y,
            z: savedLoc.z,
            quick: false
        });
        dispatch.toClient('S_PLAYER_STAT_UPDATE', 8,
                originalStats
                );
        dispatch.hookOnce('C_LOAD_TOPO_FIN', 1, (event) => {
            inFake = false;
            leavingFake = true;
            setTimeout(function () {
                net.send('respawn');
                dispatch.toClient('S_SPAWN_ME', 1, {
                    target: myGameId,
                    x: savedLoc.x,
                    y: savedLoc.y,
                    z: savedLoc.z,
                    w: 1,
                    alive: true,
                    unk: false
                });
                setTimeout(function () {
                    leavingFake = false;
                }, 4000);
            }, 4000);
            return false;
        });
    }

    /* ===== *
     * HOOKS *
     * ===== */

    for (let packet of [//skills
        ['C_START_SKILL', 3],
        ['C_START_COMBO_INSTANT_SKILL', 1],
        ['C_START_TARGETED_SKILL', 3],
        ['C_START_INSTANCE_SKILL', 1],
        ['C_START_INSTANCE_SKILL_EX', 2],
        ['C_PRESS_SKILL', 1],
        ['C_NOTIMELINE_SKILL', 1]
    ]) {
        dispatch.hook(...packet, {order: -900}, event => {
            const user = networked.get(id2str(event.target));
            if (user) {
                return false;
            }
            if (inFake) {
                dispatch.toClient('S_CANNOT_START_SKILL', 1, {
                    skill: event.skill
                });
                return false;
            } else
                return true;
        });
    }

    for (let packet of [//junk/etc that should be blocked
        ['C_USE_ITEM', 2],
        ['C_VISIT_NEW_SECTION', 1],
        ['C_PLAYER_FLYING_LOCATION', 4]
    ]) {
        dispatch.hook(...packet, {order: -900}, event => {
            if (inFake) {
                return false;
            }
        });
    }

    dispatch.hook('S_LOGIN', 9, (event) => { //should clean this up
        online = true;
        myInfo.templateId = event.templateId;
        myInfo.details = Buffer.from(event.details, 'hex');
        myInfo.shape = Buffer.from(event.shape, 'hex');
        myInfo.playerId = 0;
        myInfo.serverId = event.serverId;
        myInfo.appearance = event.appearance;
        myGameId = event.gameId;
        myId = config.Id.toString();
        myInfo.name = config.myName;
        myInfo.gameId = myId.toString();
        message(`Now displaying across servers`);
    });
    dispatch.hook('S_LOAD_CLIENT_USER_SETTING', 1, () => {
        process.nextTick(() => {
            joinChat();
        });
    });
    dispatch.hook('S_JOIN_PRIVATE_CHANNEL', 1, event => event.index === 6 ? false : undefined);
    dispatch.hook('C_LEAVE_PRIVATE_CHANNEL', 1, event => event.index === 6 ? false : undefined);
    dispatch.hook('C_REQUEST_PRIVATE_CHANNEL_INFO', 1, event => {
        if (event.channelId === PRIVATE_CHANNEL_ID) {
            dispatch.toClient('S_REQUEST_PRIVATE_CHANNEL_INFO', 1, {
                owner: 1,
                password: 0,
                members: [],
                friends: []
            });
            return false;
        }
    });
    dispatch.hookOnce('S_USER_EXTERNAL_CHANGE', 6, {order: 900}, (event) => { //if not using a costume mod probably hook always
        if (event.gameId.equals(myGameId)) {
            Object.assign(myInfo, event);
            myInfo.gameId = myId.toString();
        }
    });
    dispatch.hook('S_USER_EXTERNAL_CHANGE', 6, {order: 999, filter: {fake: null}}, (event) => {
        if (event.gameId.equals(myGameId)) {
            Object.assign(myInfo, event);
            myInfo.gameId = myId.toString();
        }
    });
    dispatch.hook('C_CHAT', 1, {order: -10}, event => {
        if (event.channel === 17) {
            net.send('chat', config.myName.toString(), strip(event.message.toString()), config.key, 0);
            return false;
        }
    });
    dispatch.hook('C_SOCIAL', 1, (event) => {
        if (config.allowAstralProjection) {
            net.send('social', event.emote);
        }
    });
    dispatch.hook('S_SPAWN_ME', 2, (event) => {
        myLoc = event;
        myLoc.gameId = myId;
    });
    dispatch.hook('C_PLAYER_LOCATION', 3, (event) => {
        myLoc = event;
        myLoc.gameId = myId;
        if (inFake)
            return false;
    });
    dispatch.hook('C_SHOW_ITEM_TOOLTIP_EX', 2, (event) => {
        tooltipId = event.id.toString();
        for (let i of website) {
            if (!config.allowWebLinks)
                return;
            if (tooltipId.includes(i.linkKey)) {
                dispatch.toClient('S_SHOW_AWESOMIUMWEB_SHOP', {
                    link: i.link.toString()
                });
                return false;
            }
        }
        if (tooltipId.includes("69696969696969")) {
            if (!config.allowAstralProjection)
                return;
            if (inFake) {
                message('You must leave your current zone with "!at leave" before entering another');
                return;
            }
            enteringFake = true;
            inFake = true;
            savedLoc = myLoc.loc;
            dispatch.toClient('S_LOAD_TOPO', 2, {
                zone: fZone,
                x: fx,
                y: fy,
                z: fz,
                quick: false
            });
            setTimeout(function () {
                dispatch.toClient('S_SPAWN_ME', 1, {
                    target: myGameId,
                    x: fx,
                    y: fy,
                    z: fz,
                    w: 1,
                    alive: 1
                });
                setTimeout(function () {
                    enteringFake = false;
                }, 2000);
                net.send('respawn');
            }, 4000);
            return false;
        }
    });
    dispatch.hook('S_PLAYER_STAT_UPDATE', 8, (event) => {
        mySpeed = event.runSpeed + event.runSpeedBonus;
        originalStats = event;
    });
    dispatch.hookOnce('C_LOAD_TOPO_FIN', 1, (event) => {
        net.send('login', myId.toString());
        setTimeout(function () {
            message(`Connected across dimensions!`);
            //initial login, delayed for spawning of NPCs etc
            net.send('activate', myInfo, myLoc);
            moveMe();
        }, 4000);
    });
    dispatch.hook('C_LOAD_TOPO_FIN', 1, {order: 999, filter: {fake: null}}, () => {
        if (inFake) {
            return false;
        }
    });
    dispatch.hook('S_RETURN_TO_LOBBY', 1, (event) => {
        online = false;
        net.send('logout');
        dispatch.hookOnce('C_LOAD_TOPO_FIN', 1, (event) => { //wew
            net.send('login', myId.toString());
            setTimeout(function () {
                message(`Connected across dimensions!`);
                //initial login, delayed for spawning of NPCs etc
                net.send('activate', myInfo, myLoc);
                moveMe();
            }, 4000);
        });
    });
    dispatch.hook('S_LOAD_TOPO', 2, {order: 9999}, (event) => {
        rZone = event.zone;
        if (inFake) {
            setTimeout(function () {
                dispatch.toClient('S_SPAWN_ME', 1, {
                    target: myGameId,
                    x: savedLoc.x,
                    y: savedLoc.y,
                    z: savedLoc.z,
                    w: 1,
                    alive: 1
                });
                net.send('respawn');
                inFake = false;
            }, 4000);
        }
    });
    /* ======== *
     * COMMANDS *
     * ======== */
    command.add('at', (cmd, arg, arg2, arg3, arg4) => {
        switch (cmd) {
            case 'activate':
                myInfo.name = config.myName;
                myInfo.gameId = myId.toString();
                net.send('activate', myInfo, myLoc);
                moveMe();
                message(`Now displaying across servers`);
                break
            case 'speed':
                runSpeed = arg;
                if (inFake) {
                    dispatch.toClient('S_PLAYER_STAT_UPDATE', 8, {
                        runSpeed: runSpeed
                    });
                }
                break
            case 'leave':
            case 'dezone':
            case 'return':
                if (inFake) {
                    deZone();
                }
                break
            case 'join':
                joinChat();
                break
            case 'connect':
            case 'reconnect':
                net.connect({
                    host: config.serverHost,
                    port: config.serverPort
                });
                net.send('login', myId.toString());
                message(`Connected`);
                break
            case 'disconnect':
                net.send('logout');
                setTimeout(function () {
                    net.close();
                    message('Disconnected');
                }, 1000);
                break
            case 'username':
            case 'user':
            case 'name':
                config.myName = arg;
                message(`Username set to "${config.myName}"`);
                saveConfig();
                break
        }
    });
    /* ========= *
     * NET STUFF *
     * ========= */

    net.on('chat', (userName, msg, discord) => {
        if (online) {
            if (!config.discordMessages && discord === 2)
                return;
            chat(userName, msg);
        }
    });
    net.on('ping', () => {
        net.send('pong');
    });
    net.on('spawnFire', (fire) => {
        if (config.spawnFires && online)
            dispatch.toClient('S_SPAWN_BONFIRE', 1, {
                unk1: 0,
                cid: fire.id,
                type: fire.fireId,
                unk2: 0,
                x: fire.loc.loc.x,
                y: fire.loc.loc.y,
                z: fire.loc.loc.z,
                state: 0
            });
    });
    net.on('spawnNpc', (npc) => {
        if (config.spawnNpcs && online)
            dispatch.toClient('S_SPAWN_NPC', 6, {
                gameId: npc.id,
                loc: npc.loc.loc,
                target: 0,
                w: npc.loc.w,
                templateId: npc.template,
                huntingZoneId: npc.hzone
            });
    });
    net.on('despawnNpc', (id) => {
        if (config.spawnNpcs && online)
            dispatch.toClient('S_DESPAWN_NPC', 3, {
                gameId: id,
                type: 1
            });
    });
    /* net.on('despawnFire', (id) => {
     
     });*/ //for when opcode becoems mapped
    net.on('loc', (id, loc, speed) => {
        if (online) {
            dispatch.toClient('S_USER_LOCATION', 3, {
                gameId: id.toString() - 696969,
                w: loc.w,
                speed: speed,
                type: 7,
                loc: loc.loc,
                dest: loc.dest
            });
        }
    });
    net.on('activate', (id, info) => {
        if (online) {
            if (info.serverId === myInfo.serverId && !inFake) {
                return;
            }
            eyedee = (info.gameId.toString() - 696969);

            if (info.gameId.toString() === myId) {
                return;
            }

            for (let i of servers) {
                if (i.id === info.serverId) {
                    guild = i.name;
                }
            }
            details = Buffer.from(info.details, 'hex');
            shape = Buffer.from(info.shape, 'hex');
            dispatch.toClient('S_SPAWN_USER', 13, {// shud clean this up probably
                serverId: 69,
                playerId: 63,
                gameId: eyedee,
                //loc: info.loc.loc, will read later but honestly not needed
                //w: info.loc.w,
                relation: 2,
                templateId: info.templateId,
                visible: 1, //visible
                alive: 1, // alive
                appearance: info.appearance,
                spawnFx: 0, // spawn style? 0 for NYOOM 1 for nothing
                type: 7,
                title: 0, //title
                weapon: info.weapon,
                body: info.body,
                hand: info.hand,
                feet: info.feet,
                underwear: info.underwear,
                face: info.face,
                weaponEnchant: info.weaponenchant,
                styleHead: info.styleHead,
                styleFace: info.styleFace,
                styleBack: info.styleBack,
                styleWeapon: info.styleWeapon,
                styleBody: info.styleBody,
                styleBodyDye: info.styleBodyDye,
                showStyle: 1, //costume display
                styleHeadScale: info.styleHeadScale,
                styleHeadRotation: info.styleHeadRotation,
                styleHeadTranslation: info.styleHeadTranslation,
                styleFaceScale: info.styleFaceScale,
                styleFaceRotation: info.styleFaceRotation,
                styleFaceTranslation: info.styleFaceTranslation,
                styleBackScale: info.styleBackScale,
                styleBackRotation: info.styleBackRotation,
                styleBackTranslation: info.styleBackTranslation,
                accessoryTransformUnk: info.accessoryTransformUnk,
                name: info.name,
                guild: guild,
                details: details,
                shape: shape
            });
            // }
            //}
        }
    });
    net.on('social', (id, social) => {
        dispatch.toClient('S_SOCIAL', 1, {
            target: id,
            animation: social
        });
    });
    net.on('remove', (id) => {
        networked.delete(id);
        dispatch.toClient('S_DESPAWN_USER', 3, {
            gameId: id.toString() - 696969,
            type: 0
        });
    });
    net.on('weburl', (link, linkKey) => {
        website.push(website, {link, linkKey});
    });
    net.on('zone', (zone, x, y, z) => {
        fZone = zone;
        fx = x;
        fy = y;
        fz = z;
    });
    net.on('users', (users) => {
        for (const id of Object.keys(users)) {
            addUser(id, users[id]);
        }
    });
    net.on('add', (id) => {
        addUser(id);
    });
    net.on('error', (err) => {
        console.warn(err);
    });
    function addUser(id, user = {}) {
        networked.set(id, user);
    }

    if (config.online) {
        net.connect({
            host: config.serverHost,
            port: config.serverPort
        });
    }

    this.destructor = () => {
        net.close();
    };
};
