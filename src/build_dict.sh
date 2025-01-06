#!/bin/bash

rm -f tmp_words*

tail -n +3 words.fr.txt | sed s/[à]/a/g | sed s/[éèê]/e/g | sed s/[ïî]/i/g | sed s/[öô]/o/g | sed s/[ùüû]/u/g | tr "ABCDEFGHIJKLMNOPQRSTUVWXYZ" "abcdefghijklmnopqrstuvwxyz" > tmp_words.txt

wordsFile=words.fr.js

nbTotalWords=0

echo "class Words {" > $wordsFile
echo "    constructor() {" >> $wordsFile
echo "        return {" >> $wordsFile

for length in $(seq 5 15) ; do
    echo "        $length: {" >> $wordsFile
    for letter in "a" "b" "c" "d" "e" "f" "g" "h" "i" "j" "k" "l" "m" "n" "o" "p" "q" "r" "s" "t" "u" "v" "w" "x" "y" "z" ; do
        currentFile=tmp_words_${length}_${letter}.txt
        grep -P '^'${letter}'[a-z]{'$((${length} - 1))'}$' tmp_words.txt | sort | uniq | sed -E 's/(.*)/"\1",/g' >> $currentFile

        nbWords=$(cat $currentFile | wc -l)
        if [ $(cat $currentFile |wc -m) -gt 1 ] ; then
            echo "            $letter:"      >> $wordsFile
            echo "            ["             >> $wordsFile
            cat $wordsFile $currentFile      >> ${wordsFile}2
            mv ${wordsFile}2 ${wordsFile}
            echo "                ],"        >> $wordsFile

            nbTotalWords=$(($nbTotalWords + $nbWords))
        fi

        rm $currentFile
    done
    echo "        }," >> $wordsFile
done

echo "        }" >> $wordsFile
echo "    }" >> $wordsFile
echo "}" >> $wordsFile

# rm -f tmp_words.txt

echo "loaded $nbTotalWords words"