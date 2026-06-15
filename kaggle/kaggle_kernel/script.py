import os
import glob
import subprocess
import sys

# Lazy loaders for conversion libraries to avoid unnecessary/conflicting installations
_pymupdf4llm = None
_markitdown_instance = None

def get_pymupdf4llm():
    global _pymupdf4llm
    if _pymupdf4llm is None:
        try:
            import pymupdf4llm
            _pymupdf4llm = pymupdf4llm
        except ImportError:
            print("Installing pymupdf4llm...")
            subprocess.run([sys.executable, "-m", "pip", "install", "pymupdf4llm"], check=True)
            import pymupdf4llm
            _pymupdf4llm = pymupdf4llm
    return _pymupdf4llm

def get_markitdown():
    global _markitdown_instance
    if _markitdown_instance is None:
        try:
            from markitdown import MarkItDown
            _markitdown_instance = MarkItDown()
        except ImportError:
            print("Installing markitdown...")
            subprocess.run([sys.executable, "-m", "pip", "install", "markitdown"], check=True)
            from markitdown import MarkItDown
            _markitdown_instance = MarkItDown()
    return _markitdown_instance

input_dir = "/kaggle/input"
output_dir = "/kaggle/working"

# Support PDF, Word, PowerPoint, Excel formats
extensions = ["*.pdf", "*.docx", "*.doc", "*.pptx", "*.ppt", "*.xlsx", "*.xls"]
files_to_convert = []

for ext in extensions:
    # Recursively search all files in the input directory (case-insensitive)
    files_to_convert.extend(glob.glob(os.path.join(input_dir, "**", ext), recursive=True))
    files_to_convert.extend(glob.glob(os.path.join(input_dir, "**", ext.upper()), recursive=True))

# Deduplicate files
files_to_convert = list(set(files_to_convert))

print(f"Starting conversion. Found {len(files_to_convert)} files to convert.")

for file_path in files_to_convert:
    try:
        print(f"Processing: {file_path}")
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.pdf':
            # Lazy load pymupdf4llm only when we have a PDF file
            pymupdf = get_pymupdf4llm()
            # PDF to Markdown using pymupdf4llm (high fidelity markdown) without writing images
            markdown_content = pymupdf.to_markdown(file_path)
        else:
            # Lazy load markitdown only when we have Office documents
            mid = get_markitdown()
            # Convert DOCX, PPTX, XLSX using MarkItDown
            result = mid.convert(file_path)
            markdown_content = result.text_content
        
        base_name = os.path.basename(file_path)
        name_without_ext = os.path.splitext(base_name)[0]
        output_path = os.path.join(output_dir, f"{name_without_ext}.md")
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        
        print(f"Successfully converted and saved: {output_path}")
    except Exception as e:
        print(f"Failed to convert {file_path}. Error: {e}")
        raise e

print("Document conversion completed.")
