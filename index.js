const puppeteer = require('puppeteer');
const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// المعلومات التي قدمتها لي تم وضعها هنا مباشرة
const TELEGRAM_TOKEN = 'ضع_هنا_التوكن_الذي_أخذته_من_BotFather'; // استبدل هذا السطر بالتوكن الطويل من BotFather
const CHAT_ID = '1544455907'; // هويتك الرقمية يا فهد

async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        console.log("✅ أرسلت لك الروابط على تلغرام يا فهد.");
    } catch (error) {
        console.error("❌ مشكلة في الإرسال:", error.message);
    }
}

async function startScraping() {
    console.log("🔍 فهد، أنا الآن أبحث في ايجي ديد...");
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // التوجه لقسم الكرتون
        await page.goto('https://egydead.media/category/%d8%a7%d9%81%d9%84%d8%a7%d9%85-%d9%83%d8%b1%d8%tu%d9%86/', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        const movieLink = await page.evaluate(() => document.querySelector('.movieItem a')?.href);

        if (movieLink) {
            await page.goto(movieLink, { waitUntil: 'domcontentloaded' });

            const videoData = await page.evaluate(() => {
                const title = document.querySelector('h1')?.innerText || "فيلم غير مسمى";
                const frames = Array.from(document.querySelectorAll('iframe'))
                                    .map(f => f.src)
                                    .filter(src => src.startsWith('http'));
                return { title, frames };
            });

            if (videoData.frames.length > 0) {
                let report = `<b>🎬 فهد، استخرجت لك روابط جديدة:</b>\n`;
                report += `<b>📌 الفيلم:</b> ${videoData.title}\n\n`;
                
                videoData.frames.forEach((link, index) => {
                    report += `✅ سيرفر ${index + 1}: ${link}\n\n`;
                });

                await sendToTelegram(report);
            }
        }
    } catch (err) {
        console.error("❌ خطأ:", err.message);
    } finally {
        if (browser) await browser.close();
    }
}

app.get('/', (req, res) => {
    res.send('<h1>سيرفر فهد يعمل الآن!</h1>');
});

app.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال يا فهد على منفذ: ${PORT}`);
    startScraping();
    // يفحص كل 30 دقيقة
    setInterval(startScraping, 30 * 60 * 1000);
});

