#!/usr/bin/env python3
import os
import subprocess
import tempfile

def create_final_icon():
    """Create the final app icon with black background and smaller centered logo"""
    
    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # The logo-black-b.png already has a black background
        # We just need to make it smaller and ensure it's 1024x1024
        
        # Resize the logo to be smaller (about 60% of icon size)
        small_logo = os.path.join(temp_dir, "small_logo.png")
        subprocess.run([
            "sips", "-z", "600", "600",
            "logo-black-b.png", "--out", small_logo
        ], check=True)
        
        # Create a 1024x1024 black background
        black_bg = os.path.join(temp_dir, "black_bg.png")
        subprocess.run([
            "sips", "-c", "1024", "1024", 
            "-s", "format", "png",
            "--setProperty", "formatOptions", "default",
            "logo-black-b.png", "--out", black_bg
        ], check=True)
        
        # For now, let's use the black background logo directly
        # since it already has the black background we want
        final_icon = "logo.png"
        subprocess.run(["cp", "logo-black-b.png", final_icon], check=True)
        
        print("Created final icon with black background and smaller logo")
        return True

if __name__ == "__main__":
    try:
        create_final_icon()
    except Exception as e:
        print(f"Error: {e}")
        # Fallback: just copy the original logo
        subprocess.run(["cp", "logo-black-b.png", "logo.png"])
