const puppeteer = require('puppeteer');
const axios = require('axios');
const express = require('express');
const app = express();

// المتغيرات (سيتم جلبها تلقائياً من Render)
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;

async function scrapeEgyDead() {
    console.log("جاري بدء عملية الجلب من ايجي ديد...");
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // الرابط الذي طلبته (قسم أفلام الكرتون)
        await page.goto('https://egydead.media/category/%d8%a7%d9%81%d9%84%d8%a7%d9%85-%d9%83%d8%b1%d8%aa%d9%88%d9%86/', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });

        // استخراج البيانات بناءً على كود HTML الموقع
        const movies = await page.evaluate(() => {
            let results = [];
            let items = document.querySelectorAll('.movieItem');
            items.forEach((item) => {
                let title = item.querySelector('h1.BottomTitle')?.innerText;
                let link = item.querySelector('a')?.href;
                let img = item.querySelector('img')?.src;
                if (title && link) {
                    results.push({ title, link, img });
                }
            });
            return results;
        });

        console.log(`تم العثور على ${movies.length} فيلم.`);

        // إرسال الأفلام للبوت
        for (let movie of movies) {
            const message = `🎬 *الفيلم:* ${movie.title}\n\n🔗 *الرابط:* ${movie.link}`;
            
            // إرسال الصورة مع الرابط
            await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
                chat_id: chatId,
                photo: movie.img,
                caption: message,
                parse_mode: 'Markdown'
            }).catch(err => console.log("خطأ في إرسال فيلم معين"));
            
            // تأخير بسيط لتجنب حظر التلجرام (Flood)
            await new Promise(r => setTimeout(r, 1000));
        }

    } catch (error) {
        console.error("حدث خطأ أثناء الجلب:", error.message);
    } finally {
        if (browser) await browser.close();
    }
}

// تشغيل السيرفر لضمان بقاء الخدمة تعمل على Render
app.get('/', (req, res) => res.send('بوت جلب الأفلام يعمل بنجاح!'));
app.listen(process.env.PORT || 3000, () => {
    console.log("السيرفر جاهز...");
    // تشغيل الجلب فور تشغيل السيرفر
    scrapeEgyDead();
});

// تكرار العملية كل 6 ساعات لجلب الجديد
setInterval(scrapeEgyDead, 6 * 60 * 60 * 1000);
