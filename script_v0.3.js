const version = `v0.3`
const scriptname = `ioBroker-SetShutterLevel-HomematicIP`
const constri = `Schmakus`

//------------------------------------------//
//    Release Notes                         //
//------------------------------------------//
/*
2021-07-13 v0.3
    *Schmakus   - Problem mit unterschiedlichen und hintereinander gesetzten Lamellenpositionen behoben.
                  Die Lamellen werden vor jeder neuen Bewegung zuerst vollständig geschlossen (0%) und anschließen wird die neue Lamellenposition angefahren
                - NEW: Zusätzlicher Datenpunkt, um nur die Lamellen zu verstellen, ohne die Behanghähe signifikant zu ändern.
2021-07-09 v0.2
    *Schmakus:  - Diverse Optimierungen
                - Bekanntes Problem: Wenn mehrere Positionen nacheinander angefahren werden, passt die Lamellenposition nicht mehr. Es muss deshalb immer zuerst auf 0 gefahren werden, bevor eine neue Position gesetzt wird.

2021-07-08 v0.1
    *Schmakus:  - Erstellung
*/

//------------------------------------------//
//    Allgemine Werte definieren            //
//------------------------------------------//
const statesPath = "0_userdata.0.Rollladensteuerung."  //Grundpfad für Script Datenpunkte.
const logging = true                                // Logging Ein/Aus

//------------------------------------------//
//    Parameter erstellen                 //
//------------------------------------------//
const arrShutters = [
    {
        name: 'Küche',
        pathShutter: 'hm-rpc.1.00165A49924753.6',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,40],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,60],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,90],    //Jalousien komplett geschlossen, Lamellen Sichtschutz
        },
        default: [0,0]      //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
    },
    {
        name: 'Essen_Süd',
        pathShutter: 'hm-rpc.1.00165A49924753.10',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,40],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,60],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,90],    //Jalousien komplett geschlossen, Lamellen Sichtschutz       
        },
        default: [0,0]      //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
    },
    {
        name: 'Essen_West',
        pathShutter: 'hm-rpc.1.00165A49924753.14',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,40],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,60],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,90],    //Jalousien komplett geschlossen, Lamellen Sichtschutz       
        },
        default: [0,0]      //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
    },
]

//------------------------------------------//
//    AB HIER NICHTS MEHR ÄNDERN            //
//------------------------------------------//

//******* Logeintrag mit Scriptnamen, Version und Developer */
console.log(`${scriptname} ${version} ${constri}`);

//******* State Datenpunkt für jede Jalousie erstellen und Array bearbeiten*/
let dpCount = 0;        //Zähler
let customStates = [];  //Array mit anzulegenden Dps
for (const shutter of arrShutters) {
    //Objekt für Datenpunkte erstellen
    customStates[dpCount] = {id: statesPath + shutter.name + '.' + 'State', init: 100, forceCreation: false, json: { read: true, write: true, name: shutter.name + ' Status', type: "number", role: "state", desc: "Datenpunkt für ShutterControl", def: 0, min: 0, max: 100 }};
    dpCount++;
    customStates[dpCount] = {id: statesPath + shutter.name + '.' + 'BlindLevel', init: 0, forceCreation: false, json: { read: true, write: true, name: shutter.name + ' Lamellenposition anfahren', type: "number", role: "state", desc: "Lamellenposition vorgeben ohne Behanghöhe zu ändern", def: 0, min: 0, max: 100 }};
    dpCount++;

    //Pfade ergänzen
    shutter.pathParameter = shutter.pathShutter + '.COMBINED_PARAMETER'
    shutter.pathProcess = shutter.pathShutter + '.PROCESS'
    shutter.pathControl = statesPath + shutter.name + '.State'
    shutter.pathBlindLevel = statesPath + shutter.name + '.BlindLevel'

    //Variablen setzen
    shutter.waitForZeroBlind = false
    shutter.parameter = []
}

