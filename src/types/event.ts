export interface EventData {
  id: number;
  event_name: string;
  event_description: string;
  event_date: string; // Unix timestamp
  start_time: string;
  end_time: string;
  asset_id: number;
  status: 'active' | 'cancelled' | 'suspended';
  created_at: string;
  updated_at: string;
  host_id: number;
  asset: Asset;
  host: Host;
  event_code: string;
}
export interface Host {
  id: number;
  name: string;
  email: string;
  profile_image: string;
}
export interface Asset {
  id: number;
  asset_name: string;
  asset_type: string;
  asset_url: string;
  asset_size: number;
  duration: number | null;
  hls_url: string | null;
  processing_status: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  presignedUrl: string;
}
