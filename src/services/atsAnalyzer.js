import OpenAI from 'openai';
import { ATS_PROMPT } from '../prompts/atsPrompt.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze resume against job description using OpenAI
 */
export async function analyzeResume(jdText, resumeText) {
  try {
    const prompt = ATS_PROMPT(jdText, resumeText);

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert ATS analyzer. Return only valid JSON with no additional formatting or markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    // Get content from response
    const content = response.choices[0].message.content;

    // Parse and validate JSON response
    const result = JSON.parse(content);

    // Validate required fields
    if (!result.score || !result.score_breakdown || !result.fixed_resume_latex) {
      console.error('OpenAI response missing fields:', JSON.stringify(result, null, 2));
      throw new Error('Invalid response from OpenAI - missing required fields');
    }

    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Failed to parse JSON:', error);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
    console.error('ATS analysis error:', error);
    throw new Error(`ATS analysis failed: ${error.message}`);
  }
}

/**
 * Format analysis result for Telegram message
 */
export function formatAnalysisForTelegram(analysis) {
  const { score, score_breakdown, matched_keywords, missing_keywords, critical_missing, summary } = analysis;

  let message = `🎯 *ATS Analysis Complete*\n\n`;

  // Score
  const scoreEmoji = score >= 90 ? '🟢' : score >= 70 ? '🟡' : score >= 50 ? '🟠' : '🔴';
  message += `${scoreEmoji} *Overall Score: ${score}/100*\n\n`;

  // Breakdown
  message += `📊 *Score Breakdown:*\n`;
  message += `   • Keyword Match: ${score_breakdown.keyword_match}/40\n`;
  message += `   • Experience Relevance: ${score_breakdown.experience_relevance}/30\n`;
  message += `   • Skills Alignment: ${score_breakdown.skills_alignment}/30\n\n`;

  // Summary
  message += `📝 *Summary:*\n${summary}\n\n`;

  // Matched keywords
  message += `✅ *Matched Keywords (${matched_keywords.length}):*\n`;
  message += matched_keywords.slice(0, 15).join(', ');
  if (matched_keywords.length > 15) {
    message += `, and ${matched_keywords.length - 15} more...`;
  }
  message += `\n\n`;

  // Missing critical keywords
  if (critical_missing && critical_missing.length > 0) {
    message += `⚠️ *Critical Missing Keywords:*\n`;
    message += critical_missing.map(k => `   • ${k}`).join('\n');
    message += `\n\n`;
  }

  // Other missing keywords
  if (missing_keywords && missing_keywords.length > 0) {
    message += `❌ *Other Missing Keywords (${missing_keywords.length}):*\n`;
    message += missing_keywords.slice(0, 10).join(', ');
    if (missing_keywords.length > 10) {
      message += `, and ${missing_keywords.length - 10} more...`;
    }
    message += `\n\n`;
  }

  message += `📄 *Optimized resume will be sent as a separate file.*`;

  return message;
}
