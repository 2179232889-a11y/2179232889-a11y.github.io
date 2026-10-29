from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont


VIDEOS = [
    ("01", Path(r"E:\桌\Bb08-22-008-0002.mp4"), 72.446),
    ("02", Path(r"E:\桌\last超能.mp4"), 30.0),
    ("03", Path(r"E:\桌\4月22日(5).MP4"), 59.967),
    ("04", Path(r"E:\桌\Bb12-22-008-0007.mp4"), 61.44),
]

output_dir = Path("tmp/video-frames")
output_dir.mkdir(parents=True, exist_ok=True)

cell_width, cell_height = 350, 225
sheet = Image.new("RGB", (cell_width * 5, cell_height * len(VIDEOS)), "#d7d2c6")
draw = ImageDraw.Draw(sheet)
font_path = Path(r"C:\Windows\Fonts\arial.ttf")
font = ImageFont.truetype(str(font_path), 16) if font_path.exists() else ImageFont.load_default()

for row, (label, video, duration) in enumerate(VIDEOS):
    for column, fraction in enumerate((0.12, 0.3, 0.5, 0.7, 0.88)):
        timestamp = duration * fraction
        frame = output_dir / f"{label}-{column}.png"
        subprocess.run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-ss",
                f"{timestamp:.2f}",
                "-i",
                str(video),
                "-frames:v",
                "1",
                "-vf",
                "scale=320:180:force_original_aspect_ratio=decrease,"
                "pad=320:180:(ow-iw)/2:(oh-ih)/2:color=#d7d2c6",
                str(frame),
            ],
            check=True,
        )
        image = Image.open(frame).convert("RGB")
        x = column * cell_width + 15
        y = row * cell_height + 22
        sheet.paste(image, (x, y))
        draw.text((x, row * cell_height + 3), f"{label}  {timestamp:05.1f}s", fill="#27251f", font=font)

sheet.save("contact-sheet.jpg", quality=88)
print("Saved contact-sheet.jpg")
