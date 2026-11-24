import type { Category, ChipVendor, Score, SpecGroup, SpecItem } from './common';

export interface ProductCard {
  id: string;
  category: Category;
  name: string;
  priceVnd: number;
  imageUrl: string | null;
  vendor: ChipVendor;
  aibBrand: string | null;
  isLimitedEdition: boolean;
  score: Pick<Score, 'raw' | 'normalized'>;
  summary: SpecItem[];
}

export type ProductSort = 'default' | 'price_asc' | 'price_desc' | 'score_desc';

export interface ProductListQuery {
  category: Category;
  vendor?: ChipVendor[];
  priceMin?: number;
  priceMax?: number;
  vramGb?: number[];
  aibBrand?: string[];
  socket?: string[];
  seriesId?: string;
  limitedEdition?: boolean;
  sort?: ProductSort;
  q?: string;
  page?: number;
  pageSize?: number;
  perVendor?: boolean;
  vendorPages?: Partial<Record<ChipVendor, number>>;
}

export interface Facets {
  vendors: ChipVendor[];
  priceRange: { min: number; max: number } | null;
  vramGb?: number[];
  aibBrands?: string[];
  sockets?: string[];
}

export interface ProductListPagination {
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: ProductCard[];
  facets: Facets;
  total: number;
  pagination?: ProductListPagination;
  vendorTotals?: Partial<Record<ChipVendor, number>>;
}

export interface FeaturedProductsResponse {
  cpus: ProductCard[];
  gpus: ProductCard[];
}

export interface ProductDetail extends ProductCard {
  stockStatus: 'in_stock';
  warrantyMonths: 36;
  packaging: 'full_box';
  score: Score;
  specGroups: SpecGroup[];
  series: { id: string; name: string } | null;
  psuPrefill: { cpu?: string; gpu?: string };
}

export interface SearchSuggestion {
  id: string;
  name: string;
  category: Category;
  priceVnd: number;
  imageUrl: string | null;
}

export interface RemovedItem {
  productId: string;
  name: string | null;
}

export interface ResolveResponse {
  active: Pick<ProductCard, 'id' | 'name' | 'category' | 'priceVnd' | 'imageUrl'>[];
  removed: RemovedItem[];
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  src: string;
}

export interface MusicPlaylistResponse {
  tracks: MusicTrack[];
}
