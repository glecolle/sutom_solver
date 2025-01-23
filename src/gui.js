class Gui {
    demo;
    trueGame;
    /* 1 index based */
    currentAttempt;
    /* 1 index based */
    currentLetter;
    length;
    first;
    secret;
    game;

    constructor() {
        this.build();
    }

    build() {
        let body = document.getElementsByTagName("body")[0];

        body.innerHTML = `<h1>Sutom Solver</h1>
        <input id="command" placeholder= "mot ou première suivie du nombre de lettres" size="40"></input>
        <div id="grid" class="hidden"></div>
        <div id="error"></div>`;

        document.getElementById("command").addEventListener("keyup", (e) => {
            this.initGame(e.currentTarget.value);
        });

        document.querySelector("body").addEventListener("keyup", this.letterTyped.bind(this));
        document.querySelector("body").addEventListener("click", this.letterClicked.bind(this));
        document.getElementById("command").focus();
    }

    initGame(param) {
        console.log("init word", param);
        this.demo = false;
        this.trueGame = false;

        if (/^[a-z]\s*\d{1,2}$/i.test(param)) {
            // will try to guess a secret from an external source (suggest and allow color user input)
            this.secret = null;
            this.game = new InteractiveGame(param[0], parseInt(param.substring(1)), this);
        } else if (/^[a-z]+$/i.test(param)) {
            // solver demo
            this.demo = true;
            this.secret = param;
            this.game = new Game(this.secret);
        } else if (param === "") {
            this.trueGame = true;
            this.game = new Game(Sutom.getRandomWord());
        } else {
            this.error("Vous devez saisir un mot ou une première lettre suivie du nombre total de lettres.");
            return;
        }

        this.currentAttempt = 0;

        this.addWord();

        this.resetError();

        document.getElementById("command").blur();
    }

    addWord() {
        this.currentAttempt++;
        this.currentLetter = 2;

        console.log("add word", this.currentAttempt);

        let grid = document.getElementById("grid");

        if (this.currentAttempt === 1) {
            grid.innerHTML = "";
        }

        grid.setAttribute("style", `grid-template-columns: repeat(${this.game.getLength()}, 2em) auto`);
        grid.classList.remove("hidden");
        for (let i=1 ; i <= this.game.getLength(); i++) {
            let id = `word_${this.currentAttempt}_${i}`;
            let letter = ".";
            if (i === 1) {
                letter = this.game.getFirst();
            } else if (i == 2) {
                letter = "_";
            }
            let classes = "letter";
            if (i === 1) {
                classes += " good";
            }
            grid.insertAdjacentHTML("beforeend", `
                <div class="cell">
                    <div id="${id}" class="${classes}">${letter}</div>
                </div>`
            );
        }

        let remaining = this.game.getRemaining();
        let remainingLength = "";
        if (remaining.length > 0) {
            remainingLength = `(${remaining.length})`;
        }
        let next = this.game.next(5).join(" ");

        grid.insertAdjacentHTML("beforeend", `
            <div id="attempt_${this.currentAttempt}" class="actions">
                <div class="action backspace" title="Effacer le dernier caractère">⇦</div>
                <div class="action enter" title="Valider">⏎</div>
                <div class="remaining" title="Nombre de mots encore possibles">${remainingLength}</div>
                <div class="next" title="Suggestions permettant de réduire au maximum la liste des mots restants">${next}</div>
            </div>
        `);
    }

    error(message) {
        document.getElementById("error").innerText = message;
    }

    resetError() {
        this.error("");
    }

    letterTyped(event) {
        console.log("typed key=", event.key, "code=", event.code, event.currentTarget, this.currentAttempt, this.currentLetter);
        if (!this.game || !this.game.getLength() || event.currentTarget.id == "command" ) {
            return;
        }

        if (event.key >= "a" && event.key <= "z") {
            // update current letter, or backspace or enter

            this.updateLetter(this.currentAttempt, this.currentLetter, event.key);
            this.currentLetter = Math.min(this.currentLetter+1, this.game.getLength()+1);
            this.updateLetter(this.currentAttempt, this.currentLetter, "_");

        } else if (event.code == "Backspace") {
            this.updateLetter(this.currentAttempt, this.currentLetter, ".");
            this.currentLetter = Math.max(2, this.currentLetter-1);
            this.updateLetter(this.currentAttempt, this.currentLetter, "_");

        } else if (event.code == "Delete") {
            this.currentLetter = 2;
            this.updateLetter(this.currentAttempt, this.currentLetter, "_");
            for (let i=3; i <= this.game.getLength() ; i++) {
                this.updateLetter(this.currentAttempt, i, ".");
            }
        } else if (event.code == "Enter" || event.code == "NumpadEnter") {
            let word = this.getCurrentWord();

            if (!/^[a-z]+$/.test(word)) {
                //this.error("Mot invalide ou incomplet");
                return;
            }

            let result = this.game.analyse(word);

            if (this.trueGame) {
                this.displayResult(result);
            }

            if (result !== true) {
                this.nextAttempt();
            }
        }
    }

    getCurrentWord() {
        let word = [];
        for (let i = 1 ; i <= this.game.getLength() ; i++) {
            let id = `word_${this.currentAttempt}_${i}`;
            word.push(document.getElementById(id).innerText);
        }
        word = word.join("").toLocaleLowerCase();

        return word;
    }

    /** Return the same analysis than Sutom.analyse, but from user input */
    getAnalysis() {
        let result = [];
        for (let i=1 ; i < this.game.getLength() ; i++) {
            let letterElement = document.getElementById(`word_${this.currentAttempt}_${i}`);
            if (letterElement.classList.contains("good")) {
                result.push(true);
            } else if (letterElement.classList.contains("misplaced")) {
                result.push(false);
            } else {
                result.push(null);
            }
        }

        if (result.every((r) => {r === true})) {
            return true;
        }

        return result;
    }

    displayResult(result) {
        console.log("result", result, "against", this.game.secret);

        if (result === true) {
            result = [];
            for (let i = 0 ; i < this.game.getLength(); i++) {
                result[i] = true;
            }
        }

        result.forEach((r, i) => {
            if (r === true) {
                document.getElementById(`word_${this.currentAttempt}_${i+1}`).classList.add("good");
            } else if (r === false) {
                document.getElementById(`word_${this.currentAttempt}_${i+1}`).classList.add("misplaced");
            }
        });
    }

    nextAttempt() {
        this.addWord();
    }

    updateLetter(attempt, rank, letter) {
        if (rank <= this.game.getLength()) {
            document.getElementById(`word_${attempt}_${rank}`).innerText = letter;
        }
    }

    letterClicked(event) {
        console.log("click", event.target);
        let id = event.target.id;
        if (!this.game || !this.game.getLength() || this.demo || !event.target.classList.contains("letter") || id.indexOf(`word_${this.currentAttempt}_`) === -1 || !/^[a-z]$/i.test(event.target.innerText)) {
            return;
        }

        this.updateLetterResult(event.target);
    }

    updateLetterResult(element) {
        if (!element.classList.contains("good") && !element.classList.contains("misplaced")) {
            element.classList.add("good");
        } else if (element.classList.contains("good")) {
            element.classList.remove("good");
            element.classList.add("misplaced");
        } else {
            element.classList.remove("misplaced");
        }

        // TODO mettre à jour les suggestions
    }
}

class InteractiveGame extends Game {
    gui;
    solver;

    constructor(first, length, gui) {
        super(first, length);
        this.gui = gui;
        this.solver = new Solver(this);
    }

    analyse(word) {
        let res = this.gui.getAnalysis();
        if (res === true) {
            console.log("found word:", word, "in", iter, "attempts");
            return {word: w, attempts: iter};
        }

        if (res === false) {
            console.log("could not find word, not an existing one");
            return false;
        }

        this.solver.reduceRemainingWords(word, res);
        return res;
    }

    getRemaining() {
        return this.solver.getRemaining();
    }

    next(count) {
        return this.solver.next(count);
    }
}

new Gui();

/* Scénario interactif

en mode jeu, afficher la liste des lettres possibles et impossibles selon une disposition azerty
quand on a une lettre à null, compter le nombre de lettres présentes, si d'autres sont présentes, compter le nombre bien et mal placées et si pas déj) fait, remove(letter, "not", count), stocker l'info dans tableau count[letter]=int
mode démo quand on saisit un mot (avec solveur et complétion automatique)
icones cliquables
on me suggère un mot contenant une lettre à une mauvaise position ainsi qu'un mot ne contenant pas une lettre obligatoire, ajouter des tests unitaires pour tirer cela au clair



*/