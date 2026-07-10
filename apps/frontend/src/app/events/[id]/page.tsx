'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { api } from '../../../services/api';
import { toast } from '../../../utils/toast';
import { Loader2, Calendar, ArrowLeft, MapPin } from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api.get(`/discovery/events/${id}`)
      .then((res) => {
        if (res.data?.status === 'success') setEvent(res.data.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/discovery/events/${id}/join`);
      toast.success('Đã tham gia sự kiện!');
      setEvent((prev: any) => ({
        ...prev,
        _count: { ...prev._count, attendees: (prev._count?.attendees || 0) + 1 },
        isJoined: true,
      }));
    } catch {
      toast.error('Không thể tham gia sự kiện.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1877f2] animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="max-w-[680px] mx-auto fb-card p-8 text-center">
          <p className="text-[var(--text-secondary)]">Không tìm thấy sự kiện.</p>
          <Link href="/events" className="text-[#1877f2] text-sm font-semibold mt-2 inline-block hover:underline">
            Quay lại Sự kiện
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[680px] mx-auto flex flex-col gap-4">
        <Link href="/events" className="flex items-center gap-2 text-sm text-[#1877f2] font-semibold hover:underline w-fit">
          <ArrowLeft className="w-4 h-4" /> Sự kiện
        </Link>

        <div className="fb-card p-6">
          <div className="flex items-start gap-3 mb-4">
            <Calendar className="w-6 h-6 text-[#1877f2] flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{event.title}</h1>
              <p className="text-sm text-[#1877f2] font-semibold mt-1">
                {new Date(event.startAt).toLocaleString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">{event.description}</p>
          )}

          <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)] border-t border-[var(--border-soft)] pt-4">
            {event.location && (
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {event.location}
              </p>
            )}
            <p>{event._count?.attendees || 0} người tham gia</p>
          </div>

          {!event.isJoined && (
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="w-full mt-4 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {joining ? 'Đang tham gia...' : 'Tham gia sự kiện'}
            </button>
          )}
          {event.isJoined && (
            <p className="mt-4 text-center text-sm font-semibold text-[#42b72a]">✓ Bạn đã tham gia sự kiện này</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
