import CatalogPreview from "@/components/catalog-preview";
import { getCatalogData } from "@/lib/catalog-data";

export const revalidate = 0;

export default async function Home() {
  const { products, categories } = await getCatalogData();
  return <CatalogPreview products={products} categories={categories} />;
}
