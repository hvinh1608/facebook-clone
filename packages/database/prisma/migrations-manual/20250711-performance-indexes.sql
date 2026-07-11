-- Run on Neon production (SQL Editor or psql)
-- Safe to re-run: uses IF NOT EXISTS

CREATE INDEX IF NOT EXISTS "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt");
CREATE INDEX IF NOT EXISTS "Post_groupId_createdAt_idx" ON "Post"("groupId", "createdAt");

CREATE INDEX IF NOT EXISTS "Block_blockerId_idx" ON "Block"("blockerId");
CREATE INDEX IF NOT EXISTS "Block_blockedId_idx" ON "Block"("blockedId");

CREATE INDEX IF NOT EXISTS "Reaction_postId_idx" ON "Reaction"("postId");

CREATE INDEX IF NOT EXISTS "Comment_postId_parentId_idx" ON "Comment"("postId", "parentId");

CREATE INDEX IF NOT EXISTS "Friendship_user1Id_idx" ON "Friendship"("user1Id");
CREATE INDEX IF NOT EXISTS "Friendship_user2Id_idx" ON "Friendship"("user2Id");

CREATE INDEX IF NOT EXISTS "Follow_followerId_idx" ON "Follow"("followerId");
CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" ON "Follow"("followingId");
