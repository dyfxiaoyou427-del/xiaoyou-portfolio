"""Create small web covers and a contact sheet from the user's own portfolio."""

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
OUTPUT = IMAGES / "covers"


def contact_sheet(videos=False):
    folder = ROOT / ".preview/video-frames" if videos else IMAGES
    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in {".jpg", ".png", ".webp"})
    cell_w, cell_h, columns = 240, 190, 6
    canvas = Image.new("RGB", (cell_w * columns, ((len(files) + columns - 1) // columns) * cell_h), "#eeeeeb")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 13)
    dimensions = {}
    for index, file in enumerate(files):
        with Image.open(file) as original:
            dimensions[file.name] = original.size
            image = original.convert("RGB")
            image.thumbnail((cell_w - 16, cell_h - 42))
        x, y = (index % columns) * cell_w, (index // columns) * cell_h
        canvas.paste(image, (x + (cell_w - image.width) // 2, y + 5))
        draw.text((x + 8, y + cell_h - 34), file.name, font=font, fill="#222222")
        draw.text((x + 8, y + cell_h - 17), str(dimensions[file.name]), font=font, fill="#555555")
    target = ROOT / ".preview"
    target.mkdir(exist_ok=True)
    canvas.save(target / ("video-sheet.jpg" if videos else "contact-sheet.jpg"), quality=90)
    print(json.dumps(dimensions, ensure_ascii=False))


def cover(source, target, width=1100, crop=None):
    with Image.open(IMAGES / source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        if crop:
            image = image.crop(crop)
        if image.width > width:
            image = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
        image.save(OUTPUT / (target + ".webp"), "WEBP", quality=86, method=6)
        print(f"{target}: {image.width} x {image.height}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet", action="store_true")
    parser.add_argument("--videos", action="store_true")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if args.sheet or args.videos:
        contact_sheet(args.videos)
    else:
        cover("4.png", "roopy", crop=(420, 0, 1740, 1238))
        # CORE X fills a wide desktop hero, so keep a larger source than the
        # compact gallery covers to avoid enlarging a 1100px bitmap on detail.
        cover("115.jpg", "corex", width=2200, crop=(1025, 48, 2200, 1190))
        cover("minicare-brand-combined.png", "minicare-silver", crop=(0, 0, 1305, 730))
        cover("minicare-brand-combined.png", "minicare-products", crop=(210, 1470, 1170, 2200))
        cover("0.1.png", "lab-form")
        cover("14.png", "lab-light")
