export type Availability = "in_stock" | "out_of_stock" | "coming_soon";
export type ProductBadge =
  | "none"
  | "promo"
  | "price_down"
  | "price_up"
  | "new";

export type ProductImage = {
  id?: string;
  path: string;
  alt: string;
  position: number;
  legacyFile?: string;
  storagePath?: string | null;
};

export type CatalogProduct = {
  id: string;
  name: string;
  price: number | null;
  oldPrice: number | null;
  unit: string | null;
  category: string;
  availability: Availability;
  badge: ProductBadge;
  published: boolean;
  sortOrder: number;
  images: ProductImage[];
};

export type CatalogCategory = {
  id: string;
  name: string;
  sortOrder: number;
};
