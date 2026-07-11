import { PrismaClient, MediaType, Privacy } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_USER_EMAILS = [
  'nguyenvana@gmail.com',
  'tranthib@gmail.com',
  'leminhc@gmail.com',
  'phamthid@gmail.com',
  'hoangvane@gmail.com',
  'vuthif@gmail.com',
];

const SAMPLE_VIDEOS = [
  {
    authorEmail: 'tranthib@gmail.com',
    content: 'Review quán cà phê view đẹp ở Sài Gòn ☕ #shorts',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    authorEmail: 'hoangvane@gmail.com',
    content: 'Mukbang bún bò Huế chuẩn vị 🍜',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    authorEmail: 'leminhc@gmail.com',
    content: 'Setup bàn làm việc tại nhà cho dev 💻',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    authorEmail: 'vuthif@gmail.com',
    content: 'Yoga buổi sáng tại Nha Trang 🧘‍♀️',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    authorEmail: 'nguyenvana@gmail.com',
    content: 'Hà Nội mùa thu — đi phố cổ một ngày 🍂',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
];

const SAMPLE_MARKETPLACE = [
  {
    sellerEmail: 'nguyenvana@gmail.com',
    title: 'MacBook Air M2 2023 — 256GB',
    description: 'Máy zin 99%, pin 96%, kèm hộp và sạc. Bảo hành 3 tháng shop.',
    price: 18500000,
    location: 'Hà Nội',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
  {
    sellerEmail: 'tranthib@gmail.com',
    title: 'iPhone 14 Pro Max 128GB',
    description: 'Deep Purple, ít dùng, không cấn móp. Giao tay quận 1.',
    price: 16900000,
    location: 'TP. Hồ Chí Minh',
    imageUrl: 'https://images.unsplash.com/photo-1678652197831-2b924a37c8ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    sellerEmail: 'leminhc@gmail.com',
    title: 'Bàn gaming + ghế ergonomic',
    description: 'Full set bàn 120cm + ghế có tựa đầu. Thanh lý do chuyển nhà.',
    price: 3200000,
    location: 'Đà Nẵng',
    imageUrl: 'https://images.unsplash.com/photo-1593640495253-ab9de414c07a?auto=format&fit=crop&w=800&q=80',
  },
  {
    sellerEmail: 'phamthid@gmail.com',
    title: 'Túi xách Charles & Keith mới',
    description: 'Hàng auth mua tại store, còn tag. Màu be trung tính.',
    price: 890000,
    location: 'Hải Phòng',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89e76a861a?auto=format&fit=crop&w=800&q=80',
  },
  {
    sellerEmail: 'hoangvane@gmail.com',
    title: 'Nồi chiên không dầu 5.5L',
    description: 'Dùng 4 tháng, còn bảo hành. Kèm giá đỡ và sách nấu ăn.',
    price: 750000,
    location: 'Cần Thơ',
    imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
  },
  {
    sellerEmail: 'vuthif@gmail.com',
    title: 'Sách IELTS Cambridge 18 + 19',
    description: 'Bộ 2 cuốn full 4 kỹ năng, viết ít, không bút highlight.',
    price: 420000,
    location: 'Nha Trang',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
  },
];

const SAMPLE_EVENTS = [
  {
    creatorEmail: 'phamthid@gmail.com',
    title: 'Workshop Marketing 2026 — Miền Bắc',
    description: 'Chia sẻ chiến lược content và chạy ads Facebook/TikTok cho SME Việt Nam.',
    location: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
    startAt: new Date('2026-08-15T09:00:00+07:00'),
    endAt: new Date('2026-08-15T17:00:00+07:00'),
    coverUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  },
  {
    creatorEmail: 'tranthib@gmail.com',
    title: 'Meetup Designer Sài Gòn',
    description: 'Giao lưu UI/UX, portfolio review và networking buổi tối.',
    location: 'The Workshop Café, Quận 3, TP.HCM',
    startAt: new Date('2026-07-25T18:30:00+07:00'),
    endAt: new Date('2026-07-25T21:30:00+07:00'),
    coverUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
  },
  {
    creatorEmail: 'leminhc@gmail.com',
    title: 'Hackathon Sinh viên Đà Nẵng',
    description: '48 giờ lập trình chủ đề du lịch thông minh. Cơ cấu giải 50 triệu.',
    location: 'FPT University Đà Nẵng',
    startAt: new Date('2026-09-05T08:00:00+07:00'),
    endAt: new Date('2026-09-07T18:00:00+07:00'),
    coverUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  },
  {
    creatorEmail: 'hoangvane@gmail.com',
    title: 'Lễ hội Ẩm thực Đường phố Cần Thơ',
    description: 'Hơn 50 gian hàng đặc sản miền Tây, biểu diễn nghệ thuật cuối tuần.',
    location: 'Bến Ninh Kiều, Cần Thơ',
    startAt: new Date('2026-07-20T10:00:00+07:00'),
    endAt: new Date('2026-07-20T22:00:00+07:00'),
    coverUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  },
  {
    creatorEmail: 'vuthif@gmail.com',
    title: 'Yoga & Wellness Sunrise Nha Trang',
    description: 'Buổi yoga sáng bên biển, phù hợp mọi trình độ. Mang theo thảm riêng.',
    location: 'Bãi biển Trần Phú, Nha Trang',
    startAt: new Date('2026-07-18T05:30:00+07:00'),
    endAt: new Date('2026-07-18T07:00:00+07:00'),
    coverUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
  },
];

const SAMPLE_PAGES = [
  {
    ownerEmail: 'nguyenvana@gmail.com',
    name: 'TechZone Việt Nam',
    description: 'Chuyên laptop, phụ kiện công nghệ chính hãng. Giao nhanh toàn quốc.',
    category: 'Cửa hàng điện tử',
    avatarUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80',
  },
  {
    ownerEmail: 'tranthib@gmail.com',
    name: 'Bích Design Studio',
    description: 'Thiết kế logo, banner, UI app. Portfolio 200+ dự án trong nước.',
    category: 'Dịch vụ sáng tạo',
    avatarUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
  },
  {
    ownerEmail: 'hoangvane@gmail.com',
    name: 'Ẩm Thực Miền Tây',
    description: 'Đặc sản khô, mắm, trái cây theo mùa. Ship COD toàn quốc.',
    category: 'Thực phẩm',
    avatarUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  },
];

async function getUserIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  return user?.id ?? null;
}

async function main() {
  console.log('Adding sample videos, marketplace, events, and pages...');

  const userIds = new Map<string, string>();
  for (const email of SAMPLE_USER_EMAILS) {
    const id = await getUserIdByEmail(email);
    if (id) userIds.set(email, id);
    else console.warn(`User not found: ${email} — run db:seed:vi first`);
  }

  // Videos (Reels / Watch)
  for (const video of SAMPLE_VIDEOS) {
    const authorId = userIds.get(video.authorEmail);
    if (!authorId) continue;

    const exists = await prisma.post.findFirst({
      where: { authorId, content: video.content },
    });
    if (exists) {
      console.log(`Skip video post: ${video.content.slice(0, 40)}...`);
      continue;
    }

    await prisma.post.create({
      data: {
        authorId,
        content: video.content,
        privacy: Privacy.PUBLIC,
        media: {
          create: {
            type: MediaType.VIDEO,
            url: video.videoUrl,
          },
        },
      },
    });
    console.log(`Video: ${video.content.slice(0, 50)}...`);
  }

  // Marketplace
  for (const item of SAMPLE_MARKETPLACE) {
    const sellerId = userIds.get(item.sellerEmail);
    if (!sellerId) continue;

    const exists = await prisma.marketplaceListing.findFirst({
      where: { sellerId, title: item.title },
    });
    if (exists) {
      console.log(`Skip listing: ${item.title}`);
      continue;
    }

    await prisma.marketplaceListing.create({
      data: {
        sellerId,
        title: item.title,
        description: item.description,
        price: item.price,
        location: item.location,
        imageUrl: item.imageUrl,
        status: 'ACTIVE',
      },
    });
    console.log(`Listing: ${item.title}`);
  }

  // Events
  const createdEvents: { id: string; title: string }[] = [];
  for (const event of SAMPLE_EVENTS) {
    const creatorId = userIds.get(event.creatorEmail);
    if (!creatorId) continue;

    const exists = await prisma.event.findFirst({
      where: { creatorId, title: event.title },
    });
    if (exists) {
      console.log(`Skip event: ${event.title}`);
      createdEvents.push({ id: exists.id, title: event.title });
      continue;
    }

    const created = await prisma.event.create({
      data: {
        creatorId,
        title: event.title,
        description: event.description,
        location: event.location,
        startAt: event.startAt,
        endAt: event.endAt,
        coverUrl: event.coverUrl,
      },
    });
    createdEvents.push({ id: created.id, title: event.title });
    console.log(`Event: ${event.title}`);
  }

  // Event attendees
  const attendeeEmails = ['nguyenvana@gmail.com', 'tranthib@gmail.com', 'leminhc@gmail.com'];
  for (const event of createdEvents.slice(0, 3)) {
    for (const email of attendeeEmails) {
      const userId = userIds.get(email);
      if (!userId) continue;
      await prisma.eventAttendee.upsert({
        where: { eventId_userId: { eventId: event.id, userId } },
        update: { status: 'GOING' },
        create: { eventId: event.id, userId, status: 'GOING' },
      });
    }
  }

  // Pages (cửa hàng / trang)
  for (const page of SAMPLE_PAGES) {
    const ownerId = userIds.get(page.ownerEmail);
    if (!ownerId) continue;

    const exists = await prisma.page.findFirst({
      where: { ownerId, name: page.name },
    });
    if (exists) {
      console.log(`Skip page: ${page.name}`);
      continue;
    }

    await prisma.page.create({
      data: {
        ownerId,
        name: page.name,
        description: page.description,
        category: page.category,
        avatarUrl: page.avatarUrl,
        coverUrl: page.coverUrl,
      },
    });
    console.log(`Page: ${page.name}`);
  }

  console.log('\nDone!');
  console.log('  - 5 video posts (Reels / Watch)');
  console.log('  - 6 marketplace listings');
  console.log('  - 5 events + attendees');
  console.log('  - 3 pages (cửa hàng)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