let numStates = customStates.length;

customStates.forEach(function (state) {
    createStateAsync(state.id, state.init, state.forceCreation, state.json, function () {
        numStates--;
        if (numStates === 0) {
            if (logging) console.log(`${scriptname}: CreateStates fertig!`);
            CreateTrigger(arrShutters)
        };
    });
});

/* ******* Trigger erstellen *******
 * @param {array} arrShutters Enthält die Informationen und Parameter jeder Jalousie
*/
async function CreateTrigger(arrShutters) {
    arrShutters.forEach(function async(objTemp) {

        //Trigger auf eigenen Datenpunkt, welcher durch ShutterControl angesteuert wird
        on({id: objTemp.pathControl, change: "ne"}, async function (obj) {
            const value = obj.state.val

            SetAck(obj)

            if (logging) console.log(`${scriptname}: Set state for Shutter: ${objTemp.name} from ShutterControl: ${value}`)

            //Check, if position exits
            let found = false;
            for(const i of Object.keys(objTemp.positions)) {
                if (i == value) {
                    found = true
                    break
                }
            }

            if(found) {
                //Parameter setzen
                objTemp.parameter = `L=${objTemp.positions[value][0]},L2=${objTemp.positions[value][1]}`
                if(value > 0 && value < 100) {
                    //Lamellen in Zwischenpositionen zuerst schließen, dann Position anfahren
                    SetZeroBlind(objTemp)  
                } else {
                    //Datenpunkt setzen
                    SetShutter(objTemp)   
                }
            } else {
                //Parameter setzen
                objTemp.parameter = `L=${objTemp.default[0]},L2=${objTemp.default[1]}`
                //Datenpunkt setzen
                SetShutter(objTemp)
            }
        })

        //Trigger auf BlindLevel Datenpunkt
        on({id: objTemp.pathBlindLevel, change: "ne"}, async function (obj) {
            const value = obj.state.val
            SetAck(obj)
            
            //Parameter setzen
            objTemp.parameter = `L=100.5,L2=${value}` 

            if(value > 0 && value < 100) {   
                //Lamellen in Zwischenpositionen zuerst schließen, dann Position anfahren
                SetZeroBlind(objTemp)  
            } else {
                //Datenpunkt setzen
                SetShutter(objTemp)   
            }
        }) 

        //Trigger auf PROCESS Datenpunkt des Jalousien Channels
        on({id: objTemp.pathProcess, change: "lt", ack: true}, async function (obj) {
            if (logging) console.log(`${scriptname}: ${objTemp.name} // Process ist stable now`)
            if(objTemp.waitForZeroBlind) {
                //Datenpunkt setzen
                SetShutter(objTemp)
                objTemp.waitForZeroBlind = false
            }
        }) 
    })
}

/******* Homematic Parameter setzen *******
* @param {object} objTemp Alle Parameter des jeweils ausgelösten Triggers und der dazugehörigen Jalousie
*/
function SetShutter(objTemp) {
    if (logging) console.log(`${scriptname}: ${objTemp.name} // Set level for Shutter/Blind:  ${objTemp.parameter}`)
    setStateAsync(objTemp.pathParameter, objTemp.parameter)
}

/******* Lamellen komplett schließen  *******
* @param {object} objTemp Alle Parameter des jeweils ausgelösten Triggers und der dazugehörigen Jalousie
*/
function SetZeroBlind(objTemp) {
    if (logging) console.log(`${scriptname}: ${objTemp.name} // Set ZeroBlind`)
    objTemp.waitForZeroBlind = true
    setStateAsync(objTemp.pathParameter, 'L=100.5,L2=0')
}

/******* Ack auf True setzen  *******
* @param {object} obj Objekt des Triggers
*/
async function SetAck(obj) {
    if(!obj.state.ack) {
        setStateAsync(obj.id, obj.state.val, true)
    }
}
