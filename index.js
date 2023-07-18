const Vec3 = require('tera-vec3')
//let BadGui
const fs = require('fs');
const path = require('path');
const Networking = require('./networking');
const PRIVATE_CHANNEL_ID = -4 >>> 0;  //make setable
const PRIVATE_CHANNEL_NAME = `Astral`; //this too
const networked = new Map();
const Window = require('./window');
/*try {
    BadGui = require('../badGui')
} catch (e) {
    try {
        BadGui = require('../badGui-master')
    } catch (e) {
        console.log(`[AT] - badGUI not installed, some features may not function correctly!`)
    }
}*/

module.exports = function maze(mod) {
    const net = new Networking();
    //const { Host } = require('tera-mod-ui'); //TOOLBOX FUCKING SUCKS LULLLL BROKEN ASS SHIT
    const npcList = require('./npcs.json')
    const win = new Window();
    /*const gui = new BadGui(mod)*/
    const generator = require('./generate-maze'); //move to server
    const NUM_CELLS = 15;
    const CELL_SIZE = 210;
    const maze = generator(NUM_CELLS);
    const shuttle = new Map();
    const npc = new Map();
    const player = new Map()
    const effect = new Map();
    const playerEffect = new Map();
    const playerEffectsTrigger = new Map();
    const effectsTrigger = new Map();
    const shuttleEffectTrigger = new Map()
    const playerNpc = new Map();
    const door = new Map();
    const collection = new Map();
    const workObject = new Map();
    const shuttleCheckpoint = new Map();
    const GPKTrigger = new Map()
    const shuttleGPK = new Map();
    const shuttleMoving = new Map();
    const checkpoint = new Map();
    const ray = new Map(); //delet dis
    //ccccancer ccccode cccomence
    const maps = new Set([shuttle, npc, player, effect, effectsTrigger, shuttleEffectTrigger, playerNpc, door, collection, workObject, shuttleCheckpoint, GPKTrigger, shuttleGPK, shuttleMoving, checkpoint])
    const shuttleSpawns = new Set([shuttle, shuttleCheckpoint, shuttleGPK, shuttleMoving, shuttleEffectTrigger])
    const npcSpawns = new Set([npc, effect, checkpoint, GPKTrigger, effectsTrigger])
    const playerSpawns = new Set([player, playerNpc, playerEffect, playerEffectsTrigger])
    const tLock = new Set()
    //use set xd
    //set.has instead of includes, new Set([array])

    let spawnCounter = 0,
        inFake = false,
        mazeIsSpawned = false,
        inShut = false,
        limitMode = false,
        type,
        myLoc,
        counter = 0,
        sm = false,
        myFlyLoc,
        selectedNpc,
        currentShutLoc,
        selectionpId,
        newTestLoc,
        currentShutId,
        originalStats,
        mySpeed,
        testLoc,
        safeLoc,
        ranNum = 0;

    //query lag machine go brrrrrrrrrrRR r   rr                 r                         rr r

    let npcInfo = new Map();
    let npcInfoHolderPleaseKillMe = []

    mod.queryData('/NpcData@huntingZoneId=?/Template/', [1000], true).then(results => {
        results.forEach(result => npcInfo.set(result.attributes.shapeId, { id: result.attributes.id, name: null }))
    })

    mod.queryData('/NpcShape/Shape/', [], true).then(results => {
        results.forEach(result => {
            if (npcInfo.has(result.attributes.id)) {
                npcInfo.get(result.attributes.id).name = result.attributes.mesh
            } else {
                // console.log(result.attributes.id)
            }
        })
    })



    let reggy = /(?:\.Skel\.)(.*)_Skel$/gm
    let JSSUX
    for (let [key, value] of npcInfo.entries()) {
        JSSUX = reggy.exec(value.name)
        while (JSSUX !== null) {
            npcInfoHolderPleaseKillMe.push({ name: JSSUX[1], id: value.id }) // why is this necessary?
            JSSUX = reggy.exec(value.name)
        }
    }
    fs.writeFile(path.join(__dirname, '/ui/npcInfo.json'), JSON.stringify(npcInfoHolderPleaseKillMe, null, 4), (err) => {
        console.log('AT GUI CONFIG SAVED');
    })








    //// Hooks


    mod.hook('*', 'event', (code, data, fromServer, fake) => { //for making sure we don't get beaned for teleporting
        if (inFake && !fromServer && !fake) {
            return false;
        }
    });
    mod.hook('*', 'event', { order: -9999999 }, (code, data, fromServer, fake) => { //for deleting smelly SP
        if (inFake && !fromServer && fake) {
            return false;
        }
    });

    mod.hook('C_PLAYER_FLYING_LOCATION', 4, { order: -99999999 }, (event) => {
        myFlyLoc = event
    })

    mod.hook('S_PLAYER_STAT_UPDATE', 17, (event) => {
        mySpeed = event.runSpeed + event.runSpeedBonus;
        originalStats = event;
    });

    mod.hook('C_PLAYER_LOCATION', 5, { order: -99999999 }, (event) => {
        myLoc = event
        if (limitMode) { //do timeout after this, this should work
            setTimeout(() => {
                for (let [key, value] of shuttle.entries()) {
                    if (((!inShut && myLoc.loc.dist2D(value.loc) < 600) || (inShut && currentShutLoc.dist2D(value.loc) < 600)) && value.shown != true) {
                        value.shown = true
                        spawn(value)
                    } else
                        if (((!inShut && myLoc.loc.dist2D(value.loc) > 600) || (inShut && currentShutLoc.dist2D(value.loc) > 600)) && value.shown == true) {
                            value.shown = false
                            despawn(value)
                        }
                }
                for (let [key, value] of npc.entries()) {
                    if (((!inShut && myLoc.loc.dist2D(value.loc) < 600) || (inShut && currentShutLoc.dist2D(value.loc) < 600)) && value.shown != true) {
                        value.shown = true
                        spawn(value)
                    } else
                        if (((!inShut && myLoc.loc.dist2D(value.loc) > 600) || (inShut && currentShutLoc.dist2D(value.loc) > 600)) && value.shown == true) {
                            value.shown = false
                            despawn(value)
                        }
                }
            }, 1000)
        }
    })

    mod.hook('C_GET_IN_SHUTTLE', 1, { order: -99999999 }, (event) => {
        currentShutLoc = new Vec3(event.loc)
        inShut = true
        currentShutId = Number(event.gameId)
        if (shuttleGPK.has(currentShutId)) {
            data = shuttleGPK.get(currentShutId)
            //gui.parse([{ gpk: `${data.gpkCommand}` }], `You shouldn't be able to see this...`)
        }
        /*if (tCheck.has(event.gameId)) {
            currentCheck = event.gameId
        }*/
    })

    mod.hook('C_GET_OUT_SHUTTLE', 1, { order: -99999999 }, (event) => {
        inShut = false //
    });


    /* mod.hook('S_SPAWN_USER', 16, { order: -99999999 }, (event) => {
          console.log(event)
          event.name = "dong"
          return true
      });*/

    mod.hook('C_CHAT', 1, { order: -99999999 }, (event) => {
        if (event.channel === 17) {
            console.log('hehexd')
            net.send('chat', 'CONFIG.NAME HERE HAHAHA', strip(event.message), 0);
            return false;
        }
    });

    mod.hook('C_CAN_LOCKON_TARGET', 3, { order: -99999999 }, (event) => { //For spawning in selectable targets
        if (tLock.has(Number(event.target.toString())) && sm) {
            mod.send('S_CAN_LOCKON_TARGET', 3, {
                target: event.target.toString(),
                unk: 0,
                skill: event.skill,
                success: true
            })
            mod.command.message(`Selected NPC with ID: ${event.target.toString()}!`)
            selectedNpc = event.target.toString() - 1 //net.send here
            if (!inShut) {
                mod.send('S_ACTION_END', 5, {
                    gameId: mod.game.me.gameId,
                    loc: myLoc.loc,
                    skill: {
                        reserved: 0,
                        npc: false,
                        type: 1,
                        huntingZoneId: 0,
                        id: 410100
                    },
                    type: 0
                })
            } else {
                mod.send('S_ACTION_END', 5, {
                    gameId: mod.game.me.gameId,
                    loc: currentShutLoc,
                    skill: {
                        reserved: 0,
                        npc: false,
                        type: 1,
                        huntingZoneId: 0,
                        id: 410100
                    },
                    type: 0
                })
            }
            for (let i of tLock) {
                mod.send('S_DESPAWN_USER', 3, {
                    gameId: i,
                    type: 0
                })
            }
            sm = false
            tLock.clear()
            return false
        }
    })



    //// Functions

    function strip(str) { //fantastic regex lmozle
        return str.replace(/^<[^>]+>|<\/[^>]+><[^\/][^>]*>|<\/[^>]+>$/g, '');
    }

    function joinChat() {
        mod.send('S_JOIN_PRIVATE_CHANNEL', 2, {
            index: 6,
            channelId: PRIVATE_CHANNEL_ID,
            unk: [],
            name: PRIVATE_CHANNEL_NAME
        });
    }

    /*mod.hook('C_LOGIN_ARBITER', 2, (event) => {
        mod.send('S_VERSION_INFO', 1, {
            Revision: 6969,
            Display: 1,
            Description: "Dong's Hellworld"
        });
    })*/

    /*mod.hook('S_VERSION_INFO', 1, (event) => {
        console.log(event)
    });*/
    function bypass(str) {
        return str = str.replace(/<FONT>(.*?)<\/FONT>/gu, '<FONT></FONT>$1');
    }
    function chat(userName, msg, discord, color) {// colour spelt wrong :(
        console.log(color)
        console.log(discord)
        console.log(userName)
        mod.send('S_PRIVATE_CHAT', 1, {
            channel: PRIVATE_CHANNEL_ID,
            authorID: 6969, //could be the persons AT ID for friend adding
            message: `<FONT color="#${color ? color : 'FFB6C1'}"><ChatLinkAction param="1#####50066@28410291@ASTRALTERA">[${userName}]</ChatLinkAction> :</font> ${msg}</FONT>`
            //28410291 can be made into the publicID of the person, click > UI select for friend adding/person info on main screen stuff like Name Rank Credit amount FreqID joinDate Add Block
        });
    }
    mod.game.on('enter_game', () => {
        joinChat()
        net.connect({
            host: `localhost`,
            port: 3454
        })
    })

    function spawn(obj) { //Main handler for spawning
        spawnCounter++
        ranNum = randGen()
        //Limit the amount of things that can be spawned for performance reasons
        if (spawnCounter >= 222 && !limitMode) {
            mod.command.message(`Warning! Spawned objects exceeding recommended limits, lag may occur!`)
            limitMode = true
            //switch mode to location based here, give the user a choice of when it kicks in w/ config file
        }
        switch (obj.type) {
            case 'shuttle':
                if (!obj.gameId) {
                    shuttle.set(ranNum, { gameId: ranNum, id: obj.id, loc: obj.loc, w: obj.direction, shown: true, type: "shuttle", shown: true })
                }
                if (limitMode && obj.shown == true) {
                    mod.send('S_SPAWN_SHUTTLE', 3,
                        shuttle.get(obj.gameId)
                    )
                } else if (!limitMode) {
                    mod.send('S_SPAWN_SHUTTLE', 3,
                        shuttle.get(ranNum)
                    )
                }
                break
            case 'shuttleMoving': // Maybe make it so all shuttles can be moved on contact, but these ones constantly move
                break
            case 'shuttleGPK': // persistent trigger point
                shuttleGPK.set(ranNum, { gameId: ranNum, id: obj.id, loc: obj.loc, w: obj.direction, shown: true, type: "shuttle", shown: true, gpkCommand: obj.gpkCommand })
                mod.send('S_SPAWN_SHUTTLE', 3,
                    shuttleGPK.get(ranNum)
                )
                break
            case 'GPKTrigger': //a single trigger, then removed, for things like messages
                break
            case 'shuttleCheckpoint': //lighterweight checkpoint option, will perhaps limit the ammount of PLAYER_LOCATION checks to like either checkpoints OR dynamic spawning
                break
            case 'checkpoint': //might add something to make checkpoints iterated upon/numbered, e.g. checkpoint 1 despawns once checkpoint 2 is stepped on
                break
            case 'npc':
                if (!obj.gameId) {
                    npc.set(ranNum, { gameId: ranNum, loc: obj.loc, w: obj.w, templateId: obj.templateId, type: "npc", huntingZoneId: obj.huntingZoneId, shown: obj.shown, scale: 1, visible: true, alive: true, name: obj.name, playerId: ranNum + 1, serverId: 420, shuttleId: obj.shuttleId })
                    if (obj.shown) {
                        mod.send('S_SPAWN_USER', 16,
                            npc.get(ranNum)
                        )
                        mod.send('S_UNICAST_TRANSFORM_DATA', 6, {
                            gameId: ranNum,
                            serverId: 420,
                            playerId: ranNum + 1,
                            type: 2,
                            isAppear: true,
                            templateId: obj.templateId,
                            huntingZoneId: obj.huntingZoneId
                        })
                    }
                } else {
                    if (obj.shown) {
                        mod.send('S_SPAWN_USER', 16, {
                            serverId: 420,
                            playerId: obj.playerId,
                            gameId: obj.gameId, // do not need loc or w since we're spawning it in the middle
                            shuttleId: obj.shuttleId,
                            templateId: 10908,
                            visible: 1, //visible
                            alive: 1, // alive     
                            scale: 1,
                            type: 7,
                            name: obj.templateId
                        })

                        mod.send('S_UNICAST_TRANSFORM_DATA', 6, {
                            gameId: obj.gameId,
                            serverId: 420,
                            playerId: obj.playerId,
                            type: 2,
                            isAppear: true,
                            templateId: obj.templateId,
                            huntingZoneId: obj.huntingZoneId
                        })
                    }
                }
                /* if ((!limitMode || obj.shown == true) && obj.gameId) {
                     mod.send('S_SPAWN_NPC', 11,
                         npc.get(obj.gameId)
                     )
                     obj.shown = true
                 } else {
                     npc.set(ranNum, { gameId: ranNum, loc: obj.loc, w: obj.w, templateId: obj.templateId, type: "npc", huntingZoneId: obj.huntingZoneId, shown: false })
                 }*/

                break
            case 'player':
                break
            case 'playerNpc': //For things like player names on NPC models
                break
            case 'effect': //Effects can be applied to existing NPCs/Players or as their own thing
                break
            case 'playerEffect':
                break
            case 'effectTrigger':
                break
            case 'shuttleEffectTrigger':
                break
            case 'playerEffectTrigger':
                break
            case 'workObject':
                break
            case 'door':
                break
            case 'collection':
                break
        }
    }

    //for replacing do delet current type, respawn new type in same location

    function despawn(obj) {// Despaawning handler
        switch (obj.type) {
            case 'shuttle':
            case 'shuttleMoving':
            case 'shuttleGPK':
            case 'shuttleCheckpoint':
            case 'shuttleEffectTrigger':
                mod.send('S_DESPAWN_SHUTTLE', 2, {
                    gameId: obj.gameId,
                })
                break
            case 'npc':
            case 'effect':
            case 'GPKTrigger':
            case 'checkpoint':
            case 'effectTrigger':
                mod.send('S_DESPAWN_USER', 3, {
                    gameId: obj.gameId,
                })
                break
            case 'player':
            case 'playerNpc':
            case 'playerEffect':
            case 'playerEffectTrigger':
                mod.send('S_DESPAWN_USER', 3, {
                    gameId: obj.gameId
                })
                break
            case 'workObject':
                break
            case 'door':
                break
            case 'collection':
                break
        }
    }

    function despawnAll() { //Remove everything loaded
        maps.forEach(xd => {
            if (shuttleSpawns.has(xd))
                type = "shuttle"
            if (npcSpawns.has(xd))
                type = "npc"
            if (playerSpawns.has(xd))
                type = "player"
            xd.forEach(value => {
                if (type == "shuttle")
                    mod.send('S_DESPAWN_SHUTTLE', 2, {
                        gameId: value.gameId,
                    })
                if (type == "npc") {
                    mod.send('S_DESPAWN_USER', 3, {
                        gameId: value.gameId,
                    })
                }
                if (type == "player") {
                    mod.send('S_DESPAWN_USER', 3, {
                        gameId: value.gameId,
                    })
                }
            })
            xd.clear()
        })
    }


    function gpk(str) { //move to net.on
        //gui.parse([{ gpk: str }], `AT - You shouldn't be able to see this`)
    }

    function randGen() {
        return Math.floor((Math.random() * 1000000000) + 999999999)
    }

    function movePlayer(l) {
        mod.send('S_INSTANT_MOVE', 3, {
            gameId: mod.game.me.gameId,
            loc: l,
        })
    }

    function spawnCell(cell) { //maze function, move to server
        let center = new Vec3(-cell.y * CELL_SIZE, cell.x * CELL_SIZE, 0)
        center.add(myLoc.loc)
        if (cell.top)
            spawn({ type: "npc", templateId: 61148000, huntingZoneId: 1000, loc: center.addN(new Vec3(CELL_SIZE / 2, 0, 0)), w: 0 })
        if (cell.bottom && (cell.y == NUM_CELLS - 1))
            spawn({ type: "npc", templateId: 61148000, huntingZoneId: 1000, loc: center.addN(new Vec3(-CELL_SIZE / 2, 0, 0)), w: 0 })
        if (cell.left)
            spawn({ type: "npc", templateId: 61148000, huntingZoneId: 1000, loc: center.addN(new Vec3(0, -CELL_SIZE / 2, 0)), w: Math.PI / 2 })
        spawn({ type: "shuttle", id: 904351, loc: center.addN(new Vec3(0, -CELL_SIZE, 0)), w: Math.PI / 2 })
        if (cell.right && (cell.x == NUM_CELLS - 1))
            spawn({ type: "npc", templateId: 61148000, huntingZoneId: 1000, loc: center.addN(new Vec3(0, CELL_SIZE / 2, 0)), w: Math.PI / 2 })
        spawn({ type: "shuttle", id: 904351, loc: center.addN(new Vec3(0, CELL_SIZE, 0)), w: Math.PI / 2 })
    }




    function stag(step) {
        setTimeout(() => {
            spawn({ type: "npc", huntingZoneId: 1000, loc: myLoc.loc.addN(new Vec3((100 * step), 0, 0).rotate(myLoc.w)), w: myLoc.w - (Math.PI), templateId: 80004000, shown: true })
        }, 1000)
    }


    mod.hook('S_START_USER_PROJECTILE', 9, { order: -99999999 }, (event) => {
        //  console.log('START')
        //   console.log(event)
        //console.log(event)
    });


    mod.hook('S_SPAWN_PROJECTILE', 5, { order: -99999999 }, (event) => {
        //   console.log('SPAWN')
        //   console.log(event.id)
    });



    let tooltipId
    let website = {}


    mod.hook('C_SHOW_ITEM_TOOLTIP_EX', 6, (event) => {
        console.log(event)
        if (event.owner == 'ASTRALTERA;') {
            console.log('Y O I N K')
            return false
        }
        /* tooltipId = event.id.toString();
         for (let i of website) { //re-add config
             if (tooltipId.includes(i.linkKey)) {
                 mod.send('S_SHOW_AWESOMIUMWEB_SHOP', 1, {
                     link: i.link.toString()
                 });
                 return false;
             }
         } //re add zone transition except less bad*/
    });



    mod.hook('C_HIT_USER_PROJECTILE', 4, { order: -99999999 }, (event) => {
        console.log(event.targets) // packet gets sent per hit detected on client, can be used as a shortcut for sending projectile hit
        if (event.id <= 100000) {
            mod.send('S_PLAY_EFFECT', 1, {
                gameId: event.targets[0].gameId,
                id: 919090602
            });
            mod.send('S_DESPAWN_PROJECTILE', 2, {
                id: event.id
            });
            console.log('pooby')
            return false
        }
    });

    mod.hook('S_ACTION_STAGE', 9, { order: -99999999 }, (event) => {
        // console.log('STAGE')
        //console.log(event)
    });



    //// Chat command handler
    mod.command.add('AT', (cmd, arg, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) => {
        switch (cmd) {
            case 'meem':
                mod.send('S_QA_SET_ADMIN_LEVEL', 1, {
                    enable: 1
                });

                break
            case 'meme':
                mod.send('I_INPUT_COMMAND', 1, {
                    command: arg,
                    parameter: arg2
                });
                break
            case 't':
                /*mod.send('S_CHAT', 3, {
                    channel: 17,
                    gameId: mod.game.me.gameId,
                    message: `<font color="#FF69B4">[Vanigay]</font> : Hi my name is vani and I love rock hard clits!` //add bypass here if you want
                });*/
                mod.send('S_PRIVATE_CHAT', 1, {
                    channel: PRIVATE_CHANNEL_ID,
                    authorID: mod.game.me.gameId,
                    message: `<FONT color="#FF69B4"><ChatLinkAction param="1#####50066@28410291@ASTRALTERA">[Vanigay]</ChatLinkAction> : </FONT>`
                    // message: `<FONT color="#FF69B4"><ChatLinkAction param="1#####50066@28410291@ASTRALTERA">&lt;Vanigay&gt;</ChatLinkAction></FONT>`
                    //LinkType#####ItemID@DBID@UserName
                });
                break
            case 'chat':
                joinChat()
                break
            case 'connect':
                net.close()
                setTimeout(() => {
                    net.connect({
                        host: 'localhost',
                        port: 3454
                    });
                    net.send('login', `4657894132`)
                }, 2000);//delayed because I hate fun

                break
            case 'ray':
                let rayVec = new Vec3({ x: 20345.5234375, y: 3335.434326171875, z: 6210.25 })
                let step = 0
                let randProj = Math.floor(Math.random() * Math.floor(100000));
                mod.send('S_START_USER_PROJECTILE', 9, {
                    gameId: mod.game.me.gameId,
                    templateId: 11007,
                    unk1: 0,
                    id: randProj,
                    skill: {
                        reserved: 0,
                        npc: false,
                        type: 0,
                        huntingZoneId: 0,
                        id: 10120
                    },
                    loc: rayVec,
                    dest: rayVec.addN(new Vec3(750, 0, 0).rotate(0)),
                    speed: 300, //put speed 1 and proper distance meme af according to salty // seems like 2x realtime delay
                    distance: 750,
                    curve: false,
                    projectileSpeed: 1 // this FUCKS
                });
                let meme = setInterval(() => {
                    let newRan = randGen()
                    let rayLoc
                    rayLoc = rayVec.addN(new Vec3((50 * step), 0, 0).rotate(0))
                    step++
                    //spawn({ type: "npc", huntingZoneId: 1000, loc: rayLoc, w: myLoc.w - (Math.PI), templateId: 80004000, shown: true })
                    if (rayLoc.dist2D(myLoc.loc) < 50) { //30 seems good for priest proj, might be a bit tight
                        /*mod.send('S_PLAY_EFFECT', 1, {
                            gameId: mod.game.me.gameId,
                            id: 919090602
                        });
                        mod.send('S_DESPAWN_PROJECTILE', 2, {
                            id: randProj
                        });*/
                        clearInterval(meme)
                    }
                    if (step > 15) {
                        mod.send('S_DESPAWN_PROJECTILE', 2, {
                            id: randProj
                        });
                        clearInterval(meme)
                    }
                }, 150);
                break

            case 'pa':
                spawn({ type: "npc", huntingZoneId: 1000, loc: myLoc.loc.addN(new Vec3(100, 0, 0).rotate(myLoc.w)), w: myLoc.w - (Math.PI), templateId: 80004000, shown: true })
                break
            case 'speed':
                if (inFake) {
                    mod.send('S_PLAYER_STAT_UPDATE', 17, {
                        runSpeed
                    })
                }
                break
            case 'print':
                console.log(selectedNpc)
                console.log(npc.get(Number(selectedNpc)))
                break
            case 'mall':
                if (inFake) {
                    //spawn npcs inside shuttles in a line, with a path for the player to stand on
                    mod.command.message(`Moving to mall from ${myLoc.loc.x}, ${myLoc.loc.y}, ${myLoc.loc.z}`)
                    let count = 1
                    myLoc.loc.add({ z: -250 })
                    movePlayer(myLoc.loc.addN(new Vec3(0, 0, -8900)))

                    for (let i = 0; i < npcList.length; i++) {
                        //create pathway
                        testLoc = myLoc.loc.abs().addN(new Vec3(count += 100, 0, -9000))
                        spawn({ type: "shuttle", id: 904351, loc: testLoc, w: Math.PI / 2 })

                        //create NPC path on both sides of the pathway
                        testLoc = myLoc.loc.abs().addN(new Vec3(count += 50, 150, -8950))
                        shuttle.set(count, { gameId: count, id: 904301, loc: testLoc, w: 0, shown: false, type: "shuttle" })
                        spawn({ type: "npc", huntingZoneId: 1000, loc: testLoc, templateId: npcList[i].id, shown: false, shuttleId: count })

                        testLoc = myLoc.loc.abs().addN(new Vec3(count += 50, -150, -8950))
                        shuttle.set(count, { gameId: count, id: 904301, loc: testLoc, w: 0, shown: false, type: "shuttle" })
                        spawn({ type: "npc", huntingZoneId: 1000, loc: testLoc, templateId: npcList[i += 1].id, shown: false, shuttleId: count })

                    }
                    mod.command.message(`Mall created. ${count} npcs spawned.`)

                } else {
                    mod.command.message(`You must be in fake mode to use this command.`)
                }
                /* else
                    if (i <= 400) {
                        newTestLoc = myLoc.loc.abs().addN(new Vec3(count += 70, 0, 0))
                        spawn({ type: "npc", loc: newTestLoc, w: myLoc.w, huntingZoneId: 1000, templateId: npcList[i].id, shown: false })
                    }*/

                break
            case 'lnpc':
                maps.forEach(xd => {
                    if (shuttleSpawns.has(xd))
                        type = "shuttle"
                    if (npcSpawns.has(xd))
                        type = "npc"
                    if (playerSpawns.has(xd))
                        type = "player"
                    xd.forEach(value => { //change this to just grab value rather than iterating
                        if (type == "shuttle")
                            win.send('shuttleIDs', value.gameId)
                        if (type == "npc")
                            win.send('npcIDs', value.gameId)
                        if (type == "player")
                            win.send('playerIDs', value.gameId)
                    })
                })
                break
            case 'stat':
                win.send('info', {
                    online: true,
                    name: "Dong",
                    channelId: 69,
                    canBuild: true,
                    credits: 5000
                })
                break
            case 'ui':
            case 'show':
                win.show()
                break
            case 'npc':
                spawn({ type: "npc", loc: myLoc.loc.abs(), w: myLoc.w, huntingZoneId: arg, templateId: arg2, shown: true, name: arg3 })
                if (inShut) {
                    spawn({ type: "npc", loc: myLoc.loc.abs(), w: myLoc.w, huntingZoneId: arg, templateId: arg2, shown: false, shuttleId: currentShutId })
                }
                break

            case 'tu':
                ranNum = randGen()
                console.log(ranNum)
                mod.send('S_SPAWN_USER', 16, {// may not need to spawn in a player, might just be able to shit the NPC IDs into lockon
                    serverId: 420,
                    playerId: ranNum + 1,
                    gameId: ranNum,
                    loc: myLoc.loc,
                    w: myLoc.w,
                    templateId: 30011100,
                    huntingZoneId: 1000,
                    visible: true,
                    alive: true,
                    scale: 1,
                    name: "benis"
                })
                mod.send('S_UNICAST_TRANSFORM_DATA', 6, {
                    gameId: ranNum,
                    serverId: 420,
                    playerId: ranNum + 1,
                    type: 2,
                    isAppear: true,
                    templateId: 30011100,
                    huntingZoneId: 1000
                })

                break
            case 'sm':

                counter = 0
                maps.forEach(xd => {
                    xd.forEach(value => {
                        if (myLoc.loc.dist2D(value.loc) < 600) {
                            ranNum = randGen()
                            tLock.add(value.gameId + 1)
                            counter++
                            /*mod.send('S_SPAWN_NPC', 11, {
                                gameId: ranNum,
                                loc: value.loc,
                                target: 0,
                                w: value.w,
                                templateId: 61148000,
                                huntingZoneId: 1000
                            })*/
                            console.log(value.loc)
                                / mod.send('S_SPAWN_USER', 16, {// may not need to spawn in a player, might just be able to shit the NPC IDs into lockon
                                    //probably better idea to use NPCs as they float, just need to find one/ change skill to damage
                                    serverId: 120,
                                    playerId: ranNum,
                                    gameId: value.gameId + 1, //change to gameId +1 or somethings
                                    loc: value.loc,
                                    w: myLoc.w,
                                    relation: 1,
                                    templateId: 10908,
                                    visible: 1, //visible
                                    //scale: 4,
                                    alive: 1, // alive                  
                                    type: 7,
                                    guildName: arg4,
                                    guildRank: 'Unknown',
                                    guildLogo: 'guildlogo_4107_24454_91',
                                    name: "[Selection Target]",
                                    scale: 1 //THANKS BHS REALLY COOL REQUIRED ADDITION HAHA
                                })

                        } else {
                            return
                        }
                    })
                })
                sm = true
                mod.command.message(`There are ${counter} NPC's in the area.`)
                if (!inShut) {
                    mod.send('S_ACTION_STAGE', 9, {
                        gameId: mod.game.me.gameId,
                        loc: myLoc.loc,
                        w: myLoc.w,
                        templateId: 11007,
                        skill: {
                            reserved: 0,
                            npc: false,
                            type: 1,
                            huntingZoneId: 0,
                            id: 410100
                        }
                    })
                }
                else {
                    mod.send('S_ACTION_STAGE', 9, {
                        gameId: mod.game.me.gameId,
                        loc: currentShutLoc,
                        w: myLoc.w,
                        templateId: 11007,
                        skill: {
                            reserved: 0,
                            npc: false,
                            type: 1,
                            huntingZoneId: 0,
                            id: 410100
                        }

                    })
                }
                break
            case 'gpks':
                spawn({ type: "shuttleGPK", id: arg, loc: myLoc.loc, w: myLoc.w, gpkCommand: arg2 })
                break
            case 'im':
                mod.command.message(`Moving player to x: ${arg}, y: ${arg2} z: ${arg3} from ${myLoc.loc.toString()}`)
                movePlayer({ x: arg, y: arg2, z: arg3 })
                break
            case 'maze': //move to server
                mazeIsSpawned = true
                for (let meme in maze) {
                    for (let b in maze[meme]) {
                        //console.log(`left X: ${maze[meme][b].x + 1} left Y: ${maze[meme][b].y + 1}`)
                        spawnCell(maze[meme][b])

                    }
                }
                break
            case 'dc':
            case 'fake':
                if (!inFake) {  //NEED TO ADD CHECK FOR ZONE SHIT TOO AND MOUNT STATUS
                    safeLoc = myLoc.loc
                } else {
                    //PURGE HERE TOO
                    movePlayer({ x: safeLoc.x, y: safeLoc.y, z: safeLoc.z })
                }
                //delay to ensure that the player has time to actually move there
                setTimeout(() => {
                    inFake = !inFake
                    mod.command.message(`Currently boomzoned - ${inFake}`)
                }, 1200)

                break
            case 'removeall': //move to net.on, for leaving areas
            case 'purge':
            case 'despawnAll':
                mod.command.message(`Despawning all spawned objects`)
                despawnAll()
                break
            default:
                mod.command.message('Wrong or invalid command idiot')
                break
        }
    })

    ////////////UI CODE/////////////


    win.on('mainInfo', () => {
        console.log('bbbbAAAAAA')
        win.send('info', {
            online: true,
            name: "Dong",
            channelId: 69,
            canBuild: true,
            credits: 5000
        })
    })
    win.on('requestInfo', () => {
        console.log('aaaaa')
    })

    win.on('requestInfo', (id) => {
        console.log(id)
        console.log(npc.get(Number(id)))
        win.send('displayData', npc.get(Number(id)))
    })

    win.on('at', (event, arg) => {
        console.log(event)
        console.log(arg)
    })

    win.on('requestSpawns', () => {
        maps.forEach(xd => {
            if (shuttleSpawns.has(xd))
                type = "shuttle"
            if (npcSpawns.has(xd))
                type = "npc"
            if (playerSpawns.has(xd))
                type = "player"
            xd.forEach(value => { //change this to just grab value rather than iterating
                if (type == "shuttle")
                    win.send('shuttleIDs', value.gameId)
                if (type == "npc")
                    win.send('npcIDs', value.gameId)
                if (type == "player")
                    win.send('playerIDs', value.gameId)
            })
        })
    })

    /////////////NET CODE/////////////
    let online = true

    net.connect({
        host: 'localhost',
        port: 3454
    });
    net.on('error', (err) => {
        console.log(err);
    });

    setInterval(() => {
        net.send('ping')
    }, 30000);

    net.on('pong', () => {

    })

    net.send('login', `4657894132`) //CHANGE TO ID
    net.on('chat', (userName, msg, discord, color) => { // just move it down here? why have a function??????? hello???
        if (online) {
            // if (!config.discordMessages && discord === 2)
            // return;
            chat(userName, msg, discord, color);
        }
    });

    net.on('dead', () => {
        win.send('info', { online: false })
        win.send('alert', "Cannot connect to bot, it may be down or your internet may be broke.")
    })

    net.on('died', () => {
        win.send('info', { online: false })
        win.send('alert', "Connection to the bot has been terminated. The bot may have restarted or your internet connection may have dropped out")
    })


    net.on('ping', () => {
        net.send('pong');
    });
    this.destructor = () => {
        net.close();
        win.close();
        mod.command.remove('AT')
    };

}