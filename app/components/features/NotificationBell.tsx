'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Toast } from '@/components/ui/Toast'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link?: string
  read: boolean
  created_at: string
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null)


  // Estabilizar la referencia del cliente de Supabase
  const supabase = useMemo(() => createClient(), [])

  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.read).length)
    }
  }, [supabase, userId])

  useEffect(() => {
    // Cargar datos iniciales
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications()

    // Suscribirse a notificaciones en tiempo real
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
          setLatestNotification(newNotification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, loadNotifications])

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exercise_approved':
        return 'crown'
      case 'exercise_rejected':
        return 'skull'
      case 'level_up':
        return 'sports_bar'
      default:
        return 'raven'
    }
  }


  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer scale-90 relative rounded-xs p-2 text-text-main border border-transparent hover:border-border dark:hover:border-border transition-all"
      >
        <span className="material-symbols-outlined">raven</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-xs bg-red-500 text-xs font-bold text-text-main dark:text-text-main">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xs border border-border bg-background shadow-lg dark:border-border dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-border p-4 dark:border-border">
              <h3 className="font-semibold text-text-main dark:text-text-main">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-border p-4 hover:bg-surface dark:border-border dark:hover:bg-gray-800 ${!notification.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl material-symbols-outlined">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-main dark:text-text-main">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-muted dark:text-muted">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(notification.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              markAsRead(notification.id)
                              setIsOpen(false)
                            }}
                            className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                          >
                            Ver detalles →
                          </Link>
                        )}
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <span className="material-symbols-outlined text-[20px]">check</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted">
                  No tienes notificaciones
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Render Toast if there is a new notification */}
      {latestNotification && (
        <Toast
          title={latestNotification.title}
          message={latestNotification.message}
          type={latestNotification.type}
          onClose={() => setLatestNotification(null)}
        />
      )}
    </div>
  )
}
