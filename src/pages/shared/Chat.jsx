// src/pages/shared/Chat.jsx
// Chat refactored - Componente principale con orchestrazione stato

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, getDocs, query, where, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { uploadToR2 } from '../../cloudflareStorage';
import { 
  useChat, useChatList, useTypingIndicator, useMediaUpload, 
  useSearchMessages, getTenantId
} from '../../hooks/useChat';

// Import componenti modulari
import {
  EmptyChatState,
  ChatSidebar,
  ChatHeader,
  MessagesArea,
  MessageInput,
  NewChatModal,
  getCurrentUserRole,
  playNotificationSound
} from '../../components/chat';

// Import modali (da estrarre successivamente se presenti)
// TODO: Creare questi componenti modali
// import ProfileCheckModal from './ProfileCheckModal';
// import ForwardMessageModal from './ForwardMessageModal';
// import GlobalSearchModal from './GlobalSearchModal';
// import PinnedMessagesPanel from './PinnedMessagesPanel';
// import StarredMessagesPanel from './StarredMessagesPanel';

const cn = (...classes) => clsx(...classes);

export default function Chat() {
  const user = auth.currentUser;
  
  // State management
  const [activeChat, setActiveChat] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [showStarredPanel, setShowStarredPanel] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('client');
  const [profileChecked, setProfileChecked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevMessagesCountRef = useRef(0);

  // Track online status - TODO: Implement useOnlineStatus hook
  // useOnlineStatus(user?.uid);

  // Custom hooks
  const { chats, loading: chatsLoading, createChat } = useChatList();
  const { 
    messages, 
    loading: messagesLoading, 
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
  } = useChat(activeChat?.id);
  const { typingUsers, setTyping } = useTypingIndicator(activeChat?.id);
  const { uploadMedia, uploading } = useMediaUpload(activeChat?.id);
  const { results: searchResults, search: searchMessages, clearSearch } = useSearchMessages(activeChat?.id);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get current user role
  useEffect(() => {
    if (user) {
      getCurrentUserRole(user.uid).then(role => setCurrentUserRole(role));
    }
  }, [user]);

  // Check if user has profile name
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      
      try {
        if (user.displayName) {
          setProfileChecked(true);
          return;
        }
        
        const tenantId = getTenantId();
        const userDocRef = doc(db, `tenants/${tenantId}/users/${user.uid}`);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.displayName || data.name) {
            setProfileChecked(true);
            return;
          }
        }
        
        setShowProfileModal(true);
        setProfileChecked(true);
      } catch (err) {
        console.error('Error checking profile:', err);
        setProfileChecked(true);
      }
    };
    
    checkProfile();
  }, [user]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (activeChat?.id) {
      markAsRead();
    }
  }, [activeChat?.id, markAsRead]);

  // Play sound on new message
  useEffect(() => {
    if (messages.length > 0 && prevMessagesCountRef.current > 0) {
      const lastMessage = messages[messages.length - 1];
      if (messages.length > prevMessagesCountRef.current && 
          lastMessage.senderId !== user?.uid && 
          soundEnabled) {
        playNotificationSound();
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages, user?.uid, soundEnabled]);

  // Search messages when search term changes
  useEffect(() => {
    if (messageSearchTerm) {
      searchMessages(messageSearchTerm);
    } else {
      clearSearch();
    }
  }, [messageSearchTerm, searchMessages, clearSearch]);

  // ============ HANDLERS ============

  // Handle profile save
  const handleProfileSave = async (name, photoFile) => {
    if (!user) return;

    try {
      let photoURL = user.photoURL;

      if (photoFile) {
        try {
          photoURL = await uploadToR2(photoFile, user.uid, 'profile-photos', null, true);
        } catch (r2Error) {
          console.warn('R2 upload failed, falling back to Firebase Storage:', r2Error);
          const tenantId = getTenantId();
          const path = `tenants/${tenantId}/profiles/${user.uid}/avatar.jpg`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, photoFile);
          photoURL = await getDownloadURL(storageRef);
        }
      }

      await updateProfile(user, { displayName: name, photoURL });

      const tenantId = getTenantId();
      const userDocRef = doc(db, `tenants/${tenantId}/users/${user.uid}`);
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: name,
        name: name,
        email: user.email,
        photoURL: photoURL || '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update clients collection if user is a client
      const clientDocRef = doc(db, `tenants/${tenantId}/clients/${user.uid}`);
      const clientSnap = await getDoc(clientDocRef);
      if (clientSnap.exists()) {
        await updateDoc(clientDocRef, {
          photoURL: photoURL || '',
          photo: photoURL || '',
          displayName: name,
          name: name,
          updatedAt: serverTimestamp()
        });
      }

      // Update all chats where user participates
      const chatsRef = collection(db, `tenants/${tenantId}/chats`);
      const chatsQuery = query(chatsRef, where('participants', 'array-contains', user.uid));
      const chatsSnapshot = await getDocs(chatsQuery);
      
      const updatePromises = chatsSnapshot.docs.map(async (chatDoc) => {
        const updates = { [`participantNames.${user.uid}`]: name };
        if (photoURL) {
          updates[`participantPhotos.${user.uid}`] = photoURL;
        }
        await updateDoc(doc(db, `tenants/${tenantId}/chats/${chatDoc.id}`), updates);
      });
      
      await Promise.all(updatePromises);
      setShowProfileModal(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      throw err;
    }
  };

  // Handle send message
  const handleSendMessage = async (content, type, metadata = {}) => {
    if (!activeChat?.id) return;

    try {
      if (type === 'image' || type === 'audio' || type === 'file') {
        const mediaData = await uploadMedia(content, type);
        await sendMessage(mediaData.url, type, {
          ...metadata,
          mediaUrl: mediaData.url,
          fileName: mediaData.name,
          fileSize: mediaData.size,
          mimeType: mediaData.mimeType
        });
      } else {
        await sendMessage(content, type, metadata);
      }

      setReplyTo(null);
      
      // Increment unread for other participant
      const otherParticipant = activeChat.participants?.find(p => p !== user?.uid);
      if (otherParticipant) {
        const tenantId = getTenantId();
        const chatRef = doc(db, `tenants/${tenantId}/chats/${activeChat.id}`);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
          const currentUnread = chatSnap.data().unreadCount?.[otherParticipant] || 0;
          await updateDoc(chatRef, {
            [`unreadCount.${otherParticipant}`]: currentUnread + 1
          });
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Handle edit message
  const handleEditMessage = async (messageId, newContent) => {
    try {
      await editMessage(messageId, newContent);
      setEditingMessage(null);
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  // Handle reaction
  const handleReaction = async (messageId, emoji) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const userReacted = message.reactions?.[emoji]?.includes(user?.uid);
    
    if (userReacted) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
  };

  // Handle star message
  const handleStarMessage = async (messageId) => {
    try {
      const tenantId = getTenantId();
      const messageRef = doc(db, `tenants/${tenantId}/chats/${activeChat.id}/messages/${messageId}`);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const currentStarred = messageDoc.data().isStarred || false;
        await updateDoc(messageRef, { isStarred: !currentStarred });
      }
    } catch (err) {
      console.error('Error starring message:', err);
    }
  };

  // Handle forward message
  const handleForwardMessage = (message) => {
    setMessageToForward(message);
    setShowForwardModal(true);
  };

  // Execute forward to selected chats
  const executeForward = async (message, chatIds) => {
    try {
      const tenantId = getTenantId();
      
      for (const chatId of chatIds) {
        const messagesRef = collection(db, `tenants/${tenantId}/chats/${chatId}/messages`);
        await addDoc(messagesRef, {
          content: message.content,
          type: message.type || 'text',
          mediaUrl: message.mediaUrl || null,
          fileName: message.fileName || null,
          fileSize: message.fileSize || null,
          senderId: user?.uid,
          senderName: user?.displayName || 'Utente',
          senderPhoto: user?.photoURL || null,
          createdAt: serverTimestamp(),
          isForwarded: true,
          originalSender: message.senderName
        });

        const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
        await updateDoc(chatRef, {
          lastMessage: message.type === 'text' ? message.content : `[${message.type}]`,
          lastMessageAt: serverTimestamp()
        });
      }

      setShowForwardModal(false);
      setMessageToForward(null);
    } catch (err) {
      console.error('Error forwarding message:', err);
    }
  };

  // Handle global search result selection
  const handleGlobalSearchSelect = (result) => {
    const chat = chats.find(c => c.id === result.chatId);
    if (chat) {
      setActiveChat(chat);
      setShowGlobalSearch(false);
      setTimeout(() => {
        setScrollToMessageId(result.id);
        setTimeout(() => setScrollToMessageId(null), 100);
      }, 300);
    }
  };

  // Handle video call
  const handleVideoCall = () => {
    const roomName = `fitflow-${activeChat?.id}`;
    window.open(`https://fitflow.daily.co/${roomName}`, '_blank');
    sendMessage(`📹 ${user?.displayName || 'Utente'} ha avviato una videochiamata`, 'system');
  };

  // Handle voice call
  const handleVoiceCall = () => {
    const roomName = `fitflow-${activeChat?.id}`;
    window.open(`https://fitflow.daily.co/${roomName}?audio_only=true`, '_blank');
    sendMessage(`📞 ${user?.displayName || 'Utente'} ha avviato una chiamata vocale`, 'system');
  };

  // Select chat
  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    if (isMobile) {
      setShowMobileChat(true);
    }
    setIsSearchOpen(false);
    setMessageSearchTerm('');
    clearSearch();
    setShowPinnedPanel(false);
  };

  // Back to chat list (mobile)
  const handleBack = () => {
    setShowMobileChat(false);
    setActiveChat(null);
  };

  // Archive/Unarchive chat
  const handleArchiveChat = async (chatId, archive) => {
    try {
      const tenantId = getTenantId();
      const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const currentArchivedBy = chatSnap.data().archivedBy || [];
        let newArchivedBy;
        
        if (archive) {
          newArchivedBy = [...new Set([...currentArchivedBy, user?.uid])];
        } else {
          newArchivedBy = currentArchivedBy.filter(uid => uid !== user?.uid);
        }
        
        await updateDoc(chatRef, { archivedBy: newArchivedBy });
      }
    } catch (err) {
      console.error('Error archiving chat:', err);
    }
  };

  // Pin/Unpin chat
  const handlePinChat = async (chatId, pin) => {
    try {
      const tenantId = getTenantId();
      const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const currentPinnedBy = chatSnap.data().pinnedBy || [];
        let newPinnedBy;
        
        if (pin) {
          newPinnedBy = [...new Set([...currentPinnedBy, user?.uid])];
        } else {
          newPinnedBy = currentPinnedBy.filter(uid => uid !== user?.uid);
        }
        
        await updateDoc(chatRef, { pinnedBy: newPinnedBy });
      }
    } catch (err) {
      console.error('Error pinning chat:', err);
    }
  };

  // Delete chat
  const handleDeleteChat = async (chatId) => {
    if (!confirm('Sei sicuro di voler eliminare questa conversazione? L\'azione è irreversibile.')) {
      return;
    }
    
    try {
      const tenantId = getTenantId();
      const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const currentDeletedBy = chatSnap.data().deletedBy || [];
        const newDeletedBy = [...new Set([...currentDeletedBy, user?.uid])];
        
        await updateDoc(chatRef, { deletedBy: newDeletedBy });
        
        if (activeChat?.id === chatId) {
          setActiveChat(null);
          if (isMobile) setShowMobileChat(false);
        }
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  // Mark chat as read/unread
  const handleMarkReadChat = async (chatId, markAsRead) => {
    try {
      const tenantId = getTenantId();
      const chatRef = doc(db, `tenants/${tenantId}/chats/${chatId}`);
      
      if (markAsRead) {
        await updateDoc(chatRef, {
          [`unreadCount.${user?.uid}`]: 0
        });
      } else {
        await updateDoc(chatRef, {
          [`unreadCount.${user?.uid}`]: 1
        });
      }
    } catch (err) {
      console.error('Error marking chat:', err);
    }
  };

  // Handle new chat creation
  const handleNewChat = async (participantId, participantName, participantPhoto, participantRole) => {
    try {
      const chatId = await createChat(participantId, participantName, participantPhoto, participantRole);
      if (chatId) {
        const existingChat = chats.find(c => c.id === chatId);
        if (existingChat) {
          handleSelectChat(existingChat);
        } else {
          handleSelectChat({
            id: chatId,
            participants: [user?.uid, participantId],
            participantNames: {
              [user?.uid]: user?.displayName || 'Tu',
              [participantId]: participantName
            },
            participantPhotos: {
              [user?.uid]: user?.photoURL,
              [participantId]: participantPhoto
            },
            participantRoles: {
              [user?.uid]: currentUserRole,
              [participantId]: participantRole || 'client'
            }
          });
        }
        setShowNewChatModal(false);
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  // ============ RENDER CHAT AREA ============

  const renderChatArea = () => {
    if (!activeChat) {
      return <EmptyChatState />;
    }

    return (
      <div className="flex flex-col h-full relative">
        {/* Header */}
        <div className="flex-shrink-0 z-20 bg-slate-900/60 backdrop-blur-xl border-b border-white/10">
          <ChatHeader
            chat={activeChat}
            currentUserId={user?.uid}
            onBack={handleBack}
            onVideoCall={handleVideoCall}
            onVoiceCall={handleVoiceCall}
            onSearch={() => setIsSearchOpen(!isSearchOpen)}
            onSettings={() => setShowPinnedPanel(!showPinnedPanel)}
            onStarred={() => setShowStarredPanel(!showStarredPanel)}
            isSearchOpen={isSearchOpen}
            searchTerm={messageSearchTerm}
            onSearchChange={setMessageSearchTerm}
            onCloseSearch={() => {
              setIsSearchOpen(false);
              setMessageSearchTerm('');
              clearSearch();
            }}
            searchResults={searchResults}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
          />
        </div>

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <MessagesArea
            messages={searchResults.length > 0 ? searchResults : messages}
            loading={messagesLoading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            currentUserId={user?.uid}
            onReply={setReplyTo}
            onEdit={setEditingMessage}
            onDelete={deleteMessage}
            onPin={togglePin}
            onReaction={handleReaction}
            onStar={handleStarMessage}
            onForward={handleForwardMessage}
            typingUsers={typingUsers}
            scrollToMessageId={scrollToMessageId}
            participantNames={activeChat?.participantNames}
            isMobile={isMobile}
          />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 z-20 bg-slate-900/60 backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <MessageInput
            onSend={handleSendMessage}
            onTyping={setTyping}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editingMessage={editingMessage}
            onCancelEdit={() => setEditingMessage(null)}
            onSendEdit={handleEditMessage}
            disabled={uploading}
            isMobile={isMobile}
            userRole={currentUserRole}
          />
        </div>

        {/* Pinned Messages Panel - TODO: Create component */}
        {/* <AnimatePresence>
          {showPinnedPanel && (
            <PinnedMessagesPanel
              chatId={activeChat.id}
              onClose={() => setShowPinnedPanel(false)}
              onScrollTo={(id) => {
                setScrollToMessageId(id);
                setShowPinnedPanel(false);
                setTimeout(() => setScrollToMessageId(null), 100);
              }}
            />
          )}
        </AnimatePresence> */}

        {/* Starred Messages Panel - TODO: Create component */}
        {/* <AnimatePresence>
          {showStarredPanel && (
            <StarredMessagesPanel
              chatId={activeChat.id}
              onClose={() => setShowStarredPanel(false)}
              onScrollTo={(id) => {
                setScrollToMessageId(id);
                setShowStarredPanel(false);
                setTimeout(() => setScrollToMessageId(null), 100);
              }}
            />
          )}
        </AnimatePresence> */}
      </div>
    );
  };

  // ============ MAIN RENDER ============

  if (!user) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Accesso Richiesto</h2>
          <p className="text-slate-400">Devi effettuare l'accesso per usare la chat</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex flex-col w-full",
        isMobile 
          ? "fixed inset-0 z-30"
          : "h-[calc(100vh-72px)]"
      )}
      style={isMobile ? { 
        top: 'calc(56px + env(safe-area-inset-top, 0px))',
        bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))'
      } : undefined}
    >
      {/* Profile Check Modal - TODO: Create component */}
      {/* <AnimatePresence>
        {showProfileModal && (
          <ProfileCheckModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onSave={handleProfileSave}
          />
        )}
      </AnimatePresence> */}

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <NewChatModal
            isOpen={showNewChatModal}
            onClose={() => setShowNewChatModal(false)}
            onCreate={handleNewChat}
            currentUserRole={currentUserRole}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 h-full">
        {/* Desktop Layout */}
        {!isMobile && (
          <>
            <div className="w-80 lg:w-[360px] xl:w-[400px] flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden h-full">
              <ChatSidebar
                chats={(chats || []).filter(c => !c.deletedBy?.includes(user?.uid))}
                loading={chatsLoading}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onNewChat={() => setShowNewChatModal(true)}
                onGlobalSearch={() => setShowGlobalSearch(true)}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentUserId={user?.uid}
                onArchiveChat={handleArchiveChat}
                onPinChat={handlePinChat}
                onDeleteChat={handleDeleteChat}
                onMarkReadChat={handleMarkReadChat}
              />
            </div>
            
            <div className="flex-1 flex flex-col min-w-0">
              {renderChatArea()}
            </div>
          </>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          showMobileChat ? (
            <div className="flex-1 flex flex-col min-h-0 w-full">
              {renderChatArea()}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 w-full overflow-y-auto">
              <ChatSidebar
                chats={(chats || []).filter(c => !c.deletedBy?.includes(user?.uid))}
                loading={chatsLoading}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onNewChat={() => setShowNewChatModal(true)}
                onGlobalSearch={() => setShowGlobalSearch(true)}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentUserId={user?.uid}
                onArchiveChat={handleArchiveChat}
                onPinChat={handlePinChat}
                onDeleteChat={handleDeleteChat}
                onMarkReadChat={handleMarkReadChat}
              />
            </div>
          )
        )}
      </div>

      {/* Forward Message Modal - TODO: Create component */}
      {/* <AnimatePresence>
        {showForwardModal && messageToForward && (
          <ForwardMessageModal
            message={messageToForward}
            chats={chats}
            onForward={executeForward}
            onClose={() => {
              setShowForwardModal(false);
              setMessageToForward(null);
            }}
          />
        )}
      </AnimatePresence> */}

      {/* Global Search Modal - TODO: Create component */}
      {/* <AnimatePresence>
        {showGlobalSearch && (
          <GlobalSearchModal
            chats={chats}
            onClose={() => setShowGlobalSearch(false)}
            onSelectMessage={handleGlobalSearchSelect}
          />
        )}
      </AnimatePresence> */}
    </div>
  );
}
