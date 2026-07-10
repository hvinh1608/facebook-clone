'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Layout from '../../../components/Layout';
import PostCard from '../../../components/PostCard';
import PostCreator from '../../../components/PostCreator';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useChatBoxesStore } from '../../../store/chatBoxesStore';
import {
  Camera,
  Edit3,
  UserPlus,
  UserMinus,
  UserCheck,
  MessageSquare,
  ShieldAlert,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Heart,
  MoreHorizontal,
  Share2,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import OptimizedAvatar from '../../../components/OptimizedAvatar';
import PhotoLightbox from '../../../components/PhotoLightbox';
import { resolveMediaUrl } from '../../../utils/media';
import { resolveAvatarUrl } from '../../../utils/avatar';
import { toast } from '../../../utils/toast';

type ProfileTab = 'all' | 'about' | 'friends' | 'photos' | 'videos';

export default function ProfilePage() {
  const params = useParams();
  const targetUserId = params.id as string;
  const { user: currentUser, updateUser } = useAuthStore();
  const { openBox } = useChatBoxesStore();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [relationship, setRelationship] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/users/profile/${targetUserId}`);
      if (res.data?.status === 'success') {
        const data = res.data.data.user;
        setProfileUser(data);

        setDisplayName(data.profile?.displayName || '');
        setBio(data.profile?.bio || '');
        setAddress(data.profile?.address || '');
        setWebsite(data.profile?.website || '');
        setRelationship(data.profile?.relationship || '');
        setGender(data.profile?.gender || '');
        setDob(data.profile?.dob ? data.profile.dob.split('T')[0] : '');
      }

      const postsRes = await api.get(`/posts/user/${targetUserId}?limit=20`);
      if (postsRes.data?.status === 'success') {
        setPosts(postsRes.data.data.posts);
      }

      const friendsRes = await api.get(`/users/friends/${targetUserId}`);
      if (friendsRes.data?.status === 'success') {
        setFriends(friendsRes.data.data);
      }

      const highlightsRes = await api.get(`/discovery/highlights/${targetUserId}`);
      if (highlightsRes.data?.status === 'success') {
        setHighlights(highlightsRes.data.data || []);
      }
    } catch (e) {
      console.error('Error fetching profile', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
    }
  }, [targetUserId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const profilePhotos = useMemo(
    () =>
      posts.flatMap((post) =>
        (post.media || [])
          .filter((item: { type: string }) => item.type === 'IMAGE')
          .map((item: { id: string; url: string }) => ({ ...item, postId: post.id }))
      ),
    [posts]
  );

  const previewPhotos = profilePhotos.slice(0, 9);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.status === 'success') {
        const newAvatarUrl = res.data.data.avatarUrl;
        updateUser({ avatarUrl: newAvatarUrl });
        setProfileUser((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, avatarUrl: newAvatarUrl },
        }));
      }
    } catch (err) {
      console.error('Error uploading avatar', err);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('cover', file);

    try {
      const res = await api.put('/users/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.status === 'success') {
        const newCoverUrl = res.data.data.coverUrl;
        setProfileUser((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, coverUrl: newCoverUrl },
        }));
      }
    } catch (err) {
      console.error('Error uploading cover image', err);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', {
        displayName,
        bio,
        address,
        website,
        relationship,
        gender: gender || undefined,
        dob: dob || undefined,
      });

      if (res.data?.status === 'success') {
        updateUser({ displayName });
        setProfileUser((prev: any) => ({
          ...prev,
          profile: {
            ...prev.profile,
            displayName,
            bio,
            address,
            website,
            relationship,
            gender,
            dob: dob ? new Date(dob).toISOString() : null,
          },
        }));
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Error updating profile info', err);
    }
  };

  const handleRelationshipAction = async () => {
    if (!profileUser) return;
    const { friendshipStatus } = profileUser.relationship;

    try {
      if (friendshipStatus === 'NONE') {
        await api.post(`/friends/request/${targetUserId}`);
        setProfileUser((prev: any) => ({
          ...prev,
          relationship: { ...prev.relationship, friendshipStatus: 'SENT' },
        }));
      } else if (friendshipStatus === 'SENT') {
        await api.delete(`/friends/request/cancel/${targetUserId}`);
        setProfileUser((prev: any) => ({
          ...prev,
          relationship: { ...prev.relationship, friendshipStatus: 'NONE' },
        }));
      } else if (friendshipStatus === 'RECEIVED') {
        await api.post(`/friends/request/accept/${targetUserId}`);
        setProfileUser((prev: any) => ({
          ...prev,
          relationship: { ...prev.relationship, friendshipStatus: 'FRIENDS' },
        }));
      } else if (friendshipStatus === 'FRIENDS') {
        if (window.confirm('Bạn có chắc muốn hủy kết bạn với người này?')) {
          await api.delete(`/friends/unfriend/${targetUserId}`);
          setProfileUser((prev: any) => ({
            ...prev,
            relationship: { ...prev.relationship, friendshipStatus: 'NONE' },
          }));
        }
      }
    } catch (err) {
      console.error('Error modifying friendship', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!profileUser) return;
    const { isFollowing } = profileUser.relationship;

    try {
      if (isFollowing) {
        await api.delete(`/users/unfollow/${targetUserId}`);
        setProfileUser((prev: any) => ({
          ...prev,
          relationship: { ...prev.relationship, isFollowing: false },
        }));
      } else {
        await api.post(`/users/follow/${targetUserId}`);
        setProfileUser((prev: any) => ({
          ...prev,
          relationship: { ...prev.relationship, isFollowing: true },
        }));
      }
    } catch (err) {
      console.error('Error toggling follow', err);
    }
  };

  const handleBlockUser = async () => {
    if (!profileUser) return;
    if (window.confirm('Bạn có chắc muốn chặn người này? Bạn sẽ không còn thấy nhau hoặc nhắn tin được.')) {
      try {
        await api.post(`/users/block/${targetUserId}`);
        toast.success('Đã chặn người dùng thành công.');
        window.location.href = '/';
      } catch (e) {
        console.error('Error blocking user', e);
        toast.error('Không thể chặn người dùng.');
      }
    }
  };

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}/profile/${targetUserId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Đã sao chép liên kết trang cá nhân!');
      setShowMoreMenu(false);
    });
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/profile/${targetUserId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: profileUser?.profile?.displayName,
          url,
        });
      } catch {
        handleCopyProfileLink();
      }
    } else {
      handleCopyProfileLink();
    }
    setShowMoreMenu(false);
  };

  const handlePostCreated = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev]);
    setProfileUser((prev: any) =>
      prev
        ? {
            ...prev,
            stats: { ...prev.stats, posts: (prev.stats?.posts || 0) + 1 },
          }
        : prev
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-slate-500">Failed to load profile. User may not exist or has blocked you.</p>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = currentUser?.id === targetUserId;
  const { friendshipStatus, isFollowing } = profileUser.relationship;
  const cover = profileUser.profile?.coverUrl;
  const handleSlug = profileUser.email?.split('@')[0];
  const friendsCount = profileUser.stats?.friends || 0;
  const previewFriends = friends.slice(0, 9);

  const profileTabs: { type: ProfileTab; label: string }[] = [
    { type: 'all', label: 'Tất cả' },
    { type: 'about', label: 'Giới thiệu' },
    { type: 'friends', label: 'Bạn bè' },
    { type: 'photos', label: 'Ảnh' },
    { type: 'videos', label: 'Video' },
  ];

  const renderIntroCard = () => (
    <div className="fb-card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-soft)]">
        <h3 className="text-[17px] font-bold text-[var(--text-primary)]">Giới thiệu</h3>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3 text-[15px] text-[var(--text-primary)]">
        {profileUser.profile?.bio && (
          <p className="text-center leading-snug">{profileUser.profile.bio}</p>
        )}
        {profileUser.profile?.relationship && (
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
            <span>{profileUser.profile.relationship}</span>
          </div>
        )}
        {profileUser.profile?.address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
            <span>
              Sống tại <span className="font-semibold">{profileUser.profile.address}</span>
            </span>
          </div>
        )}
        {profileUser.profile?.website && (
          <div className="flex items-start gap-3">
            <LinkIcon className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
            <a
              href={profileUser.profile.website}
              target="_blank"
              rel="noreferrer"
              className="text-[#2374e1] hover:underline truncate"
            >
              {profileUser.profile.website}
            </a>
          </div>
        )}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
          <span>
            Tham gia{' '}
            {new Date(profileUser.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="w-full py-2 mt-1 bg-[#3a3b3c] hover:bg-[#4e4f50] text-white font-semibold rounded-lg text-[15px] transition-colors"
          >
            Chỉnh sửa chi tiết
          </button>
        )}
      </div>
    </div>
  );

  const renderFriendsPreviewCard = () => (
    <div className="fb-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-soft)]">
        <div>
          <h3 className="text-[17px] font-bold text-[var(--text-primary)]">Bạn bè</h3>
          <p className="text-[15px] text-[var(--text-secondary)]">{friendsCount.toLocaleString('vi-VN')} người bạn</p>
        </div>
        {friendsCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className="text-[#2374e1] hover:underline text-[15px] font-semibold"
          >
            Xem tất cả
          </button>
        )}
      </div>
      <div className="p-3 grid grid-cols-3 gap-1.5">
        {previewFriends.length === 0 ? (
          <p className="col-span-3 text-center text-sm text-[var(--text-secondary)] py-4">Chưa có bạn bè.</p>
        ) : (
          previewFriends.map((friend) => (
            <Link
              key={friend.id}
              href={`/profile/${friend.id}`}
              className="group overflow-hidden rounded-lg"
            >
              <div className="relative aspect-square bg-[#3a3b3c] overflow-hidden">
                <Image
                  src={resolveAvatarUrl(friend.profile?.avatarUrl)}
                  alt={friend.profile?.displayName || 'Friend'}
                  fill
                  sizes="120px"
                  unoptimized
                  className="object-cover group-hover:opacity-95 transition-opacity"
                />
              </div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-1.5 px-0.5 truncate leading-tight">
                {friend.profile?.displayName}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );

  const renderPhotosPreviewCard = () => (
    <div className="fb-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-soft)]">
        <div>
          <h3 className="text-[17px] font-bold text-[var(--text-primary)]">Ảnh</h3>
          <p className="text-[15px] text-[var(--text-secondary)]">{previewPhotos.length > 0 ? 'Ảnh gần đây' : 'Chưa có ảnh'}</p>
        </div>
        {previewPhotos.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className="text-[#2374e1] hover:underline text-[15px] font-semibold"
          >
            Xem tất cả
          </button>
        )}
      </div>
      <div className="p-3 grid grid-cols-3 gap-1.5">
        {previewPhotos.length === 0 ? (
          <p className="col-span-3 text-center text-sm text-[var(--text-secondary)] py-4">Chưa có ảnh nào.</p>
        ) : (
          previewPhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(profilePhotos.findIndex((p) => p.id === photo.id))}
              className="relative aspect-square overflow-hidden rounded-lg bg-[#3a3b3c]"
            >
              <Image
                src={resolveMediaUrl(photo.url)}
                alt="Profile photo"
                fill
                sizes="120px"
                unoptimized
                className="object-cover hover:opacity-95 transition-opacity"
              />
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderLeftSidebar = () => (
    <div className="flex flex-col gap-4">
      {renderIntroCard()}
      {renderFriendsPreviewCard()}
      {renderPhotosPreviewCard()}
    </div>
  );

  const renderPostsFeed = () => (
    <div className="flex flex-col gap-4">
      {isOwnProfile && <PostCreator onPostCreated={handlePostCreated} />}

      <div className="fb-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-soft)]">
          <h3 className="text-[20px] font-bold text-[var(--text-primary)]">Bài viết</h3>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="fb-card p-12 text-center">
          <p className="text-sm text-[var(--text-secondary)]">Chưa có bài viết nào.</p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col w-full">
        {/* Full-width cover photo */}
        <div className="w-full h-[200px] sm:h-[260px] md:h-[350px] bg-[#3a3b3c] relative">
          {cover ? (
            <img src={resolveMediaUrl(cover)} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-[#3a3b3c] to-[#242526]" />
          )}
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-4 right-4 md:right-[max(1rem,calc((100%-940px)/2+1rem))] px-3 py-2 bg-[#050505]/70 hover:bg-[#050505]/85 text-white rounded-lg transition-colors text-[15px] font-semibold"
            >
              <span className="flex items-center gap-2">
                <Camera className="w-4 h-4" /> Thêm ảnh bìa
              </span>
              <input type="file" ref={coverInputRef} onChange={handleCoverChange} className="hidden" accept="image/*" />
            </button>
          )}
        </div>

        <div className="max-w-[940px] mx-auto w-full flex flex-col px-0 md:px-4">
          {/* Profile identity — overlaps cover, must not clip */}
          <div className="relative z-10 px-4 md:px-6 overflow-visible pb-2">
            <div className="flex items-end gap-4 -mt-[56px] sm:-mt-[64px] md:-mt-[72px]">
              <div className="relative group flex-shrink-0">
                <OptimizedAvatar
                  src={profileUser.profile?.avatarUrl}
                  alt={profileUser.profile?.displayName}
                  size={168}
                  className="w-[132px] h-[132px] md:w-[168px] md:h-[168px] rounded-full object-cover border-4 border-[#242526] bg-[#3a3b3c]"
                />
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <Camera className="w-7 h-7" />
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                  </button>
                )}
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4">
                  <div className="min-w-0">
                    <h1 className="text-[24px] md:text-[32px] font-bold text-[var(--text-primary)] leading-tight">
                      {profileUser.profile?.displayName}
                    </h1>
                    <p className="mt-1 text-[15px] text-[var(--text-secondary)] truncate">
                      <button
                        type="button"
                        onClick={() => setActiveTab('friends')}
                        className="font-semibold text-[var(--text-primary)] hover:underline"
                      >
                        {friendsCount.toLocaleString('vi-VN')} người bạn
                      </button>
                      {profileUser.profile?.address && (
                        <>
                          <span className="mx-1">·</span>
                          <span>{profileUser.profile.address}</span>
                        </>
                      )}
                      {handleSlug && (
                        <>
                          <span className="mx-1">·</span>
                          <span className="text-[#2374e1]">@{handleSlug}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-nowrap self-start md:self-auto">
                    {isOwnProfile ? (
                      <>
                        <Link
                          href="/?story=create"
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#2374e1] hover:bg-[#1b67cc] text-white font-semibold rounded-lg text-[15px] transition-colors whitespace-nowrap"
                        >
                          Thêm vào tin
                        </Link>
                        <button
                          type="button"
                          onClick={() => setIsEditModalOpen(true)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#3a3b3c] hover:bg-[#4e4f50] text-white font-semibold rounded-lg text-[15px] transition-colors whitespace-nowrap"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline">Chỉnh sửa trang cá nhân</span>
                          <span className="sm:hidden">Chỉnh sửa</span>
                        </button>
                        <div className="relative" ref={moreMenuRef}>
                          <button
                            type="button"
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className="w-10 h-10 flex-shrink-0 bg-[#3a3b3c] hover:bg-[#4e4f50] text-white rounded-lg flex items-center justify-center transition-colors"
                            aria-label="Tùy chọn khác"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {showMoreMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#242526] rounded-lg shadow-lg border border-[var(--border-soft)] p-1 z-20">
                              <button
                                type="button"
                                onClick={handleShareProfile}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded w-full text-left"
                              >
                                <Share2 className="w-4 h-4 text-[#1877f2]" /> Chia sẻ trang cá nhân
                              </button>
                              <button
                                type="button"
                                onClick={handleCopyProfileLink}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded w-full text-left"
                              >
                                <Copy className="w-4 h-4 text-[#1877f2]" /> Sao chép liên kết
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleRelationshipAction}
                          className={`flex items-center gap-2 px-4 py-2.5 font-semibold rounded-lg text-[15px] transition-colors whitespace-nowrap ${
                            friendshipStatus === 'FRIENDS'
                              ? 'bg-[#2374e1] hover:bg-[#1b67cc] text-white'
                              : friendshipStatus === 'SENT'
                              ? 'bg-[#3a3b3c] text-white'
                              : 'bg-[#2374e1] hover:bg-[#1b67cc] text-white'
                          }`}
                        >
                          {friendshipStatus === 'FRIENDS' && <UserMinus className="w-4 h-4 flex-shrink-0" />}
                          {friendshipStatus === 'SENT' && <UserCheck className="w-4 h-4 flex-shrink-0" />}
                          {friendshipStatus === 'RECEIVED' && <UserPlus className="w-4 h-4 flex-shrink-0" />}
                          {friendshipStatus === 'NONE' && <UserPlus className="w-4 h-4 flex-shrink-0" />}
                          {friendshipStatus === 'FRIENDS' && 'Bạn bè'}
                          {friendshipStatus === 'SENT' && 'Đã gửi lời mời'}
                          {friendshipStatus === 'RECEIVED' && 'Chấp nhận'}
                          {friendshipStatus === 'NONE' && 'Thêm bạn bè'}
                        </button>
                        <button
                          type="button"
                          onClick={handleFollowToggle}
                          className={`px-4 py-2.5 font-semibold rounded-lg text-[15px] transition-colors whitespace-nowrap ${
                            isFollowing
                              ? 'bg-[#3a3b3c] text-white hover:bg-[#4e4f50]'
                              : 'bg-[#42b72a] hover:bg-[#36a420] text-white'
                          }`}
                        >
                          {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openBox(targetUserId)}
                          className="w-10 h-10 flex-shrink-0 bg-[#3a3b3c] hover:bg-[#4e4f50] rounded-lg text-white transition-colors flex items-center justify-center"
                          title="Nhắn tin"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleBlockUser}
                          className="w-10 h-10 flex-shrink-0 bg-[#3a3b3c] hover:bg-[#4e4f50] text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center justify-center"
                          title="Chặn"
                        >
                          <ShieldAlert className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile tabs */}
          <div className="fb-card overflow-hidden shadow-none border-x-0">
            <div className="flex items-center border-t border-[var(--border-soft)] px-2 md:px-4 overflow-x-auto">
            {profileTabs.map((tab) => (
              <button
                key={tab.type}
                type="button"
                onClick={() => setActiveTab(tab.type)}
                className={`px-4 py-3.5 text-[15px] font-semibold relative whitespace-nowrap transition-colors ${
                  activeTab === tab.type ? 'text-[#2374e1]' : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] rounded-lg'
                }`}
              >
                {tab.label}
                {activeTab === tab.type && (
                  <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#2374e1] rounded-t-full" />
                )}
              </button>
            ))}
            <button
              type="button"
              className="ml-auto p-2.5 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] rounded-lg flex-shrink-0"
              aria-label="More tabs"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          </div>

          {/* Story highlights */}
          {highlights.length > 0 && (
            <div className="px-4 py-3 flex gap-3 overflow-x-auto">
              {highlights.map((highlight) => (
                <button
                  key={highlight.id}
                  type="button"
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-[#1877f2] p-0.5 overflow-hidden bg-[#3a3b3c]">
                    {highlight.coverUrl ? (
                      <img
                        src={resolveMediaUrl(highlight.coverUrl)}
                        alt={highlight.title}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#1877f2]/20 flex items-center justify-center text-lg">
                        ⭐
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[72px]">
                    {highlight.title}
                  </span>
                </button>
              ))}
            </div>
          )}

        {/* Tab content */}
        <div className="py-4">
          {activeTab === 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4 items-start">
              {renderLeftSidebar()}
              {renderPostsFeed()}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4 items-start">
              {renderIntroCard()}
              <div className="fb-card overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-soft)]">
                  <h3 className="text-[17px] font-bold text-[var(--text-primary)]">Thông tin chi tiết</h3>
                </div>
                <div className="px-4 py-4 flex flex-col gap-4 text-[15px] text-[var(--text-primary)]">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Tiểu sử</p>
                    <p>{profileUser.profile?.bio || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Ngày sinh</p>
                    <p>
                      {profileUser.profile?.dob
                        ? new Date(profileUser.profile.dob).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Giới tính</p>
                    <p>{profileUser.profile?.gender || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Tình trạng quan hệ</p>
                    <p>{profileUser.profile?.relationship || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Địa chỉ</p>
                    <p>{profileUser.profile?.address || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Website</p>
                    <p>{profileUser.profile?.website || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="fb-card p-4">
              <div className="mb-4">
                <h3 className="text-[20px] font-bold text-[var(--text-primary)]">Bạn bè</h3>
                <p className="text-[15px] text-[var(--text-secondary)]">{friendsCount.toLocaleString('vi-VN')} người bạn</p>
              </div>
              {friends.length === 0 ? (
                <p className="text-center text-sm text-[var(--text-secondary)] py-8">Chưa có bạn bè.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {friends.map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/profile/${friend.id}`}
                      className="group overflow-hidden rounded-lg"
                    >
                      <div className="relative aspect-square bg-[#3a3b3c] overflow-hidden">
                        <Image
                          src={resolveAvatarUrl(friend.profile?.avatarUrl)}
                          alt={friend.profile?.displayName || 'Friend'}
                          fill
                          sizes="200px"
                          unoptimized
                          className="object-cover group-hover:opacity-95 transition-opacity"
                        />
                      </div>
                      <p className="text-[15px] font-semibold text-[var(--text-primary)] mt-2 px-1 truncate">
                        {friend.profile?.displayName}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="fb-card p-4">
              <div className="mb-4">
                <h3 className="text-[20px] font-bold text-[var(--text-primary)]">Ảnh</h3>
                <p className="text-[15px] text-[var(--text-secondary)]">{profilePhotos.length} ảnh</p>
              </div>
              {profilePhotos.length === 0 ? (
                <p className="text-center text-sm text-[var(--text-secondary)] py-8">Chưa có ảnh nào.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {profilePhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      className="relative aspect-square overflow-hidden rounded-lg bg-[#3a3b3c]"
                    >
                      <Image
                        src={resolveMediaUrl(photo.url)}
                        alt="Ảnh cá nhân"
                        fill
                        sizes="(max-width: 768px) 33vw, 200px"
                        unoptimized
                        className="object-cover hover:opacity-95 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="fb-card p-4 flex flex-col gap-4">
              <h3 className="text-[20px] font-bold text-[var(--text-primary)]">Video</h3>
              {posts.filter((p) => p.media?.some((m: any) => m.type === 'VIDEO')).length === 0 ? (
                <p className="text-center text-sm text-[var(--text-secondary)] py-8">Chưa có video nào.</p>
              ) : (
                posts
                  .filter((p) => p.media?.some((m: any) => m.type === 'VIDEO'))
                  .map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          )}
        </div>

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md fb-card p-6 rounded-2xl flex flex-col gap-5">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Chỉnh sửa trang cá nhân</h3>
              <form onSubmit={handleEditProfileSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Tên hiển thị</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="glass-input w-full px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Tiểu sử</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="glass-input w-full px-3.5 py-2 rounded-xl text-sm resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="glass-input w-full px-3.5 py-2 rounded-xl text-sm"
                  >
                    <option value="">Chưa cập nhật</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Ngày sinh</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="glass-input w-full px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Tình trạng quan hệ</label>
                  <input
                    type="text"
                    placeholder="VD: Độc thân, Đã kết hôn"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="glass-input w-full px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Thành phố / Quốc gia</label>
                  <input
                    type="text"
                    placeholder="VD: Hà Nội, Việt Nam"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="glass-input w-full px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Website</label>
                  <input
                    type="text"
                    placeholder="VD: https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="glass-input w-full px-3.5 py-2 rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-[var(--hover-bg)] hover:opacity-90 text-[var(--text-primary)] font-semibold rounded-xl text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-xl text-xs"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>

        {lightboxIndex !== null && profilePhotos.length > 0 && (
          <PhotoLightbox
            photos={profilePhotos}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </div>
    </Layout>
  );
}
