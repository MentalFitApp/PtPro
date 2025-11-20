import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function ChatNotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Conta messaggi non letti nelle chat
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      let totalUnread = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const unreadForUser = data.unreadCount?.[currentUser.uid] || 0;
        totalUnread += unreadForUser;
      });
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full min-w-[18px] text-center">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
