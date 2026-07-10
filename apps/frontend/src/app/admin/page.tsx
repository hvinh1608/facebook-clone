'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { api } from '../../services/api';
import { resolveAvatarUrl } from '../../utils/avatar';
import { useAuthStore } from '../../store/authStore';
import { Users as UsersIcon, FileText, MessageSquare, AlertTriangle, ShieldAlert, Ban, Check, Trash } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [stats, setStats] = useState<any>({ users: 0, posts: 0, comments: 0, messages: 0, groups: 0, pendingReports: 0 });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Frontend Admin Route guard
    if (user && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const statsRes = await api.get('/admin/stats');
      if (statsRes.data?.status === 'success') {
        setStats(statsRes.data.data);
      }

      const usersRes = await api.get(`/admin/users?q=${searchQuery}`);
      if (usersRes.data?.status === 'success') {
        setUsersList(usersRes.data.data);
      }

      const reportsRes = await api.get('/admin/reports');
      if (reportsRes.data?.status === 'success') {
        setReportsList(reportsRes.data.data);
      }
    } catch (e) {
      console.error('Error fetching admin data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();
    }
  }, [user, searchQuery]);

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const endpoint = isBlocked ? `/admin/users/${userId}/unblock` : `/admin/users/${userId}/block`;
      const res = await api.put(endpoint);
      if (res.data?.status === 'success') {
        fetchData();
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi khi cập nhật trạng thái người dùng');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const res = await api.put(`/admin/reports/${reportId}/resolve`);
      if (res.data?.status === 'success') {
        setReportsList((prev) => prev.filter((r) => r.id !== reportId));
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: string, reportId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết vi phạm này? Tất cả media, bình luận và báo cáo liên quan sẽ bị xóa.')) {
      try {
        const res = await api.delete(`/admin/posts/${postId}`);
        if (res.data?.status === 'success') {
          setReportsList((prev) => prev.filter((r) => r.id !== reportId));
          fetchData();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (isLoading && stats.users === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-7 h-7 text-amber-500" />
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Bảng quản trị hệ thống</h2>
        </div>

        {/* Aggregate Stats Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Người dùng', value: stats.users, icon: UsersIcon, color: 'text-brand-450 bg-brand-950/20' },
            { label: 'Bài viết', value: stats.posts, icon: FileText, color: 'text-indigo-400 bg-indigo-950/20' },
            { label: 'Bình luận', value: stats.comments, icon: MessageSquare, color: 'text-accent-400 bg-accent-950/20' },
            { label: 'Báo cáo chờ xử lý', value: stats.pendingReports, icon: AlertTriangle, color: 'text-red-400 bg-red-950/20' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass-panel p-4 rounded-2xl bg-slate-900/40 border border-slate-900 flex items-center justify-between gap-2 shadow-glass-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-550 block mb-1">{stat.label}</span>
                  <span className="text-xl font-black text-white">{stat.value}</span>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab selection menu */}
        <div className="glass-panel p-4 rounded-2xl bg-slate-900/40 border border-slate-900">
          <div className="flex border-b border-slate-850">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 text-xs font-semibold uppercase tracking-wider relative transition-all ${
                activeTab === 'users' ? 'text-brand-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Cơ sở người dùng ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-4 text-xs font-semibold uppercase tracking-wider relative transition-all ${
                activeTab === 'reports' ? 'text-red-400 font-bold' : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              Báo cáo vi phạm ({reportsList.filter(r => r.status === 'PENDING').length})
            </button>
          </div>
        </div>

        {/* Main interactive panel */}
        <div className="flex flex-col gap-4">
          {activeTab === 'users' && (
            <div className="glass-panel rounded-2xl bg-slate-900/30 border border-slate-900 overflow-hidden flex flex-col">
              {/* Search user control */}
              <div className="p-4 border-b border-slate-900">
                <input
                  type="text"
                  placeholder="Lọc theo tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-md px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs focus:border-brand-500 focus:outline-none text-slate-200"
                />
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/40 border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">Hồ sơ</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((userRow) => (
                      <tr key={userRow.id} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={resolveAvatarUrl(userRow.profile?.avatarUrl)}
                            className="w-9 h-9 rounded-full object-cover border border-slate-800"
                          />
                          <span className="font-semibold text-slate-200">{userRow.profile?.displayName}</span>
                        </td>
                        <td className="p-4 text-slate-350">{userRow.email}</td>
                        <td className="p-4 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">{userRow.role}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            userRow.status === 'ACTIVE' ? 'bg-green-950/30 text-green-500' : 'bg-red-950/30 text-red-400'
                          }`}>
                            {userRow.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {userRow.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleBlockUser(userRow.id, userRow.status === 'BLOCKED')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 ml-auto transition-all ${
                                userRow.status === 'BLOCKED'
                                  ? 'bg-green-600 hover:bg-green-500 text-white'
                                  : 'bg-red-950/20 hover:bg-red-650 text-red-500 hover:text-white border border-red-900/30'
                              }`}
                            >
                              <Ban className="w-3 h-3" />
                              {userRow.status === 'BLOCKED' ? 'Mở khóa' : 'Khóa'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="flex flex-col gap-4">
              {reportsList.filter((r) => r.status === 'PENDING').length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl text-slate-500 border border-slate-900">
                  Không có báo cáo vi phạm đang chờ xử lý.
                </div>
              ) : (
                reportsList
                  .filter((r) => r.status === 'PENDING')
                  .map((report) => (
                    <div key={report.id} className="glass-panel p-4.5 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col gap-3">
                      {/* Reporter line */}
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-200">{report.reporterName}</span>
                          <span className="text-slate-500">đã báo cáo {report.targetType === 'POST' ? 'bài viết' : report.targetType.toLowerCase()}</span>
                        </div>
                        <span className="text-[10px] font-bold text-red-400 uppercase bg-red-950/30 px-2 py-0.5 rounded border border-red-900/35">
                          CHỜ XỬ LÝ
                        </span>
                      </div>

                      {/* Reason */}
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs text-slate-350">
                        <span className="font-bold text-slate-450 block mb-1">Lý do:</span>
                        {report.reason}
                      </div>

                      {/* Targeted content preview */}
                      {report.targetContent && (
                        <div className="p-3.5 bg-slate-950/20 rounded-xl border border-slate-900 text-xs text-slate-400">
                          <span className="font-bold text-slate-550 uppercase tracking-widest text-[9px] block mb-1">Nội dung bị báo cáo:</span>
                          <p className="italic text-slate-350">{report.targetContent.content || '[Tệp đính kèm không có chữ]'}</p>
                          {report.targetContent.media && report.targetContent.media.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {report.targetContent.media.map((m: any) => (
                                <img key={m.id} src={m.url} className="w-16 h-16 object-cover rounded-lg border border-slate-800" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin action controls */}
                      <div className="flex justify-end gap-2 border-t border-slate-850 pt-3">
                        <button
                          onClick={() => handleResolveReport(report.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all border border-slate-800"
                        >
                          <Check className="w-3.5 h-3.5" /> Bỏ qua báo cáo
                        </button>
                        {report.targetType === 'POST' && report.targetContent?.id && (
                          <button
                            onClick={() => handleDeletePost(report.targetContent.id, report.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-505 text-white font-semibold rounded-xl text-xs transition-all shadow-glass-sm"
                          >
                            <Trash className="w-3.5 h-3.5" /> Xóa bài viết vi phạm
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
