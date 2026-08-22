import "server-only";

import { createClient } from "@supabase/supabase-js";
import staticCategories from "@/data/categories.json";
import staticProducts from "@/data/products.json";
import type { CatalogCategory, CatalogProduct } from "@/lib/types";

type DatabaseImage = {
  id: string;
  url: string;
  alt: string | null;
  position: number;
  storage_path: string | null;
};

type DatabaseProduct = {
  id: string;
  name: string;
  price: number | string | null;
  old_price: number | string | null;
  unit: string | null;
  category_id: string;
  availability: CatalogProduct["availability"];
  badge: CatalogProduct["badge"];
  published: boolean;
  sort_order: number;
  product_images: DatabaseImage[] | null;
};

const fallback = {
  products: staticProducts as CatalogProduct[],
  categories: staticCategories as CatalogCategory[],
  source: "local" as const,
};

export async function getCatalogData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return fallback;

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id,name,price,old_price,unit,category_id,availability,badge,published,sort_order,product_images(id,url,alt,position,storage_path)",
        )
        .eq("published", true)
        .order("sort_order"),
      supabase.from("categories").select("id,name,sort_order").order("sort_order"),
    ]);

    if (productsResult.error || categoriesResult.error) return fallback;

    const products = (productsResult.data as DatabaseProduct[]).map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price === null ? null : Number(product.price),
      oldPrice: product.old_price === null ? null : Number(product.old_price),
      unit: product.unit,
      category: product.category_id,
      availability: product.availability,
      badge: product.badge,
      published: product.published,
      sortOrder: product.sort_order,
      images: (product.product_images ?? [])
        .sort((a, b) => a.position - b.position)
        .map((image) => ({
          id: image.id,
          path: image.url,
          alt: image.alt || product.name,
          position: image.position,
          storagePath: image.storage_path,
        })),
    }));

    const categories = (categoriesResult.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sort_order,
    }));

    return { products, categories, source: "supabase" as const };
  } catch {
    return fallback;
  }
}
