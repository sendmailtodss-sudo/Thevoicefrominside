"""Rebuild exact journey glyph targets with installed OFL Noto fonts.

Preparation only: Pillow/fontTools are not browser or npm dependencies. The
catalog is read from the existing journey, so this tool cannot edit its copy.
Integer mask samples keep the runtime small and independent of system fonts.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/journey/spatial-glyphs.json'
source = (ROOT / 'public/assets/journey/journey.js').read_text()
catalog = json.loads(re.search(r'const EXPRESSION_TEXT=(\{[^;]+\});', source).group(1))
FONT_PATHS = {
    'latin': Path('/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf'),
    'cjk': Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),
}


def lines_for(text, cjk):
    """A layout break is not a change to the exact semantic string."""
    if len(text) <= (12 if cjk else 22):
        return [text]
    if cjk:
        # Do not leave punctuation at the beginning of a line.
        pivot = len(text) // 2
        if text[pivot] in '，。！？；：':
            pivot += 1
        return [text[:pivot], text[pivot:]]
    spaces = [i for i, char in enumerate(text) if char == ' ']
    pivot = min(spaces, key=lambda i: abs(i - len(text) / 2))
    return [text[:pivot], text[pivot + 1:]]


result = {'revision': 'journey-spatial-glyphs-1', 'seed': 260146,
          'license': 'SIL Open Font License 1.1', 'fonts': {}, 'locales': {}}
for key, strings in catalog.items():
    cjk = key == 'zh'
    locale = 'zh-Hans' if cjk else key
    path, face = FONT_PATHS['cjk' if cjk else 'latin'], 7 if cjk else 0
    font = ImageFont.truetype(str(path), 96, index=face)
    tt = TTFont(str(path), fontNumber=face) if cjk else TTFont(str(path))
    cmap = tt.getBestCmap()
    missing = sorted({char for text in strings for char in text if ord(char) not in cmap})
    assert not missing, (locale, missing)
    result['fonts'][locale] = {
        'family': tt['name'].getDebugName(1), 'version': tt['name'].getDebugName(5),
        'collectionFace': face, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'missingCodepoints': missing,
    }
    phrases = []
    for index, text in enumerate(strings):
        lines = lines_for(text, cjk)
        boxes = [font.getbbox(line) for line in lines]
        widths = [box[2] - box[0] for box in boxes]
        width = max(widths) + 20
        height = 116 * len(lines)
        mask = Image.new('L', (width, height))
        draw = ImageDraw.Draw(mask)
        for row, (line, box, line_width) in enumerate(zip(lines, boxes, widths)):
            draw.text(((width-line_width)/2-box[0], 8+row*116-box[1]), line, font=font, fill=255)
        samples = []
        for y in range(1, height-1, 2):
            for x in range(1, width-1, 2):
                alpha = mask.getpixel((x, y))
                if alpha >= 105:
                    samples.extend([x, y, alpha])
        phrases.append({
            'id': f'expression-{index+1}', 'text': text, 'lines': lines,
            'width': width, 'height': height, 'step': 2,
            'particleCount': len(samples)//3, 'samples': samples,
            'stringSHA256': hashlib.sha256(text.encode()).hexdigest(),
            'maskSHA256': hashlib.sha256(mask.tobytes()).hexdigest(),
        })
    result['locales'][locale] = phrases
OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
print(json.dumps({'bytes': OUT.stat().st_size, 'particles': {
    locale: [phrase['particleCount'] for phrase in phrases]
    for locale, phrases in result['locales'].items()
}}, indent=2))
