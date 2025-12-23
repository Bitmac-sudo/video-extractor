const puppeteer = require('puppeteer');
const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// الحصول على المعلومات من إعدادات البيئة في Render
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// دالة لإرسال الرسائل إلى التلغرام
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        console.log("✅ تم إرسال الروابط بنجاح إلى تلغرام.");
    } catch (error) {
        console.error("❌ خطأ في إرسال الرسالة لتلغرام:", error.message);
    }
}

// دالة فحص موقع ايجي ديد واستخراج الروابط
async function startScraping() {
    console.log("🔍 بدء فحص موقع ايجي ديد الآن...");
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // 1. التوجه لقسم الأفلام (يمكنك تغيير الرابط لأي قسم آخر)
        await page.goto('https://egydead.media/category/%d8%a7%d9%81%d9%84%d8%a7%d9%85-%d9%83%d8%b1%d8%tu%d9%86/', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // 2. سحب رابط أحدث فيلم مضاف
        const movieLink = await page.evaluate(() => {
            const item = document.querySelector('.movieItem a');
            return item ? item.href : null;
        });

        if (movieLink) {
            console.log(`🎬 تم العثور على فيلم: ${movieLink}`);
            await page.goto(movieLink, { waitUntil: 'domcontentloaded' });

            // 3. استخراج روابط سيرفرات المشاهدة
            const videoData = await page.evaluate(() => {
                const title = document.querySelector('h1')?.innerText || "بدون عنوان";
                const frames = Array.from(document.querySelectorAll('iframe'))
                                    .map(f => f.src)
                                    .filter(src => src.includes('http')); // تصفية الروابط الحقيقية
                return { title, frames };
            });

            // 4. إرسال النتائج إذا وجدت
            if (videoData.frames.length > 0) {
                let report = `<b>🎬 فيلم جديد تم اكتشافه:</b>\n`;
                report += `<b>📌 العنوان:</b> ${videoData.title}\n\n`;
                report += `<b>🔗 روابط السيرفرات المستخرجة:</b>\n`;
                
                videoData.frames.forEach((link, index) => {
                    report += `✅ سيرفر ${index + 1}: ${link}\n\n`;
                });

                await sendToTelegram(report);
            } else {
                console.log("⚠️ لم يتم العثور على سيرفرات فيديو داخل هذه الصفحة.");
            }
        }
    } catch (err) {
        console.error("❌ حدث خطأ أثناء عملية الاستخراج:", err.message);
    } finally {
        if (browser) await browser.close();
    }
}

// إعداد السيرفر ليبقى يعمل على Render
app.get('/', (req, res) => {
    res.send('<h1>سيرفر استخراج الروابط يعمل بنجاح!</h1><p>سيقوم البوت بإرسال الروابط لتلغرام تلقائياً.</p>');
});

app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على منفذ: ${PORT}`);
    
    // تشغيل الفحص لأول مرة عند إقلاع السيرفر
    startScraping();
    
    // تكرار العملية تلقائياً كل 30 دقيقة
    setInterval(startScraping, 30 * 60 * 1000);
});
