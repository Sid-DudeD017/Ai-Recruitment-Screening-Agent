import requests
import io
from pypdf import PdfWriter

def test_resume_parser():
    print("Creating dummy PDF...")
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    pdf_bytes = io.BytesIO()
    writer.write(pdf_bytes)
    pdf_bytes.seek(0)
    
    print("Testing /ai/upload-and-parse-resume endpoint...")
    try:
        response = requests.post(
            "http://127.0.0.1:8000/ai/upload-and-parse-resume",
            files={"file": ("dummy_resume.pdf", pdf_bytes, "application/pdf")}
        )
        if response.status_code == 200:
            print("Success!")
            print("Response:", response.json())
        else:
            print("Failed!")
            print("Status code:", response.status_code)
            print("Response:", response.text)
    except Exception as e:
        print("Error connecting to server:", e)

if __name__ == "__main__":
    test_resume_parser()
