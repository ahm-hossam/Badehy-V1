const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function createIcon() {
    try {
        // Create a 1024x1024 canvas with black background
        const canvas = createCanvas(1024, 1024);
        const ctx = canvas.getContext('2d');
        
        // Fill with black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 1024, 1024);
        
        // Load and resize the logo
        const logo = await loadImage('logo-square.png');
        const logoSize = 1024 * 0.6; // 60% of icon size
        const x = (1024 - logoSize) / 2;
        const y = (1024 - logoSize) / 2;
        
        // Draw the logo centered
        ctx.drawImage(logo, x, y, logoSize, logoSize);
        
        // Save the result
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync('logo.png', buffer);
        
        console.log('Created new logo with black background and smaller size');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createIcon();
