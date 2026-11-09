#!/usr/bin/env python3
"""Build the space book's shelf cover (cover.png, 800x600) and social preview
(og.png, 1200x630) from the SAME real surface maps the book renders
(assets/js/tex/*.js). Each body is ray-cast as a lit sphere, Saturn gets its
real ring map, all on a starfield with soft nebulae.

    python3 books/space/preview.py        (needs Pillow + numpy)
"""
import base64, io, math, os, random, re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, 'assets', 'js', 'tex')


def tex(name):
    src = open(os.path.join(TEX, name + '.js')).read()
    b64 = re.search(r"base64,([^']+)'", src).group(1)
    return np.asarray(Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGBA'), dtype=np.float32)


def sphere(name, R, tilt=0, incl=12, spin=0.0, light=(-0.55, 0.45, 0.7), emissive=False, clouds=None):
    T = tex(name)
    TH, TW = T.shape[:2]
    n = 2 * R
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    dx = (xs + 0.5 - R) / R
    dy = (R - (ys + 0.5)) / R
    d = np.sqrt(dx * dx + dy * dy)
    a = np.clip((1 - d) * R + 0.5, 0, 1)
    nz = np.sqrt(np.clip(1 - dx * dx - dy * dy, 0, 1))
    t, i = math.radians(tilt), math.radians(incl)
    x1 = dx * math.cos(t) + dy * math.sin(t)
    y1 = -dx * math.sin(t) + dy * math.cos(t)
    y2 = y1 * math.cos(i) + nz * math.sin(i)
    z2 = -y1 * math.sin(i) + nz * math.cos(i)
    lat = np.arcsin(np.clip(y2, -1, 1))
    lon = np.arctan2(x1, z2)
    u = (((lon / (2 * math.pi) + 0.5 + spin) % 1) * TW).astype(int) % TW
    v = np.clip(((0.5 - lat / math.pi) * TH).astype(int), 0, TH - 1)
    rgb = T[v, u, :3]
    if clouds is not None:
        C = tex(clouds)
        cu = (((lon / (2 * math.pi) + 0.5 + spin * 1.2) % 1) * C.shape[1]).astype(int) % C.shape[1]
        cv = np.clip(((0.5 - lat / math.pi) * C.shape[0]).astype(int), 0, C.shape[0] - 1)
        ca = C[cv, cu, :1] / 255 * 0.9
        rgb = rgb + (255 - rgb) * ca
    if emissive:
        s = 0.62 + 0.55 * np.sqrt(nz)
    else:
        L = np.array(light) / np.linalg.norm(light)
        dd = dx * L[0] + dy * L[1] + nz * L[2]
        s = 0.12 + 1.05 * np.clip((dd + 0.25) / 1.25, 0, 1)
    rgb = np.clip(rgb * s[..., None], 0, 255)
    out = np.dstack([rgb, a * 255]).astype(np.uint8)
    return Image.fromarray(out)


def saturn(R, tilt=-22, incl=22, light=(-0.55, 0.45, 0.7)):
    planet = sphere('saturn', R, tilt=tilt, incl=incl, light=light)
    ring = tex('saturn_ring')
    RW = ring.shape[1]
    strip = ring[ring.shape[0] // 2]
    S = int(R * 2.4) * 2 // 2
    C = S / 2
    ys, xs = np.mgrid[0:S, 0:S].astype(np.float32)
    dx = (xs + 0.5 - C) / R
    dy = (C - (ys + 0.5)) / R
    t, i = math.radians(tilt), math.radians(incl)
    x1 = dx * math.cos(t) + dy * math.sin(t)
    y1 = -dx * math.sin(t) + dy * math.cos(t)
    z = -y1 * math.cos(i) / math.sin(i)
    z2 = -y1 / math.sin(i)
    rad = np.hypot(x1, z2)
    inside = (rad >= 1.11) & (rad <= 2.33)
    k = np.clip(((rad - 1.11) / (2.33 - 1.11) * RW).astype(int), 0, RW - 1)
    col = strip[k]
    L = np.array(light) / np.linalg.norm(light)
    b = dx * L[0] + dy * L[1] + z * L[2]
    cc = dx * dx + dy * dy + z * z - 1
    shadow = np.where((b < 0) & (b * b - cc > 0), 0.25, 1.0)
    rgba = np.zeros((S, S, 4), np.float32)
    rgba[..., :3] = col[..., :3] * shadow[..., None]
    rgba[..., 3] = np.where(inside, col[..., 3], 0)
    front = rgba.copy(); front[..., 3] *= (z > 0)
    back = rgba.copy(); back[..., 3] *= (z <= 0)
    img = Image.fromarray(np.clip(back, 0, 255).astype(np.uint8))
    off = int(C - R)
    img.alpha_composite(planet, (off, off))
    img.alpha_composite(Image.fromarray(np.clip(front, 0, 255).astype(np.uint8)))
    return img


def sky(W, H, seed=7):
    rnd = random.Random(seed)
    img = Image.new('RGBA', (W, H), (4, 6, 14, 255))
    neb = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(neb)
    for (x, y, r, c) in [(0.18, 0.25, 0.35, (120, 70, 200)), (0.82, 0.2, 0.3, (40, 110, 210)),
                         (0.75, 0.85, 0.38, (200, 70, 130)), (0.25, 0.85, 0.3, (40, 150, 160))]:
        for _ in range(5):
            cx = (x + rnd.uniform(-0.1, 0.1)) * W; cy = (y + rnd.uniform(-0.1, 0.1)) * H
            rr = r * W * rnd.uniform(0.3, 0.6)
            g.ellipse([cx - rr, cy - rr * 0.55, cx + rr, cy + rr * 0.55], fill=c + (34,))
    img.alpha_composite(neb.filter(ImageFilter.GaussianBlur(W / 18)))
    st = ImageDraw.Draw(img)
    for _ in range(int(W * H / 900)):
        x, y = rnd.uniform(0, W), rnd.uniform(0, H)
        r = 0.4 + rnd.random() ** 3 * 1.8
        a = int(90 + rnd.random() * 165)
        st.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, a))
    return img


