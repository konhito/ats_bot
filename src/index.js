import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseDocument } from './services/documentParser.js';
import { analyzeResume, formatAnalysisForTelegram } from './services/atsAnalyzer.js';
import { getSession, updateSession, clearSession, SessionState } from './utils/session.js';
import { generateOptimizedResume, generateModernTemplate, generateClassicTemplate } from './utils/latexToPdf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Create temp directory for file downloads
const TEMP_DIR = path.join(__dirname, '..', 'temp');
await fs.mkdir(TEMP_DIR, { recursive: true });

/**
 * /start command - Welcome message
 */
bot.start((ctx) => {
  const welcomeMessage = `
👋 *Welcome to ATS Resume Analyzer Bot!*

I'll help you optimize your resume for Applicant Tracking Systems (ATS).

*How it works:*
1️⃣ Send me the Job Description (as text or file)
2️⃣ Upload your Resume (PDF, DOCX, or TXT)
3️⃣ Get detailed analysis + 3 optimized resume PDFs

*You'll receive:*
📊 ATS compatibility score & analysis
📄 Resume 1: ATS-Optimized (Blue Accent)
🎨 Resume 2: Modern Minimalist (Teal Accent)
📋 Resume 3: Classic Professional (Traditional)

*Commands:*
/analyze - Start new analysis
/cancel - Cancel current session
/help - Show this message

Ready to get started? Type /analyze
  `.trim();

  ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
});

/**
 * /help command
 */
