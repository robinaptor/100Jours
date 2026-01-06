import os
from PIL import Image

ASSETS_DIR = 'assets'
MAX_WIDTH = 1920

def optimize_images():
    if not os.path.exists(ASSETS_DIR):
        print(f"Directory {ASSETS_DIR} not found.")
        return

    files = [f for f in os.listdir(ASSETS_DIR) if f.lower().endswith(('.jpg', '.jpeg'))]
    files.sort()
    
    print(f"Found {len(files)} images to optimize.")

    for filename in files:
        filepath = os.path.join(ASSETS_DIR, filename)
        try:
            with Image.open(filepath) as img:
                # Check directly if resizing is needed
                if img.width > MAX_WIDTH:
                    # Calculate new height to maintain aspect ratio
                    ratio = MAX_WIDTH / img.width
                    new_height = int(img.height * ratio)
                    
                    # Resize
                    img_resized = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
                    
                    # Overwrite original
                    img_resized.save(filepath, quality=85, optimize=True)
                    print(f"Resized {filename}: {img.width}x{img.height} -> {MAX_WIDTH}x{new_height}")
                else:
                    print(f"Skipped {filename} (Width {img.width} <= {MAX_WIDTH})")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print("Optimization complete.")

if __name__ == "__main__":
    optimize_images()
