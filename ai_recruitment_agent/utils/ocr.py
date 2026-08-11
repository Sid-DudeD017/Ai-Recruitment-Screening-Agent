import os

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text from a given PDF file using pdfplumber."""
    if not pdfplumber:
        raise ImportError("pdfplumber is not installed. Please install it to use OCR.")
        
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at path: {file_path}")
        
    text_content = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text)
    except Exception as e:
        raise RuntimeError(f"Error reading PDF file {file_path}: {e}")
        
    return "\n".join(text_content)
