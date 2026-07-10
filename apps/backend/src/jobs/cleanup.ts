import { prisma } from 'database';

export function startCleanupJobs() {
  const intervalMs = 60 * 60 * 1000; // hourly

  const runCleanup = async () => {
    try {
      const now = new Date();

      const expiredStories = await prisma.story.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      const expiredTokens = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: now } },
      });

      if (expiredStories.count > 0 || expiredTokens.count > 0) {
        console.log(
          `🧹 Cleanup: removed ${expiredStories.count} expired stories, ${expiredTokens.count} expired refresh tokens`
        );
      }
    } catch (e) {
      console.error('Cleanup job error:', e);
    }
  };

  runCleanup();
  setInterval(runCleanup, intervalMs);
}
