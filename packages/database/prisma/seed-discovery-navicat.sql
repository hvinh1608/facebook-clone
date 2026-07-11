-- Chạy trong Navicat (Neon) sau khi đã có user mẫu (db:seed:vi)
-- Query -> New Query -> Paste -> Run

-- VIDEO POSTS (Reels / Watch)
INSERT INTO "Post" (id, "authorId", content, privacy, "audienceUserIds", "excludedUserIds", "isPoll", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u.id, 'Review quán cà phê view đẹp ở Sài Gòn ☕ #shorts', 'PUBLIC', '{}', '{}', false, NOW(), NOW()
FROM "User" u WHERE u.email = 'tranthib@gmail.com'
AND NOT EXISTS (SELECT 1 FROM "Post" p WHERE p.content = 'Review quán cà phê view đẹp ở Sài Gòn ☕ #shorts');

INSERT INTO "PostMedia" (id, "postId", type, url, "createdAt")
SELECT gen_random_uuid(), p.id, 'VIDEO', 'https://www.w3schools.com/html/mov_bbb.mp4', NOW()
FROM "Post" p WHERE p.content = 'Review quán cà phê view đẹp ở Sài Gòn ☕ #shorts'
AND NOT EXISTS (SELECT 1 FROM "PostMedia" m JOIN "Post" p2 ON m."postId" = p2.id WHERE p2.content = 'Review quán cà phê view đẹp ở Sài Gòn ☕ #shorts');

INSERT INTO "Post" (id, "authorId", content, privacy, "audienceUserIds", "excludedUserIds", "isPoll", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u.id, 'Mukbang bún bò Huế chuẩn vị 🍜', 'PUBLIC', '{}', '{}', false, NOW(), NOW()
FROM "User" u WHERE u.email = 'hoangvane@gmail.com'
AND NOT EXISTS (SELECT 1 FROM "Post" p WHERE p.content = 'Mukbang bún bò Huế chuẩn vị 🍜');

INSERT INTO "PostMedia" (id, "postId", type, url, "createdAt")
SELECT gen_random_uuid(), p.id, 'VIDEO', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', NOW()
FROM "Post" p WHERE p.content = 'Mukbang bún bò Huế chuẩn vị 🍜'
AND NOT EXISTS (SELECT 1 FROM "PostMedia" m JOIN "Post" p2 ON m."postId" = p2.id WHERE p2.content = 'Mukbang bún bò Huế chuẩn vị 🍜');

-- MARKETPLACE
INSERT INTO "MarketplaceListing" (id, "sellerId", title, description, price, location, "imageUrl", status, "createdAt")
SELECT gen_random_uuid(), u.id, 'MacBook Air M2 2023 — 256GB', 'Máy zin 99%, pin 96%, kèm hộp và sạc.', 18500000, 'Hà Nội', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 'ACTIVE', NOW()
FROM "User" u WHERE u.email = 'nguyenvana@gmail.com'
AND NOT EXISTS (SELECT 1 FROM "MarketplaceListing" m WHERE m.title = 'MacBook Air M2 2023 — 256GB');

INSERT INTO "MarketplaceListing" (id, "sellerId", title, description, price, location, "imageUrl", status, "createdAt")
SELECT gen_random_uuid(), u.id, 'iPhone 14 Pro Max 128GB', 'Deep Purple, ít dùng, không cấn móp.', 16900000, 'TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1678652197831-2b924a37c8ab?auto=format&fit=crop&w=800&q=80', 'ACTIVE', NOW()
FROM "User" u WHERE u.email = 'tranthib@gmail.com'
AND NOT EXISTS (SELECT 1 FROM "MarketplaceListing" m WHERE m.title = 'iPhone 14 Pro Max 128GB');

INSERT INTO "MarketplaceListing" (id, "sellerId", title, description, price, location, "imageUrl", status, "createdAt")
SELECT gen_random_uuid(), u.id, 'Bàn gaming + ghế ergonomic', 'Full set bàn 120cm + ghế có tựa đầu.', 3200000, 'Đà Nẵng', 'https://images.unsplash.com/photo-1593640495253-ab9de414c07a?auto=format&fit=crop&w=800&q=80', 'ACTIVE', NOW()
FROM "User" u WHERE u.email = 'leminhc@gmail.com'
AND NOT EXISTS (SELECT 1 FROM "MarketplaceListing" m WHERE m.title = 'Bàn gaming + ghế ergonomic');

-- EVENTS
INSERT INTO "Event" (id, title, description, location, "startAt", "endAt", "coverUrl", "creatorId", "createdAt")
SELECT gen_random_uuid(), 'Meetup Designer Sài Gòn', 'Giao lưu UI/UX và networking buổi tối.', 'The Workshop Café, Quận 3, TP.HCM', '2026-07-25 18:30:00+07', '2026-07-25 21:30:00+07', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80', u.id, NOW()
FROM "User" u WHERE u.email = 'tranthib@gmail.com'
AND NOT EXISTS (SELECT 1 FROM "Event" e WHERE e.title = 'Meetup Designer Sài Gòn');

INSERT INTO "Event" (id, title, description, location, "startAt", "endAt", "coverUrl", "creatorId", "createdAt")
SELECT gen_random_uuid(), 'Lễ hội Ẩm thực Đường phố Cần Thơ', 'Hơn 50 gian hàng đặc sản miền Tây.', 'Bến Ninh Kiều, Cần Thơ', '2026-07-20 10:00:00+07', '2026-07-20 22:00:00+07', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', u.id, NOW()
FROM "User" u WHERE u.email = 'hoangvane@gmail.com'
AND NOT EXISTS (SELECT 1 FROM "Event" e WHERE e.title = 'Lễ hội Ẩm thực Đường phố Cần Thơ');

-- PAGES
INSERT INTO "Page" (id, name, description, "avatarUrl", "coverUrl", category, "ownerId", "createdAt")
SELECT gen_random_uuid(), 'TechZone Việt Nam', 'Chuyên laptop, phụ kiện công nghệ chính hãng.', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=150&q=80', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80', 'Cửa hàng điện tử', u.id, NOW()
FROM "User" u WHERE u.email = 'nguyenvana@gmail.com'
AND NOT EXISTS (SELECT 1 FROM "Page" pg WHERE pg.name = 'TechZone Việt Nam');
