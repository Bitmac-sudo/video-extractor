const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Endpoint لعرض روابط الفيديوهات
app.get('/videos', (req, res) => {
  res.json({
    video1: process.env.VIDEO1,
    video2: process.env.VIDEO2,
    video3: process.env.VIDEO3
  });
});

// صفحة رئيسية للتأكد من تشغيل السيرفر
app.get('/', (req, res) => {
  res.send('تم تشغيل السيرفر الخاص بك بنجاح على Render!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
