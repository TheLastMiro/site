import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_FILE = ROOT / "data" / "products.json"
SOURCE_DIRECTORY = ROOT / "Photos"
OUTPUT_DIRECTORY = ROOT / "public" / "products"
MAX_SIDE = 1100
WEBP_QUALITY = 86
BACKGROUND_DISTANCE = 86
TRANSPARENT_DISTANCE = 18
OPAQUE_DISTANCE = 72


def remove_light_edge_background(image: Image.Image) -> tuple[Image.Image, bool]:
    rgb = np.asarray(image.convert("RGB"), dtype=np.int16)
    height, width, _ = rgb.shape
    patch = max(5, min(28, round(min(width, height) * 0.045)))
    corners = np.concatenate((
        rgb[:patch, :patch].reshape(-1, 3),
        rgb[:patch, -patch:].reshape(-1, 3),
        rgb[-patch:, :patch].reshape(-1, 3),
        rgb[-patch:, -patch:].reshape(-1, 3),
    ))
    light_neutral = (corners.min(axis=1) >= 165) & (np.ptp(corners, axis=1) <= 58)
    samples = corners[light_neutral]
    if len(samples) < 12:
        return image.convert("RGBA"), False

    background = np.median(samples, axis=0)
    if background.mean() < 200 or np.ptp(background) > 45:
        return image.convert("RGBA"), False

    delta = rgb - background
    distance = np.sqrt(np.sum(delta * delta, axis=2))
    brightness = rgb.mean(axis=2)
    candidate = (distance <= BACKGROUND_DISTANCE) & (brightness >= 150)

    padded = np.full((height + 2, width + 2), 255, dtype=np.uint8)
    padded[1:-1, 1:-1] = candidate.astype(np.uint8) * 255
    cv2.floodFill(padded, None, (0, 0), 128, loDiff=0, upDiff=0, flags=4)
    connected = padded[1:-1, 1:-1] == 128

    alpha = np.full((height, width), 255, dtype=np.uint8)
    feather = np.clip(
        (distance - TRANSPARENT_DISTANCE) / (OPAQUE_DISTANCE - TRANSPARENT_DISTANCE),
        0,
        1,
    )
    alpha[connected] = np.round(feather[connected] * 255).astype(np.uint8)
    changed = np.count_nonzero(alpha < 250) / alpha.size >= 0.01
    if not changed:
        return image.convert("RGBA"), False

    rgba = np.dstack((rgb.astype(np.uint8), alpha))
    return Image.fromarray(rgba, mode="RGBA"), True


def main() -> None:
    products = json.loads(PRODUCTS_FILE.read_text(encoding="utf-8"))
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    converted = 0
    backgrounds_removed = 0

    for product in products:
        for image in product["images"]:
            source = SOURCE_DIRECTORY / image["legacyFile"]
            target = ROOT / "public" / image["path"].lstrip("/")

            with Image.open(source) as opened:
                opened.seek(0)
                normalized = ImageOps.exif_transpose(opened).convert("RGB")
                normalized.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
                processed, changed = remove_light_edge_background(normalized)
                processed.save(target, "WEBP", quality=WEBP_QUALITY, method=3)
                converted += 1
                backgrounds_removed += int(changed)

    print(f"Оптимизировано изображений: {converted}")
    print(f"Светлый фон удалён: {backgrounds_removed}")


if __name__ == "__main__":
    main()
