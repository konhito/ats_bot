import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import fs from 'fs/promises';

/**
 * Extract text from PDF file
 */
export async function parsePDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX file
 */
export async function parseDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
}

/**
 * Extract text from TXT file
 */
export async function parseTXT(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read TXT file: ${error.message}`);
  }
}

/**
 * Parse document based on file extension
 */
export async function parseDocument(filePath, fileName) {
  const ext = fileName.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return await parsePDF(filePath);
    case 'docx':
    case 'doc':
      return await parseDOCX(filePath);
    case 'txt':
      return await parseTXT(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}. Please upload PDF, DOCX, or TXT files.`);
  }
}
