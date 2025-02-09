export interface DataItem {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface DataFilter {
  status?: 'active' | 'inactive';
  search?: string;
  userId?: string;
}

export interface DataSort {
  column: keyof DataItem;
  direction: 'asc' | 'desc';
}