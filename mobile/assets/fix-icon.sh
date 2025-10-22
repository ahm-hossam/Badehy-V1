#!/bin/bash
cd /Users/ahmed.hossam/Documents/Badehy-V1/mobile/assets

# Create a black background (1024x1024)
sips -c 1024 1024 -s format png --setProperty formatOptions default logo-original.png --out black-bg.png

# Make the logo much smaller (about 40% of icon size)
sips -z 400 400 logo-original.png --out logo-tiny.png

# Create the final icon by compositing
# First, create a black square
sips -c 1024 1024 -s format png --setProperty formatOptions default logo-original.png --out final-icon.png

echo "Created icon components"
