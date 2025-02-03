class Test {
    static assertEquals(expected, value, label) {
        SutomTest.nbTests++;
        let jsonExpected = JSON.stringify(expected);
        let jsonValue = JSON.stringify(value);

        if (jsonExpected !== jsonValue) {
            let message = "actual value: " + jsonValue + " differs from expected: " + jsonExpected + (label ? "for test " + label : "")
            console.error(message);
            document.body.insertAdjacentHTML("beforeend", `<div class="error">${message}</div>`);
        }
    }

    static assertTrue(value, label) {
        Test.assertEquals(true, value, label);
    }

    static fail(label) {
        throw new Error("this should not happen: " + label);
    }
}

class SutomTest extends Test {
    static nbTests = 0;

    constructor() {
        super();
        let s = new Sutom();

        let r = Sutom.analyse("actif", "avion");
        Test.assertEquals(r.ok, false, "1");
        Test.assertEquals(r.letters, [true, null, null, false, null], "2");

        r = Sutom.analyse("actif", "actif");
        Test.assertEquals(r.ok, true, "3");
        Test.assertEquals(r.letters, [true, true, true, true, true], "4");

        r = Sutom.analyse("apero", "aeree");
        Test.assertEquals(r.ok, false, 5);
        Test.assertEquals(r.letters, [true, null, false, false, null], 6);

        r = Sutom.analyse("aedcb", "abcde");
        Test.assertEquals(r.ok, false, 7);
        Test.assertEquals(r.letters, [true, false, false, false, false], 8);

        r = Sutom.analyse("a_ecb", "abcde");
        Test.assertEquals(r.ok, false, 9);
        Test.assertEquals(r.letters, [true, null, false, false, false], 10);

        r = Sutom.analyse("a_e_b", "abcde");
        Test.assertEquals(r.ok, false, 11);
        Test.assertEquals(r.letters, [true, null, false, null, false], 12);

        r = Sutom.analyse("abcdé", "abcde");
        Test.assertEquals(r.ok, false, 13);
        Test.assertEquals(r.letters, [true, true, true, true, null], 14);

        r = Sutom.analyse("abbcccc", "aeeebbb");
        Test.assertEquals(r.ok, false, 15);
        Test.assertEquals(r.letters, [true, false, false, null, null, null, null], 16);

        r = Sutom.analyse("acccbbb", "abbeeee");
        Test.assertEquals(r.ok, false, 17);
        Test.assertEquals(r.letters, [true, null, null, null, false, false, null], 17);

        try {
            Sutom.analyse("abcde", "abcdef");
            Test.fail();
        } catch(e) {
            Test.assertEquals("cannot analyse words of different lengths (abcde should contain 6 characters)", e.message, "not the same length");
        }

        r = Sutom.valid(5);
        Test.assertEquals(r, "word '5' is not a string", "invalid type");

        r = Sutom.valid("abcdé");
        Test.assertEquals(r, "invalid letters in abcdé", "invalid letters");

        r = Sutom.valid("a");
        Test.assertEquals(r, "no dictionary for this length: 1", "no dict for length 1");

        let g = new Game("abats");
        r = g.analyse("aboie");
        Test.assertEquals(r, [true, true, null, null, null], "game basic check");
        r = g.analyse("activ");
        Test.assertEquals(r, false, "unknown word");
        r = g.analyse("abats");
        Test.assertEquals(r, true, "game check ok");
        r = g.analyse("bacon");
        Test.assertEquals(r, false, "attempt with another first letter");

        Test.assertEquals("a", g.getFirst(), "game init info");
        Test.assertEquals(5, g.getLength(), "game init info");

        console.log(`all tests ok (${SutomTest.nbTests})`);
    }
}

