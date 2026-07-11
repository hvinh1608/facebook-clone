import { prisma } from 'database';
import { sendRealtimeNotification } from '../socket';

export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'NEW_MESSAGE'
  | 'SHARE';

interface CreateNotificationParams {
  receiverId: string;
  senderId?: string | null;
  type: NotificationType;
  entityId?: string | null;
}

async function shouldNotify(receiverId: string, type: NotificationType): Promise<boolean> {
  const settings = await prisma.userSettings.findUnique({ where: { userId: receiverId } });
  if (!settings) return true;
  switch (type) {
    case 'LIKE':
      return settings.notifyLike;
    case 'COMMENT':
      return settings.notifyComment;
    case 'SHARE':
      return settings.notifyShare;
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPT':
      return settings.notifyFriendRequest;
    case 'NEW_MESSAGE':
      return settings.notifyMessage;
    default:
      return true;
  }
}

export async function createAndPushNotification({
  receiverId,
  senderId,
  type,
  entityId,
}: CreateNotificationParams) {
  if (senderId && senderId === receiverId) return null;

  if (!(await shouldNotify(receiverId, type))) return null;

  const notification = await prisma.notification.create({
    data: {
      receiverId,
      senderId: senderId || null,
      type,
      entityId: entityId || null,
    },
    include: {
      sender: { include: { profile: true } },
    },
  });

  const formatted = {
    id: notification.id,
    type: notification.type,
    entityId: notification.entityId,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    sender: notification.sender
      ? {
          id: notification.sender.id,
          displayName: notification.sender.profile?.displayName,
          avatarUrl: notification.sender.profile?.avatarUrl,
        }
      : null,
  };

  sendRealtimeNotification(receiverId, formatted);
  return formatted;
}
