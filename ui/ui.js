// Our UI website's main script
// A real ui would obviously use jQuery or whatever here
//const { Renderer } = require('tera-mod-ui'); TOOBOX SUCKS LUL a lot of code in this will be fucked looking as a result
const events = require('events');
const { ipcRenderer, remote } = require('electron');
const fs = require('fs');

class IPC extends events.EventEmitter {
    constructor() {
        super();
        ipcRenderer.on('astral-tera', (event, ...args) => {
            console.log('on', ...args);
            this.emit(...args);
        });
    }
    send(...args) {
        ipcRenderer.send('astral-tera', ...args);
    }
}
const ipc = new IPC();

jQuery(($) => {
    //let ui = new ipcRenderer;
    let themes = "./mods/at/ui/themes/"
    let mascots = require('./mascots.json')
    let masc;

    $(document).ready(function () { //because poopy
        ipc.send('mainInfo')
        $("#main").append(`<img id="mascot" src="${randMascot()}">`);
    });

    //tabs
    let Tabs = {};
    let CurrentTab = null;

    function addTab(tab, implementation) {
        Tabs[tab] = implementation;
    }

    function isCurrentTab(tab) {
        return CurrentTab === tab;
    }

    function emitTabEvent(tab, event, ...args) {
        if (!tab || !Tabs[tab])
            return;

        if (typeof Tabs[tab][event] === 'function')
            Tabs[tab][event](...args);
    }

    function tabReady(tab) {
        if (!isCurrentTab(tab))
            return;
        $("#" + CurrentTab + "_loading").removeClass('current');
        $("#" + CurrentTab).addClass('current');
        refreshMascot()
    }

    $('ul.tabs li').click(function changeTab() {
        if ($(this).attr('tabclickonly') === 'true') {
            emitTabEvent($(this).attr('tabname'), 'click');
        } else {
            emitTabEvent(CurrentTab, 'hide');
            $('ul.tabs li').removeClass('current');
            $('.tab-content').removeClass('current');

            CurrentTab = $(this).attr('tabname');
            $(this).addClass('current');
            $("#" + CurrentTab + "_loading").addClass('current');
            emitTabEvent(CurrentTab, 'show');
        }
    });

    function refreshMascot() {
        if ($("#mascot").length === 0) {
            $("#mascot").remove()
            $("#" + CurrentTab).append(`<img id="mascot" src="${randMascot()}">`);
        } else if ($("#mascot").length > 0) {
            $("#mascot").remove()
            $("#" + CurrentTab).append(`<img id="mascot" src="${randMascot()}">`);
        }
    }

    function randMascot() {
        masc = mascots[Math.floor(Math.random() * mascots.length)]
        return masc
    }
    //

    const CreditsTabName = 'credits';

    addTab(CreditsTabName, {
        show: () => {
            tabReady(CreditsTabName);
        },
    });
    const mainTabName = 'main';

    addTab(mainTabName, {
        show: () => {
            console.log('bbbb')
            ipc.send('mainInfo')
            tabReady(mainTabName);
        },
    });

    ipc.on('info', (data) => {
        $("#online").text(data.online)
        $("#name").text(data.name)
        $("#channelId").text(data.channelId)
        $("#canBuild").text(data.canBuild)
        $("#creditAmount").text(data.credits.toString())
    })

    //// NPCS TAB

    const spawnsTab = 'spawns';

    addTab(spawnsTab, {
        show: () => {
            $("#npcContainer").empty()
            tabReady(spawnsTab);
            ipc.send('requestSpawns')
        },
    });

    ipc.on('npcIDs', (id) => {
        console.log(id)
        $("#npcContainer").append(`<div id="npcData" class="${id}">${id}<div class="dataThing"></div></div>`)
    })

    ipc.on('displayData', (data) => {
        $(`.${data.gameId}`).addClass("selected")
        $(`.selected > .dataThing`).append(`<div iclassdisplayedInfo gameId">GameId: <input type="text" value="${data.gameId}"></div>`)
        $(`.selected > .dataThing`).append(`<div class=" displayedInfo loc"> Location: x: <input type="number" value="${data.loc.x}"> y: <input type="number" value="${data.loc.y}"> z: <input type="number" value="${data.loc.z}"></div>`)
        $(`.selected > .dataThing`).append(`<div class=" displayedInfo w">Rotation: <input type="number" min="0" max="360" value="${data.w * (180 / Math.PI)}"></div>`)
        $(`.selected > .dataThing`).append(`<div class=" displayedInfo templateId">TemplateID: <input type="text" value="${data.templateId}"></div>`)
        $(`.selected > .dataThing`).append(`<div class=" displayedInfo huntingZoneId">HuntingZoneID: <input type="number" value="${data.huntingZoneId}"></div>`)
    })

    $("#npcContainer").on('click', '#npcData', function (e) {
        let id = this.classList
        if (id[1] == "selected") {
            console.log('already selected, closing')
            $(`.dataThing`).empty()
            $(`.${id[1]}`).removeClass("selected")
            return
        }
        if ($(".selected")[0] && id[1] != "selected") {
            console.log('aaaaa')
            $(`.dataThing`).empty()
            $(`.selected`).first().removeClass("selected")
            ipc.send('requestInfo', id[0])
        } else {
            ipc.send('requestInfo', id[0])
        }
    })

    $("#npcContainer").on('click', '.dataThing', function (e) { //you would not believe how long this took me to do
        e.stopPropagation();
        e.preventDefault();
    })
    $("#npcContainer").on('click', '.submitNpc', function (e) { //going to have to do different onclick things for each type since otherwise it'll be real cancer code hours
        ipc.send('updateSpawn', { gameId: $('.gameId').val }) //could instead have click > selects NPC/send gameId and then any changes are sent in a ubiquitous thing afterwards
    })


    /*  $(document).on('click', '#npcData', (e) => {
          console.log(e)
          let id = e.currentTarget.classList
          console.log(`CLICK TARGET ${id[0]}`)
          if (id[1] == "selected") {
              $(`.dataThing`).empty()
              $(`.${id[1]}`).removeClass("selected")
              return
          }
          console.log(e)
          ipc.send('requestInfo', id[0])//do this to recude stored HTML data/bloat
      });*/



    ////THEME TAB

    function refreshTheme() {
        $("#themeContainer").empty();
        fs.readdir(themes, (err, files) => {
            files.forEach(file => {
                $("#themeContainer").append(`<img id="theme" class="mods/at/ui/themes/${file}" src='themes/${file}'>`);
            });
        });
    }

    function mascotListUpdate(masc4masc) {
        mascots = masc4masc.split(',')
        console.log(mascots)
        fs.writeFile(path.join(__dirname, 'mascots.json'), JSON.stringify(mascots, null, 4), (err) => {
            console.log('AT MASCOT SAVED');
        });
    }

    //on show > grab themes
    // on hide, remove .themeContainer
    //or just add a refresh button
    const themeTabName = 'themeTab';

    addTab(themeTabName, {
        show: () => {
            tabReady(themeTabName);
            $("#mascotList").val(mascots.toString())
            refreshTheme()
        },
    });
    $(document).on('click', '#theme', (e) => {
        fs.readFile(e.currentTarget.className, (err, data) => {
            theme.load(data)
        })
    });


    $(document).on('click', '.refresh', (e) => {
        refreshTheme()
    });
    $(document).on('click', '.open', (e) => {
        theme.open()
    });

    $("#update").on('click', (e) => {
        mascotListUpdate($("#mascotList").val())
        refreshMascot()
    });



    //MAIN BUTTONS
    $('#minimize-btn').click(() => {
        window.minimize()
    })




    $('#close-btn').click(() => {
        window.close()
    });
    ///

    ipc.on('enter game', (data) => {
        console.log("enter game received!");
        document.getElementById('chardata').innerHTML = `
            Ingame!<br/>
            Name: ${data.name}<br/>
            Class: ${data.class}<br/>
            Race: ${data.race}<br/>
            Gender: ${data.gender}<br/>
            Level: ${data.level}<br/>`;
    });
})

