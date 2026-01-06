import os
import shutil
import glob

SOURCE_DIR = 'Images'
DEST_DIR = 'assets'
TARGET_COUNT = 96

def process_images():
    if not os.path.exists(SOURCE_DIR):
        print(f"Directory {SOURCE_DIR} not found.")
        return

    # Gather all jpg/jpeg files
    files = []
    for ext in ['*.jpg', '*.JPG', '*.jpeg', '*.JPEG']:
        files.extend(glob.glob(os.path.join(SOURCE_DIR, ext)))
    
    files.sort()
    
    if not files:
        print("No images found in source directory.")
        return

    print(f"Found {len(files)} images in {SOURCE_DIR}.")
    
    # We will process up to TARGET_COUNT images
    count = min(len(files), TARGET_COUNT)
    print(f"Processing first {count} images...")

    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)

    # Clean destination first? 
    # The user placeholders are there. We will overwrite them.
    # But files might have different extensions, so img_0.jpg might conflict if we copy img_0.png (but here we only have jpg/jpeg)
    # Since script.js expects .jpg, we should rename to .jpg

    for i in range(count):
        src_path = files[i]
        dst_name = f"img_{i}.jpg"
        dst_path = os.path.join(DEST_DIR, dst_name)
        
        # Copy file
        shutil.copy2(src_path, dst_path)
        print(f"Copied {src_path} -> {dst_path}")

    print("Done processing images.")

if __name__ == "__main__":
    process_images()
