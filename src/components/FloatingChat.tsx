/**
 * FloatingChat
 *
 * A floating action button (bottom-right) that opens a full-screen
 * slide-up modal containing:
 *   • ChatScreen    — for User / Volunteer (message admin)
 *   • AdminInbox    — for Admin (see all threads, reply)
 *
 * The button shows a red unread-count badge for the admin.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/colors';
import {
  sendMessage,
  getThreadMessages,
  getAllThreads,
  markThreadAsRead,
  getUnreadCount,
  getUserByEmail,
} from '../database/db.web';

const { height: SCREEN_H } = Dimensions.get('window');
const ADMIN_EMAIL = 'admin@ruralconnect.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const roleColor = (role: string) =>
  role === 'volunteer' ? '#8458B3' : '#A0D2EB';

const roleLabel = (role: string) =>
  role === 'volunteer' ? '🙋 Volunteer' : '👤 User';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
  ' · ' +
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// ─── User/Volunteer chat panel ────────────────────────────────────────────────
function UserChatPanel({ onClose }: { onClose: () => void }) {
  const T = useTheme();
  const fab = makeFab(T); const ps = makePs(T); const ms = makeMs(T); const inb = makeInb(T);
  const { user }                    = useAuthStore();
  const [messages, setMessages]     = useState<any[]>([]);
  const [text, setText]             = useState('');
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [adminId, setAdminId]       = useState('sys_admin_001');
  const flatRef                     = useRef<FlatList>(null);
  const threadId                    = user?.id ?? '';

  const load = useCallback(async () => {
    const msgs = await getThreadMessages(threadId);
    setMessages(msgs);
  }, [threadId]);

  useEffect(() => {
    (async () => {
      const admin = await getUserByEmail(ADMIN_EMAIL);
      if (admin) setAdminId(admin.id);
      await load();
      setLoading(false);
    })();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

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
      await load();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  const renderMsg = ({ item }: { item: any }) => {
    const mine = item.senderId === user?.id;
    return (
      <View style={[ms.row, mine ? ms.rowR : ms.rowL]}>
        {!mine && (
          <View style={ms.adminAvatar}>
            <Ionicons name="shield-checkmark" size={13} color="#fff" />
          </View>
        )}
        <View style={[ms.bubble, mine ? ms.bubbleMine : ms.bubbleAdmin]}>
          {!mine && <Text style={ms.sender}>Admin</Text>}
          <Text style={[ms.msgText, mine && ms.msgTextMine]}>{item.text}</Text>
          <Text style={[ms.time, mine && ms.timeMine]}>{fmtTime(item.timestamp)}</Text>
        </View>
        {mine && (
          <View style={ms.userAvatar}>
            <Text style={ms.userAvatarTxt}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={ps.header}>
        <View style={ps.headerLeft}>
          <View style={ps.adminAv}>
            <Ionicons name="shield-checkmark" size={18} color="#fff" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={ps.headerName}>Admin</Text>
            <Text style={ps.headerSub}>Rural Connect Support</Text>
          </View>
        </View>
        <View style={ps.privatePill}>
          <Ionicons name="lock-closed" size={10} color="#8458B3" />
          <Text style={ps.privatePillTxt}>Private</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={ps.closeBtn}>
          <Ionicons name="close" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={ps.centered}><ActivityIndicator color="#8458B3" /></View>
      ) : messages.length === 0 ? (
        <View style={ps.empty}>
          <Ionicons name="chatbubbles-outline" size={48} color="#ddd" />
          <Text style={ps.emptyTitle}>No messages yet</Text>
          <Text style={ps.emptySub}>
            Send a message to the admin.{'\n'}Only you and the admin can see this.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(i) => i.id}
          renderItem={renderMsg}
          contentContainerStyle={{ padding: 14, paddingBottom: 6 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input */}
      <View style={ps.inputBar}>
        <TextInput
          style={ps.input}
          placeholder="Type a message to admin…"
          placeholderTextColor="#bbb"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[ps.sendBtn, (!text.trim() || sending) && ps.sendBtnOff]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={17} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Admin inbox panel ────────────────────────────────────────────────────────
