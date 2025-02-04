export type ImageInfo = {
  architecture: string;
  features: string;
  variant?: string;
  digest: string;
  os: string;
  os_features: string;
  os_version?: string;
  size: number;
  status: string;
  last_pulled: string;
  last_pushed: string;
};

export type ImageTagInfo = {
  creator: number;
  id: number;
  images: ImageInfo[];
  last_updated: string;
  last_updater: number;
  last_updater_username: string;
  name: string;
  repository: number;
  full_size: number;
  v2: boolean;
  tag_status: 'active' | 'inactive' | 'deprecated'; // Adjust if other statuses exist
  tag_last_pulled: string;
  tag_last_pushed: string;
  media_type: string;
  content_type: string;
  digest: string;
};
