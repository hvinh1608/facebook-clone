import { PrismaClient, Role, UserStatus, Privacy, ReactionType, RequestStatus, MediaType, GroupRole, GroupMemberStatus, ReportTargetType, ReportStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-calculated bcrypt hash for password "password123"
const PASSWORD_HASH = '$2a$10$0QcS2.uHMlsG31WU4tft4.a88A4m0tvoK.imkC.ni6u7X0gyd2Oha';

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.report.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.postMedia.deleteMany();
  await prisma.commentReaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.post.deleteMany();
  await prisma.storyView.deleteMany();
  await prisma.story.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing database tables.');

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@nexus.com',
      passwordHash: PASSWORD_HASH,
      isVerified: true,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          displayName: 'System Admin',
          bio: 'Nexus Social Network Administrator.',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          gender: 'Other',
          address: 'Silicon Valley, USA',
          relationship: 'Single',
        },
      },
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@nexus.com',
      passwordHash: PASSWORD_HASH,
      isVerified: true,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          displayName: 'Alice Vance',
          bio: 'UI/UX Designer & Photographer | Creating beautiful visual stories.',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          gender: 'Female',
          address: 'New York, USA',
          website: 'https://alicevance.photo',
          relationship: 'In a relationship',
        },
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@nexus.com',
      passwordHash: PASSWORD_HASH,
      isVerified: true,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          displayName: 'Bob Builder',
          bio: 'Fullstack Dev | Building the future of Web3.',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
          gender: 'Male',
          address: 'San Francisco, USA',
          website: 'https://bob.dev',
          relationship: 'Single',
        },
      },
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@nexus.com',
      passwordHash: PASSWORD_HASH,
      isVerified: true,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          displayName: 'Charlie Green',
          bio: 'Nature enthusiast & traveler. Exploring the hidden corners of the world 🏔️',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1472214222541-d510753a4907?auto=format&fit=crop&w=800&q=80',
          gender: 'Male',
          address: 'Vancouver, Canada',
          relationship: 'Married',
        },
      },
    },
  });

  const david = await prisma.user.create({
    data: {
      email: 'david@nexus.com',
      passwordHash: PASSWORD_HASH,
      isVerified: true,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          displayName: 'David Miller',
          bio: 'Fitness coach | Helping people live healthier and happier.',
          avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
          gender: 'Male',
          address: 'London, UK',
          relationship: 'Single',
        },
      },
    },
  });

  const eva = await prisma.user.create({
    data: {
      email: 'eva@nexus.com',
      passwordHash: PASSWORD_HASH,
      isVerified: true,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          displayName: 'Eva Taylor',
          bio: 'Singer, songwriter, and live performer 🎤✨',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
          gender: 'Female',
          address: 'Paris, France',
          relationship: 'Complicated',
        },
      },
    },
  });

  console.log('Seeded Users.');

  // 3. Create Friendships & Requests
  // Alice is friends with Bob and Charlie
  await prisma.friendship.createMany({
    data: [
      { user1Id: alice.id, user2Id: bob.id },
      { user1Id: alice.id, user2Id: charlie.id },
      { user1Id: bob.id, user2Id: david.id },
    ],
  });

  // Friend Requests:
  // David sent friend request to Alice (Pending)
  // Eva sent friend request to Alice (Pending)
  // Alice sent friend request to David (declined, represented as PENDING/DECLINED/etc.)
  await prisma.friendRequest.createMany({
    data: [
      { senderId: david.id, receiverId: alice.id, status: RequestStatus.PENDING },
      { senderId: eva.id, receiverId: alice.id, status: RequestStatus.PENDING },
      { senderId: charlie.id, receiverId: david.id, status: RequestStatus.PENDING },
    ],
  });

  // Follows
  await prisma.follow.createMany({
    data: [
      { followerId: alice.id, followingId: bob.id },
      { followerId: bob.id, followingId: alice.id },
      { followerId: charlie.id, followingId: alice.id },
      { followerId: eva.id, followingId: alice.id },
    ],
  });

  console.log('Seeded Friendships, Requests, and Follows.');

  // 4. Create Groups
  const techGroup = await prisma.group.create({
    data: {
      name: 'Tech Enthusiasts & Coders',
      description: 'A community for developers, engineers, and tech geeks to share projects and discuss technologies.',
      privacy: Privacy.PUBLIC,
      creatorId: bob.id,
      avatarUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=150&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    },
  });

  const photoGroup = await prisma.group.create({
    data: {
      name: 'Beautiful Photography World',
      description: 'Share your best captures and get creative feedback on your photos.',
      privacy: Privacy.PUBLIC,
      creatorId: alice.id,
      avatarUrl: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d84a?auto=format&fit=crop&w=150&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d84a?auto=format&fit=crop&w=800&q=80',
    },
  });

  // Group members
  await prisma.groupMember.createMany({
    data: [
      { groupId: techGroup.id, userId: bob.id, role: GroupRole.ADMIN, status: GroupMemberStatus.APPROVED },
      { groupId: techGroup.id, userId: alice.id, role: GroupRole.MEMBER, status: GroupMemberStatus.APPROVED },
      { groupId: techGroup.id, userId: charlie.id, role: GroupRole.MEMBER, status: GroupMemberStatus.APPROVED },
      { groupId: techGroup.id, userId: david.id, role: GroupRole.MEMBER, status: GroupMemberStatus.PENDING }, // Pending membership

      { groupId: photoGroup.id, userId: alice.id, role: GroupRole.ADMIN, status: GroupMemberStatus.APPROVED },
      { groupId: photoGroup.id, userId: charlie.id, role: GroupRole.MEMBER, status: GroupMemberStatus.APPROVED },
      { groupId: photoGroup.id, userId: eva.id, role: GroupRole.MEMBER, status: GroupMemberStatus.APPROVED },
    ],
  });

  console.log('Seeded Groups.');

  // 5. Create Posts, Media, Comments, and Reactions
  // Post 1: Alice's photography post
  const post1 = await prisma.post.create({
    data: {
      authorId: alice.id,
      content: 'Just captured this beautiful sunset in Yosemite. Nature never fails to amaze me! 🌅🏔️ #sunset #yosemite',
      privacy: Privacy.PUBLIC,
      location: 'Yosemite National Park',
      feeling: 'grateful',
      media: {
        create: [
          {
            type: MediaType.IMAGE,
            url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80',
          },
        ],
      },
    },
  });

  // Post 2: Bob's coding post
  const post2 = await prisma.post.create({
    data: {
      authorId: bob.id,
      content: 'Configuring Next.js App Router + TypeScript + Tailwind. The developer experience is amazing! Who is coding today?',
      privacy: Privacy.PUBLIC,
      feeling: 'excited',
    },
  });

  // Post 3: Charlie's group post (in techGroup)
  const post3 = await prisma.post.create({
    data: {
      authorId: charlie.id,
      groupId: techGroup.id,
      content: 'Hello everyone! Glad to join this tech group. What is your go-to database ORM for Node.js projects?',
      privacy: Privacy.PUBLIC,
    },
  });

  // Post 4: Eva's private post
  const post4 = await prisma.post.create({
    data: {
      authorId: eva.id,
      content: 'Rehearsing for my upcoming acoustic show this weekend. Only my close friends can see this!',
      privacy: Privacy.FRIENDS,
    },
  });

  // Reactions for Post 1
  await prisma.reaction.createMany({
    data: [
      { postId: post1.id, userId: bob.id, type: ReactionType.LOVE },
      { postId: post1.id, userId: charlie.id, type: ReactionType.LIKE },
      { postId: post1.id, userId: eva.id, type: ReactionType.WOW },
    ],
  });

  // Reactions for Post 2
  await prisma.reaction.createMany({
    data: [
      { postId: post2.id, userId: alice.id, type: ReactionType.LIKE },
      { postId: post2.id, userId: charlie.id, type: ReactionType.HAHA },
    ],
  });

  // Comments for Post 1
  const comment1 = await prisma.comment.create({
    data: {
      postId: post1.id,
      authorId: bob.id,
      content: 'Wow, this shot is breathtaking, Alice! What lens did you use?',
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      postId: post1.id,
      authorId: charlie.id,
      content: 'Amazing! I need to visit Yosemite soon.',
    },
  });

  // Reply to comment 1
  await prisma.comment.create({
    data: {
      postId: post1.id,
      authorId: alice.id,
      parentId: comment1.id,
      content: 'Thank you Bob! I used a Sony 24-70mm f/2.8 GM lens.',
    },
  });

  // Comment reactions
  await prisma.commentReaction.create({
    data: {
      commentId: comment1.id,
      userId: alice.id,
      type: ReactionType.LOVE,
    },
  });

  // Saved Posts
  await prisma.savedPost.create({
    data: {
      userId: bob.id,
      postId: post1.id,
    },
  });

  console.log('Seeded Posts, Comments, and Reactions.');

  // 6. Create Realtime Chat (Conversations and Messages)
  // Conversation 1: 1-1 Chat Alice & Bob
  const chat1 = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: alice.id },
          { userId: bob.id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: chat1.id, senderId: alice.id, content: 'Hey Bob! Are you free to review my project design layout today?', isRead: true },
      { conversationId: chat1.id, senderId: bob.id, content: 'Hey Alice! Sure, send it over. I will take a look in about 30 minutes.', isRead: true },
      { conversationId: chat1.id, senderId: alice.id, content: 'Awesome! Here is the screenshot.', isRead: false },
      { conversationId: chat1.id, senderId: alice.id, mediaUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=500&q=80', mediaType: MediaType.IMAGE, isRead: false },
    ],
  });

  // Conversation 2: Group Chat (Alice, Bob, Charlie)
  const chat2 = await prisma.conversation.create({
    data: {
      name: 'Designers & Devs Collaboration',
      isGroup: true,
      creatorId: alice.id,
      members: {
        create: [
          { userId: alice.id, isAdmin: true },
          { userId: bob.id, isAdmin: false },
          { userId: charlie.id, isAdmin: false },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: chat2.id, senderId: alice.id, content: 'Welcome everyone to the design-dev collaboration room!', isRead: true },
      { conversationId: chat2.id, senderId: charlie.id, content: 'Glad to be here. Thanks for creating this, Alice!', isRead: true },
      { conversationId: chat2.id, senderId: bob.id, content: 'Let us build something incredible! 🚀', isRead: false },
    ],
  });

  console.log('Seeded Conversations and Messages.');

  // 7. Create Notifications
  await prisma.notification.createMany({
    data: [
      // Like notify
      { receiverId: alice.id, senderId: bob.id, type: 'LIKE', entityId: post1.id, isRead: false },
      // Comment notify
      { receiverId: alice.id, senderId: charlie.id, type: 'COMMENT', entityId: post1.id, isRead: false },
      // Friend Request notify
      { receiverId: alice.id, senderId: david.id, type: 'FRIEND_REQUEST', entityId: david.id, isRead: false },
      // Group Accept notify
      { receiverId: bob.id, senderId: techGroup.creatorId, type: 'FRIEND_ACCEPT', entityId: alice.id, isRead: true },
    ],
  });

  console.log('Seeded Notifications.');

  // 8. Create Stories
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const expiredDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Already expired 2 hours ago

  const story1 = await prisma.story.create({
    data: {
      userId: alice.id,
      mediaUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=500&q=80',
      mediaType: MediaType.IMAGE,
      expiresAt: tomorrow,
    },
  });

  const story2 = await prisma.story.create({
    data: {
      userId: bob.id,
      mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=500&q=80',
      mediaType: MediaType.IMAGE,
      expiresAt: tomorrow,
    },
  });

  // Expired story
  await prisma.story.create({
    data: {
      userId: charlie.id,
      mediaUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=80',
      mediaType: MediaType.IMAGE,
      expiresAt: expiredDate,
    },
  });

  // Story views
  await prisma.storyView.create({
    data: {
      storyId: story1.id,
      userId: bob.id,
    },
  });

  await prisma.storyView.create({
    data: {
      storyId: story1.id,
      userId: charlie.id,
    },
  });

  console.log('Seeded Stories.');

  // 9. Reports
  await prisma.report.create({
    data: {
      reporterId: eva.id,
      targetType: ReportTargetType.POST,
      targetId: post2.id,
      reason: 'Spamming advertisement links in public coding discussion.',
      status: ReportStatus.PENDING,
    },
  });

  console.log('Seeded Reports.');

  console.log('Database seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
