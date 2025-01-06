class Solver {

    static untestedLetterScore = 1;

    game;
    length;


    /** array or chars representing known letters */
    wordMask;

    /** array of letters to test */
    toTest;

    /** object {char: {count: int, more: bool, notAt: [indexes]}}, only describe misplaced letters */
    possibleLetters;

    /** array of letters that are marked as not found */
    impossibleLetters;

    /** array of strings with words still available, should be reduced after each attempt */
    remainingWords;

    constructor(game) {
        this.game = game;

        this.toTest = [];
        this.letters = {};
        this.possibleLetters = {};
        this.impossibleLetters = [];

        for (let l="a" ; l <= "z" ; l = String.fromCharCode(l.charCodeAt(0)+1)) {
            this.toTest.push(l);
            this.possibleLetters[l] = {count: 0, more: true, notAt: []};
        }

        let info = game.getInfo();
        let first = info.first;
        this.length = info.length;

        this.wordMask = [first];
        for (let i=1; i < this.length ; i++) {
            this.wordMask.push("*");
        }

        this.remainingWords = Sutom.getWords(first, this.length);
    }

    /** Iterates to find the word  */
    solve() {
        let iter;
        for (iter = 1; iter < 50 ; iter++) {
            let w = this.next(this.remainingWords);

            // TODO tester le mot candidat avec game
            let res = this.game.test(w);

            if (res === true) {
                console.log("found word:", w, "in", iter, "attempts");
                return {word: w, attempts: iter};
            }

            if (res === false) {
                console.log("could not find word, not an existing one");
                return false;
            }

            delete this.remainingWords[this.remainingWords.indexOf(w)];

            console.log("attempt", iter, "with word", w, "returned", res);

            for(let i = 1; i < this.length ; i++) {
                let nbOcc = w.substring(1).split(w[i]).length - 1;

                if (res[i] === true) {
                    // good letter
                    if (this.wordMask[i] === "*") {
                        this.wordMask[i] = w[i];
                        this.remove(w[i], "notAt", i);
                    }
                } else if (res[i] === false) {
                    // misplaced letter
                    //TODO si plusieurs instances de cette lettre et null, marquer more = false et ne pas supprimer
                    if (this.possibleLetters[w[i]].count < nbOcc) {
                        // new misplaced letter
                        this.possibleLetters[w[i]].count=1;
                        this.possibleLetters[w[i]].notAt.push(i);
                        this.remove(w[i], "at", i);
                    } else if (this.possibleLetters[w[i]].notAt.indexOf(i) === -1) {
                        // new position for a misplaced letter
                        this.possibleLetters[w[i]].count=1;
                        this.possibleLetters[w[i]].notAt.push(i);
                        this.remove(w[i], "at", i);
                    }
                } else if (res[i] === null) {
                    // letter not present in secret
                    if (nbOcc > 1) {
                        // do nothing for the moment, might be improved
                        //console.log("do nothing when one of several occurences is null, nbOcc=", nbOcc, "for", w[i]);
                        this.remove(w[i], "at", i);
                    } else if (this.impossibleLetters.indexOf(w[i]) === -1) {
                        this.impossibleLetters.push(w[i]);
                        this.remove(w[i], "after", 1);
                    }
                }
            }

            // TODO éliminer les mots qui contient plus d'occurrences de certaines lettres (quand on connait le nombre exact d'une lettre: possibleLetters[letter].more == false)
        }

        return {word: null, attempts: iter};
    }

    /** Find the next word to try according to current state and remaining words, get the word having the most untested letters and most frequent letters */
    next() {
        let top = new TopN(5);

        let freq = this.getLetterFrequency();

        this.remainingWords.forEach((word) => {
            let score = 0;
            score += this.evaluateFreq(word, freq); // allow to give priority to words having more frequent letters among the remaining words
            score += this.evaluateNotTested(word); // allow to scan more letters and discover new ones/

            top.add(word, score);
        });

        let topWords = top.getWithScores();
        console.log("next words:", topWords.map(t => { return `${t.value} (${t.score})` }).join(", "));

        return topWords[0].value;
    }

    /** @return list of letters from remaining words by descending frequency {letter: frequency_among_all_letters} */
    getLetterFrequency() {
        let freq = {};
        for (let l="a" ; l <= "z" ; l = String.fromCharCode(l.charCodeAt(0)+1)) {
            freq[l] = 0;
        }

        let max = 0;

        this.remainingWords.forEach((word) => {
            for(let i=1 ; i < this.length ; i++) {
                freq[word[i]]++;

                max = Math.max(freq[word[i]], max);
            }
        });

        Object.keys(freq).forEach((letter) => {
            freq[letter] = freq[letter] / max;
        });

        //console.log("freq", freq, max);
        return freq;
    }

    evaluateFreq(word, freq) {
        let score = 0;
        for (let i=1 ; i < word.length ; i++) {
            score += freq[word[i]];
        }

        return score;
    }

    evaluateNotTested(word) {
        let score = 0;
        for (let i=1 ; i < word.length ; i++) {
            if (this.toTest.indexOf(word[i]) !== -1) {
                if (word.indexOf(word[i]) >= i) { // do not count multiple instances of letters
                    score += Solver.untestedLetterScore;
                }
            }
        }
        return score;
    }

    remove(letter, operator, index) {
        this.remainingWords.forEach((word, i) => {
            if (operator === "at") {
                if (word[index] === letter) {
                    this.remainingWords[i] = null;
                }
            } else if (operator === "notAt") {
                if (word[index] !== letter) {
                    this.remainingWords[i] = null;
                }
            } else if (operator === "after") {
                if (word.indexOf(letter, index) > index) {
                    this.remainingWords[i] = null;
                }
            }
        });

        this.remainingWords = this.remainingWords.filter((w) => { return w !== null});
        console.log("remove all words with", letter, operator, index, ",", this.remainingWords.length, "remaining words", this.remainingWords);
    }
}

class TopN {
    items;
    length;

    constructor(length) {
        this.length = length;
        this.clear();
    }

    add(value, score) {
        this.items.push({value, score});

        this.items.sort((a, b) => {
            return a.score < b.score;
        });

        while (this.items.length > this.length) {
            this.items.pop();
        }
    }

    get() {
        return this.items.map((item) => { return item.value; });
    }

    getWithScores() {
        return this.items;
    }

    clear() {
        this.items = [];
    }
}

class SolverChallenge {
    stats;

    constructor(words) {
        this.stats = {top: new TopN(20)};

        words.forEach(w => {
            let s = new Solver(new Game(w));
            let res = s.solve();

            this.add(res.word, res.attempts, res.word.length);
            this.add(res.word, res.attempts, "all");

            this.stats.top.add(res.word, res.attempts);
        });
    }

    add(word, nbAttempts, key) {
        if (!this.stats[key]) {
            this.stats[key] = {nbWords: 0, nbAttempts: 0, mean: 0};
        }

        this.stats[key].nbWords++;
        this.stats[key].nbAttempts += nbAttempts;
        this.stats[key].mean = Math.round(this.stats[key].nbAttempts / this.stats[key].nbWords *1000) / 1000;
    }

    getStats() {
        return this.stats;
    }
}

