#!/bin/bash
cp -r content/ docs/content/
cd docs/content
find . -type f -name "*.png" | while read fname; do
  cwebp "$fname" -resize 1280 0 -q 75 -o ${fname%.*}-large.webp
  cwebp "$fname" -resize 640 0 -q 75 -o ${fname%.*}-regular.webp
  cwebp "$fname" -resize 480 0 -q 75 -o ${fname%.*}-medium.webp
  cwebp "$fname" -resize 320 0 -q 75 -o ${fname%.*}-small.webp
  rm "$fname"
done