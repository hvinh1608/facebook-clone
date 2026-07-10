import { prisma, Privacy } from 'database';

export async function getUserSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId } });
  }
  return settings;
}

export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  if (userId1 === userId2) return true;
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: userId1, user2Id: userId2 },
        { user1Id: userId2, user2Id: userId1 },
      ],
    },
  });
  return !!friendship;
}

async function isBlocked(userId1: string, userId2: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    },
  });
  return !!block;
}

export async function canViewProfile(viewerId: string, targetUserId: string): Promise<boolean> {
  if (viewerId === targetUserId) return true;

  if (await isBlocked(viewerId, targetUserId)) return false;

  const settings = await getUserSettings(targetUserId);
  const visibility = settings.profileVisibility;

  if (visibility === Privacy.PUBLIC) return true;
  if (visibility === Privacy.ONLY_ME || visibility === Privacy.PRIVATE) return false;
  if (visibility === Privacy.FRIENDS) return areFriends(viewerId, targetUserId);

  return true;
}

export async function canSendMessage(senderId: string, receiverId: string): Promise<boolean> {
  if (senderId === receiverId) return false;
  if (await isBlocked(senderId, receiverId)) return false;

  const settings = await getUserSettings(receiverId);
  const whoCanMessage = settings.whoCanMessage;

  if (whoCanMessage === 'NO_ONE') return false;
  if (whoCanMessage === 'EVERYONE') return true;
  if (whoCanMessage === 'FRIENDS') return areFriends(senderId, receiverId);

  return true;
}

export async function canSendFriendRequest(senderId: string, receiverId: string): Promise<boolean> {
  if (senderId === receiverId) return false;
  if (await isBlocked(senderId, receiverId)) return false;

  const settings = await getUserSettings(receiverId);
  const whoCanFriendRequest = settings.whoCanFriendRequest;

  if (whoCanFriendRequest === 'NO_ONE') return false;
  if (whoCanFriendRequest === 'EVERYONE') return true;
  if (whoCanFriendRequest === 'FRIENDS_OF_FRIENDS') {
    if (await areFriends(senderId, receiverId)) return true;
    const senderFriends = await prisma.friendship.findMany({
      where: { OR: [{ user1Id: senderId }, { user2Id: senderId }] },
    });
    const senderFriendIds = senderFriends.map((f) =>
      f.user1Id === senderId ? f.user2Id : f.user1Id
    );
    if (senderFriendIds.length === 0) return false;
    const mutual = await prisma.friendship.findFirst({
      where: {
        OR: senderFriendIds.flatMap((fid) => [
          { user1Id: fid, user2Id: receiverId },
          { user1Id: receiverId, user2Id: fid },
        ]),
      },
    });
    return !!mutual;
  }
  if (whoCanFriendRequest === 'FRIENDS') return areFriends(senderId, receiverId);

  return true;
}
