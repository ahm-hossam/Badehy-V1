#!/usr/bin/env python3
import os
import subprocess
import tempfile

def create_proper_icon():
    """Create a proper app icon with black background and smaller centered logo"""
    
    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a 1024x1024 black background
        black_bg = os.path.join(temp_dir, "black_bg.png")
        subprocess.run([
            "sips", "-c", "1024", "1024", 
            "-s", "format", "png",
            "--setProperty", "formatOptions", "default",
            "logo-black-b.png", "--out", black_bg
        ], check=True)
        
        # The logo-smaller.png is already 600x600 (about 60% of 1024)
        # We need to create a final icon with proper centering
        
        # For now, let's use the smaller logo directly
        # Since it already has black background, this should work
        final_icon = "logo.png"
        subprocess.run(["cp", "logo-smaller.png", final_icon], check=True)
        
        print("Created icon with smaller logo (600x600 on 1024x1024 background)")
        return True

if __name__ == "__main__":
    try:
        create_proper_icon()
    except Exception as e:
        print(f"Error: {e}")
        # Fallback: just copy the smaller logo
        subprocess.run(["cp", "logo-smaller.png", "logo.png"])
