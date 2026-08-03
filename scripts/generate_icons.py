from PIL import Image, ImageDraw

SIZES = [16, 32, 48, 128]
COLOR = (33, 150, 243, 255)
SCALE = 8

def draw_droplet(size):
    big = size * SCALE
    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = big / 2
    top = big * 0.08
    bottom = big * 0.92
    width_at_bottom = big * 0.36
    circle_r = width_at_bottom / 2
    circle_cy = bottom - circle_r
    draw.ellipse(
        [cx - circle_r, circle_cy - circle_r, cx + circle_r, circle_cy + circle_r],
        fill=COLOR,
    )
    draw.polygon(
        [(cx, top), (cx - circle_r * 0.95, circle_cy), (cx + circle_r * 0.95, circle_cy)],
        fill=COLOR,
    )
    hl_r = circle_r * 0.22
    hl_cx = cx - circle_r * 0.35
    hl_cy = circle_cy - circle_r * 0.25
    draw.ellipse(
        [hl_cx - hl_r, hl_cy - hl_r, hl_cx + hl_r, hl_cy + hl_r],
        fill=(255, 255, 255, 160),
    )
    return img.resize((size, size), Image.LANCZOS)

for s in SIZES:
    draw_droplet(s).save(f'public/icons/icon-{s}.png')
print('icons generated')
