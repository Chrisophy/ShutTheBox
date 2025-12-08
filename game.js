// =================================================================
// 1. Spiellogik Klasse (Portierung von ShutTheBoxGame)
// =================================================================

class ShutTheBoxGame {
    constructor(anzahlSpieler, spielmodus = 0) {
        this.spielerAnzahl = anzahlSpieler;
        this.spielmodus = spielmodus;
        this.spielerZustaende = {};
        for (let i = 1; i <= anzahlSpieler; i++) {
            this.spielerZustaende[i] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        }

        this.aktuellerSpieler = 1;
        this.punkte = {}; 
        this.rundenGespielt = {};
        this.ergebnisse = {}; 

        for (let i = 1; i <= anzahlSpieler; i++) {
            this.punkte[i] = 0;
            this.rundenGespielt[i] = 1;
        }

        this.wuerfel1 = 0;
        this.wuerfel2 = 0;
        this.summe = 0;

        this.istCpuSpielFlag = (anzahlSpieler === 2); 
        this.cpuSpielerId = this.istCpuSpielFlag ? 2 : 0;
    }

    istAktuellerSpielerCPU() {
        return this.aktuellerSpieler === this.cpuSpielerId;
    }

    getAktuelleZahlen() {
        return this.spielerZustaende[this.aktuellerSpieler] || [];
    }

    wuerfeln() {
        this.wuerfel1 = Math.floor(Math.random() * 6) + 1;
        this.wuerfel2 = Math.floor(Math.random() * 6) + 1;
        this.summe = this.wuerfel1 + this.wuerfel2;
    }

    istGueltigerZug(gewaehlteZahlen) {
        if (!gewaehlteZahlen || gewaehlteZahlen.length === 0 || gewaehlteZahlen.reduce((a, b) => a + b, 0) !== this.summe) {
            return false;
        }
        const aktuelleZahlen = this.getAktuelleZahlen();
        return gewaehlteZahlen.every(zahl => aktuelleZahlen.includes(zahl));
    }

    _findeKombinationDP(zielSumme, verfuegbareZahlen) {
        const dp = new Array(zielSumme + 1).fill(false);
        dp[0] = true;

        for (const zahl of verfuegbareZahlen) {
            for (let s = zielSumme; s >= zahl; s--) {
                if (dp[s - zahl]) {
                    dp[s] = true;
                }
            }
        }
        return dp[zielSumme];
    }

    istZugMoeglich() {
        const aktuelleZahlen = this.getAktuelleZahlen();
        if (aktuelleZahlen.length === 0) return false;
        if (aktuelleZahlen.reduce((a, b) => a + b, 0) < this.summe) return false;
        if (Math.min(...aktuelleZahlen) > this.summe) return false;

        return this._findeKombinationDP(this.summe, aktuelleZahlen);
    }

    // ✅ KORRIGIERT: Wählt nun die KÜRZESTE Kombination (die höchsten Zahlen)
    findeBesteKombination() {
        const zielSumme = this.summe;
        // Sortiere absteigend, um größere Zahlen zuerst zu berücksichtigen
        const verfuegbareZahlen = this.getAktuelleZahlen().sort((a, b) => b - a); 
        let besteKombination = [];
        // Setze auf Infinity, da wir die kürzeste Kombination suchen
        let besteKombinationsLaenge = Infinity; 

        const findeKombinationen = (startIndex, currentSum, currentCombination) => {
            if (currentSum === zielSumme) {
                // Wähle die KÜRZESTE Kombination
                if (currentCombination.length < besteKombinationsLaenge) {
                    besteKombination = [...currentCombination];
                    besteKombinationsLaenge = currentCombination.length;
                }
                return; 
            }
            if (currentSum > zielSumme) return;
            
            // Abbruch, wenn die aktuelle Kombination bereits länger ist als die beste gefundene
            if (currentCombination.length >= besteKombinationsLaenge) return;

            for (let i = startIndex; i < verfuegbareZahlen.length; i++) {
                const zahl = verfuegbareZahlen[i];
                currentCombination.push(zahl);
                findeKombinationen(i + 1, currentSum + zahl, currentCombination);
                currentCombination.pop(); 
            }
        };

        findeKombinationen(0, 0, []);
        return besteKombination;
    }

