import os
from PIL import Image, ImageDraw, ImageFont
import colorsys

ASSETS_DIR = 'assets'
TOTAL_IMAGES = 96
WIDTH = 1920
HEIGHT = 1080

if not os.path.exists(ASSETS_DIR):
    os.makedirs(ASSETS_DIR)

print(f"Generating {TOTAL_IMAGES} images in {ASSETS_DIR}...")

for i in range(TOTAL_IMAGES):
    # Background color shifts through hue
    hue = i / TOTAL_IMAGES
    rgb = colorsys.hsv_to_rgb(hue, 0.8, 0.8)
    color = (int(rgb[0]*255), int(rgb[1]*255), int(rgb[2]*255))
    
    img = Image.new('RGB', (WIDTH, HEIGHT), color)
    d = ImageDraw.Draw(img)
    
    # Draw number in center
    text = f"{i}"
    
    # Try to load a font, fallback to default
    try:
        # Mac default font path
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 300)
    except:
        try:
             font = ImageFont.truetype("Arial.ttf", 300)
        except:
             font = ImageFont.load_default()

    # Calculate text brightness
    text_color = (255, 255, 255)
    
    # Draw text
    # textbbox was added in Pillow 8.0.0, older versions use textsize
    try:
        bbox = d.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
    except AttributeError:
        text_w, text_h = d.textsize(text, font=font)
        
    d.text(((WIDTH - text_w) / 2, (HEIGHT - text_h) / 2), text, font=font, fill=text_color)
    
    filename = f"img_{i}.jpg"
    img.save(os.path.join(ASSETS_DIR, filename), quality=80)

print("Done.")
