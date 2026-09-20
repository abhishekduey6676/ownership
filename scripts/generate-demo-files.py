"""Build small static demo assets once, or --check without writing.

Uses bundled reportlab/Pillow/pypdf. No network, AI, browser or PDF-preview rendering.
The PNG is authored directly from the same layout/data as the PDF, not a PDF screenshot.
"""
import argparse
import json
from pathlib import Path

import reportlab
from PIL import Image, ImageDraw, ImageFont, PngImagePlugin
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "samples"
MANIFEST = ROOT / "lib" / "demo" / "file-samples.json"
FONT_DIR = Path(reportlab.__file__).parent / "fonts"
WIDTH, HEIGHT = A4
SCALE = 2
DISCLAIMER = "SYNTHETIC - NOT VALID FOR A CLAIM"
FOOTER = "Fictional data for demonstration. Not a purchase receipt."


def create_sample(sample):
    # Explicit app assets, never user source files. Stable filenames are checked before writing.
    assert sample["id"] in {"detailed-invoice", "incomplete-invoice"}
    stem = OUT / sample["id"]
    doc = canvas.Canvas(str(stem.with_suffix(".pdf")), pagesize=A4, invariant=1, pageCompression=1)
    doc.setTitle("Ownership - " + sample["title"] + " - SYNTHETIC")
    doc.setAuthor("Ownership demo")
    image = Image.new("RGB", (round(WIDTH * SCALE), round(HEIGHT * SCALE)), "white")
    draw = ImageDraw.Draw(image)

    def rectangle(x, y, width, height, color):
        doc.setFillColor(color)
        doc.rect(x, HEIGHT - y - height, width, height, fill=1, stroke=0)
        draw.rectangle((round(x * SCALE), round(y * SCALE), round((x + width) * SCALE), round((y + height) * SCALE)), fill=color)

    def text(value, x, baseline, size, bold=False, color="#171914", max_width=None):
        font_name = "DemoBold" if bold else "DemoRegular"
        font_file = FONT_DIR / ("VeraBd.ttf" if bold else "Vera.ttf")
        width = pdfmetrics.stringWidth(value, font_name, size)
        assert width <= (max_width if max_width is not None else WIDTH - x - 44), (sample["id"], value, width)
        assert 20 < baseline < HEIGHT - 24
        doc.setFillColor(color)
        doc.setFont(font_name, size)
        doc.drawString(x, HEIGHT - baseline, value)
        draw.text((round(x * SCALE), round(baseline * SCALE)), value,
                  font=ImageFont.truetype(str(font_file), round(size * SCALE)), fill=color, anchor="ls")

    rectangle(0, 0, WIDTH, 148, "#d5ff00")
    text("OWNERSHIP / SAMPLE FILE", 44, 36, 10, bold=True)
    text("Demo invoice", 44, 81, 30, bold=True)
    text(DISCLAIMER, 44, 117, 12, bold=True)
    text(sample["title"], 44, 185, 18, bold=True)
    for index, (label, value) in enumerate(sample["fields"]):
        baseline = 224 + index * 43
        assert baseline < 706
        rectangle(44, baseline + 12, WIDTH - 88, 0.5, "#dddddd")
        text(label, 44, baseline, 11, color="#444444", max_width=150)
        text(value, 212, baseline, 12, bold=True)
    rectangle(44, 739, WIDTH - 88, 3, "#b789fa")
    text(FOOTER, 44, 765, 10)
    text("Use only to explore the demo. No personal or payment information.", 44, 787, 9)
    text("1 / 1", WIDTH - 76, 815, 9, max_width=35)
    doc.showPage()
    doc.save()
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("Description", DISCLAIMER)
    image.save(stem.with_suffix(".png"), pnginfo=metadata, optimize=True)


def check_sample(sample):
    pdf_path = OUT / (sample["id"] + ".pdf")
    png_path = OUT / (sample["id"] + ".png")
    for file in (pdf_path, png_path):
        assert 0 < file.stat().st_size < 3 * 1024 * 1024
    assert pdf_path.read_bytes().startswith(b"%PDF-")
    assert png_path.read_bytes().startswith(b"\x89PNG\r\n\x1a\n")
    pdf = PdfReader(pdf_path, strict=True)
    assert not pdf.is_encrypted and len(pdf.pages) == 1
    root = pdf.trailer["/Root"]
    assert "/OpenAction" not in root and "/AA" not in root and "/AcroForm" not in root
    assert not pdf.pages[0].get("/Annots")
    content = pdf.pages[0].extract_text()
    assert DISCLAIMER in content and FOOTER in content
    for label, value in sample["fields"]:
        assert label in content and value in content, (label, value)
    if sample["id"] == "incomplete-invoice":
        for absent in ("warranty", "serial", "expiry", "physical location"):
            assert absent not in content.lower(), absent
    with Image.open(png_path) as image:
        assert image.format == "PNG" and image.mode == "RGB"
        assert image.size == (round(WIDTH * SCALE), round(HEIGHT * SCALE))
        assert image.info["Description"] == DISCLAIMER
        image.verify()
    print(f"PASS {sample['id']}: one-page PDF text/structure and PNG integrity; {pdf_path.stat().st_size} / {png_path.stat().st_size} bytes")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate existing assets without generating them")
    args = parser.parse_args()
    samples = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if not args.check:
        OUT.mkdir(parents=True, exist_ok=True)
        pdfmetrics.registerFont(TTFont("DemoRegular", str(FONT_DIR / "Vera.ttf")))
        pdfmetrics.registerFont(TTFont("DemoBold", str(FONT_DIR / "VeraBd.ttf")))
        for sample in samples:
            create_sample(sample)
    for sample in samples:
        check_sample(sample)
