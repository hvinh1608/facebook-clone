-- Sửa URL video demo (Google thường bị chặn/chậm → đổi sang nguồn ổn định hơn)
-- Chạy trong Navicat → Query → Run

UPDATE "PostMedia"
SET url = 'https://www.w3schools.com/html/mov_bbb.mp4'
WHERE type = 'VIDEO'
  AND url LIKE '%ForBiggerBlazes%';

UPDATE "PostMedia"
SET url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
WHERE type = 'VIDEO'
  AND url LIKE '%ForBiggerEscapes%';

UPDATE "PostMedia"
SET url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
WHERE type = 'VIDEO'
  AND url LIKE '%ForBiggerFun%';

UPDATE "PostMedia"
SET url = 'https://www.w3schools.com/html/mov_bbb.mp4'
WHERE type = 'VIDEO'
  AND url LIKE '%ForBiggerJoyrides%';

UPDATE "PostMedia"
SET url = 'https://www.w3schools.com/html/mov_bbb.mp4'
WHERE type = 'VIDEO'
  AND url LIKE '%BigBuckBunny%';

UPDATE "PostMedia"
SET url = 'https://www.w3schools.com/html/mov_bbb.mp4'
WHERE type = 'VIDEO'
  AND url LIKE '%commondatastorage.googleapis.com%';

-- Kiểm tra sau khi sửa
SELECT id, type, url FROM "PostMedia" WHERE type = 'VIDEO';
