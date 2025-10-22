#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw

# Create a 1024x1024 black background
size = 1024
background = Image.new('RGB', (size, size), 'black')

# Load the logo
logo_path = 'logo-square.png'
if os.path.exists(logo_path):
    logo = Image.open(logo_path)
    
    # Resize logo to be smaller (about 60% of the icon size)
    logo_size = int(size * 0.6)
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Center the logo on the black background
    x = (size - logo_size) // 2
    y = (size - logo_size) // 2
    
    # Paste the logo onto the black background
    background.paste(logo, (x, y), logo if logo.mode == 'RGBA' else None)
    
    # Save the result
    background.save('logo.png', 'PNG')
    print("Created new logo with black background and smaller size")
else:
    print("Logo file not found")
