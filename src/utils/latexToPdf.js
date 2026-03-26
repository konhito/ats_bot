import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const execAsync = promisify(exec);

/**
 * Check if LaTeX is installed
 */
async function isLatexAvailable() {
  try {
    await execAsync('pdflatex --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Convert LaTeX to PDF using pdflatex (if available)
 */
async function compileLatexToPDF(latexContent, outputPath) {
  const tempDir = path.dirname(outputPath);
  const baseName = path.basename(outputPath, '.pdf');
  const texPath = path.join(tempDir, `${baseName}.tex`);

  // Write LaTeX to file
  await fs.promises.writeFile(texPath, latexContent, 'utf-8');

  try {
    // Compile LaTeX to PDF
    await execAsync(`pdflatex -interaction=nonstopmode -output-directory="${tempDir}" "${texPath}"`);

    // Clean up auxiliary files
    const auxFiles = ['.aux', '.log', '.out'].map(ext =>
      path.join(tempDir, baseName + ext)
    );

    for (const auxFile of auxFiles) {
      try {
        await fs.promises.unlink(auxFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Remove tex file
    await fs.promises.unlink(texPath);

    return outputPath;
  } catch (error) {
    // Clean up tex file on error
    try {
      await fs.promises.unlink(texPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw new Error(`LaTeX compilation failed: ${error.message}`);
  }
}

/**
 * Fallback: Convert LaTeX content to PDF using PDFKit (no LaTeX required)
 */
async function latexToPDFKitFallback(latexContent, outputPath, style = 'default') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Extract content from LaTeX
      const content = parseLatexContent(latexContent);

      // Apply styling based on template
      if (style === 'modern') {
        renderModernStyle(doc, content);
      } else if (style === 'classic') {
        renderClassicStyle(doc, content);
      } else {
        renderDefaultStyle(doc, content);
      }

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (error) => reject(error));

    } catch (error) {
      reject(new Error(`PDF generation failed: ${error.message}`));
    }
  });
}

/**
 * Parse LaTeX content to extract structured data
 */
function parseLatexContent(latexContent) {
  const content = {
    name: '',
    contact: '',
    sections: []
  };

  // Extract name (between \LARGE \textbf{} or similar)
  const nameMatch = latexContent.match(/\\(?:LARGE|Large|large)\s*\\textbf\{([^}]+)\}/);
  if (nameMatch) {
    content.name = nameMatch[1];
  }

  // Extract contact info (usually after name)
  const contactMatch = latexContent.match(/Email.*?Location|Phone.*?LinkedIn|[^}]+@[^}]+\.[^}]+/);
  if (contactMatch) {
    content.contact = contactMatch[0];
  }

  // Extract sections
  const sectionRegex = /\\section\*?\{([^}]+)\}(.*?)(?=\\section\*?\{|\\end\{document\}|$)/gs;
  let match;

  while ((match = sectionRegex.exec(latexContent)) !== null) {
    const sectionTitle = match[1];
    const sectionContent = match[2].trim();

    // Parse items within section
    const items = [];

    // Look for itemize lists
    const itemizeMatch = sectionContent.match(/\\begin\{itemize\}(.*?)\\end\{itemize\}/s);
    if (itemizeMatch) {
      const itemContent = itemizeMatch[1];
      const itemMatches = itemContent.match(/\\item\s+([^\n]+)/g);
      if (itemMatches) {
        items.push(...itemMatches.map(item => item.replace(/\\item\s+/, '').trim()));
      }
    } else {
      // If no itemize, treat as paragraph
      items.push(sectionContent.replace(/\\[a-zA-Z*]+\{[^}]*\}/g, '').trim());
    }

    content.sections.push({
      title: sectionTitle,
      items: items.filter(item => item.length > 0)
    });
  }

  return content;
}

/**
 * Render default style
 */
function renderDefaultStyle(doc, content) {
  // Name
  if (content.name) {
    doc.fontSize(24)
       .fillColor('#1a1a1a')
       .font('Helvetica-Bold')
       .text(content.name, { align: 'center' });
    doc.moveDown(0.5);
  }

  // Contact
  if (content.contact) {
    doc.fontSize(10)
       .fillColor('#666666')
       .font('Helvetica')
       .text(content.contact.replace(/[\\{}]/g, ''), { align: 'center' });
    doc.moveDown(1);
  }

  // Sections
  content.sections.forEach(section => {
    if (doc.y > 700) doc.addPage();

    // Section title
    doc.fontSize(16)
       .fillColor('#2563eb')
       .font('Helvetica-Bold')
       .text(section.title.toUpperCase());
    doc.moveDown(0.2);

    // Underline
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke();
    doc.moveDown(0.4);

    // Items
    section.items.forEach(item => {
      if (doc.y > 720) doc.addPage();

      const cleanItem = item.replace(/\\[a-zA-Z*]+\{([^}]*)\}/g, '$1').replace(/\\[a-zA-Z*]+/g, '');

      doc.fontSize(11)
         .fillColor('#333333')
         .font('Helvetica')
         .text('• ' + cleanItem.trim(), { indent: 20, lineGap: 2 });
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  });
}

/**
 * Render modern style
 */
function renderModernStyle(doc, content) {
  // Name with teal accent
  if (content.name) {
    doc.fontSize(28)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(content.name.toUpperCase(), { align: 'center' });

    doc.moveDown(0.2);
    doc.strokeColor('#00CED1')
       .lineWidth(3)
       .moveTo(doc.page.width / 2 - 100, doc.y)
       .lineTo(doc.page.width / 2 + 100, doc.y)
       .stroke();
    doc.moveDown(1);
  }

  // Contact
  if (content.contact) {
    doc.fontSize(10)
       .fillColor('#666666')
       .font('Helvetica')
       .text(content.contact.replace(/[\\{}]/g, ''), { align: 'center' });
    doc.moveDown(1);
  }

  // Sections with teal backgrounds
  content.sections.forEach(section => {
    if (doc.y > 700) doc.addPage();

    // Section background
    doc.rect(40, doc.y - 5, doc.page.width - 80, 25)
       .fillAndStroke('#00CED1', '#00CED1');

    doc.fontSize(14)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text(section.title.toUpperCase(), 50, doc.y, { align: 'left' });

    doc.moveDown(0.8);
    doc.fillColor('#000000');

    // Items with modern bullets
    section.items.forEach(item => {
      if (doc.y > 720) doc.addPage();

      const cleanItem = item.replace(/\\[a-zA-Z*]+\{([^}]*)\}/g, '$1').replace(/\\[a-zA-Z*]+/g, '');
      const currentY = doc.y;

      // Modern bullet (filled circle)
      doc.circle(55, currentY + 5, 2)
         .fillAndStroke('#00CED1', '#00CED1');

      doc.fontSize(10)
         .fillColor('#333333')
         .font('Helvetica')
         .text(cleanItem.trim(), 70, currentY, { width: 485, align: 'left', lineGap: 2 });

      doc.moveDown(0.25);
    });

    doc.moveDown(0.5);
  });
}

