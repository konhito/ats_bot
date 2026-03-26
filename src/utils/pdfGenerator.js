import PDFDocument from 'pdfkit';
import MarkdownIt from 'markdown-it';
import fs from 'fs';

const md = new MarkdownIt();

/**
 * TEMPLATE 1: Modern Minimalist Style
 * Clean design with accent colors and modern typography
 */
export async function generateModernTemplate(markdownContent, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const tokens = md.parse(markdownContent, {});
      let isFirstHeading = true;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'heading_open') {
          const level = parseInt(token.tag.substring(1));
          const nextToken = tokens[i + 1];

          if (nextToken && nextToken.type === 'inline') {
            const text = nextToken.content;

            if (doc.y > 720) doc.addPage();

            if (level === 1) {
              // Name - Bold, Large, with underline accent
              if (isFirstHeading) {
                doc.fontSize(28)
                  .fillColor('#000000')
                  .font('Helvetica-Bold')
                  .text(text.toUpperCase(), { align: 'center' });

                doc.moveDown(0.2);
                doc.strokeColor('#00CED1')
                  .lineWidth(3)
                  .moveTo(doc.page.width / 2 - 100, doc.y)
                  .lineTo(doc.page.width / 2 + 100, doc.y)
                  .stroke();
                doc.moveDown(1);
                isFirstHeading = false;
              }
            } else if (level === 2) {
              // Section Headers - Colored background
              doc.moveDown(0.5);

              // Background rectangle
              doc.rect(40, doc.y - 5, doc.page.width - 80, 25)
                .fillAndStroke('#00CED1', '#00CED1');

              doc.fontSize(14)
                .fillColor('#FFFFFF')
                .font('Helvetica-Bold')
                .text(text.toUpperCase(), 50, doc.y, { align: 'left' });

              doc.moveDown(0.8);
              doc.fillColor('#000000');
            } else if (level === 3) {
              // Subsection - Bold with icon
              doc.moveDown(0.3);
              doc.fontSize(12)
                .fillColor('#00CED1')
                .font('Helvetica-Bold')
                .text('▸ ' + text, { align: 'left' });
              doc.moveDown(0.2);
              doc.fillColor('#000000');
            }

            i += 2;
            continue;
          }
        }

        if (token.type === 'paragraph_open') {
          const nextToken = tokens[i + 1];
          if (nextToken && nextToken.type === 'inline') {
            const text = cleanMarkdownText(nextToken.content);
            if (doc.y > 720) doc.addPage();

            doc.fontSize(10)
              .fillColor('#333333')
              .font('Helvetica')
              .text(text, { align: 'left', lineGap: 3 });

            doc.moveDown(0.4);
            i += 2;
            continue;
          }
        }

        if (token.type === 'bullet_list_open') {
          let j = i + 1;
          while (j < tokens.length && tokens[j].type !== 'bullet_list_close') {
            if (tokens[j].type === 'list_item_open') {
              let k = j + 1;
              while (k < tokens.length && tokens[k].type !== 'list_item_close') {
                if (tokens[k].type === 'inline') {
                  const text = cleanMarkdownText(tokens[k].content);
                  if (doc.y > 720) doc.addPage();

                  const currentY = doc.y;

                  // Modern bullet (filled circle)
                  doc.circle(55, currentY + 5, 2)
                    .fillAndStroke('#00CED1', '#00CED1');

                  doc.fontSize(10)
                    .fillColor('#333333')
                    .font('Helvetica')
                    .text(text, 70, currentY, { width: 485, align: 'left', lineGap: 2 });

                  doc.moveDown(0.25);
                  break;
                }
                k++;
              }
            }
            j++;
          }
          i = j;
          doc.moveDown(0.3);
          continue;
        }
      }

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (error) => reject(error));

    } catch (error) {
      reject(new Error(`Modern template generation failed: ${error.message}`));
    }
  });
}

/**
 * TEMPLATE 2: Professional Classic Style
 * Traditional, conservative design suitable for corporate environments
 */
