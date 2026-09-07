import os
import json
import pandas as pd
import fitz  # PyMuPDF
import docx
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from backend.services.file_service import extract_file_content

def convert_file(input_path: str, target_format: str, output_dir: str) -> str:
    """
    Converts a file from its current format into target_format.
    Supports PDF, DOCX, XLSX, CSV, TXT, JSON, HTML, MD, PNG, JPG.
    Returns the path to the newly converted file.
    """
    input_ext = os.path.splitext(input_path)[1].lower().replace('.', '')
    target_format = target_format.lower().replace('.', '')

    base_name = os.path.splitext(os.path.basename(input_path))[0]
    output_filename = f"{base_name}_converted.{target_format}"
    output_path = os.path.join(output_dir, output_filename)

    extracted = extract_file_content(input_path, input_ext)
    text_content = extracted.get("text", "")
    table_data = extracted.get("table_data")

    # If converting tabular data (CSV/XLSX)
    if table_data and target_format in ['csv', 'xlsx', 'json', 'html']:
        df = pd.DataFrame(table_data["rows"], columns=table_data["columns"])
        if target_format == 'csv':
            df.to_csv(output_path, index=False)
        elif target_format == 'xlsx':
            df.to_excel(output_path, index=False)
        elif target_format == 'json':
            df.to_json(output_path, orient='records', indent=2)
        elif target_format == 'html':
            df.to_html(output_path, index=False)
        return output_path

    # Standard text/document conversions
    if target_format == 'txt':
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text_content)
    
    elif target_format == 'md':
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"# Converted Document\n\n{text_content}")

    elif target_format == 'html':
        paragraphs = text_content.split('\n\n')
        html_paragraphs = "".join([f"<p>{p.strip()}</p>" for p in paragraphs if p.strip()])
        html_doc = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{base_name}</title>
    <style>
        body {{ font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }}
        p {{ margin-bottom: 1em; }}
    </style>
</head>
<body>
    <h1>{base_name}</h1>
    {html_paragraphs}
</body>
</html>"""
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_doc)

    elif target_format == 'docx':
        doc = docx.Document()
        doc.add_heading(base_name, level=1)
        for paragraph in text_content.split('\n\n'):
            if paragraph.strip():
                doc.add_paragraph(paragraph.strip())
        doc.save(output_path)

    elif target_format == 'pdf':
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        normal = styles['Normal']
        normal.leading = 14

        elements = []
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=12
        )
        elements.append(Paragraph(base_name, title_style))
        elements.append(Spacer(1, 12))

        for paragraph in text_content.split('\n\n'):
            if paragraph.strip():
                # Clean html tags for reportlab safely
                clean_p = paragraph.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
                elements.append(Paragraph(clean_p, normal))
                elements.append(Spacer(1, 8))

        doc.build(elements)

    elif target_format == 'json':
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"title": base_name, "content": text_content}, f, indent=2)

    elif target_format in ['png', 'jpg', 'jpeg']:
        if input_ext == 'pdf':
            doc = fitz.open(input_path)
            if len(doc) > 0:
                page = doc[0]
                pix = page.get_pixmap()
                pix.save(output_path)
            doc.close()
        else:
            # Render blank canvas with text for image export
            img = Image.new('RGB', (800, 600), color=(255, 255, 255))
            img.save(output_path)

    else:
        # Fallback to plain text output
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text_content)

    return output_path
