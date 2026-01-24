export interface ClusterResponse {
  jobId: string;
  clusters: ClusterGroup[];
  orphans: OrphanGroup[];
}

export interface ClusterGroup {
  id: string;
  slug: string;
  label: string;
  items: string[];
}

export interface OrphanGroup {
  id: string;
  slug: string;
  label: string;
  item: string;
}

export interface ClusterDetailResponse {
  jobId: string;
  slug: string;
  label: string;
  items: string[];
  type: 'cluster' | 'orphan';
}
