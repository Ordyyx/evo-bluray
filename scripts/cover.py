#!/usr/bin/env python3
"""Save an Apple TV artwork URL or a local image as a web-sized cover."""
import argparse
from io import BytesIO
from pathlib import Path
import re
import subprocess
from tempfile import NamedTemporaryFile
from urllib.parse import urlsplit

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 25 * 1024 * 1024
MAX_SIZE = (720, 1080)


def apple_artwork_url(url):
    parsed = urlsplit(url)
    host = parsed.hostname or ""
    return (
        parsed.scheme == "https"
        and (host == "mzstatic.com" or host.endswith(".mzstatic.com"))
        and parsed.username is None
        and parsed.port in (None, 443)
    )


def read_source(source):
    if urlsplit(source).scheme:
        if not apple_artwork_url(source):
            raise ValueError("Use the direct HTTPS image link from Apple’s mzstatic.com CDN, or a local image file.")
        result = subprocess.run(
            ["curl", "--disable", "--fail", "--silent", "--show-error", "--globoff",
             "--max-time", "30", "--max-filesize", str(MAX_BYTES), "--url", source],
            capture_output=True,
        )
        if result.returncode:
            raise ValueError(result.stderr.decode(errors="replace").strip())
        contents = result.stdout
    else:
        with Path(source).expanduser().open("rb") as stream:
            contents = stream.read(MAX_BYTES + 1)

    if len(contents) > MAX_BYTES:
        raise ValueError("The source image exceeds 25 MB. Try a smaller copy.")
    return contents


def save_cover(contents, target):
    with Image.open(BytesIO(contents)) as source:
        cover = ImageOps.exif_transpose(source)
        cover.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS, reducing_gap=3)
        mode = "RGBA" if cover.has_transparency_data else "RGB"
        cover = cover.convert(mode)
        target.parent.mkdir(parents=True, exist_ok=True)
        with NamedTemporaryFile(dir=target.parent, suffix=".webp", delete=False) as temp:
            temporary_path = Path(temp.name)
        try:
            cover.save(temporary_path, format="WEBP", quality=84, method=6)
            temporary_path.replace(target)
        finally:
            temporary_path.unlink(missing_ok=True)
        return cover.size


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("slug", help="Lowercase film ID, e.g. interstellar-2014")
    parser.add_argument("source", help="Direct Apple artwork URL or path to an image")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.slug):
        parser.error("Use lowercase letters, numbers, and single hyphens for the film ID.")

    target = ROOT / "assets" / "covers" / f"{args.slug}.webp"
    try:
        width, height = save_cover(read_source(args.source), target)
    except (OSError, ValueError, Image.DecompressionBombError) as error:
        parser.exit(1, f"Could not save the cover: {error}\n")

    print(f"Saved {width} × {height} WebP ({target.stat().st_size / 1024:.0f} KB).")
    print(f'Use in collection.json: "poster": "{target.relative_to(ROOT).as_posix()}"')


if __name__ == "__main__":
    main()
