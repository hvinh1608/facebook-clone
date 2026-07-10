import { prisma } from 'database';

let lastCheckAt = new Date();

/** Kiểm tra bài đã lên lịch — feed tự hiện khi scheduledAt <= now */
export function startScheduledPostPublisher() {
  const intervalMs = 60_000;

  setInterval(async () => {
    try {
      const now = new Date();
      const dueCount = await prisma.post.count({
        where: {
          scheduledAt: { not: null, lte: now, gt: lastCheckAt },
        },
      });
      lastCheckAt = now;
      if (dueCount > 0) {
        console.log(`📅 ${dueCount} scheduled post(s) published`);
      }
    } catch (e) {
      console.error('Scheduled post publisher error:', e);
    }
  }, intervalMs);
}
