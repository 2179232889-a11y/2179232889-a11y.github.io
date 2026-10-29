import io
import sys
from pathlib import Path

import pdfplumber


sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

pdf_path = Path(
    r"C:\xwechat_files\wxid_olbeof1hgg6z12_e876\msg\file\2026-10"
    r"\罗鑫_简历_内容策划品牌传播_ATS照片版.pdf"
)

with pdfplumber.open(str(pdf_path)) as pdf:
    for page_number, page in enumerate(pdf.pages, start=1):
        print(f"--- PAGE {page_number} ---")
        print(page.extract_text(x_tolerance=2, y_tolerance=3))
