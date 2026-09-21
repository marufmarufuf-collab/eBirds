export type Profile = {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
};

export type Conversation = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

// Minimal hand-written Database type (swap for `supabase gen types typescript`
// once the project is live, per the README).
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string; username: string }; Update: Partial<Profile> };
      conversations: { Row: Conversation; Insert: Partial<Conversation>; Update: Partial<Conversation> };
      messages: { Row: Message; Insert: Partial<Message> & { conversation_id: string; sender_id: string; content: string }; Update: Partial<Message> };
    };
    Functions: {
      get_or_create_conversation: { Args: { other_user: string }; Returns: string };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
    };
  };
};
