# 🤖 ATS Resume Analyzer Telegram Bot

A Telegram bot that analyzes resumes against job descriptions using AI (OpenAI GPT-4) to provide ATS compatibility scores, keyword analysis, and 3 professionally formatted resume PDFs.

## ✨ Features

- 📊 **ATS Score Analysis** - Get detailed compatibility scores (0-100)
- 🔍 **Keyword Matching** - See which JD keywords are in your resume
- ⚠️ **Gap Identification** - Find critical missing keywords
- 📝 **Resume Optimization** - Get AI-rewritten, ATS-friendly content
- 🎨 **3 PDF Templates** - Receive resumes in 3 different professional styles
  - **ATS-Optimized** - Blue accent, clean layout (best for ATS)
  - **Modern Minimalist** - Teal accent, contemporary design
  - **Classic Professional** - Traditional, corporate-friendly
- 📄 **Multi-format Support** - Upload PDF, DOCX, or TXT files
- 💬 **Easy Telegram Interface** - Simple conversational flow

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Telegram account
- OpenAI API key
- Telegram bot token

### 1. Clone & Install

```bash
cd /Users/adityasingh/Dev/dr_code
npm install
```

### 2. Get Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token (looks like `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 3. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in / Create account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-`)

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your tokens
nano .env
```

Update `.env` with your actual values:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo
NODE_ENV=production
```

### 5. Run the Bot

```bash
# Production mode
npm start

# Development mode (auto-restart on changes)
npm run dev
```

You should see:
```
🚀 Starting ATS Telegram Bot...
✅ Bot is running!
📱 Bot username: @YourBotName
📊 Waiting for messages...
```

## 📱 How to Use

1. **Start the bot** - Open Telegram and search for your bot (use the username from BotFather)

2. **Begin analysis** - Send `/analyze`

3. **Upload Job Description** - Send the JD as:
   - Plain text (copy-paste)
   - File (PDF, DOCX, TXT)

4. **Upload Resume** - Send your resume as a file

5. **Get Results** - Receive:
   - ATS compatibility score
   - Keyword match analysis
   - Critical gaps
   - **3 optimized resume PDFs:**
     - Resume 1: ATS-Optimized (Blue Accent)
     - Resume 2: Modern Minimalist (Teal Accent)
     - Resume 3: Classic Professional (Traditional)
   - Actionable improvement suggestions

## 🎯 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and introduction |
| `/analyze` | Start new resume analysis |
| `/cancel` | Cancel current analysis session |
| `/help` | Show help and usage instructions |

## 📂 Project Structure

```
dr_code/
├── src/
│   ├── index.js                    # Main bot entry point
│   ├── services/
│   │   ├── atsAnalyzer.js         # OpenAI integration
│   │   └── documentParser.js      # PDF/DOCX parsing
│   ├── utils/
│   │   └── session.js             # Session management
│   └── prompts/
│       └── atsPrompt.js           # ATS analysis prompt
├── temp/                          # Temporary file storage
├── .env                           # Environment variables (create this)
├── .env.example                   # Example env file
├── package.json
└── README.md
```

## 🔧 Configuration

### OpenAI Models

Recommended models (set in `.env`):

- `gpt-4-turbo` - Best balance of speed and quality (recommended)
- `gpt-4o` - Faster, slightly less detailed
- `gpt-4` - Most thorough but slower and more expensive

### Supported File Formats

**Job Description & Resume:**
- PDF (`.pdf`)
- Word (`.docx`, `.doc`)
- Plain text (`.txt`)

## 💰 Cost Estimation

OpenAI API costs (approximate per analysis):

- **GPT-4 Turbo**: ~$0.10 - $0.30 per resume
- **GPT-4o**: ~$0.05 - $0.15 per resume

Typical resume + JD = ~5,000-10,000 tokens

## 🛡️ Privacy & Security

- Files are temporarily stored locally and deleted after processing
- No data is permanently stored by the bot
- Sessions are in-memory only (cleared on restart)
- For production: consider using Redis for sessions & encrypted storage

## 🐛 Troubleshooting

### Bot doesn't respond
```bash
# Check if bot is running
# Look for errors in console

# Verify token is correct
echo $TELEGRAM_BOT_TOKEN

# Test OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### "Failed to parse PDF"
- Ensure PDF is not password-protected
- Try converting to DOCX or TXT
- Check if file is corrupted

### OpenAI errors
- **Rate limit**: Wait a few minutes, OpenAI has usage limits
- **Invalid API key**: Double-check your `.env` file
- **Quota exceeded**: Add billing at platform.openai.com

### Out of memory
- Large PDFs may cause issues
- Try splitting resume into smaller files
- Increase Node.js memory: `node --max-old-space-size=4096 src/index.js`

## 🚀 Deployment

### Deploy to VPS (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone project
git clone <your-repo>
cd dr_code

# Install dependencies
npm install

# Setup .env
nano .env

# Install PM2 (process manager)
sudo npm install -g pm2

# Start bot with PM2
pm2 start src/index.js --name ats-bot

# Auto-restart on server reboot
pm2 startup
pm2 save

# View logs
pm2 logs ats-bot
```

### Deploy to Heroku

```bash
# Install Heroku CLI
# heroku login

# Create app
heroku create your-ats-bot

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set OPENAI_API_KEY=your_key
heroku config:set OPENAI_MODEL=gpt-4-turbo

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## 📊 Example Output

```
🎯 ATS Analysis Complete

🟢 Overall Score: 87/100

📊 Score Breakdown:
   • Keyword Match: 35/40
   • Experience Relevance: 28/30
   • Skills Alignment: 24/30

📝 Summary:
Strong match with excellent backend engineering experience. Resume demonstrates proficiency in most required technologies including Node.js, PostgreSQL, and AWS. Main gap is lack of explicit Kubernetes experience mentioned in requirements.

✅ Matched Keywords (42):
Node.js, JavaScript, TypeScript, REST API, PostgreSQL, MongoDB, AWS, Docker, Git, CI/CD, ...

⚠️ Critical Missing Keywords:
   • Kubernetes
   • Microservices architecture
   • GraphQL

📄 Optimized resume will be sent as a separate file.
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🆘 Support

- **Issues**: Open an issue on GitHub
- **Questions**: Contact the maintainer

## 🔮 Future Enhancements

- [ ] Redis session storage for multi-server deployment
- [ ] Web dashboard for historical analysis
- [ ] LinkedIn profile import
- [ ] Cover letter generation
- [ ] Multi-language support
- [ ] Interview question generation based on JD
- [ ] Batch processing for multiple resumes

---

**Built with ❤️ using Node.js, Telegraf, and OpenAI GPT-4**