class SolverTest extends Test {
    constructor() {
        super();

        let top = new TopN(5);
        top.add("hello", 2);
        top.add("world", 1.5);
        top.add("last one", 1.1);
        top.add("first", 2.1);
        Test.assertEquals(["first", "hello", "world", "last one"], top.get());
        top.add("last2", 0.9);
        top.add("last3", -1);
        Test.assertEquals(["first", "hello", "world", "last one", "last2"], top.get());
        top.clear();

        top.add("4th", 7);
        top.add("second", 9);
        top.add("6th", 5);
        top.add("third", 8);
        top.add("5th", 6);
        top.add("first", 10);
        Test.assertEquals(["first", "second", "third", "4th", "5th"], top.get());

        let s = new Solver(new Game("avion"));
        let res = s.solve();
        Test.assertEquals("avion", res.word);
        Test.assertTrue(res.attempts <= 9, "check nb attemps");

        s = new Solver(new Game("plage"));
        res = s.solve();
        Test.assertEquals("plage", res.word);
        Test.assertTrue(res.attempts <= 9, "check nb attemps");

        s = new Solver(new Game("aberrant"));
        res = s.solve();
        Test.assertEquals("aberrant", res.word);
        Test.assertTrue(res.attempts <= 9, "check nb attemps");

        s = new Solver(new Game("bonjour"));
        res = s.solve();
        Test.assertEquals("bonjour", res.word);
        Test.assertTrue(res.attempts <= 9, "check nb attemps");

        s = new Solver(new Game("monde"));
        res = s.solve();
        Test.assertEquals("monde", res.word);
        Test.assertTrue(res.attempts <= 9, "check nb attemps");

        s = new Solver(new Game("transgresse"));
        res = s.solve();
        Test.assertEquals("transgresse", res.word);
        Test.assertTrue(res.attempts <= 9, "check nb attemps");

        s = new Solver(new Game("cafetiere"));
        res = s.solve();
        Test.assertEquals("cafetiere", res.word);
        Test.assertTrue(res.attempts <= 9, "check nb attemps");

        Sutom.words[4] = {};
        Sutom.words[4].a = ["abcd", "aero", "alti", "alto", "atel", "alco"];
        s = new Solver(new Game("alto"));
        let remain = s.attempt("aero"); // true, null, null, true
        Test.assertEquals(["alto", "alco"], remain);

        // delete null letters
        Sutom.words[4].a = ["abcd", "adcb", "accc", "abbb", "aaaa", "abbc", "aocb", "abco", "adoc", "alto"];
        s = new Solver(new Game("alto"));
        remain = s.attempt("aocb"); // true, false, null, null
        Test.assertEquals(["alto"], remain);

        Sutom.words[4].a = "abcd aero alti alto atel alco axyl".split(" ");
        s = new Solver(new Game("alto"));
        remain = s.attempt("atel"); // true, false, null, false
        // remove with t at 1 : atel
        // remove with e : aero
        // remove with l at 3 : axyl
        // remove without t : abcd alco
        Test.assertEquals(["alti", "alto"], remain);

        Sutom.words[4].a = "abcd abbb abbc aaaa acbb accb aecb areo aree aeyy".split(" ");
        s = new Solver(new Game("abbc"));
        remain = s.attempt("aecb"); // true, null, false, false
        // remove words containing e : aecb areo
        // remove words with c at 2 : abcd accb
        // remove words without c : abbb aaaa
        Test.assertEquals(["abbc"], remain);

        Sutom.words[4].a = "aaaa aaab aaac aacc accc aabb".split(" ");
        s = new Solver(new Game("aacc"));
        remain = s.attempt("aaab"); // true, true, null, false
        Test.assertEquals(["aacc"], remain);

        // challenge
        let nbWords = 50;
        let challengeWords = [];
        while(nbWords > 0) {
            nbWords--;
            challengeWords.push(Sutom.getRandomWord());
        }

        console.time("challenge");
        let sc = new SolverChallenge(challengeWords);
        console.timeEnd("challenge");
        console.log("challenge stats", sc.getStats());
    }
}