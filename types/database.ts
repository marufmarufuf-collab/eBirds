export type ProfilePhoto = {
  id: string;
  user_id: string;
  url: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  is_active: boolean;
  points: number;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
};

export type Conversation = {
  id: string;
  type: "direct" | "group";
  user_a: string | null;
  user_b: string | null;
  title: string | null;
  avatar_url: string | null;
  created_at: string;
};

export const ACTIVITIES = ["walking", "running", "jogging", "swimming", "trips", "sightseeing", "camping"] as const;
export type Activity = (typeof ACTIVITIES)[number];

export type EventStatus = "open" | "full" | "cancelled" | "completed";

export type Event = {
  id: string;
  organizer_id: string;
  activity: Activity;
  title: string;
  description: string | null;
  event_date: string;
  location_area: string;
  meeting_point: string | null;
  location_link: string | null;
  max_participants: number | null;
  is_paid: boolean;
  price: number | null;
  currency: string;
  status: EventStatus;
  conversation_id: string | null;
  created_at: string;
};

export type ParticipantStatus = "pending" | "confirmed" | "declined" | "cancelled";

export type EventParticipant = {
  event_id: string;
  user_id: string;
  status: ParticipantStatus;
  requested_at: string;
  confirmed_at: string | null;
  completed: boolean;
};

export type Club = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  conversation_id: string | null;
  created_at: string;
};

export type ClubMember = {
  club_id: string;
  user_id: string;
  role: "member" | "admin";
  joined_at: string;
};

export type ClubAnnouncement = {
  id: string;
  club_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type PointsEntry = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  event_id: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  audio_url: string | null;
  audio_duration: number | null;
  edited_at: string | null;
  deleted_at: string | null;
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
