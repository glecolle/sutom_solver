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

    /** count of each letters when known */
    count;

    constructor(game) {
        this.game = game;

        this.toTest = [];
        this.letters = {};
        this.count = {};
        this.possibleLetters = {};
        this.impossibleLetters = [];

        for (let l="a" ; l <= "z" ; l = String.fromCharCode(l.charCodeAt(0)+1)) {
            this.toTest.push(l);
            this.possibleLetters[l] = {count: 0, more: true, notAt: []};
        }

        this.first = game.getFirst();
        this.length = game.getLength();

        this.wordMask = [this.first];
        for (let i=1; i < this.length ; i++) {
            this.wordMask.push("*");
        }

        this.remainingWords = Sutom.getWords(this.first, this.length);
    }

    /** Iterates to find the word  */
    solve(details) {
        let iter;
        for (iter = 1; iter < 50 ; iter++) {
            let detail = new SolutionDetail();
            detail.attempt = iter;
            detail.nbRemaining = this.remainingWords.length;

            let word = this.next();
            detail.word = word;

            let res = this.attempt(word, iter, true);
            detail.result = res;

            if (details) {
                details.push(detail);
            }

            if (typeof res == "boolean") {
                return res;
            } else if (res && res.word) {
                return res;
            }
        }

        return {word: null, attempts: iter};
    }

    attempt(word, iter, returnResult) {
        let res = this.game.analyse(word);

        console.log("attempt", iter, "with word", word, "returned", res);

        if (res === true) {
            console.log("found word:", word, "in", iter, "attempts");
            return {word, attempts: iter};
        }

        if (res === false) {
            console.log("could not find word, not an existing one");
            return false;
        }

        let remaining = this.reduceRemainingWords(word, res);
        if (returnResult) {
            return res;
        } else {
            return remaining;
        }
    }

    reduceRemainingWords(w, res) {
        this.remove(w, "equals");


        for (let i = 1; i < this.length ; i++) {
            //let nbOcc = w.split(w[i]).length - 1;
            let nbOcc = 0;
            for (let r=0 ; r < w.length ; r++) {
                if (w[r] === w[i]) {
                    nbOcc++;
                }
            }

            if (res[i] === true) {
                if (this.wordMask[i] === "*") {
                    console.log("good letter: ", w[i], "at", i);
                    this.wordMask[i] = w[i];
                    this.remove(w[i], "notAt", i);
                }
            } else if (res[i] === false) {
                //TODO si plusieurs instances de cette lettre et null, marquer more = false et ne pas supprimer
                if (this.possibleLetters[w[i]].count < nbOcc) {
                    console.log("new misplaced letter", w[i], "at", i);
                    this.possibleLetters[w[i]].count=1;
                    this.possibleLetters[w[i]].notAt.push(i);
                    this.remove(w[i], "at", i);
                } else if (this.possibleLetters[w[i]].notAt.indexOf(i) === -1) {
                    console.log("new position for a misplaced letter", w[i], "at", i);
                    this.possibleLetters[w[i]].count=1;
                    this.possibleLetters[w[i]].notAt.push(i);
                    this.remove(w[i], "at", i);
                }
                this.remove(w[i], "notIn");
            } else if (res[i] === null) {
                if (nbOcc === 1) {
                    console.log("letter is not present in secret", w[i]);
                    this.count[w[i]] = 0;
                    this.remove(w[i], "in");
                } else if (typeof this.count[w[i]] === "undefined") {
                    let nb = 0;
                    for(let rank=0 ; rank < w.length ; rank++) {
                        if (w[i] === w[rank] && typeof res[rank] === "boolean") {
                            nb++;
                        }
                    }
                    console.log("letter", w[i], "is present exactly", nb, "times");
                    this.count[w[i]] = nb;
                    this.remove(w[i], "notExactly", nb);
                }
            }
        }

        // TODO éliminer les mots qui contient plus d'occurrences de certaines lettres (quand on connait le nombre exact d'une lettre: possibleLetters[letter].more == false)
        return this.remainingWords;
    }

    getRemaining() {
        return this.remainingWords;
    }

    /** Find the next word to try according to current state and remaining words, get the word having the most untested letters and most frequent letters */
    next(count) {
        if (typeof count == "undefined") {
            count = 1;
        }

        let top = new TopN(count);

        let freq = this.getLetterFrequency();

        this.remainingWords.forEach((word) => {
            let score = 0;
            score += this.evaluateFreq(word, freq); // allow to give priority to words having more frequent letters among the remaining words
            score += this.evaluateNotTested(word); // allow to scan more letters and discover new ones/

            top.add(word, score);
        });

        let topWords = top.getWithScores();
        console.log("next words:", topWords.map(t => { return `${t.value} (${t.score})` }).join(", "));

        if (count == 1 && topWords.length > 0) {
            return topWords[0].value;
        } else {
            return topWords.map(i => { return i.value; });
        }
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

    /**
     * @param letter
     * @param operator at, notAt, notIn, equals, notExactly
     * @param index 0 index based
     */
    remove(letter, operator, index) {
        let logCount=5;
        this.remainingWords.forEach((word, i) => {

            if (operator === "at") {
                if (word[index] === letter) {
                    this.remainingWords[i] = null;
                    logCount >= 0 && console.log("   remove", word);
                    logCount--;
                }
            } else if (operator === "notAt") {
                if (word[index] !== letter) {
                    this.remainingWords[i] = null;
                    logCount >= 0 && console.log("   remove", word);
                    logCount--;
                }
            } else if (operator === "notIn") {
                if (word.indexOf(letter) == -1) {
                    this.remainingWords[i] = null;
                    logCount >= 0 && console.log("   remove", word);
                    logCount--;
                }
            } else if (operator === "in") {
                if (word.indexOf(letter) !== -1) {
                    this.remainingWords[i] = null;
                    logCount >= 0 && console.log("   remove", word);
                    logCount--;
                }
            } else if (operator === "equals") {
                if (word === letter) {
                    this.remainingWords[i] = null;
                    logCount >= 0 && console.log("   remove", word);
                    logCount--;
                }
            } else if (operator === "notExactly") {
                let count = 0;
                for (let r=0 ; r < word.length ; r++) {
                    if (word[r] === letter) {
                        count++;
                    }
                }
                if (count !== index) {
                    this.remainingWords[i] = null;
                    logCount >= 0 && console.log("   remove", word);
                    logCount--;
                }
            }
        });

        this.remainingWords = this.remainingWords.filter((w) => { return w !== null});
        console.log("removed all words with", letter, operator, index, ",", this.remainingWords.length, "remaining words", this.remainingWords);
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

class SolutionDetail {
    attempt;
    word;
    result;
    nbRemaining;
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

