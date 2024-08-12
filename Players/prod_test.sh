#!/bin/bash

for dir in */; do
          echo $dir
          if [ $dir = "dependencies/" ] || [ $dir = "functions/" ] 
          then
          echo "In if condition"
          continue
          fi
          cd $dir
          npm install
          npm run prod-test-coverage > testcoverage.txt
          grep -n 'All files[^|]*\|[^|]*\s+([\d\.]+)' testcoverage.txt > result.txt 
          VALID="$(grep -o 'failing' testcoverage.txt)"
          grep -A 2 -B 2 'All files[^|]*\|[^|]*\s+([\d\.]+)' testcoverage.txt | while read -r line ; do
          echo "$line" 
          done 
          echo $coveragedetails
          echo $VALID
          linepercentage="$(cat result.txt | cut -c48-56)"
          echo $linepercentage
          finallinepercent=$( printf "%.0f" $linepercentage )
          if [ $finallinepercent -lt 10 ]
          then
          echo "test coverage failed for $dir with line percentage of $linepercentage %"
          exit 1
          fi
          if [[ $VALID == "failing" ]]
          then
          echo "test cases failed for $dir"
          exit 1
          fi
          cd ..
          echo "test cases passed for $dir"
        done
