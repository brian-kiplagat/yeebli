export interface EventDate {
  id: number;
  membership_id: number;
  date: string; // Unix timestamp as string
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface EventAsset {
  id: number;
  asset_name: string;
  asset_type: string;
  content_type: string;
  asset_url: string;
  asset_size: number;
  duration: number;
  hls_url: string | null;
  processing_status: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  presignedUrl: string;
}

export interface EventHost {
  name: string;
  email: string;
  profile_image: string | null;
}

export interface EventMembership {
  id: number;
  name: string;
  description: string;
  price: number;
  payment_type: 'one_off' | string;
  price_point: string;
  billing: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  dates: EventDate[];
}

export interface EventData {
  id: number;
  event_name: string;
  event_description: string;
  event_type: 'prerecorded' | string;
  asset_id: number;
  created_at: string;
  status: 'active' | 'cancelled' | string;
  live_video_url: string;
  success_url: string;
  instructions: string;
  landing_page_url: string;
  live_venue_address: string;
  updated_at: string;
  host_id: number;
  asset: EventAsset;
  host: EventHost;
  leadCount: number;
  memberships: EventMembership[];
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  event_id: number;
  registered_date: string | null;
  membership_active: boolean;
  form_identifier: string;
  host_id: number;
  token: string;
  created_at: string;
  updated_at: string;
  status_identifier: string;
  lead_status: string | null;
  dates: number[];
  source_url: string | null;
  membership_level: number;
  userId: number;
}

export interface StreamResponse {
  lead: Lead;
  membership: EventMembership;
  event: EventData;
  selectedDates: EventDate[];
}