    klappeZahlUm(zahl) {
        const aktuelleZahlen = this.getAktuelleZahlen();
        const index = aktuelleZahlen.indexOf(zahl);
        if (index > -1) {
            aktuelleZahlen.splice(index, 1);
            return true;
        }
        return false;
    }

    setZustaendeFuerNeuenZug() {
        if (this.spielmodus === 1 || this.spielmodus === 2) {
            this.spielerZustaende[this.aktuellerSpieler] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        }
    }

    beendeRunde() {
        const hinzuzufuegendePunkte = this.getAktuelleZahlen().reduce((a, b) => a + b, 0);
        this.rundenGespielt[this.aktuellerSpieler]++;

        let spielEnde = false;

        if (this.spielmodus === 0) {
            if (!(this.aktuellerSpieler in this.ergebnisse)) {
                this.ergebnisse[this.aktuellerSpieler] = hinzuzufuegendePunkte;
            }
            spielEnde = Object.keys(this.ergebnisse).length === this.spielerAnzahl;
        } else if (this.spielmodus === 1 || this.spielmodus === 2) {
            this.punkte[this.aktuellerSpieler] += hinzuzufuegendePunkte;
            if (this.punkte[this.aktuellerSpieler] >= 100) {
                for (const spielerId in this.punkte) {
                    this.ergebnisse[spielerId] = this.punkte[spielerId];
                }
                spielEnde = true;
            }
        }

        if (spielEnde) {
            return false; 
        }

        const startSpieler = this.aktuellerSpieler;
        let naechsterSpieler;

        do {
            naechsterSpieler = (this.aktuellerSpieler % this.spielerAnzahl) + 1;
            this.aktuellerSpieler = naechsterSpieler;

            if (this.spielmodus === 0 && naechsterSpieler in this.ergebnisse) {
                if (naechsterSpieler === startSpieler) {
                    return false; 
                }
                continue; 
            }

            return true; 

        } while (this.aktuellerSpieler !== startSpieler);
        
        return false;
    }

    getHighscoreTabelle() {
        if ((this.spielmodus === 1 || this.spielmodus === 2) && Object.keys(this.ergebnisse).length === 0) {
            for (const spielerId in this.punkte) {
                this.ergebnisse[spielerId] = this.punkte[spielerId];
            }
        }
        
        return Object.entries(this.ergebnisse).sort(([, punkteA], [, punkteB]) => punkteA - punkteB);
    }
}

// =================================================================
// 2. GUI-Steuerung (Web-spezifisch)
// =================================================================

let game;
let gewaehlteZahlenTemp = [];
let mussWuerfeln = true; 
const zahlenControls = []; 

// ✅ NEU: Hilfsfunktion zum Ausblenden der Würfel
function hideDice() {
    document.getElementById('wuerfel-1').style.display = 'none';
    document.getElementById('wuerfel-2').style.display = 'none';
    document.getElementById('summe-label').textContent = "Summe: 0";
}

// ✅ NEU: Hilfsfunktion zum Einblenden der Würfel nach dem Wurf
function showDice() {
    const wuerfel1Img = document.getElementById('wuerfel-1');
    const wuerfel2Img = document.getElementById('wuerfel-2');
    const summeLabel = document.getElementById('summe-label');
    
    wuerfel1Img.style.display = 'inline-block';
    wuerfel2Img.style.display = 'inline-block';
    wuerfel1Img.src = `resources/wuerfel_${game.wuerfel1}.png`; 
    wuerfel2Img.src = `resources/wuerfel_${game.wuerfel2}.png`;
    summeLabel.textContent = `Summe: ${game.summe}`;
}

