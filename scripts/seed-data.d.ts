export interface SeedService {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export const SEED_SERVICES: SeedService[];
