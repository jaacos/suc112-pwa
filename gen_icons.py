from PIL import Image, ImageDraw, ImageFont

BLUE = (11, 61, 145, 255)      # #0B3D91 - placeholder institucional
WHITE = (255, 255, 255, 255)

def make_icon(size, maskable=False, path="icon.png"):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Maskable: fondo solido a sangre completa (zona segura ~80% centro)
        draw.rectangle([0, 0, size, size], fill=BLUE)
        content_scale = 0.6
    else:
        # Icono normal: circulo con margen
        margin = size * 0.04
        draw.ellipse([margin, margin, size - margin, size - margin], fill=BLUE)
        content_scale = 0.72

    # Cruz sanitaria simple
    cross_w = size * content_scale * 0.22
    cross_len = size * content_scale * 0.62
    cx, cy = size / 2, size / 2
    draw.rectangle([cx - cross_w / 2, cy - cross_len / 2, cx + cross_w / 2, cy + cross_len / 2], fill=WHITE)
    draw.rectangle([cx - cross_len / 2, cy - cross_w / 2, cx + cross_len / 2, cy + cross_w / 2], fill=WHITE)

    img.save(path)

make_icon(192, maskable=False, path="public/icons/icon-192.png")
make_icon(512, maskable=False, path="public/icons/icon-512.png")
make_icon(512, maskable=True, path="public/icons/icon-maskable-512.png")
print("iconos generados")