function initGame() {
    let anzahlSpieler;
    while (true) {
        const input = prompt("Wähle die Anzahl der menschlichen Spieler (1-4). 1 startet mit CPU.", "1");
        anzahlSpieler = parseInt(input);
        if (anzahlSpieler >= 1 && anzahlSpieler <= 4) break;
        if (input === null) return; 
    }

    let spielerAnzahlReal = anzahlSpieler === 1 ? 2 : anzahlSpieler;

    let spielmodus;
    while (true) {
        const input = prompt("Wähle den Spielmodus:\n0: Standard\n1: Highscore (100 Punkte)\n2: Ok / Ende", "0");
        spielmodus = parseInt(input);
        if (spielmodus >= 0 && spielmodus <= 2) break;
        if (input === null) return; 
    }
    
    game = new ShutTheBoxGame(spielerAnzahlReal, spielmodus);

    // Globale Zustände zurücksetzen
    gewaehlteZahlenTemp = [];
    mussWuerfeln = true; 

    document.getElementById('highscore-label').style.display = (spielmodus === 1 || spielmodus === 2) ? 'block' : 'none';
    document.getElementById('bestaetigen-button').textContent = (spielmodus === 2) ? "Ok / Ende" : "Zug bestätigen";
    
    document.getElementById('wuerfeln-button').disabled = false;
    document.getElementById('neustart-button').disabled = false;
    
    // Stelle sicher, dass das Modal versteckt ist
    document.getElementById('highscore-modal').style.display = 'none';

    createNumberTiles();
    updateUI(true);
    checkAndStartCPUTurn();
}

function createNumberTiles() {
    const numbersArea = document.getElementById('numbers-area');
    numbersArea.innerHTML = ''; 
    zahlenControls.length = 0; 
    
    for (let i = 1; i <= 9; i++) {
        const tile = document.createElement('div');
        tile.className = 'number-tile';
        tile.id = 'tile-' + i;
        tile.textContent = i;
        tile.dataset.zahl = i;
        
        tile.addEventListener('click', () => handleNumberClick(i));
        
        numbersArea.appendChild(tile);
        zahlenControls.push(tile);
    }
}

function updateUI(isNewRound = false) {
    const isCPU = game.istAktuellerSpielerCPU();
    const aktuelleZahlen = game.getAktuelleZahlen();
    const gesamtpunkte = aktuelleZahlen.reduce((a, b) => a + b, 0);
    const rundenAktuell = game.rundenGespielt[game.aktuellerSpieler];
    
    let spielerName;
    // ✅ KORRIGIERT: Zeigt "Computer" an, wenn die CPU am Zug ist
    if (isCPU) {
        spielerName = 'Computer';
    } else {
        spielerName = `Spieler ${game.aktuellerSpieler}`;
    }
    
    document.getElementById('spieler-label').textContent = `${spielerName} ist dran (Runde ${rundenAktuell})`;
    
    document.getElementById('gesamtpunkte-label').textContent = `Gesamtpunkte: ${gesamtpunkte}`;
    document.getElementById('runden-label').textContent = `Abgeschlossene Runden: ${rundenAktuell - 1}`;
    
    if (game.spielmodus === 1 || game.spielmodus === 2) {
        document.getElementById('highscore-label').textContent = `Bisherige Punkte: ${game.punkte[game.aktuellerSpieler]}`;
    }
    
    const wuerfelnButton = document.getElementById('wuerfeln-button');
    const bestaetigenButton = document.getElementById('bestaetigen-button');
    
    wuerfelnButton.disabled = isCPU || !mussWuerfeln;
    bestaetigenButton.disabled = isCPU || mussWuerfeln;
    
    for (const control of zahlenControls) {
        const zahl = parseInt(control.dataset.zahl);
        
        control.classList.remove('selected', 'closed', 'invalid');
        
        if (!aktuelleZahlen.includes(zahl)) {
            control.classList.add('closed');
            control.style.backgroundColor = 'darkred';
            control.style.pointerEvents = 'none';
        } else {
            control.style.backgroundColor = 'green';
            control.style.pointerEvents = (isCPU || mussWuerfeln) ? 'none' : 'auto';
            
            if (gewaehlteZahlenTemp.includes(zahl)) {
                control.classList.add('selected');
                control.style.backgroundColor = 'gold';
            }
        }
    }
    
    // **✅ GEÄNDERT:** Nur für menschliche Spieler die Würfel hier steuern
    if (!isCPU) {
        if (mussWuerfeln) {
            hideDice(); 
        } else {
            showDice(); 
        }
    }
    
    if ((game.spielmodus === 1 || game.spielmodus === 2) && isNewRound) {
        game.setZustaendeFuerNeuenZug();
    }
}


