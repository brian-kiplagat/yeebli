export interface EventDate {
  id: number;
  event_id: number;
  date: string; // Unix timestamp as string
  created_at: string;
  updated_at: string;
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
  payment_type: 'one_off' | string; // Add other payment types if needed
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface EventData {
  id: number;
  event_name: string;
  event_description: string;
  event_type: 'prerecorded' | string; // Add other event types if needed
  asset_id: number;
  created_at: string;
  status: 'active' | string; // Add other status types if needed
  live_video_url: string;
  success_url: string;
  instructions: string;
  landing_page_url: string;
  live_venue_address: string;
  dates: EventDate[];
  membership_id: number;
  updated_at: string;
  host_id: number;
  asset: EventAsset;
  host: EventHost;
  leadCount: number;
  membership: EventMembership;
}
