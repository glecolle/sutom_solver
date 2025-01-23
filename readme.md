# Sutom Solver

## Purpose

Solver for [Motus](https://fr.wikipedia.org/wiki/Motus_(jeu_t%C3%A9l%C3%A9vis%C3%A9)) game.

The goal of the game is to guess a word within the least possible amount of iterations. After each attempt, the letters are colored to give good and misplaced letters. All words have to start with the correct letter and must be spelled correctly.

This software attemps to get the least possible number of attempts for each word by extraction all possible information from the response and choose the best word for each attempt.

## Architecture

This a is browser JS application, not requiring any server.

## How does it work

This all starts from a dictionary containing all existing words within a language.
The two axis for reducing the number of iterations are:

- choose the best candidate word to reduce possibilities
  - priority to words containing letters not tested yet
  - priority to word containing frequent letters according to remaining words
- extract all possible information from the result to reduce the list of possible words
  - remove words according to letter positions
  - remove word not containing required letters
  - remove words containing letters that are not present in the word
  - ...

## Dictionary

The dictionary can be built from aspell command line tool.

```
generated with: aspell -d fr dump master | aspell -l fr expand > words.fr.txt
aspell -d fr dump master | aspell -l fr expand > words.fr.txt
```
To compile the list of words into a JS dictionaray, run:
```
./build_dict.sh
```