bot.help((ctx) => {
  const helpMessage = `
📚 *ATS Analyzer Bot - Help*

*Commands:*
/start - Welcome message
/analyze - Start new resume analysis
/cancel - Cancel current analysis
/help - Show this help

*Process:*
1️⃣ Type /analyze to begin
2️⃣ Send Job Description (paste text or upload file)
3️⃣ Upload your Resume (PDF, DOCX, or TXT)
4️⃣ Receive:
   • ATS compatibility score
   • Keyword analysis
   • Improvement suggestions
   • 3 optimized resume PDFs:
     └─ Resume 1: ATS-Optimized (Blue Accent)
     └─ Resume 2: Modern Minimalist (Teal Accent)
     └─ Resume 3: Classic Professional (Traditional)

*Supported file formats:*
• PDF (.pdf)
• Word (.docx, .doc)
• Text (.txt)

*Tips:*
• Make sure the JD is complete and detailed
• Include all relevant experience in your resume
• The bot never fabricates experience - it only optimizes existing content
• Choose the resume style that best matches the company culture

Need help? Contact @yourusername
  `.trim();

  ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

/**
 * /analyze command - Start analysis flow
 */
bot.command('analyze', (ctx) => {
  const userId = ctx.from.id;

  // Clear any existing session
  clearSession(userId);

  // Start new session
  updateSession(userId, {
    state: SessionState.WAITING_FOR_JD,
    jobDescription: null,
    resume: null,
  });

  ctx.reply(
    '📋 *Step 1/2: Job Description*\n\nPlease send me the job description.\n\nYou can:\n• Paste it as text\n• Upload as a file (PDF, DOCX, TXT)',
    { parse_mode: 'Markdown' }
  );
});

/**
 * /cancel command - Cancel current session
 */
bot.command('cancel', (ctx) => {
  const userId = ctx.from.id;
  clearSession(userId);
  ctx.reply('❌ Analysis cancelled. Type /analyze to start over.');
});

/**
 * Handle text messages (for JD as text)
 */
bot.on(message('text'), async (ctx) => {
  const userId = ctx.from.id;
  const session = getSession(userId);

  // Ignore if it's a command
  if (ctx.message.text.startsWith('/')) {
    return;
  }

  if (session.state === SessionState.WAITING_FOR_JD) {
    // Save job description
    updateSession(userId, {
      jobDescription: ctx.message.text,
      state: SessionState.WAITING_FOR_RESUME,
    });

    ctx.reply(
      '✅ Job description received!\n\n📄 *Step 2/2: Resume*\n\nNow upload your resume (PDF, DOCX, or TXT file).',
      { parse_mode: 'Markdown' }
    );
  } else if (session.state === SessionState.IDLE) {
    ctx.reply('Type /analyze to start a new analysis, or /help for instructions.');
  } else {
    ctx.reply('Please upload your resume as a file.');
  }
});

/**
 * Handle document uploads
 */
bot.on(message('document'), async (ctx) => {
  const userId = ctx.from.id;
  const session = getSession(userId);
  const document = ctx.message.document;

  try {
    if (session.state === SessionState.WAITING_FOR_JD) {
      // Handle JD as document
      await ctx.reply('📥 Downloading job description...');

      const file = await ctx.telegram.getFile(document.file_id);
      const filePath = path.join(TEMP_DIR, `jd_${userId}_${Date.now()}_${document.file_name}`);

      // Download file
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const buffer = await response.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));

      // Parse document
      const jdText = await parseDocument(filePath, document.file_name);

      // Clean up
      await fs.unlink(filePath);

      // Save to session
      updateSession(userId, {
        jobDescription: jdText,
        state: SessionState.WAITING_FOR_RESUME,
      });

      ctx.reply(
        '✅ Job description received!\n\n📄 *Step 2/2: Resume*\n\nNow upload your resume (PDF, DOCX, or TXT file).',
        { parse_mode: 'Markdown' }
      );

    } else if (session.state === SessionState.WAITING_FOR_RESUME) {
      // Handle resume upload
      if (!session.jobDescription) {
        ctx.reply('⚠️ Please send the job description first. Type /analyze to start over.');
        return;
      }

      await ctx.reply('📥 Downloading and processing your resume...');

      // Update state
      updateSession(userId, { state: SessionState.PROCESSING });

      const file = await ctx.telegram.getFile(document.file_id);
      const filePath = path.join(TEMP_DIR, `resume_${userId}_${Date.now()}_${document.file_name}`);

      // Download file
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const buffer = await response.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));

      // Parse resume
      const resumeText = await parseDocument(filePath, document.file_name);

      // Clean up uploaded file
      await fs.unlink(filePath);

      // Perform ATS analysis
      await ctx.reply('🤖 Analyzing with AI... This may take 30-60 seconds.');

      const analysis = await analyzeResume(session.jobDescription, resumeText);

      // Send analysis summary
      const summaryMessage = formatAnalysisForTelegram(analysis);
      await ctx.reply(summaryMessage, { parse_mode: 'Markdown' });

      // Generate all resume PDFs
      await ctx.reply('📄 Generating your optimized resumes (3 formats)...');

      const timestamp = Date.now();
      const optimizedPath = path.join(TEMP_DIR, `optimized_${userId}_${timestamp}.pdf`);
      const modernPath = path.join(TEMP_DIR, `modern_${userId}_${timestamp}.pdf`);
      const classicPath = path.join(TEMP_DIR, `classic_${userId}_${timestamp}.pdf`);

      try {
        // Generate all 3 PDFs in parallel using LaTeX
        await Promise.all([
          generateOptimizedResume(analysis.fixed_resume_latex, optimizedPath),
          generateModernTemplate(analysis.fixed_resume_latex, modernPath),
          generateClassicTemplate(analysis.fixed_resume_latex, classicPath),
        ]);

        // Send PDF 1: Optimized ATS Resume
        await ctx.replyWithDocument(
          { source: optimizedPath, filename: '1_ATS_Optimized_Resume.pdf' },
          { caption: '📄 *Resume 1:* ATS-Optimized (Professional LaTeX)' },
        );

        // Send PDF 2: Modern Template
        await ctx.replyWithDocument(
          { source: modernPath, filename: '2_Modern_Template_Resume.pdf' },
          { caption: '🎨 *Resume 2:* Modern Minimalist (Teal Accent)' },
        );

        // Send PDF 3: Classic Template
        await ctx.replyWithDocument(
          { source: classicPath, filename: '3_Classic_Professional_Resume.pdf' },
          { caption: '📋 *Resume 3:* Classic Professional (Traditional)' },
        );

        // Clean up all PDF files
        await Promise.all([
          fs.unlink(optimizedPath),
          fs.unlink(modernPath),
          fs.unlink(classicPath),
        ]);

        await ctx.reply('✅ All 3 resume formats delivered! Choose the one that best fits the role.');

      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);

        // Fallback: send as LaTeX file if PDF generation fails
        const texPath = path.join(TEMP_DIR, `optimized_resume_${userId}_${timestamp}.tex`);
        await fs.writeFile(texPath, analysis.fixed_resume_latex);

        await ctx.replyWithDocument(
          { source: texPath, filename: 'optimized_resume.tex' },
          { caption: '📄 Your ATS-optimized resume (LaTeX format - PDF generation failed)\n\nYou can compile this using Overleaf or a local LaTeX installation.' }
        );

        await fs.unlink(texPath);
      }

      // Send suggestions if any
      if (analysis.suggestions && analysis.suggestions.length > 0) {
        let suggestionsMessage = '💡 *Improvement Suggestions:*\n\n';
        analysis.suggestions.forEach((suggestion, index) => {
          suggestionsMessage += `${index + 1}. ${suggestion}\n`;
        });
        await ctx.reply(suggestionsMessage, { parse_mode: 'Markdown' });
      }

      // Clear session
      clearSession(userId);

      await ctx.reply('\n✅ Analysis complete! Type /analyze to analyze another resume.');

    } else {
      ctx.reply('Type /analyze to start a new analysis.');
    }

  } catch (error) {
    console.error('Error processing document:', error);
    ctx.reply(`❌ Error: ${error.message}\n\nPlease try again or type /cancel to start over.`);

    // Reset state on error
    if (session.state === SessionState.PROCESSING) {
      updateSession(userId, {
        state: SessionState.WAITING_FOR_RESUME,
      });
    }
  }
});

/**
 * Error handling
 */
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An unexpected error occurred. Please try again or type /cancel to start over.');
});

/**
 * Launch bot
 */
console.log('🚀 Starting ATS Telegram Bot...');

bot.launch().then(async () => {
  const botInfo = await bot.telegram.getMe();
  console.log('✅ Bot is running!');
  console.log(`📱 Bot username: @${botInfo.username}`);
  console.log('📊 Waiting for messages...\n');
}).catch((error) => {
  console.error('❌ Failed to start bot:', error.message);
  process.exit(1);
});

// Enable graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Stopping bot (SIGINT)...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Stopping bot (SIGTERM)...');
  bot.stop('SIGTERM');
});
