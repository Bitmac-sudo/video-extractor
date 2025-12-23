
const puppeteer = require('puppeteer');
const axios = require('axios');

// إعدادات التلغرام
const TELEGRAM_TOKEN = 'ضع_هنا_توكن_البوت';
const CHAT_ID = 'ضع_هنا_ايدي_حسابك';

async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await axios.post(url, { chat_id: CHAT_ID, text: message });
    } catch (error) {
        console.error("خطأ في إرسال التلغرام:", error.message);
    }
}

async function startScraping() {
    console.log("بدء عملية فحص الروابط في ايجي ديد...");
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    try {
        // 1. الدخول لموقع ايجي ديد (قسم الأفلام)
        await page.goto('https://egydead.media/category/%d8%a7%d9%81%d9%84%d8%a7%d9%85-%d9%83%d8%b1%d8%aa%d9%88%d9%86/', { waitUntil: 'networkidle2' });

        // 2. استخراج رابط أول فيلم (الأحدث)
        const latestMovieLink = await page.evaluate(() => {
            return document.querySelector('.movieItem a')?.href;
        });

        if (latestMovieLink) {
            await page.goto(latestMovieLink, { waitUntil: 'domcontentloaded' });

            // 3. استخراج روابط السيرفرات (iframe)
            const videoLinks = await page.evaluate(() => {
                const frames = Array.from(document.querySelectorAll('iframe')).map(f => f.src);
                const title = document.querySelector('h1')?.innerText || "فيلم جديد";
                return { title, frames };
            });

            // 4. إرسال النتائج لتلغرام
            if (videoLinks.frames.length > 0) {
                let msg = `🎬 تم استخراج روابط لـ: ${videoLinks.title}\n\n`;
                videoLinks.frames.forEach((link, index) => {
                    msg += `🔗 سيرفر ${index + 1}: ${link}\n\n`;
                });
                await sendToTelegram(msg);
            }
        }

    } catch (e) {
        console.log("حدث خطأ:", e.message);
    } finally {
        await browser.close();
    }
}

// تشغيل الكود كل 30 دقيقة مثلاً بشكل تلقائي
setInterval(startScraping, 30 * 60 * 1000); 
startScraping(); // تشغيل فوري عند البدء