function AdminInboxPanel({ onClose }: { onClose: () => void }) {
  const T = useTheme();
  const fab = makeFab(T); const ps = makePs(T); const ms = makeMs(T); const inb = makeInb(T);
  const { user }                        = useAuthStore();
  const [threads, setThreads]           = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [loading, setLoading]           = useState(true);

  const loadThreads = useCallback(async () => {
    const t = await getAllThreads();
    setThreads(t);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadThreads();
    const id = setInterval(loadThreads, 3000);
    return () => clearInterval(id);
  }, [loadThreads]);

  if (activeThread) {
    return (
      <AdminThreadPanel
        thread={activeThread}
        onBack={() => { setActiveThread(null); loadThreads(); }}
        onClose={onClose}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={ps.header}>
        <View style={ps.headerLeft}>
          <Ionicons name="mail" size={22} color="#8458B3" />
          <Text style={[ps.headerName, { marginLeft: 10 }]}>Inbox</Text>
        </View>
        <Text style={ps.headerSub}>
          {threads.length} conversation{threads.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={onClose} style={ps.closeBtn}>
          <Ionicons name="close" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={ps.centered}><ActivityIndicator color="#8458B3" /></View>
      ) : threads.length === 0 ? (
        <View style={ps.empty}>
          <Ionicons name="chatbubbles-outline" size={48} color="#ddd" />
          <Text style={ps.emptyTitle}>No messages yet</Text>
          <Text style={ps.emptySub}>Messages from users and volunteers will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(i) => i.threadId}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[inb.card, item.unreadCount > 0 && inb.cardUnread]}
              onPress={() => setActiveThread(item)}
              activeOpacity={0.75}
            >
              <View style={[inb.av, { backgroundColor: roleColor(item.senderRole) }]}>
                <Text style={inb.avTxt}>{item.senderName?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={inb.row}>
                  <Text style={inb.name}>{item.senderName}</Text>
                  <Text style={inb.date}>
                    {new Date(item.lastTimestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <View style={inb.row}>
                  <View style={[inb.rolePill, { backgroundColor: roleColor(item.senderRole) + '18' }]}>
                    <Text style={[inb.roleTxt, { color: roleColor(item.senderRole) }]}>
                      {roleLabel(item.senderRole)}
                    </Text>
                  </View>
                  <Text style={inb.email} numberOfLines={1}>{item.senderEmail}</Text>
                </View>
                <Text style={inb.lastMsg} numberOfLines={1}>{item.lastMessage}</Text>
              </View>
              {item.unreadCount > 0 && (
                <View style={inb.badge}>
                  <Text style={inb.badgeTxt}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// ─── Admin thread panel ───────────────────────────────────────────────────────
function AdminThreadPanel({
  thread,
  onBack,
  onClose,
}: {
  thread: any;
  onBack: () => void;
  onClose: () => void;
}) {
  const T = useTheme();
  const fab = makeFab(T); const ps = makePs(T); const ms = makeMs(T); const inb = makeInb(T);
  const { user }                    = useAuthStore();
  const [messages, setMessages]     = useState<any[]>([]);
  const [text, setText]             = useState('');
  const [sending, setSending]       = useState(false);
  const flatRef                     = useRef<FlatList>(null);

  const load = useCallback(async () => {
    await markThreadAsRead(thread.threadId);
    const msgs = await getThreadMessages(thread.threadId);
    setMessages(msgs);
  }, [thread.threadId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await sendMessage({
        senderId:   user.id,
        senderName: user.name,
        senderRole: 'admin',
        receiverId: thread.threadId,
        threadId:   thread.threadId,
        text: text.trim(),
      });
      setText('');
      await load();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  const renderMsg = ({ item }: { item: any }) => {
    const isAdmin = item.senderRole === 'admin';
    return (
      <View style={[ms.row, isAdmin ? ms.rowR : ms.rowL]}>
        {!isAdmin && (
          <View style={[ms.userAvatar, { backgroundColor: roleColor(item.senderRole) }]}>
            <Text style={ms.userAvatarTxt}>{item.senderName?.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[ms.bubble, isAdmin ? ms.bubbleMine : ms.bubbleAdmin]}>
          {!isAdmin && (
            <Text style={[ms.sender, { color: roleColor(item.senderRole) }]}>{item.senderName}</Text>
          )}
          <Text style={[ms.msgText, isAdmin && ms.msgTextMine]}>{item.text}</Text>
          <Text style={[ms.time, isAdmin && ms.timeMine]}>{fmtTime(item.timestamp)}</Text>
        </View>
        {isAdmin && (
          <View style={ms.adminAvatar}>
            <Ionicons name="shield-checkmark" size={13} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={ps.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={20} color="#8458B3" />
        </TouchableOpacity>
        <View style={[inb.av, { backgroundColor: roleColor(thread.senderRole), width: 34, height: 34, borderRadius: 17 }]}>
          <Text style={inb.avTxt}>{thread.senderName?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={ps.headerName}>{thread.senderName}</Text>
          <Text style={ps.headerSub}>{thread.senderEmail}</Text>
        </View>
        <View style={[inb.rolePill, { backgroundColor: roleColor(thread.senderRole) + '18' }]}>
          <Text style={[inb.roleTxt, { color: roleColor(thread.senderRole) }]}>
            {roleLabel(thread.senderRole)}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={[ps.closeBtn, { marginLeft: 8 }]}>
          <Ionicons name="close" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={ps.empty}>
          <Ionicons name="chatbubble-outline" size={40} color="#ddd" />
          <Text style={ps.emptyTitle}>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(i) => i.id}
          renderItem={renderMsg}
          contentContainerStyle={{ padding: 14, paddingBottom: 6 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reply input */}
      <View style={ps.inputBar}>
        <TextInput
          style={ps.input}
          placeholder={`Reply to ${thread.senderName}…`}
          placeholderTextColor="#bbb"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[ps.sendBtn, (!text.trim() || sending) && ps.sendBtnOff]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={17} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Floating button + modal shell ───────────────────────────────────────────
export default function FloatingChat() {
  const T = useTheme();
  const fab = makeFab(T);
  const ps = makePs(T);
  const { user }              = useAuthStore();
  const [open, setOpen]       = useState(false);
  const [unread, setUnread]   = useState(0);
  const slideAnim             = useRef(new Animated.Value(SCREEN_H)).current;

  const isAdmin = user?.role === 'admin';

  // Poll unread count for admin badge
  useEffect(() => {
    if (!isAdmin) return;
    const tick = async () => setUnread(await getUnreadCount());
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [isAdmin]);

  const openPanel = () => {
    setOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_H,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  if (!user) return null;

  return (
    <>
      {/* ── Floating button ── */}
      <TouchableOpacity
        style={fab.btn}
        onPress={openPanel}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isAdmin ? 'mail' : 'chatbubbles'}
          size={26}
          color="#fff"
        />
        {/* Unread badge */}
        {isAdmin && unread > 0 && (
          <View style={fab.badge}>
            <Text style={fab.badgeTxt}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Slide-up modal ── */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closePanel}
        statusBarTranslucent
      >
        {/* Dim backdrop */}
        <TouchableOpacity
          style={fab.backdrop}
          activeOpacity={1}
          onPress={closePanel}
        />

        {/* Panel */}
        <Animated.View
          style={[fab.panel, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Drag handle */}
          <View style={fab.handle} />

          <SafeAreaView style={{ flex: 1 }}>
            {isAdmin
              ? <AdminInboxPanel onClose={closePanel} />
              : <UserChatPanel   onClose={closePanel} />}
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

/** Floating button + modal — theme-aware builders */
const makeFab = (T: any) => ({
  btn: {
    position: 'absolute' as const, bottom: 24, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: T.primary,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 10, zIndex: 999,
  },
  badge: {
    position: 'absolute' as const, top: -2, right: -2,
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: T.danger,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    paddingHorizontal: 4, borderWidth: 2, borderColor: T.cardBg,
  },
  badgeTxt: { fontSize: 10, fontWeight: '800' as const, color: T.white },
  backdrop: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: {
    position: 'absolute' as const, left: 0, right: 0, bottom: 0,
    height: SCREEN_H * 0.82, backgroundColor: T.bg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    overflow: 'hidden' as const,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 20,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: T.border, alignSelf: 'center' as const, marginTop: 10, marginBottom: 4 },
});

const makePs = (T: any) => ({
  header: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: T.cardBg, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  headerLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, flex: 1 },
  adminAv: { width: 38, height: 38, borderRadius: 19, backgroundColor: T.primary, justifyContent: 'center' as const, alignItems: 'center' as const },
  headerName: { fontSize: 15, fontWeight: '700' as const, color: T.textPrimary },
  headerSub: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  privatePill: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, backgroundColor: T.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 8 },
  privatePillTxt: { fontSize: 10, color: T.primary, fontWeight: '700' as const },
  closeBtn: { padding: 6 },
  centered: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
  empty: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 28 },
  emptyTitle: { fontSize: 16, fontWeight: '700' as const, color: T.textMuted, marginTop: 14 },
  emptySub: { fontSize: 13, color: T.textMuted, textAlign: 'center' as const, marginTop: 8, lineHeight: 20 },
  inputBar: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, backgroundColor: T.cardBg, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: T.border, gap: 10 },
  input: { flex: 1, borderWidth: 1.5, borderColor: T.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: T.textPrimary, maxHeight: 100, backgroundColor: T.surface },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: T.primary, justifyContent: 'center' as const, alignItems: 'center' as const },
  sendBtnOff: { backgroundColor: T.textMuted },
});

const makeMs = (T: any) => ({
  row: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, marginBottom: 10 },
  rowR: { justifyContent: 'flex-end' as const },
  rowL: { justifyContent: 'flex-start' as const },
  adminAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: T.primary, justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: 7 },
  userAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: T.accent, justifyContent: 'center' as const, alignItems: 'center' as const, marginLeft: 7 },
  userAvatarTxt: { fontSize: 11, fontWeight: '800' as const, color: T.white },
  bubble: { maxWidth: '72%' as any, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18 },
  bubbleMine: { backgroundColor: T.primary, borderBottomRightRadius: 4 },
  bubbleAdmin: { backgroundColor: T.cardBg, borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 1 },
  sender: { fontSize: 10, fontWeight: '700' as const, color: T.primary, marginBottom: 3 },
  msgText: { fontSize: 14, color: T.textPrimary, lineHeight: 20 },
  msgTextMine: { color: T.white },
  time: { fontSize: 10, color: T.textMuted, marginTop: 3, textAlign: 'right' as const },
  timeMine: { color: 'rgba(255,255,255,0.6)' },
});

const makeInb = (T: any) => ({
  card: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: T.cardBg, borderRadius: 14, padding: 13, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: T.primary },
  av: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center' as const, alignItems: 'center' as const },
  avTxt: { fontSize: 17, fontWeight: '800' as const, color: T.white },
  row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  name: { fontSize: 14, fontWeight: '700' as const, color: T.textPrimary },
  date: { fontSize: 11, color: T.textMuted },
  rolePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  roleTxt: { fontSize: 10, fontWeight: '700' as const },
  email: { fontSize: 11, color: T.textMuted, flex: 1, marginLeft: 6 },
  lastMsg: { fontSize: 12, color: T.textSecond, marginTop: 3 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: T.danger, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 4, marginLeft: 8 },
  badgeTxt: { fontSize: 10, fontWeight: '800' as const, color: T.white },
});

