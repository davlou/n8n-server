const express = require('express');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json({ limit: '10mb' }));

const defaultLaunchOptions = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ],
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'puppeteer-api' });
});

// HTML to PDF
app.post('/pdf', async (req, res) => {
  let browser;

  try {
    const { html, url, options = {} } = req.body;

    if (!html && !url) {
      return res.status(400).json({ error: 'Either html or url is required' });
    }

    browser = await puppeteer.launch(defaultLaunchOptions);

    const page = await browser.newPage();

    if (html) {
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    } else {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    }

    const pdfOptions = {
      format: options.format || 'A4',
      printBackground: options.printBackground !== false,
      margin: options.margin || {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    };

    const pdfBuffer = await page.pdf(pdfOptions);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="output.pdf"'
    });
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Puppeteer error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Screenshot
app.post('/screenshot', async (req, res) => {
  let browser;

  try {
    const { html, url, options = {} } = req.body;

    if (!html && !url) {
      return res.status(400).json({ error: 'Either html or url is required' });
    }

    browser = await puppeteer.launch(defaultLaunchOptions);

    const page = await browser.newPage();

    if (options.viewport) {
      await page.setViewport(options.viewport);
    }

    if (html) {
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    } else {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    }

    const screenshotOptions = {
      type: options.type || 'png',
      fullPage: options.fullPage !== false
    };

    if (options.quality && screenshotOptions.type === 'jpeg') {
      screenshotOptions.quality = options.quality;
    }

    const screenshot = await page.screenshot(screenshotOptions);

    res.set({
      'Content-Type': `image/${screenshotOptions.type}`,
      'Content-Disposition': `attachment; filename="screenshot.${screenshotOptions.type}"`
    });
    res.send(screenshot);

  } catch (error) {
    console.error('Puppeteer error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Get page content
app.post('/content', async (req, res) => {
  let browser;

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    browser = await puppeteer.launch(defaultLaunchOptions);

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    const content = await page.content();
    const title = await page.title();

    res.json({ title, content });

  } catch (error) {
    console.error('Puppeteer error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Execute custom script
app.post('/execute', async (req, res) => {
  let browser;

  try {
    const { url, script } = req.body;

    if (!url || !script) {
      return res.status(400).json({ error: 'url and script are required' });
    }

    browser = await puppeteer.launch(defaultLaunchOptions);

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    const result = await page.evaluate(script);

    res.json({ result });

  } catch (error) {
    console.error('Puppeteer error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Puppeteer API running on port ${PORT}`);
});