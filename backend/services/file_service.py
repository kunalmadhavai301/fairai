import os
import json
import zipfile
import pandas as pd
import fitz  # PyMuPDF
import docx
from PIL import Image
from typing import Dict, Any, Tuple

SUPPORTED_EXTENSIONS = {
    '.pdf', '.docx', '.pptx', '.xlsx', '.csv', '.txt', '.md', 
    '.json', '.html', '.xml', '.png', '.jpg', '.jpeg', '.zip'
}

def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()

def extract_file_content(file_path: str, file_type: str) -> Dict[str, Any]:
    """
    Extracts readable text, structured data, or metadata from uploaded files.
    """
    ext = file_type.lower() if file_type.startswith('.') else f".{file_type.lower()}"
    
    result = {
        "type": ext,
        "text": "",
        "table_data": None,
        "json_data": None,
        "meta": {}
    }

    try:
        if ext == '.pdf':
            doc = fitz.open(file_path)
            pages_text = []
            for i, page in enumerate(doc):
                pages_text.append(f"--- Page {i+1} ---\n" + page.get_text())
            result["text"] = "\n\n".join(pages_text)
            result["meta"] = {"pages": len(doc)}
            doc.close()

        elif ext in ['.csv', '.xlsx', '.xls']:
            if ext == '.csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
            
            # Fill NaN for clean JSON conversion
            df_clean = df.fillna("")
            records = df_clean.to_dict(orient="records")
            columns = list(df.columns)
            
            result["table_data"] = {
                "columns": columns,
                "rows": records,
                "shape": [len(df), len(columns)]
            }
            result["text"] = f"Tabular dataset with {len(df)} rows and {len(columns)} columns:\nColumns: {', '.join(columns)}\nSample:\n" + df.head(10).to_string()
            result["meta"] = {"rows": len(df), "columns": len(columns)}

        elif ext == '.docx':
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            result["text"] = "\n\n".join(paragraphs)
            result["meta"] = {"paragraphs": len(paragraphs)}

        elif ext in ['.txt', '.md', '.html', '.xml']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            result["text"] = content
            result["meta"] = {"char_count": len(content)}

        elif ext == '.json':
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                data = json.load(f)
            result["json_data"] = data
            result["text"] = json.dumps(data, indent=2)
            result["meta"] = {"is_json": True}

        elif ext in ['.png', '.jpg', '.jpeg']:
            img = Image.open(file_path)
            result["text"] = f"Image file ({img.format}, {img.size[0]}x{img.size[1]} px, mode {img.mode})"
            result["meta"] = {"width": img.size[0], "height": img.size[1], "format": img.format}

        elif ext == '.zip':
            with zipfile.ZipFile(file_path, 'r') as z:
                files = z.namelist()
            result["text"] = f"ZIP Archive containing {len(files)} files:\n" + "\n".join(files)
            result["meta"] = {"contained_files": files}

        elif ext == '.pptx':
            result["text"] = f"PowerPoint presentation ({file_path})"
            result["meta"] = {"slides": "PPTX parsed"}

        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                result["text"] = f.read(5000)

    except Exception as e:
        result["text"] = f"Error reading file content: {str(e)}"
        result["error"] = str(e)

    return result

def save_edited_file_content(file_path: str, new_content: str, file_type: str, table_data: Any = None) -> bool:
    """
    Saves updated content back to the physical file based on its type.
    """
    ext = file_type.lower() if file_type.startswith('.') else f".{file_type.lower()}"

    try:
        if ext in ['.txt', '.md', '.html', '.xml', '.json']:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True

        elif ext == '.docx':
            doc = docx.Document()
            for line in new_content.split('\n\n'):
                if line.strip():
                    doc.add_paragraph(line.strip())
            doc.save(file_path)
            return True

        elif ext in ['.csv', '.xlsx'] and table_data:
            cols = table_data.get("columns", [])
            rows = table_data.get("rows", [])
            df = pd.DataFrame(rows, columns=cols)
            if ext == '.csv':
                df.to_csv(file_path, index=False)
            else:
                df.to_excel(file_path, index=False)
            return True

        elif ext == '.pdf':
            # Generate a new PDF with ReportLab or fitz
            doc = fitz.open()
            page = doc.new_page()
            rect = fitz.Rect(50, 50, 550, 800)
            page.insert_textbox(rect, new_content, fontsize=11)
            doc.save(file_path)
            doc.close()
            return True

    except Exception as e:
        print(f"Error saving edited content: {e}")
        return False

    return False
