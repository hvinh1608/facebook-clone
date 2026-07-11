import { PrismaClient, Role, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

// bcrypt hash for "password123"
const PASSWORD_HASH = '$2a$10$0QcS2.uHMlsG31WU4tft4.a88A4m0tvoK.imkC.ni6u7X0gyd2Oha';

const vietnameseUsers = [
  {
    email: 'nguyenvana@gmail.com',
    displayName: 'Nguyễn Văn An',
    bio: 'Lập trình viên tại Hà Nội | Yêu cà phê và code ☕',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    gender: 'Nam',
    address: 'Hà Nội, Việt Nam',
    relationship: 'Độc thân',
  },
  {
    email: 'tranthib@gmail.com',
    displayName: 'Trần Thị Bích',
    bio: 'Designer UI/UX | Thích chụp ảnh và du lịch 📸',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=800&q=80',
    gender: 'Nữ',
    address: 'TP. Hồ Chí Minh, Việt Nam',
    relationship: 'Đang hẹn hò',
  },
  {
    email: 'leminhc@gmail.com',
    displayName: 'Lê Minh Cường',
    bio: 'Sinh viên Đại học Bách Khoa | Backend developer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
    gender: 'Nam',
    address: 'Đà Nẵng, Việt Nam',
    relationship: 'Độc thân',
  },
  {
    email: 'phamthid@gmail.com',
    displayName: 'Phạm Thị Dung',
    bio: 'Marketing tại FPT | Yêu thích networking và sự kiện',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    gender: 'Nữ',
    address: 'Hải Phòng, Việt Nam',
    relationship: 'Đã kết hôn',
  },
  {
    email: 'hoangvane@gmail.com',
    displayName: 'Hoàng Văn Em',
    bio: 'Food blogger | Khám phá ẩm thực ba miền 🍜',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    gender: 'Nam',
    address: 'Cần Thơ, Việt Nam',
    relationship: 'Độc thân',
  },
  {
    email: 'vuthif@gmail.com',
    displayName: 'Vũ Thị Phương',
    bio: 'Giáo viên tiếng Anh | Đam mê đọc sách và yoga',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    gender: 'Nữ',
    address: 'Nha Trang, Việt Nam',
    relationship: 'Độc thân',
  },
];

async function main() {
  console.log('Adding Vietnamese sample users (existing data is kept)...');

  const createdUsers: { id: string; email: string; displayName: string }[] = [];

  for (const user of vietnameseUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (existing) {
      console.log(`Skip (exists): ${user.email}`);
      createdUsers.push({ id: existing.id, email: user.email, displayName: user.displayName });
      continue;
    }

    const created = await prisma.user.create({
      data: {
        email: user.email,
        passwordHash: PASSWORD_HASH,
        isVerified: true,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        profile: {
          create: {
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            coverUrl: user.coverUrl,
            gender: user.gender,
            address: user.address,
            relationship: user.relationship,
          },
        },
        userSettings: {
          create: {},
        },
      },
      include: { profile: true },
    });

    console.log(`Created: ${user.email} (${user.displayName})`);
    createdUsers.push({ id: created.id, email: user.email, displayName: user.displayName });
  }

  // Friendships between first 4 users
  const pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [2, 3],
    [3, 4],
    [4, 5],
  ];

  for (const [a, b] of pairs) {
    const u1 = createdUsers[a];
    const u2 = createdUsers[b];
    if (!u1 || !u2) continue;

    const [user1Id, user2Id] = u1.id < u2.id ? [u1.id, u2.id] : [u2.id, u1.id];
    await prisma.friendship.upsert({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      update: {},
      create: { user1Id, user2Id },
    });
  }

  // Sample posts
  const samplePosts = [
    { userIndex: 0, content: 'Chào mọi người! Hôm nay trời Hà Nội đẹp quá 🌤️' },
    { userIndex: 1, content: 'Vừa hoàn thành xong dự án mới, cảm ơn team đã support nhiều! 💪' },
    { userIndex: 2, content: 'Ai có tips học Node.js cho người mới không ạ?' },
    { userIndex: 4, content: 'Review quán phở ngon nhất Cần Thơ tuần này 🍜' },
  ];

  for (const post of samplePosts) {
    const author = createdUsers[post.userIndex];
    if (!author) continue;

    const exists = await prisma.post.findFirst({
      where: { authorId: author.id, content: post.content },
    });
    if (exists) continue;

    await prisma.post.create({
      data: {
        authorId: author.id,
        content: post.content,
      },
    });
    console.log(`Post by ${author.displayName}`);
  }

  console.log('\nDone! All accounts use password: password123');
  createdUsers.forEach((u) => console.log(`  - ${u.email} | ${u.displayName}`));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
