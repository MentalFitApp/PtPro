// src/hooks/useChat.js
// Hook completo per gestione chat real-time con Firebase

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, doc, query, where, orderBy, limit, 
  onSnapshot, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove,
  startAfter, endBefore, limitToLast
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';

// ============ UTILITY FUNCTIONS ============

export const getTenantId = () => localStorage.getItem('tenantId');

export const getChatCollection = () => {
  const tenantId = getTenantId();
  return collection(db, `tenants/${tenantId}/chats`);
};

export const getMessagesCollection = (chatId) => {
  const tenantId = getTenantId();
  return collection(db, `tenants/${tenantId}/chats/${chatId}/messages`);
};

// Formatta data per raggruppamento messaggi
export const formatMessageDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Ieri';
  if (days < 7) {
    return date.toLocaleDateString('it-IT', { weekday: 'long' });
  }
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Formatta ora messaggio
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

// ============ MAIN CHAT HOOK ============

export function useChat(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastDocRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Carica messaggi in tempo reale
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const messagesRef = getMessagesCollection(chatId);
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    unsubscribeRef.current = onSnapshot(q, 
      (snapshot) => {
        const newMessages = [];
        snapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordina dal più vecchio al più recente per la visualizzazione
        setMessages(newMessages.reverse());
        
        if (snapshot.docs.length > 0) {
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        }
        
        setHasMore(snapshot.docs.length === 50);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading messages:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [chatId]);

  // Carica messaggi più vecchi (paginazione)
  const loadMore = useCallback(async () => {
    if (!chatId || !hasMore || loadingMore || !lastDocRef.current) return;

    setLoadingMore(true);
    try {
      const messagesRef = getMessagesCollection(chatId);
      const q = query(
        messagesRef, 
        orderBy('createdAt', 'desc'), 
        startAfter(lastDocRef.current),
        limit(30)
      );

      const snapshot = await getDocs(q);
      const olderMessages = [];
      snapshot.forEach((doc) => {
        olderMessages.push({ id: doc.id, ...doc.data() });
      });

      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }

      setMessages(prev => [...olderMessages.reverse(), ...prev]);
      setHasMore(snapshot.docs.length === 30);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, hasMore, loadingMore]);

  // Invia messaggio
  const sendMessage = useCallback(async (content, type = 'text', metadata = {}) => {
    if (!chatId || !content) return null;
    
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const messagesRef = getMessagesCollection(chatId);
    const chatRef = doc(getChatCollection(), chatId);

    // Prepara il messaggio
    const messageData = {
      content,
      type, // text, image, audio, file, system
      senderId: user.uid,
      senderName: user.displayName || 'Utente',
      senderPhoto: user.photoURL || null,
      createdAt: serverTimestamp(),
      readBy: [user.uid],
      reactions: {},
      replyTo: metadata.replyTo || null,
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      ...metadata
    };

    try {
      // Aggiungi messaggio
      const docRef = await addDoc(messagesRef, messageData);

      // Aggiorna chat con ultimo messaggio
      await updateDoc(chatRef, {
        lastMessage: content.substring(0, 100),
        lastMessageType: type,
        lastMessageAt: serverTimestamp(),
        lastMessageBy: user.uid,
        [`unreadCount.${user.uid}`]: 0, // Reset proprio contatore
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [chatId]);

  // Segna messaggi come letti
  const markAsRead = useCallback(async () => {
    if (!chatId) return;
    
    const user = auth.currentUser;
    if (!user) return;

    try {
      const chatRef = doc(getChatCollection(), chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${user.uid}`]: 0,
        [`lastRead.${user.uid}`]: serverTimestamp()
      });

      // Segna tutti i messaggi non letti come letti
      const messagesRef = getMessagesCollection(chatId);
      const q = query(messagesRef, where('readBy', 'not-in', [[user.uid]]));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          readBy: arrayUnion(user.uid)
        });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [chatId]);

  // Elimina messaggio
  const deleteMessage = useCallback(async (messageId, hardDelete = false) => {
    if (!chatId || !messageId) return;

    const messageRef = doc(getMessagesCollection(chatId), messageId);
    
    try {
      if (hardDelete) {
        await deleteDoc(messageRef);
      } else {
        await updateDoc(messageRef, {
          isDeleted: true,
          content: 'Messaggio eliminato',
          deletedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  }, [chatId]);

  // Modifica messaggio
  const editMessage = useCallback(async (messageId, newContent) => {
    if (!chatId || !messageId || !newContent) return;

    const messageRef = doc(getMessagesCollection(chatId), messageId);
    
    try {
      await updateDoc(messageRef, {
        content: newContent,
        isEdited: true,
        editedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error editing message:', err);
      throw err;
    }
  }, [chatId]);

  // Pin/Unpin messaggio
  const togglePin = useCallback(async (messageId) => {
    if (!chatId || !messageId) return;

    const messageRef = doc(getMessagesCollection(chatId), messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (messageSnap.exists()) {
      await updateDoc(messageRef, {
        isPinned: !messageSnap.data().isPinned
      });
    }
  }, [chatId]);

  // Aggiungi reazione
  const addReaction = useCallback(async (messageId, emoji) => {
    if (!chatId || !messageId || !emoji) return;

    const user = auth.currentUser;
    if (!user) return;

    const messageRef = doc(getMessagesCollection(chatId), messageId);
    
    try {
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: arrayUnion(user.uid)
      });
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  }, [chatId]);

  // Rimuovi reazione
  const removeReaction = useCallback(async (messageId, emoji) => {
    if (!chatId || !messageId || !emoji) return;

    const user = auth.currentUser;
    if (!user) return;

    const messageRef = doc(getMessagesCollection(chatId), messageId);
    
    try {
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: arrayRemove(user.uid)
      });
    } catch (err) {
      console.error('Error removing reaction:', err);
    }
  }, [chatId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMore,
    sendMessage,
    markAsRead,
    deleteMessage,
    editMessage,
    togglePin,
    addReaction,
    removeReaction
  };
}

// ============ CHAT LIST HOOK ============

export function useChatList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    const chatsRef = getChatCollection();
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const chatList = [];
        snapshot.forEach((doc) => {
          chatList.push({ id: doc.id, ...doc.data() });
        });
        setChats(chatList);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading chats:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Crea nuova chat
  const createChat = useCallback(async (participantId, participantName, participantPhoto = null, participantRole = 'client') => {
    const user = auth.currentUser;
    if (!user || !participantId) return null;

    const chatsRef = getChatCollection();
    
    // Controlla se esiste già una chat con questo partecipante
    const existingQuery = query(
      chatsRef,
      where('participants', 'array-contains', user.uid)
    );
    const existingSnap = await getDocs(existingQuery);
    
    let existingChat = null;
    existingSnap.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(participantId) && data.type === 'direct') {
        existingChat = { id: doc.id, ...data };
      }
    });

    if (existingChat) return existingChat.id;

    // Determina il ruolo dell'utente corrente
    let currentUserRole = 'client';
    const tenantId = getTenantId();
    try {
      const adminDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/admins`));
      if (adminDoc.exists() && adminDoc.data().uids?.includes(user.uid)) {
        currentUserRole = 'admin';
      } else {
        const coachDoc = await getDoc(doc(db, `tenants/${tenantId}/roles/coaches`));
        if (coachDoc.exists() && coachDoc.data().uids?.includes(user.uid)) {
          currentUserRole = 'coach';
        }
      }
    } catch (err) {
      console.warn('Error getting user role:', err);
    }

    // Crea nuova chat
    const chatData = {
      type: 'direct',
      participants: [user.uid, participantId],
      participantNames: {
        [user.uid]: user.displayName || 'Utente',
        [participantId]: participantName
      },
      participantPhotos: {
        [user.uid]: user.photoURL || null,
        [participantId]: participantPhoto
      },
      participantRoles: {
        [user.uid]: currentUserRole,
        [participantId]: participantRole
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: null,
      unreadCount: {
        [user.uid]: 0,
        [participantId]: 0
      },
      typingUsers: [],
      pinnedMessages: []
    };

    const docRef = await addDoc(chatsRef, chatData);
    return docRef.id;
  }, []);

  return { chats, loading, createChat };
}

// ============ TYPING INDICATOR HOOK ============

export function useTypingIndicator(chatId) {
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(getChatCollection(), chatId);
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const user = auth.currentUser;
        // Filtra l'utente corrente
        setTypingUsers((data.typingUsers || []).filter(u => u.id !== user?.uid));
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  const setTyping = useCallback(async (isTyping) => {
    if (!chatId) return;

    const user = auth.currentUser;
    if (!user) return;

    const chatRef = doc(getChatCollection(), chatId);
    const typingData = {
      id: user.uid,
      name: user.displayName || 'Utente',
      timestamp: Date.now()
    };

    try {
      if (isTyping) {
        await updateDoc(chatRef, {
          typingUsers: arrayUnion(typingData)
        });

        // Auto-remove after 3 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      } else {
        // Remove from typing users
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
          const currentTyping = chatSnap.data().typingUsers || [];
          const filtered = currentTyping.filter(t => t.id !== user.uid);
          await updateDoc(chatRef, { typingUsers: filtered });
        }
      }
    } catch (err) {
      console.error('Error updating typing status:', err);
    }
  }, [chatId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { typingUsers, setTyping };
}

// ============ MEDIA UPLOAD HOOK ============

export function useMediaUpload(chatId) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadMedia = useCallback(async (file, type = 'image') => {
    if (!chatId || !file) return null;

    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    setUploading(true);
    setProgress(0);

    try {
      const tenantId = getTenantId();
      const timestamp = Date.now();
      const extension = file.name?.split('.').pop() || (type === 'audio' ? 'webm' : 'jpg');
      const path = `tenants/${tenantId}/chats/${chatId}/${type}s/${user.uid}_${timestamp}.${extension}`;
      
      const storageRef = ref(storage, path);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      setProgress(100);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        path,
        type,
        name: file.name || `${type}_${timestamp}`,
        size: file.size,
        mimeType: file.type
      };
    } catch (err) {
      console.error('Error uploading media:', err);
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [chatId]);

  return { uploadMedia, uploading, progress };
}

// ============ SEARCH MESSAGES HOOK ============

export function useSearchMessages(chatId) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (searchTerm) => {
    if (!chatId || !searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const messagesRef = getMessagesCollection(chatId);
      const snapshot = await getDocs(messagesRef);
      
      const searchLower = searchTerm.toLowerCase();
      const matches = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.content && data.content.toLowerCase().includes(searchLower) && !data.isDeleted) {
          matches.push({ id: doc.id, ...data });
        }
      });

      // Ordina per data
      matches.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setResults(matches);
    } catch (err) {
      console.error('Error searching messages:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [chatId]);

  const clearSearch = useCallback(() => {
    setResults([]);
  }, []);

  return { results, searching, search, clearSearch };
}

// ============ UNREAD COUNT HOOK ============

export function useUnreadCount() {
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setTotalUnread(0);
      return;
    }

    const chatsRef = getChatCollection();
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        count += data.unreadCount?.[user.uid] || 0;
      });
      setTotalUnread(count);
    });

    return () => unsubscribe();
  }, []);

  return totalUnread;
}

export default useChat;