/**
 * Render classic style
 */
function renderClassicStyle(doc, content) {
  // Name
  if (content.name) {
    doc.fontSize(26)
       .fillColor('#1a1a1a')
       .font('Helvetica-Bold')
       .text(content.name, { align: 'center' });

    doc.moveDown(0.3);
    doc.strokeColor('#1a1a1a')
       .lineWidth(1.5)
       .moveTo(60, doc.y)
       .lineTo(doc.page.width - 60, doc.y)
       .stroke();
    doc.moveDown(0.8);
  }

  // Contact
  if (content.contact) {
    doc.fontSize(10)
       .fillColor('#666666')
       .font('Helvetica')
       .text(content.contact.replace(/[\\{}]/g, ''), { align: 'center' });
    doc.moveDown(1);
  }

  // Sections
  content.sections.forEach(section => {
    if (doc.y > 700) doc.addPage();

    // Section title
    doc.fontSize(13)
       .fillColor('#1a1a1a')
       .font('Helvetica-Bold')
       .text(section.title.toUpperCase());
    doc.moveDown(0.1);

    // Underline
    doc.strokeColor('#666666')
       .lineWidth(0.5)
       .moveTo(60, doc.y)
       .lineTo(doc.page.width - 60, doc.y)
       .stroke();
    doc.moveDown(0.5);

    // Items with square bullets
    section.items.forEach(item => {
      if (doc.y > 710) doc.addPage();

      const cleanItem = item.replace(/\\[a-zA-Z*]+\{([^}]*)\}/g, '$1').replace(/\\[a-zA-Z*]+/g, '');
      const currentY = doc.y;

      // Classic bullet (square)
      doc.rect(65, currentY + 4, 3, 3)
         .fillAndStroke('#1a1a1a', '#1a1a1a');

      doc.fontSize(10.5)
         .fillColor('#2d2d2d')
         .font('Helvetica')
         .text(cleanItem.trim(), 80, currentY, { width: 455, align: 'left', lineGap: 2 });

      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  });
}

/**
 * Generate ATS-Optimized Resume (tries LaTeX first, fallback to PDFKit)
 */
export async function generateOptimizedResume(latexContent, outputPath) {
  try {
    if (await isLatexAvailable()) {
      return await compileLatexToPDF(latexContent, outputPath);
    } else {
      console.log('LaTeX not available, using PDFKit fallback');
      return await latexToPDFKitFallback(latexContent, outputPath, 'default');
    }
  } catch (error) {
    console.log('LaTeX compilation failed, using PDFKit fallback:', error.message);
    return await latexToPDFKitFallback(latexContent, outputPath, 'default');
  }
}

/**
 * Generate Modern Minimalist Template
 */
export async function generateModernTemplate(latexContent, outputPath) {
  try {
    if (await isLatexAvailable()) {
      // Create modern LaTeX version
      const modernLatex = latexContent.replace(
        /\\documentclass\[.*?\]\{.*?\}/,
        '\\documentclass[11pt,a4paper]{article}'
      ).replace(
        /\\usepackage\{[^}]*\}/g,
        '\\usepackage[margin=0.6in]{geometry}\n\\usepackage{enumitem}\n\\usepackage[hidelinks]{hyperref}\n\\usepackage{xcolor}\n\\definecolor{accentcolor}{RGB}{0,206,209}'
      );
      return await compileLatexToPDF(modernLatex, outputPath);
    } else {
      return await latexToPDFKitFallback(latexContent, outputPath, 'modern');
    }
  } catch (error) {
    console.log('LaTeX compilation failed, using PDFKit fallback:', error.message);
    return await latexToPDFKitFallback(latexContent, outputPath, 'modern');
  }
}

/**
 * Generate Classic Professional Template
 */
export async function generateClassicTemplate(latexContent, outputPath) {
  try {
    if (await isLatexAvailable()) {
      return await compileLatexToPDF(latexContent, outputPath);
    } else {
      return await latexToPDFKitFallback(latexContent, outputPath, 'classic');
    }
  } catch (error) {
    console.log('LaTeX compilation failed, using PDFKit fallback:', error.message);
    return await latexToPDFKitFallback(latexContent, outputPath, 'classic');
  }
}

/**
 * Save LaTeX content as .tex file
 */
export async function saveAsLatexFile(latexContent, outputPath) {
  return fs.promises.writeFile(outputPath, latexContent, 'utf-8');
}