function handleNumberClick(zahl) {
    if (game.istAktuellerSpielerCPU() || mussWuerfeln) return;
    
    const index = gewaehlteZahlenTemp.indexOf(zahl);
    const aktuelleSumme = gewaehlteZahlenTemp.reduce((a, b) => a + b, 0);

    if (index === -1) {
        if (aktuelleSumme + zahl <= game.summe) {
            gewaehlteZahlenTemp.push(zahl);
        } else {
            alert(`Ungültige Auswahl! Die Summe darf ${game.summe} nicht überschreiten.`);
        }
    } else {
        gewaehlteZahlenTemp.splice(index, 1);
    }
    
    updateUI();
}

// =================================================================
// 3. Aktionen und Haupt-Ablauf
// =================================================================

function wuerfelnUndAnzeigen() {
    if (!mussWuerfeln) return;
    
    game.wuerfeln();
    mussWuerfeln = false;
    gewaehlteZahlenTemp = [];
    
    if (!game.istZugMoeglich()) {
        alert("Kein Zug möglich! Runde wird beendet.");
        wechselSpielerUndStarteNeueRunde(true); 
        return;
    }
    
    updateUI();
}

function bestaetigeZug() {
    if (mussWuerfeln) return;
    
    if (game.spielmodus === 2 && gewaehlteZahlenTemp.length === 0) {
        // ✅ NEU: Rufe benutzerdefiniertes Modal auf
        zeigeBestätigungsModal();
        return;
    }

    if (game.istGueltigerZug(gewaehlteZahlenTemp)) {
        
        for (const zahl of gewaehlteZahlenTemp) {
            game.klappeZahlUm(zahl);
        }
        gewaehlteZahlenTemp = [];
        
        if (game.getAktuelleZahlen().length === 0) {
            alert("Box geschlossen! Bonusrunde!");
            wechselSpielerUndStarteNeueRunde(true);
        } else {
            mussWuerfeln = true;
            // **NEU:** Würfel ausblenden, bevor die nächste Runde startet
            hideDice(); 
            alert("Zug erfolgreich. Erneut würfeln!");
            updateUI();
        }
    } else {
        alert(`Ungültiger Zug! Die Summe der gewählten Zahlen muss ${game.summe} ergeben.`);
        gewaehlteZahlenTemp = [];
        updateUI();
    }
}