def glow(img, x, y, r, color, alpha=150):
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(lay).ellipse([x - r, y - r, x + r, y + r], fill=color + (alpha,))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(r / 2.2)))


def orbit(img, cx, cy, a, b, col=(190, 210, 255, 60), w=2):
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(lay).ellipse([cx - a, cy - b, cx + a, cy + b], outline=col, width=w)
    img.alpha_composite(lay)


def scene(W, H, title=None):
    img = sky(W, H)
    s = H / 600
    sx, sy = W * 0.5, H * (0.47 if title else 0.5)
    K = 0.36
    orbits = [130, 200, 290, 390]
    for a in orbits:
        orbit(img, sx, sy, a * s * W / H * 0.75, a * s * K * W / H * 0.75)
    glow(img, sx, sy, 150 * s, (255, 170, 60), 170)
    sun = sphere('sun', int(70 * s), emissive=True)
    img.alpha_composite(sun, (int(sx - 70 * s), int(sy - 70 * s)))

    def put(im, x, y):
        img.alpha_composite(im, (int(x - im.width / 2), int(y - im.height / 2)))

    def lit(x, y):
        return (sx - x, y - sy, 0.6 * math.hypot(sx - x, sy - y) + 1)

    f = W / H * 0.75
    bodies = [  # name, x-offset (orbit units), y, radius, extra
        ('earth_daymap', -130, -0.6, 22, dict(tilt=23, clouds='earth_clouds', spin=0.35)),
        ('mars', 200, 0.5, 16, dict(tilt=25)),
        ('jupiter', -290, 0.3, 46, dict(tilt=3, spin=0.2)),
        ('neptune', 390, -0.45, 24, dict(tilt=28)),
    ]
    for name, a, yy, r, kw in bodies:
        x = sx + a * s * f
        y = sy + yy * 120 * s
        put(sphere(name, int(r * s), light=lit(x, y), **kw), x, y)
    sxp, syp = sx + 290 * s * f, sy - 0.75 * 120 * s
    put(saturn(int(34 * s), light=lit(sxp, syp)), sxp, syp)
    mx, my = sx - 130 * s * f + 36 * s, sy - 0.6 * 120 * s - 14 * s
    put(sphere('moon', int(6 * s), light=lit(mx, my)), mx, my)

    if title:
        d = ImageDraw.Draw(img)
        font = None
        for fp in ['/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf',
                   '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
                   '/Library/Fonts/Arial Bold.ttf']:
            if os.path.exists(fp):
                font = ImageFont.truetype(fp, int(H * 0.1)); break
        font = font or ImageFont.load_default()
        tw = d.textlength(title, font=font)
        tx, ty = (W - tw) / 2, H * 0.83
        d.text((tx + 3, ty + 4), title, font=font, fill=(0, 0, 0, 180))
        d.text((tx, ty), title, font=font, fill=(255, 211, 110, 255))
    return img.convert('RGB')


if __name__ == '__main__':
    scene(800, 600).save(os.path.join(HERE, 'cover.png'), optimize=True)
    scene(1200, 630, 'Our Solar System').save(os.path.join(HERE, 'og.png'), optimize=True)
    print('wrote cover.png, og.png')
