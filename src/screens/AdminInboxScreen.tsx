/**
 * AdminInboxScreen — for Admin only
 *
 * Shows a list of all conversations (one per user/volunteer).
 * Tapping a thread opens the full conversation where admin can reply.
 * Unread messages are highlighted with a badge.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import {
  getAllThreads,
  getThreadMessages,
  sendMessage,
  markThreadAsRead,
} from '../database/db.web';

// ─── Inbox list ───────────────────────────────────────────────────────────────
function InboxList({
  onOpenThread,
}: {
  onOpenThread: (thread: any) => void;
}) {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const t = await getAllThreads();
    setThreads(t);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const roleColor = (role: string) =>
    role === 'volunteer' ? '#E65100' : '#1976D2';

  const roleLabel = (role: string) =>
    role === 'volunteer' ? '🙋 Volunteer' : '👤 User';

  if (loading) {
    return (
      <View style={inboxStyles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={inboxStyles.container}>
      <View style={inboxStyles.header}>
        <Ionicons name="mail" size={28} color="#fff" />
        <Text style={inboxStyles.headerTitle}>Inbox</Text>
        <Text style={inboxStyles.headerSub}>
          {threads.length} conversation{threads.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {threads.length === 0 ? (
        <View style={inboxStyles.empty}>
          <Ionicons name="chatbubbles-outline" size={56} color="#ddd" />
          <Text style={inboxStyles.emptyTitle}>No messages yet</Text>
          <Text style={inboxStyles.emptySub}>
            Messages from users and volunteers will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.threadId}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                inboxStyles.threadCard,
                item.unreadCount > 0 && inboxStyles.threadCardUnread,
              ]}
              onPress={() => onOpenThread(item)}
              activeOpacity={0.75}
            >
              {/* Avatar */}
              <View
                style={[
                  inboxStyles.avatar,
                  { backgroundColor: roleColor(item.senderRole) },
                ]}
              >
                <Text style={inboxStyles.avatarText}>
                  {item.senderName?.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={inboxStyles.threadTop}>
                  <Text style={inboxStyles.senderName}>{item.senderName}</Text>
                  <Text style={inboxStyles.threadTime}>
                    {new Date(item.lastTimestamp).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short',
                    })}
                  </Text>
                </View>
                <View style={inboxStyles.threadMid}>
                  <View
                    style={[
                      inboxStyles.rolePill,
                      { backgroundColor: roleColor(item.senderRole) + '18' },
                    ]}
                  >
                    <Text
                      style={[
                        inboxStyles.rolePillText,
                        { color: roleColor(item.senderRole) },
                      ]}
                    >
                      {roleLabel(item.senderRole)}
                    </Text>
                  </View>
                  <Text style={inboxStyles.senderEmail} numberOfLines={1}>
                    {item.senderEmail}
                  </Text>
                </View>
                <Text style={inboxStyles.lastMsg} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>

              {/* Unread badge */}
              {item.unreadCount > 0 && (
                <View style={inboxStyles.unreadBadge}>
                  <Text style={inboxStyles.unreadBadgeText}>
                    {item.unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const inboxStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f0' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#2E7D32', padding: 20, paddingTop: 44, alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 6 },
  headerSub:   { fontSize: 13, color: '#C8E6C9', marginTop: 3 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#bbb', marginTop: 16 },
  emptySub:   { fontSize: 13, color: '#ccc', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  threadCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  threadCardUnread: {
    borderLeftWidth: 4, borderLeftColor: '#2E7D32',
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  threadTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  senderName: { fontSize: 15, fontWeight: '700', color: '#222' },
  threadTime: { fontSize: 11, color: '#aaa' },
  threadMid:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  rolePill:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  rolePillText: { fontSize: 10, fontWeight: '700' },
  senderEmail:{ fontSize: 11, color: '#aaa', flex: 1 },
  lastMsg:    { fontSize: 13, color: '#888', marginTop: 4 },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: '#D32F2F',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5, marginLeft: 8,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
});

// ─── Thread view (admin replies here) ────────────────────────────────────────
function ThreadView({
  thread,
  onBack,
}: {
  thread: any;
  onBack: () => void;
}) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const flatListRef             = useRef<FlatList>(null);

  const load = useCallback(async () => {
    await markThreadAsRead(thread.threadId);
    const msgs = await getThreadMessages(thread.threadId);
    setMessages(msgs);
  }, [thread.threadId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await sendMessage({
        senderId:   user.id,
        senderName: user.name,
        senderRole: 'admin',
        receiverId: thread.threadId,   // reply goes to the user
        threadId:   thread.threadId,
        text: text.trim(),
      });
      setText('');
      await load();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  const roleColor = (role: string) =>
    role === 'volunteer' ? '#E65100' : '#1976D2';

  const renderMessage = ({ item }: { item: any }) => {
    const isAdmin = item.senderRole === 'admin';
    return (
      <View style={[threadStyles.msgRow, isAdmin ? threadStyles.msgRowRight : threadStyles.msgRowLeft]}>
        {!isAdmin && (
          <View style={[threadStyles.avatar, { backgroundColor: roleColor(item.senderRole) }]}>
            <Text style={threadStyles.avatarText}>
              {item.senderName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={[threadStyles.bubble, isAdmin ? threadStyles.bubbleAdmin : threadStyles.bubbleUser]}>
          {!isAdmin && (
            <Text style={[threadStyles.bubbleSender, { color: roleColor(item.senderRole) }]}>
              {item.senderName}
            </Text>
          )}
          <Text style={[threadStyles.bubbleText, isAdmin && threadStyles.bubbleTextAdmin]}>
            {item.text}
          </Text>
          <Text style={[threadStyles.bubbleTime, isAdmin && threadStyles.bubbleTimeAdmin]}>
            {new Date(item.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit',
            })}
            {' · '}
            {new Date(item.timestamp).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short',
            })}
          </Text>
        </View>

        {isAdmin && (
          <View style={threadStyles.adminAvatar}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={threadStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Back bar */}
      <View style={threadStyles.topBar}>
        <TouchableOpacity onPress={onBack} style={threadStyles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2E7D32" />
        </TouchableOpacity>
        <View
          style={[
            threadStyles.topAvatar,
            { backgroundColor: roleColor(thread.senderRole) },
          ]}
        >
          <Text style={threadStyles.topAvatarText}>
            {thread.senderName?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={threadStyles.topName}>{thread.senderName}</Text>
          <Text style={threadStyles.topEmail}>{thread.senderEmail}</Text>
        </View>
        <View
          style={[
            threadStyles.roleTag,
            { backgroundColor: roleColor(thread.senderRole) + '18' },
          ]}
        >
          <Text style={[threadStyles.roleTagText, { color: roleColor(thread.senderRole) }]}>
            {thread.senderRole === 'volunteer' ? '🙋 Volunteer' : '👤 User'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={threadStyles.empty}>
          <Ionicons name="chatbubble-outline" size={40} color="#ddd" />
          <Text style={threadStyles.emptyText}>No messages in this thread</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={threadStyles.list}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reply input */}
      <View style={threadStyles.inputBar}>
        <TextInput
          style={threadStyles.input}
          placeholder={`Reply to ${thread.senderName}…`}
          placeholderTextColor="#bbb"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[threadStyles.sendBtn, (!text.trim() || sending) && threadStyles.sendBtnDisabled]}
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

const threadStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f0' },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  backBtn:       { padding: 4, marginRight: 8 },
  topAvatar:     { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  topAvatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  topName:       { fontSize: 14, fontWeight: '700', color: '#222' },
  topEmail:      { fontSize: 11, color: '#aaa', marginTop: 1 },
  roleTag:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  roleTagText:   { fontSize: 10, fontWeight: '700' },
  empty:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:     { fontSize: 14, color: '#bbb', marginTop: 12 },
  list:          { padding: 16, paddingBottom: 8 },
  msgRow:        { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  msgRowRight:   { justifyContent: 'flex-end' },
  msgRowLeft:    { justifyContent: 'flex-start' },
  avatar:        { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText:    { fontSize: 12, fontWeight: '800', color: '#fff' },
  adminAvatar:   { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  bubble:        { maxWidth: '72%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleAdmin:   { backgroundColor: '#2E7D32', borderBottomRightRadius: 4 },
  bubbleUser:    { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 1 },
  bubbleSender:  { fontSize: 11, fontWeight: '700', marginBottom: 3 },
  bubbleText:    { fontSize: 14, color: '#333', lineHeight: 20 },
  bubbleTextAdmin: { color: '#fff' },
  bubbleTime:    { fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'right' },
  bubbleTimeAdmin: { color: 'rgba(255,255,255,0.65)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#eee', gap: 10,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#333',
    maxHeight: 100, backgroundColor: '#fafafa',
  },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#aaa' },
});

// ─── Main export — switches between list and thread ───────────────────────────
export default function AdminInboxScreen() {
  const [activeThread, setActiveThread] = useState<any>(null);

  if (activeThread) {
    return (
      <ThreadView
        thread={activeThread}
        onBack={() => setActiveThread(null)}
      />
    );
  }

  return <InboxList onOpenThread={setActiveThread} />;
}
