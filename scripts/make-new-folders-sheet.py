from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path('images')
folders = ['井理鸡尾酒图片', '洗护线', 'AOCOSKIN视觉', 'COREX', 'CROCS视觉', 'MOSIIMORII十二年之约新年礼盒', 'OSM视觉', 'TOMFORD视觉']
cell_w, cell_h, cols = 260, 220, 6
font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 14)
rows = []
for folder in folders:
    files = [p for p in (root / folder).iterdir() if p.suffix.lower() in {'.jpg', '.jpeg', '.png'}]
    cells = []
    for path in files:
        with Image.open(path) as source:
            image = source.convert('RGB')
            image.thumbnail((cell_w - 16, cell_h - 42))
            cell = Image.new('RGB', (cell_w, cell_h), '#eeeeeb')
            cell.paste(image, ((cell_w - image.width) // 2, 6))
            ImageDraw.Draw(cell).text((8, cell_h - 28), f'{folder}/{path.name}', font=font, fill='#222')
            cells.append(cell)
    for i in range(0, len(cells), cols):
        row = Image.new('RGB', (cell_w * cols, cell_h), '#eeeeeb')
        for j, cell in enumerate(cells[i:i + cols]):
            row.paste(cell, (j * cell_w, 0))
        rows.append(row)
canvas = Image.new('RGB', (cell_w * cols, cell_h * len(rows)), '#eeeeeb')
for i, row in enumerate(rows):
    canvas.paste(row, (0, i * cell_h))
Path('.preview').mkdir(exist_ok=True)
canvas.save('.preview/new-folders-sheet.jpg', quality=88)
