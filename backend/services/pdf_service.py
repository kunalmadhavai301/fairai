import os
import fitz  # PyMuPDF
from typing import Tuple, Dict, Any, List
from backend.services.conversion_service import convert_file
from backend.config import PROCESSED_DIR

def render_pdf_page_image(input_path: str, page_number: int = 1, dpi: int = 300) -> Tuple[bool, bytes, int]:
    """
    Renders a document page (1-indexed) at 300 DPI high-resolution PNG bytes.
    Supports PDF, DOCX, PPTX, XLSX, TXT, and Images pixel-for-pixel.
    Returns (success_boolean, png_bytes, total_pages).
    """
    if not os.path.exists(input_path):
        return False, b"", 0

    base, ext = os.path.splitext(input_path)
    ext = ext.lower()

    # Image Files (.png, .jpg, .jpeg, .webp, .svg)
    if ext in ['.png', '.jpg', '.jpeg', '.webp', '.svg']:
        try:
            with open(input_path, "rb") as img_f:
                return True, img_f.read(), 1
        except Exception:
            return False, b"", 0

    # Non-PDF Office/Text files (.docx, .pptx, .xlsx, .txt, .json, .csv)
    target_pdf_path = input_path
    if ext != '.pdf':
        try:
            converted_pdf = convert_file(input_path, "pdf", str(PROCESSED_DIR))
            if os.path.exists(converted_pdf):
                target_pdf_path = converted_pdf
        except Exception:
            pass

    try:
        doc = fitz.open(target_pdf_path)
        total_pages = len(doc)
        if page_number < 1 or page_number > total_pages:
            page_number = min(max(1, page_number), total_pages)

        page = doc[page_number - 1]
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        png_bytes = pix.tobytes("png")
        doc.close()
        return True, png_bytes, total_pages
    except Exception as e:
        return False, b"", 0

def delete_pdf_page(input_path: str, page_number: int, output_path: str = None) -> Tuple[bool, str]:
    """
    Deletes a specific page (1-indexed) from a PDF document directly without modifying other pages or fonts.
    """
    if not output_path:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_modified{ext}"

    try:
        doc = fitz.open(input_path)
        total_pages = len(doc)

        if page_number < 1 or page_number > total_pages:
            doc.close()
            return False, f"Page number {page_number} is out of range (PDF has {total_pages} pages)."

        doc.delete_page(page_number - 1)
        doc.save(output_path)
        doc.close()

        if input_path != output_path:
            doc_mod = fitz.open(output_path)
            doc_mod.save(input_path)
            doc_mod.close()

        return True, f"Successfully deleted Page {page_number}."
    except Exception as e:
        return False, f"Failed to delete page: {str(e)}"

def extract_pdf_tables(input_path: str) -> List[Dict[str, Any]]:
    """
    Extracts embedded tables from PDF pages.
    """
    doc = fitz.open(input_path)
    tables_found = []

    for page_idx, page in enumerate(doc):
        tabs = page.find_tables()
        for tab in tabs:
            df = tab.extract()
            tables_found.append({
                "page": page_idx + 1,
                "table_data": df
            })
    doc.close()
    return tables_found
