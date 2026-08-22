import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const products = JSON.parse(fs.readFileSync(path.join(root, "data", "products.json"), "utf8"));
const categories = JSON.parse(fs.readFileSync(path.join(root, "data", "categories.json"), "utf8"));

const textValue = (value) => (value === null || value === undefined ? "null" : `'${String(value).replaceAll("'", "''")}'`);
const numberValue = (value) => (value === null || value === undefined ? "null" : String(value));

const lines = [
  "-- Начальные данные каталога «Молочные Традиции».",
  "-- Выполните после schema.sql в Supabase → SQL Editor.",
  "",
];

for (const category of categories) {
  lines.push(
    `insert into public.categories (id, name, sort_order) values (${textValue(category.id)}, ${textValue(category.name)}, ${category.sortOrder}) on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;`,
  );
}

lines.push("");

for (const product of products) {
  lines.push(
    `insert into public.products (id, name, price, old_price, unit, category_id, availability, badge, published, sort_order) values (${textValue(product.id)}, ${textValue(product.name)}, ${numberValue(product.price)}, ${numberValue(product.oldPrice)}, ${textValue(product.unit)}, ${textValue(product.category)}, ${textValue(product.availability)}, ${textValue(product.badge)}, ${product.published}, ${product.sortOrder}) on conflict (id) do update set name = excluded.name, price = excluded.price, old_price = excluded.old_price, unit = excluded.unit, category_id = excluded.category_id, availability = excluded.availability, badge = excluded.badge, published = excluded.published, sort_order = excluded.sort_order;`,
  );

  for (const image of product.images) {
    const imageId = `${product.id}-image-${image.position}`;
    lines.push(
      `insert into public.product_images (id, product_id, url, storage_path, alt, position) values (${textValue(imageId)}, ${textValue(product.id)}, ${textValue(image.path)}, null, ${textValue(image.alt)}, ${image.position}) on conflict (id) do update set url = excluded.url, alt = excluded.alt, position = excluded.position;`,
    );
  }
}

lines.push("");
fs.mkdirSync(path.join(root, "supabase"), { recursive: true });
fs.writeFileSync(path.join(root, "supabase", "seed.sql"), `${lines.join("\n")}\n`);
console.log(`Создан seed.sql: ${products.length} товаров, ${categories.length} категорий.`);
