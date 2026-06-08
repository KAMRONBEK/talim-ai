import pdfParse from 'pdf-parse';
import OpenAI, { toFile } from 'openai';
import { env } from '../config/env.js';
import { recordUsage, type UsageContext } from './usage.service.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text?.trim() ?? '';
}

/** OCR fallback for scanned/image PDFs via OpenAI vision. */
async function extractWithOpenAI(
  buffer: Buffer,
  filename: string,
  usage?: UsageContext,
): Promise<string> {
  if (!openai) {
    throw new Error(
      'PDF has no selectable text (likely scanned). Set OPENAI_API_KEY to enable OCR processing.',
    );
  }

  const upload = await openai.files.create({
    file: await toFile(buffer, filename, { type: 'application/pdf' }),
    purpose: 'user_data',
  });

  try {
    const model = 'gpt-4o-mini';
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'file', file: { file_id: upload.id } },
            {
              type: 'text',
              text: 'Extract all readable text from this document. Return plain text only with no introduction, commentary, or meta phrases (do not write "Here is the extracted text" or similar). Start directly with the document content. Preserve the original language (including Uzbek if present).',
            },
          ],
        },
      ],
    });

    if (usage) {
      recordUsage({
        userId: usage.userId,
        tenantId: usage.tenantId,
        feature: 'PDF_PARSE',
        model,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        metadata: usage.metadata,
      });
    }

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('No text could be extracted from PDF');
    }
    return text;
  } finally {
    await openai.files.del(upload.id).catch(() => {});
  }
}

export async function extractPdfText(
  buffer: Buffer,
  filename = 'document.pdf',
  usage?: UsageContext,
): Promise<string> {
  const parsed = await extractWithPdfParse(buffer);
  if (parsed) return parsed;

  return extractWithOpenAI(buffer, filename, usage);
}

/** OCR a cropped page region (image/png or jpeg) from a scanned PDF viewer selection. */
export async function extractRegionTextFromImage(
  imageBuffer: Buffer,
  usage?: UsageContext,
): Promise<string> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is required for scanned PDF region OCR');
  }

  const model = 'gpt-4o-mini';
  const base64 = imageBuffer.toString('base64');
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${base64}` },
          },
          {
            type: 'text',
            text: 'Extract all readable text visible in this image. Return plain text only with no introduction or commentary. Preserve the original language.',
          },
        ],
      },
    ],
  });

  if (usage) {
    recordUsage({
      userId: usage.userId,
      tenantId: usage.tenantId,
      feature: 'PDF_PARSE',
      model,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      metadata: usage.metadata,
    });
  }

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('No text could be extracted from the selected region');
  }
  return text;
}