// ✅ NEU: Funktion zur Anzeige des Bestätigungs-Modals
function zeigeBestätigungsModal() {
    const highscoreModal = document.getElementById('highscore-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const neustartJa = document.getElementById('modal-neustart-ja');
    const neustartNein = document.getElementById('modal-neustart-nein');
    
    // Temporäre Anpassung für die Bestätigung
    modalTitle.textContent = "Runde vorzeitig beenden?";
    modalMessage.textContent = "Möchten Sie die Runde beenden? Ihre aktuellen Restpunkte zählen zu Ihren Punkte.";
    
    neustartJa.textContent = "Ja (Runde beenden)";
    neustartNein.textContent = "Nein (Weiterspielen)";
    
    // Temporäre Event Listener für die Bestätigungslogik
    neustartJa.onclick = () => {
        highscoreModal.style.display = 'none';
        // Übergibt 'true', um die Runde zu beenden
        wechselSpielerUndStarteNeueRunde(true); 
        // Setzt Modal-Text für eventuelles Highscore-Ende zurück
        modalTitle.textContent = "Spiel beendet!"; 
    };
    
    neustartNein.onclick = () => {
        highscoreModal.style.display = 'none';
        // Setzt Modal-Text für eventuelles Highscore-Ende zurück
        modalTitle.textContent = "Spiel beendet!"; 
    };

    highscoreModal.style.display = 'flex'; // Modal anzeigen
}


function wechselSpielerUndStarteNeueRunde(rundeVerloren) {
    if (rundeVerloren) {
        if (!game.beendeRunde()) {
            zeigeHighscore();
            return;
        }
    }
    
    mussWuerfeln = true;
    updateUI(true); 
    checkAndStartCPUTurn();
}

function zeigeHighscore() {
    const tabelle = game.getHighscoreTabelle();
    
    let nachricht = (game.spielmodus === 0) 
        ? "Alle Spieler sind ausgeschieden. Ergebnis:\n\n" 
        : "Spiel beendet! Ein Spieler hat 100 oder mehr Punkte erreicht.\n\n";

    for (let i = 0; i < tabelle.length; i++) {
        const [spielerNr, punkte] = tabelle[i];
        const platz = i + 1;
        const runden = game.rundenGespielt[spielerNr] - 1;
        let spielerName = `Spieler ${spielerNr}`;
        
        // Korrektur: Wenn es die CPU ist, zeige "Computer"
        if (parseInt(spielerNr) === game.cpuSpielerId) {
             spielerName = "Computer ";
        }

        nachricht += `[${platz}. Platz] ${spielerName} - ${punkte} Punkte (${runden} Runden)\n`;
    }

    // Deaktiviere die Spiel-Buttons (sie bleiben deaktiviert)
    document.getElementById('wuerfeln-button').disabled = true;
    document.getElementById('bestaetigen-button').disabled = true;
    
    // Der Neustart-Button muss immer aktiv bleiben!
    document.getElementById('neustart-button').disabled = false; 
    
    // Deaktiviere Zahlen-Kacheln
    for (const control of zahlenControls) {
        control.style.pointerEvents = 'none'; 
    }
    
    // Fülle den Modal
    const highscoreModal = document.getElementById('highscore-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const neustartJa = document.getElementById('modal-neustart-ja');
    const neustartNein = document.getElementById('modal-neustart-nein');

    modalTitle.textContent = "Spiel beendet!";
    modalMessage.textContent = nachricht;
    
    // Setze die Buttons auf die Highscore-Standardtexte zurück
    neustartJa.textContent = "Ja";
    neustartNein.textContent = "Nein";
    
    highscoreModal.style.display = 'flex'; // Modal anzeigen

    // Event Listener neu zuweisen für Highscore
    neustartJa.onclick = () => {
        highscoreModal.style.display = 'none';
        initGame(); // Starte neues Spiel
    };
    
    neustartNein.onclick = () => {
        highscoreModal.style.display = 'none';
        alert("Spiel beendet. Vielen Dank fürs Spielen!"); 
    };
}

// =================================================================
// 4. CPU-Ablauf (✅ ÜBERARBEITET FÜR VERZÖGERUNGEN UND WÜRFEL-AUSBLENDUNG)
// =================================================================

// Kurze Verzögerung für den Start des CPU-Zuges
const CPU_START_DELAY = 1000; 
// Verzögerung zwischen Würfelwurf und Zug-Prüfung
const CPU_ROLL_DELAY = 1500; 
// Verzögerung nach dem Umklappen der Zahlen (Wartezeit, um den Zug zu sehen)
const CPU_MOVE_DELAY = 1000; 
// Verzögerung zwischen Zügen, wenn die CPU erneut würfeln darf
const CPU_NEXT_ROLL_DELAY = 1500; 

async function checkAndStartCPUTurn() {
    if (game && game.istAktuellerSpielerCPU()) {
        // Starte mit einer kleinen Verzögerung
        await new Promise(resolve => setTimeout(resolve, CPU_START_DELAY)); 
        cpuZugAblauf();
    }
}

async function cpuZugAblauf() {
    
    document.getElementById('wuerfeln-button').disabled = true;
    document.getElementById('bestaetigen-button').disabled = true;
    
    // 1. Würfeln
    game.wuerfeln();
    mussWuerfeln = false;
    gewaehlteZahlenTemp = [];
    
    // 2. Würfel anzeigen (manuell, da updateUI für CPU deaktiviert wurde)
    showDice();
    updateUI(); // Nur die Zahlen-Kacheln aktualisieren

    // 3. Verzögern, damit der Spieler das Ergebnis sieht
    await new Promise(resolve => setTimeout(resolve, CPU_ROLL_DELAY)); 

    if (!game.istZugMoeglich()) {
        // Keine Zugmöglichkeit: Kurze Pause, dann Runde beenden
        await new Promise(resolve => setTimeout(resolve, CPU_ROLL_DELAY)); 
        // ✅ NEU: Würfel ausblenden, bevor die Runde endet
        hideDice(); 
        wechselSpielerUndStarteNeueRunde(true); 
        return;
    }

    while (true) {
        
        const kombination = game.findeBesteKombination();
        
        if (kombination.length > 0) {
            
            // 4. Zug wählen und markieren
            gewaehlteZahlenTemp = kombination;
            updateUI(); 
            
            // 5. Verzögerung, damit der Spieler die gewählten Zahlen sieht
            await new Promise(resolve => setTimeout(resolve, CPU_MOVE_DELAY));
            
            // 6. Zahlen umklappen
            for (const zahl of kombination) {
                game.klappeZahlUm(zahl);
            }
            gewaehlteZahlenTemp = [];
            
            // 7. Würfel ausblenden (wie bei menschlichem Spieler)
            hideDice(); 
            updateUI(); // Nur die Zahlen-Kacheln aktualisieren

            // 8. Kurze Verzögerung, während die Würfel ausgeblendet sind
            await new Promise(resolve => setTimeout(resolve, CPU_NEXT_ROLL_DELAY));

            if (game.getAktuelleZahlen().length === 0) {
                // Box geschlossen
                wechselSpielerUndStarteNeueRunde(true);
                return; 
            } else {
                // Erneut würfeln
                game.wuerfeln();
                mussWuerfeln = false;
                showDice(); // Würfel wieder einblenden und Summe anzeigen
                updateUI();
                
                // 9. Verzögerung, um den neuen Wurf anzuzeigen
                await new Promise(resolve => setTimeout(resolve, CPU_ROLL_DELAY)); 
                
                if (!game.istZugMoeglich()) {
                    // Keine Zugmöglichkeit mehr nach erneutem Wurf
                    await new Promise(resolve => setTimeout(resolve, CPU_ROLL_DELAY)); 
                    hideDice();
                    wechselSpielerUndStarteNeueRunde(true); 
                    return; 
                }
            }
        } else {
            // Kein Zug mehr möglich (fällt auf, wenn beim ersten Wurf ein Zug möglich war)
            hideDice();
            wechselSpielerUndStarteNeueRunde(true);
            return; 
        }
    }
}


// =================================================================
// 5. Event Listener (Verbindung zwischen UI und Logik)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('wuerfeln-button').addEventListener('click', wuerfelnUndAnzeigen);
    document.getElementById('bestaetigen-button').addEventListener('click', bestaetigeZug);
    
    // Korrektur: Bestätigungsmeldung beim Klick auf Neustart entfernt
    document.getElementById('neustart-button').addEventListener('click', () => {
        initGame();
    });

    initGame();
});
