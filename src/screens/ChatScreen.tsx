/**
 * ChatScreen — for User / Volunteer
 *
 * Shows the conversation between the logged-in user and the admin.
 * The user can send messages; admin replies appear here too.
 * Messages are private: only this user and the admin can see them.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import {
  sendMessage,
  getThreadMessages,
  getUserByEmail,
} from '../database/db.web';

const ADMIN_EMAIL = 'admin@ruralconnect.com';

export default function ChatScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages]   = useState<any[]>([]);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [adminId, setAdminId]     = useState<string>('sys_admin_001');
  const flatListRef               = useRef<FlatList>(null);

  // threadId is always the non-admin user's id
  const threadId = user?.id ?? '';

  const loadMessages = useCallback(async () => {
    const msgs = await getThreadMessages(threadId);
    setMessages(msgs);
  }, [threadId]);

  useEffect(() => {
    const init = async () => {
      // Resolve admin id
      const admin = await getUserByEmail(ADMIN_EMAIL);
      if (admin) setAdminId(admin.id);
      await loadMessages();
      setLoading(false);
    };
    init();
  }, [loadMessages]);

  // Poll every 3 seconds for new admin replies
  useEffect(() => {
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await sendMessage({
        senderId:   user.id,
        senderName: user.name,
        senderRole: user.role,
        receiverId: adminId,
        threadId,
        text: text.trim(),
      });
      setText('');
      await loadMessages();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderId === user?.id;
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        {/* Avatar */}
        {!isMine && (
          <View style={styles.adminAvatar}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
          </View>
        )}

        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleAdmin]}>
          {!isMine && (
            <Text style={styles.bubbleSender}>Admin</Text>
          )}
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
            {new Date(item.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit',
            })}
            {' · '}
            {new Date(item.timestamp).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short',
            })}
          </Text>
        </View>

        {isMine && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* ── Header info bar ── */}
      <View style={styles.infoBar}>
        <View style={styles.adminAvatarLarge}>
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.infoName}>Admin</Text>
          <Text style={styles.infoSub}>Rural Connect Support</Text>
        </View>
        <View style={styles.privateBadge}>
          <Ionicons name="lock-closed" size={11} color="#2E7D32" />
          <Text style={styles.privateBadgeText}>Private</Text>
        </View>
      </View>

      {/* ── Messages ── */}
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Ionicons name="chatbubbles-outline" size={56} color="#ddd" />
          <Text style={styles.emptyChatTitle}>No messages yet</Text>
          <Text style={styles.emptyChatSub}>
            Send a message to the admin.{'\n'}Only you and the admin can see this conversation.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Input bar ── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message to admin…"
          placeholderTextColor="#bbb"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f0f4f0' },
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Info bar */
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  adminAvatarLarge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
  },
  infoName:  { fontSize: 15, fontWeight: '700', color: '#222' },
  infoSub:   { fontSize: 12, color: '#888', marginTop: 1 },
  privateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10,
  },
  privateBadgeText: { fontSize: 11, color: '#2E7D32', fontWeight: '700' },

  /* Empty state */
  emptyChat: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  emptyChatTitle: { fontSize: 18, fontWeight: '700', color: '#bbb', marginTop: 16 },
  emptyChatSub:   { fontSize: 13, color: '#ccc', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  /* Message list */
  messageList: { padding: 16, paddingBottom: 8 },

  /* Message rows */
  msgRow:      { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft:  { justifyContent: 'flex-start' },

  /* Avatars */
  adminAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1976D2',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },
  userAvatarText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  /* Bubbles */
  bubble: {
    maxWidth: '72%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: '#2E7D32',
    borderBottomRightRadius: 4,
  },
  bubbleAdmin: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: '#2E7D32', marginBottom: 3 },
  bubbleText:     { fontSize: 14, color: '#333', lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTime:     { fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)' },

  /* Input bar */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
    backgroundColor: '#fafafa',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#aaa' },
});
