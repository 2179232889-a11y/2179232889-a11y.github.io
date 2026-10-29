from pathlib import Path
import subprocess

from PIL import Image


ROOT = Path(__file__).resolve().parent
ASSET_ROOT = ROOT / "public" / "assets"
POSTER_ROOT = ASSET_ROOT / "posters"
VIDEO_ROOT = ASSET_ROOT / "video"
PORTRAIT_ROOT = ASSET_ROOT / "portrait"

for directory in (POSTER_ROOT, VIDEO_ROOT, PORTRAIT_ROOT):
    directory.mkdir(parents=True, exist_ok=True)

poster_source = Path(r"E:\桌\图片素材\jpg（原文件夹）\jpg")
poster_files = {
    "hailu-beach": "19d646d6-4931-408a-808c-edfcce9834ea 拷贝.jpg",
    "shuanglu-igniter": "065fb08b-7eca-455e-82f5-432c97dc2613 拷贝.jpg",
    "sanjin-green": "72cbaae3-8df9-4cc7-8fff-74a7d2fd2db3 拷贝.jpg",
    "yangyuanqing-clock": "9c0839c9-6099-44ee-bc7c-22d4868880e9 拷贝.jpg",
    "centaine-wave": "b9c4b5f4-e9cf-4759-966b-520b3b84dacb 拷贝.jpg",
    "centaine-mountain": "a098c19d-c5a0-48cb-b827-5daa4eaf1efd 拷贝.jpg",
    "centaine-hair": "cb64754f-3e99-454f-91ae-b97f09a7eeb8 拷贝.jpg",
    "hailu-spring": "眼睛的温泉假期 拷贝.jpg",
    "yangyuanqing-hearts": "a050e902-2ff6-4fa5-a197-2ef54dd1255c 拷贝.jpg",
    "shuanglu-door": "ad27ed08-6d6b-4714-a422-3479f2be682f 拷贝.jpg",
    "yangyuanqing-interview": "ea641aaa-1bbd-4912-8fbe-97ceb55205ed 拷贝.jpg",
    "shuanglu-light": "b55214c9-2b48-4f63-b1c6-0018d6bef3f7 拷贝.jpg",
    "sanjin-blue": "2c513a36-2027-44a4-9059-5977874468a4 拷贝.jpg",
    "hailu-mountain": "3faa7047-0216-49ca-8e8c-c62a06cc0900 拷贝.jpg",
    "sanjin-stage": "7e3e349f-5172-4b3f-9b85-0c502209f181 拷贝.jpg",
}

for output_name, source_name in poster_files.items():
    with Image.open(poster_source / source_name) as image:
        image = image.convert("RGB")
        image.thumbnail((1000, 1400), Image.Resampling.LANCZOS)
        image.save(POSTER_ROOT / f"{output_name}.webp", "WEBP", quality=88, method=6)

portrait_path = Path(
    r"C:\xwechat_files\wxid_olbeof1hgg6z12_e876\temp\RWTemp\2026-10"
    r"\ac25ce2c3f5cc9b85072f2a0584d5251\99c6422cde48d99ee61b0748419f59e4.jpg"
)
with Image.open(portrait_path) as portrait:
    portrait = portrait.convert("RGB")
    portrait.crop((176, 0, 896, 900)).save(
        PORTRAIT_ROOT / "luo-xin-portrait.webp",
        "WEBP",
        quality=90,
        method=6,
    )

video_files = [
    {
        "source": Path(r"E:\桌\Bb08-22-008-0002.mp4"),
        "name": "creative-workflow",
        "start": "18",
        "duration": "10",
        "poster": "21.7",
    },
    {
        "source": Path(r"E:\桌\last超能.mp4"),
        "name": "forest-story",
        "start": "20",
        "duration": "8",
        "poster": "26.4",
    },
    {
        "source": Path(r"E:\桌\4月22日(5).MP4"),
        "name": "tangled-ideas",
        "start": "34",
        "duration": "10",
        "poster": "42",
    },
    {
        "source": Path(r"E:\桌\Bb12-22-008-0007.mp4"),
        "name": "botanical-film",
        "start": "25",
        "duration": "10",
        "poster": "30.7",
    },
]

for video in video_files:
    name = video["name"]
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-ss",
            video["poster"],
            "-i",
            str(video["source"]),
            "-frames:v",
            "1",
            "-vf",
            "scale=1280:720:force_original_aspect_ratio=decrease,"
            "pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=#e8e2d5",
            "-q:v",
            "2",
            str(VIDEO_ROOT / f"{name}-poster.jpg"),
        ],
        check=True,
    )
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-ss",
            video["start"],
            "-i",
            str(video["source"]),
            "-t",
            video["duration"],
            "-vf",
            "scale=960:540:force_original_aspect_ratio=decrease,"
            "pad=960:540:(ow-iw)/2:(oh-ih)/2:color=#e8e2d5",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "27",
            "-an",
            "-movflags",
            "+faststart",
            str(VIDEO_ROOT / f"{name}.mp4"),
        ],
        check=True,
    )

print(f"Prepared {len(poster_files)} posters and {len(video_files)} video clips.")
