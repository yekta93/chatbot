import glob
import os
import PyPDF2
import requests
from llama_parse import LlamaParse


def split_pdf_pages(file_path: str) -> list:
    pdf_pages = []

    with open(file_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file, strict=False)
        name = os.path.basename(file_path)
        total_pages = len(pdf_reader.pages)

        for page_number in range(total_pages):
            pdf_writer = PyPDF2.PdfWriter()
            pdf_writer.add_page(pdf_reader.pages[page_number])

            directory_path = os.path.dirname(file_path)

            output_dir = os.path.join(directory_path, "pdf")
            os.makedirs(output_dir, exist_ok=True)

            file_name = f"{name.replace('.pdf', '')}-{page_number + 1}.pdf"
            pdf_path = os.path.join(output_dir, file_name)

            with open(pdf_path, "wb") as temp_pdf:
                pdf_writer.write(temp_pdf)
            pdf_pages.append(pdf_path)

    return pdf_pages


def add_pdf_upload_and_get_link(api_url: str, token: str, pages: list) -> list:
    links = []

    for page_number, pdf_path in enumerate(pages, start=1):
        with open(pdf_path, "rb") as temp_pdf:
            files = {"filehandle": (pdf_path, temp_pdf, "multipart/form-data")}

            payload = {"token": token, "command": "addfile", "page_number": page_number}
            response = requests.post(api_url, data=payload, files=files)
            json_response = response.json()
            file_token = json_response.get("FileToken")

            payload = {
                "token": token,
                "command": "convert",
                "filetoken": file_token,
                "method": "4",
            }
            response = requests.post(api_url, data=payload, files=files)
            json_response = response.json()

        links.append(json_response.get("FileToDownload"))
    print(links)

    return links


def download_docx_files(links: list[str], directory_path: str, name: str) -> str:

    output_dir_docx = os.path.join(directory_path, "docx")
    os.makedirs(output_dir_docx, exist_ok=True)

    for page_number, link in enumerate(links, start=1):
        docx_file_path = os.path.join(
            output_dir_docx, f"{name.replace('.pdf', '')}-{page_number}.docx"
        )

        response = requests.get(link)
        response.raise_for_status()

        with open(docx_file_path, "wb") as file:
            file.write(response.content)

        print(f" DOCX saved to: {docx_file_path}")

    return output_dir_docx


def convert_to_md(docx_dir: str, name: str) -> str:
    directory_path = os.path.dirname(docx_dir)
    output_dir_md = os.path.join(directory_path, "md")
    os.makedirs(output_dir_md, exist_ok=True)

    docx_files = [f for f in os.listdir(docx_dir) if f.endswith(".docx")]

    all_md_content = []

    parser = LlamaParse(complemental_formatting_instruction="markdown")

    for page_number, docx_file in enumerate(docx_files, start=1):
        docx_path = os.path.join(docx_dir, docx_file)

        print(f"Processing: {docx_path}")

        docs_pages = parser.load_data(
            file_path=docx_path, extra_info={"file_name": docx_file}
        )
        doc_contents = [doc.text for doc in docs_pages]

        all_md_content.extend(doc_contents)

    md_pages = "\n".join(all_md_content)

    md_file_name = f"{os.path.splitext(name)[0]}.md"
    md_file_path = os.path.join(output_dir_md, md_file_name)

    with open(md_file_path, "w") as md_file:
        md_file.write(md_pages)

    print(f"✅ Markdown saved to: {md_file_path}")

    return md_file_path


if __name__ == "__main__":
    API_URL = "https://www.eboo.ir/api/ocr/getway"
    TOKEN = "n3xiZaeenurpyI3lIuJTuArxVdyJaq4u"

    directory_path = "./artifacts/docs/ocr"
    pattern = "*.pdf"
    files = glob.glob(os.path.join(directory_path, pattern))

    for file_path in files:
        name = os.path.basename(file_path)
        pdf_pages = split_pdf_pages(file_path)
        links = add_pdf_upload_and_get_link(API_URL, TOKEN, pdf_pages)

        download_docx_files(links, directory_path, name)
        docx_dir = "./artifacts/docs/ocr/docx"
        convert_to_md(docx_dir, name)
