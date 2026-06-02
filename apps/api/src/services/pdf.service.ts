import pdfParse from 'pdf-parse';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  const text = data.text?.trim();
  if (!text) {
    throw new Error('No text could be extracted from PDF');
  }
  return text;
}
