const version = `v0.5`
const scriptname = `ioBroker-SetShutterLevel-HomematicIP`
const constri = `Schmakus`

//------------------------------------------//
//    Release Notes                         //
//------------------------------------------//
/*
2021-09-30 v0.5
    *Schmakus   - Info: Bei Steuerung auf 100% Behanghöhe fahren die Jalousien wieder ein Stück zurück auf 95%.
                         Es scheint ein Problem des RPC Adapters oder der CCU zu sein.
                 - Change: Bei Vorgabe von State = 100 oder State = 0 wird ab sofort der Datenpunkt LEVEL gesetzt. 

2021-07-13 v0.4
    *Schmakus   - NEW: Zusätzliche Datenpunkte unter "All_Shutters" um alle Jalousien gleichzeitig verstellen zu können
                - NEW: minimalen %-Wert der Behnanghöhe, bei der keine Lamellenverstellung mehr durchgeführt wird. Standard = 90%
                - Diverse Optimierungen

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
const statesPath = "0_userdata.0.Rollladensteuerung."   //Grundpfad für Script Datenpunkte.
const logging = true                                    // Logging Ein/Aus
const minLevelForSetBlinds = 90                         // % der Behanghöhe, ab welcher keine Lamellenverstellung vorgenommen wird
//------------------------------------------//
//    Parameter erstellen                 //
//------------------------------------------//


//******* ACHTUNG !!! */
// Positions 0 und 100 stehen für komplett offen und geschlossen. Hier keine Parameter angeben!

