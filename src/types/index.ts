// Matches backend User model (Sanctum auth, multi-tenant)
export interface User {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'super_admin' | 'head_coach' | 'coach' | 'member';
  tenant_id: string;
  timezone?: string;
  dm_available_to_members?: boolean;
  settings?: Record<string, any>;
  created_at: string;
}

// Matches backend Coach model
export interface Coach {
  id: string;
  user_id: string;
  user: User;
  specialization?: string;
  bio?: string;
  is_active: boolean;
  can_stream: boolean;
}

// Matches backend Trade model (Verticals/Trading)
export type TradeStatus = 'open' | 'closed' | 'cancelled' | 'watchlist';
export type InstrumentType = 'stock' | 'option' | 'forex' | 'crypto' | 'futures' | 'other';
export type TradeDirection = 'long' | 'short';
export type TradingStyle = 'scalping' | 'day_trading' | 'swing_trading' | 'position_trading' | 'long_term' | 'other';

export interface Trade {
  id: string;
  user_id: string;
  tenant_id: string;
  community_id?: string;
  symbol: string;
  instrument_type: InstrumentType;
  direction: TradeDirection;
  status: TradeStatus;
  entry_price?: number;
  exit_price?: number;
  position_size?: number;
  stop_loss?: number;
  take_profit?: number;
  pnl?: number;
  pnl_percent?: number;
  entry_notes?: string;
  exit_notes?: string;
  strategy_tag?: string;
  trading_style?: TradingStyle;
  is_shareable?: boolean;
  is_shared_to_community?: boolean;
  is_copied?: boolean;
  copied_from_trade_id?: string;
  copied_from_user_id?: string;
  already_copied_by_user?: boolean;
  entry_time?: string;
  exit_time?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  user?: User;
  transactions?: TradeTransaction[];
  notes?: TradeNote[];
}

export interface TradeTransaction {
  id: string;
  trade_id: string;
  action: 'close' | 'partial_close' | 'expire';
  quantity: number;
  price: number;
  fees?: number;
  realized_pnl?: number;
  notes?: string;
  transaction_at: string;
}

export interface TradeNote {
  id: string;
  trade_id: string;
  note_text: string;
  note_type?: string;
  noted_at: string;
}

// Matches backend ChatRoom model
export type ChatRoomType = 'community' | 'direct_message';

export interface ChatRoom {
  id: string;
  tenant_id: string;
  community_id?: string;
  name: string;
  description?: string;
  type: ChatRoomType;
  is_private: boolean;
  is_active: boolean;
  message_count: number;
  last_message_at?: string;
  // Client-side state
  unreadCount?: number;
  isFavorite?: boolean;
  isMuted?: boolean;
  lastMessage?: MessagePreview;
}

export interface MessagePreview {
  text: string;
  senderName: string;
  timestamp: string;
}

// Matches backend ChatMessage model
export interface ChatMessage {
  id: string;
  chat_room_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'system';
  reply_to_message_id?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  shared_trade_id?: string;
  is_edited: boolean;
  is_deleted: boolean;
  read_by?: string[];
  link_preview?: Record<string, any>;
  created_at: string;
  // Populated from relationships
  user?: User;
  reactions?: ChatReaction[];
  replyTo?: ChatMessage;
  // Client-side helpers
  isOwn?: boolean;
  threadCount?: number;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

// Matches backend DirectMessage/ChatRoom with type=direct_message
export interface DirectMessageConversation {
  id: string; // room id
  participant: User;
  lastMessage?: MessagePreview;
  unreadCount: number;
}

// Matches backend TenantAnnouncement model
export interface Announcement {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  link_url?: string;
  link_text?: string;
  priority: 'normal' | 'high' | 'critical';
  is_dismissible: boolean;
  published_at?: string;
  expires_at?: string;
  created_by: string;
  creator?: User;
}

// Matches backend CoachingSession model
export type SessionStatus = 'scheduled' | 'live' | 'ended';
export type SessionRoomType = 'broadcast' | 'video_call' | 'meeting' | 'webinar';

export interface CoachingSession {
  id: string;
  tenant_id: string;
  coach_id: string;
  title: string;
  description?: string;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  status: SessionStatus;
  room_type: SessionRoomType;
  is_recording_enabled: boolean;
  peak_viewers?: number;
  total_viewers?: number;
  // Relationships
  coach?: User;
  // Client-side
  reminderEnabled?: boolean;
}

// Matches backend Product model (used as Community)
export interface Community {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  image_url?: string;
  member_count?: number;
}

// Notification settings (client-side)
export interface NotificationSettings {
  globalEnabled: boolean;
  coachSettings: Record<string, { enabled: boolean; tradesOnly: boolean }>;
  mutedChannels: string[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

// Tenant
export interface Tenant {
  id: string;
  name: string;
  logo_url?: string;
}
