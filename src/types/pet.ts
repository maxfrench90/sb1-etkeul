export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  age: number;
  status: 'active' | 'inactive';
  owner_name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface PetFilter {
  species?: string;
  status?: string;
  ageRange?: {
    min: number;
    max: number;
  };
}

export interface SortConfig {
  column: keyof Pet;
  direction: 'asc' | 'desc';
}

export interface VisibleColumns {
  name: boolean;
  species: boolean;
  age: boolean;
  status: boolean;
  owner_name: boolean;
  created_at: boolean;
}