const arrShutters = [
    {
        name: 'Küche',
        pathShutter: 'hm-rpc.1.00165A49924753.6',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,15],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,45],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,90],    //Jalousien komplett geschlossen, Lamellen Sichtschutz
        },
        default: [0,0],     //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
        toAll: true,        //Soll diese Jalousie der Gruppe "All_Shutters" hinzugefügt werden? Ja = true
    },
    {
        name: 'Essen_Süd',
        pathShutter: 'hm-rpc.1.00165A49924753.10',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,25],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,60],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,100],   //Jalousien komplett geschlossen, Lamellen Sichtschutz       
        },
        default: [0,0],     //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
        toAll: true,        //Soll diese Jalousie der Gruppe "All_Shutters" hinzugefügt werden? Ja = true
    },
    {
        name: 'Essen_West',
        pathShutter: 'hm-rpc.1.00165A49924753.14',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,25],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,50],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,100],   //Jalousien komplett geschlossen, Lamellen Sichtschutz       
        },
        default: [0,0],     //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
        toAll: true,        //Soll diese Jalousie der Gruppe "All_Shutters" hinzugefügt werden? Ja = true
    },
    {
        name: 'Wohnen_West_01',
        pathShutter: 'hm-rpc.1.00165A49A065F3.2',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,25],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,50],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,100],   //Jalousien komplett geschlossen, Lamellen Sichtschutz       
        },
        default: [0,0],     //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
        toAll: true,        //Soll diese Jalousie der Gruppe "All_Shutters" hinzugefügt werden? Ja = true
    },
    {
        name: 'Wohnen_West_02',
        pathShutter: 'hm-rpc.1.00165A49A065F3.6',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,25],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,60],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,100],   //Jalousien komplett geschlossen, Lamellen Sichtschutz       
        },
        default: [0,0],     //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
        toAll: true,        //Soll diese Jalousie der Gruppe "All_Shutters" hinzugefügt werden? Ja = true
    },
    {
        name: 'Wohnen_Nord',
        pathShutter: 'hm-rpc.1.00165A49A065F3.10',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,25],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,60],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,100],   //Jalousien komplett geschlossen, Lamellen Sichtschutz       
        },
        default: [0,0],     //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
        toAll: false,        //Soll diese Jalousie der Gruppe "All_Shutters" hinzugefügt werden? Ja = true
    },
    {
        name: 'Flur OG',
        pathShutter: 'hm-rpc.1.00165A49A06736.10',   //Pfad zum Channel der Jalousie
        positions: {
            0:   [0,0],     //Jalousien komplett geschlossen, Lamellen komplett geschlossen
            100: [100,0],   //Jalousien komplett geöffnet, Lamellenposition ignoriert
            95:  [0,15],    //Jalousien komplett geschlossen, Lamellen Sonnenschutz
            90:  [0,60],    //Jalousien komplett geschlossen, Lamellen geöffnet (Durchsicht)
            85:  [0,100],    //Jalousien komplett geschlossen, Lamellen Sichtschutz       
        },
        default: [0,0],      //Default: Jalousien komplett geschlossen, Lamellen komplett geschlossen
        toAll: false,        //Soll diese Jalousie der Gruppe "All_Shutters" hinzugefügt werden? Ja = true
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

//Objekt für Datenpunkte All erstellen
customStates[dpCount] = {id: statesPath + 'All_Shutters.State', init: 100, forceCreation: false, json: { read: true, write: true, name: 'Alle Jalousien Status', type: "number", role: "state", desc: "Datenpunkt für ShutterControl", def: 0, min: 0, max: 100 }};
dpCount++;
customStates[dpCount] = {id: statesPath + 'All_Shutters.BlindLevel', init: 0, forceCreation: false, json: { read: true, write: true, name: 'Alle Jalousien Lamellenposition anfahren', type: "number", role: "state", desc: "Lamellenposition vorgeben ohne Behanghöhe zu ändern", def: 0, min: 0, max: 100 }};
dpCount++;

for (const shutter of arrShutters) {
    //Objekt für Datenpunkte erstellen
    customStates[dpCount] = {id: statesPath + shutter.name + '.' + 'State', init: 100, forceCreation: false, json: { read: true, write: true, name: shutter.name + ' Status', type: "number", role: "state", desc: "Datenpunkt für ShutterControl", def: 0, min: 0, max: 100 }};
    dpCount++;
    customStates[dpCount] = {id: statesPath + shutter.name + '.' + 'BlindLevel', init: 0, forceCreation: false, json: { read: true, write: true, name: shutter.name + ' Lamellenposition anfahren', type: "number", role: "state", desc: "Lamellenposition vorgeben ohne Behanghöhe zu ändern", def: 0, min: 0, max: 100 }};
    dpCount++;

    //Pfade ergänzen
    shutter.pathParameter = shutter.pathShutter + '.COMBINED_PARAMETER'
    shutter.pathProcess = shutter.pathShutter + '.PROCESS'
    shutter.pathLevel = shutter.pathShutter + '.LEVEL'
    shutter.pathControl = statesPath + shutter.name + '.State'
    shutter.pathBlindLevel = statesPath + shutter.name + '.BlindLevel'
    shutter.pathControlAll = statesPath + 'All_Shutters.State'
    shutter.pathBlindLevelAll = statesPath + 'All_Shutters.BlindLevel'
    
    //Variablen setzen
    shutter.waitForZeroBlind = false
    shutter.parameter = []


    //Lamellen komplett schließen
    shutter.SetZeroBlind = async function() {
        if (logging) console.log(`${scriptname}: ${this.name} // Set ZeroBlind`)
        this.waitForZeroBlind = true
        setStateAsync(this.pathParameter, 'L=100.5,L2=0')
    }

    //Lamellenposition anfahren
    shutter.SetShutter = async function() {
        if (logging) console.log(`${scriptname}: ${this.name} // Set level for Shutter/Blind:  ${this.parameter}`)
        setStateAsync(this.pathParameter, this.parameter)
    }

    //Behanghöhe 0% oder 100% anfahren
    shutter.SetLevel = async function(level) {
        if (logging) console.log(`${scriptname}: ${this.name} // Set level for Shutter:  ${level}`)
        setStateAsync(this.pathLevel, level)
    }

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
        on({id: objTemp.pathControl, change: "any", ack: false}, async function (obj) {
            const value = obj.state.val

            setStateAsync(obj.id, value, true)

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
                    await objTemp.SetZeroBlind() 
                } else {
                    //Datenpunkt setzen
                    await objTemp.SetLevel(value)   
                }
            } else {
                //Parameter setzen
                objTemp.parameter = `L=${objTemp.default[0]},L2=${objTemp.default[1]}`
                //Datenpunkt setzen
                await objTemp.SetShutter()
            }
        })

        //Trigger auf BlindLevel Datenpunkt
        on({id: objTemp.pathBlindLevel, change: "any", ack: false}, async function (obj) {
            const value = obj.state.val
            
            setStateAsync(obj.id, value, true)

            //Aktuelle Behanghöhe der Jalousie auslesen
            const actualPosition = await getStateAsync(objTemp.pathLevel)
            let actualPositionOfShutter = 0
            actualPositionOfShutter = actualPosition.val
            
            //Prüfen, ob Behanghöhe der Verstellgrenze entspricht
            if(actualPositionOfShutter <= minLevelForSetBlinds) {
                //Parameter setzen
                objTemp.parameter = `L=100.5,L2=${value}` 

                if(value > 0 && value < 100) {   
                    //Lamellen in Zwischenpositionen zuerst schließen, dann Position anfahren
                    await objTemp.SetZeroBlind()  
                } else {
                    //Datenpunkt setzen
                    await objTemp.SetShutter()   
                }
            }else {
                if (logging) console.log(`${scriptname}: ${objTemp.name} // Behanghöhe ist > ${minLevelForSetBlinds}%. Deshalb keine Lamellenverstellung`)
            }
        }) 

        //Trigger auf State_All Datenpunkt
        on({id: objTemp.pathControlAll, change: "any", ack: false}, async function (obj) {
            const value = obj.state.val
            setStateAsync(obj.id, value, true)
            //Alle Jalousien antriggern
            if(objTemp.toAll) {                  
                setStateAsync(objTemp.pathControl, value)
            }
        }) 

        //Trigger auf BlindLevel_All Datenpunkt
        on({id: objTemp.pathBlindLevelAll, change: "any", ack: false}, async function (obj) {
            const value = obj.state.val
            setStateAsync(obj.id, value, true)
            //Alle Jalousien antriggern
            if(objTemp.toAll) {   
                setStateAsync(objTemp.pathBlindLevel, value)
            }
        }) 

        //Trigger auf PROCESS Datenpunkt des Jalousien Channels
        on({id: objTemp.pathProcess, change: "lt", ack: true}, async function (obj) {
            if (logging) console.log(`${scriptname}: ${objTemp.name} // Process ist stable now`)
            if(objTemp.waitForZeroBlind) {
                //Datenpunkt setzen
                await objTemp.SetShutter()
                objTemp.waitForZeroBlind = false
            }
        }) 
    })
}