export async function generateClassicTemplate(markdownContent, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        bufferPages: true,
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const tokens = md.parse(markdownContent, {});
      let isFirstHeading = true;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'heading_open') {
          const level = parseInt(token.tag.substring(1));
          const nextToken = tokens[i + 1];

          if (nextToken && nextToken.type === 'inline') {
            const text = nextToken.content;

            if (doc.y > 700) doc.addPage();

            if (level === 1) {
              // Name - Centered, elegant
              if (isFirstHeading) {
                doc.fontSize(26)
                  .fillColor('#1a1a1a')
                  .font('Helvetica-Bold')
                  .text(text, { align: 'center' });

                doc.moveDown(0.3);
                doc.strokeColor('#1a1a1a')
                  .lineWidth(1.5)
                  .moveTo(60, doc.y)
                  .lineTo(doc.page.width - 60, doc.y)
                  .stroke();
                doc.moveDown(0.8);
                isFirstHeading = false;
              }
            } else if (level === 2) {
              // Section Headers - Uppercase with line
              doc.moveDown(0.6);
              doc.fontSize(13)
                .fillColor('#1a1a1a')
                .font('Helvetica-Bold')
                .text(text.toUpperCase(), { align: 'left' });

              doc.moveDown(0.1);
              doc.strokeColor('#666666')
                .lineWidth(0.5)
                .moveTo(60, doc.y)
                .lineTo(doc.page.width - 60, doc.y)
                .stroke();
              doc.moveDown(0.5);
            } else if (level === 3) {
              // Subsection - Simple bold
              doc.moveDown(0.4);
              doc.fontSize(11)
                .fillColor('#1a1a1a')
                .font('Helvetica-Bold')
                .text(text, { align: 'left' });
              doc.moveDown(0.3);
            }

            i += 2;
            continue;
          }
        }

        if (token.type === 'paragraph_open') {
          const nextToken = tokens[i + 1];
          if (nextToken && nextToken.type === 'inline') {
            const text = cleanMarkdownText(nextToken.content);
            if (doc.y > 710) doc.addPage();

            doc.fontSize(10.5)
              .fillColor('#2d2d2d')
              .font('Helvetica')
              .text(text, { align: 'justify', lineGap: 2 });

            doc.moveDown(0.5);
            i += 2;
            continue;
          }
        }

        if (token.type === 'bullet_list_open') {
          let j = i + 1;
          while (j < tokens.length && tokens[j].type !== 'bullet_list_close') {
            if (tokens[j].type === 'list_item_open') {
              let k = j + 1;
              while (k < tokens.length && tokens[k].type !== 'list_item_close') {
                if (tokens[k].type === 'inline') {
                  const text = cleanMarkdownText(tokens[k].content);
                  if (doc.y > 710) doc.addPage();

                  const currentY = doc.y;

                  // Classic bullet (square)
                  doc.rect(65, currentY + 4, 3, 3)
                    .fillAndStroke('#1a1a1a', '#1a1a1a');

                  doc.fontSize(10.5)
                    .fillColor('#2d2d2d')
                    .font('Helvetica')
                    .text(text, 80, currentY, { width: 455, align: 'left', lineGap: 2 });

                  doc.moveDown(0.3);
                  break;
                }
                k++;
              }
            }
            j++;
          }
          i = j;
          doc.moveDown(0.3);
          continue;
        }
      }

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (error) => reject(error));

    } catch (error) {
      reject(new Error(`Classic template generation failed: ${error.message}`));
    }
  });
}

/**
 * OPTIMIZED RESUME: Professional ATS-friendly format
 */
export async function convertMarkdownToPDF(markdownContent, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const tokens = md.parse(markdownContent, {});

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'heading_open') {
          const level = parseInt(token.tag.substring(1));
          const nextToken = tokens[i + 1];

          if (nextToken && nextToken.type === 'inline') {
            const text = nextToken.content;

            if (doc.y > 700) doc.addPage();

            if (level === 1) {
              doc.fontSize(24)
                .fillColor('#1a1a1a')
                .font('Helvetica-Bold')
                .text(text, { align: 'left' });
              doc.moveDown(0.3);
              doc.strokeColor('#2563eb')
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
              doc.moveDown(0.8);
            } else if (level === 2) {
              doc.moveDown(0.5);
              doc.fontSize(16)
                .fillColor('#2563eb')
                .font('Helvetica-Bold')
                .text(text, { align: 'left' });
              doc.moveDown(0.2);
              doc.strokeColor('#e5e7eb')
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();
              doc.moveDown(0.4);
            } else if (level === 3) {
              doc.moveDown(0.3);
              doc.fontSize(12)
                .fillColor('#1f2937')
                .font('Helvetica-Bold')
                .text(text, { align: 'left' });
              doc.moveDown(0.3);
            }

            i += 2;
            continue;
          }
        }

        if (token.type === 'paragraph_open') {
          const nextToken = tokens[i + 1];
          if (nextToken && nextToken.type === 'inline') {
            const text = cleanMarkdownText(nextToken.content);
            if (doc.y > 720) doc.addPage();

            doc.fontSize(11)
              .fillColor('#333333')
              .font('Helvetica')
              .text(text, { align: 'justify', lineGap: 2 });

            doc.moveDown(0.5);
            i += 2;
            continue;
          }
        }

        if (token.type === 'bullet_list_open') {
          let j = i + 1;
          while (j < tokens.length && tokens[j].type !== 'bullet_list_close') {
            if (tokens[j].type === 'list_item_open') {
              let k = j + 1;
              while (k < tokens.length && tokens[k].type !== 'list_item_close') {
                if (tokens[k].type === 'inline') {
                  const text = cleanMarkdownText(tokens[k].content);
                  if (doc.y > 720) doc.addPage();

                  const currentY = doc.y;

                  doc.fontSize(11)
                    .fillColor('#333333')
                    .font('Helvetica')
                    .text('•', 50, currentY);

                  doc.text(text, 70, currentY, { width: 475, align: 'left', lineGap: 2 });

                  doc.moveDown(0.3);
                  break;
                }
                k++;
              }
            }
            j++;
          }
          i = j;
          doc.moveDown(0.3);
          continue;
        }
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
 * Clean markdown formatting from text
 */
function cleanMarkdownText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^#+\s*/g, '')
    .trim();
}
