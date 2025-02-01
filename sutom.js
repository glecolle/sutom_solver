
// toolbox, dictionary holder
class Sutom {

    static words;

    constructor() {
        if (!Sutom.words) {
            Sutom.words = new Words();
            //console.debug("loaded words", Sutom.words);
        }
    }

    static analyse(attempt, secret) {
        if (attempt.length != secret.length) {
            throw new Error("cannot analyse words of different lengths (" + attempt+ " should contain "+(secret.length)+" characters)");
        }

        let result = { ok: true, letters: new Array(secret.length)};
        let secretMatches = new Array(secret.length);

        // mark good letters
        for (let i= 0 ; i < secret.length ; i++) {
            if (secret[i] === attempt[i]) {
                result.letters[i] = true;
                secretMatches[i] = true;
            } else {
                result.ok = false;
                result.letters[i] = null;
            }
        }

        // look for misplaced letters among remaining letters
        for (let a=0 ; a < secret.length ; a++) {
            for (let s=0 ; s < secret.length ; s++) {
                if (result.letters[a] === null && a !== s && secretMatches[s] !== true) {
                    if (attempt[a] === secret[s]) {
                        result.letters[a] = false;
                        secretMatches[s] = true;
                        continue;
                    }
                }
            }
        }

        return result;
    }

    static valid(word) {
        if (typeof word !== "string") {
            return `word '${JSON.stringify(word)}' is not a string`;
        }

        if (!/^[a-z]+$/.test(word)) {
            return `invalid letters in ${word}`;
        }

        if (!Sutom.words[word.length]) {
            return `no dictionary for this length: ${word.length}`;
        }

        if (!Sutom.words[word.length][word[0]]) {
            return `no dictionary for length ${word.length} starting by letter '${word[0]}'`;
        }

        if (Sutom.words[word.length][word[0]].indexOf(word) === -1) {
            return `unknown word '${word}'`;
        }

        return true;
    }

    static getWords(first, length) {
        return JSON.parse(JSON.stringify(Sutom.words[length][first]));
    }

    static getRandomWord() {
        let lengths = Object.keys(Sutom.words);
        let lengthIndex = Math.floor(Math.random()*lengths.length);
        let randomLength = lengths[lengthIndex];

        console.log("random length", randomLength, lengths, lengthIndex);
        let randomLetters = Object.keys(Sutom.words[randomLength]);
        let randomLetter = randomLetters[Math.floor(Math.random()*randomLetters.length)];
        console.log("random letters", randomLetter, randomLetters);

        let randomWords = Sutom.words[randomLength][randomLetter];
        return randomWords[Math.floor(Math.random()*randomWords.length)];
    }
}

class Game {

    attempts;
    first;
    length;
    secret;

    constructor(secret, length) {
        if (typeof length == 'number') {
            this.first = secret;
            this.length = length;
        } else {
            let valid = Sutom.valid(secret);
            if (valid !== true) {
                throw new Error(`word ${secret} does not exist: ${valid}`);
            }
            this.secret = secret;
            this.first = this.secret[0];
            this.length = this.secret.length;
        }

        console.log("new Game", this.first, this.length);

        this.attempts = 0;
    }

    getRemaining() {
        return [];
    }

    next() {
        return [];
    }

    /** Can only be called when a secret is defined.
     * @return true or an array describing the analysis for current word */
    analyse(word) {
        this.attempts++;

        let v = Sutom.valid(word);
        if (v !== true) {
            console.error("word", word, "is not valid:", v);
            return false;
        }

        if (word[0] !== this.secret[0]) {
            console.error(`attempt ${word} must start with the letter than secret: ${this.secret[0]}`);
            return false;
        }

        let result = Sutom.analyse(word, this.secret);

        if (typeof result == "string") {
            console.error(result);
        }

        if (result.ok === true) {
            return true;
        }

        return result.letters;
    }

    getFirst() {
        return this.first;
    }

    getLength() {
        return this.length;
    }
}
