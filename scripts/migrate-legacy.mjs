import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const productsMatch = html.match(/const productsData = (\[[\s\S]*?\n    \]);/);
const transliterationMatch = html.match(/const ru2en = (\{[\s\S]*?\n    \});/);

if (!productsMatch || !transliterationMatch) {
  throw new Error("Не удалось найти исходные данные в index.html");
}

const products = vm.runInNewContext(productsMatch[1]);
const ru2en = vm.runInNewContext(`(${transliterationMatch[1]})`);
const photosDirectory = path.join(root, "Photos");
const photoFiles = new Set(
  fs.readdirSync(photosDirectory).filter((file) => /\.jpe?g$/i.test(file)),
);

const categoryLabels = {
  tvorozhny_produkt: "Творожный продукт",
  sabah: "Продукция Sabah",
  fermerskie_produkty: "Фермерские продукты",
  tvorozhnye_syry: "Творожные сыры",
  kopcheny_syr: "Копчёный сыр",
  syry: "Сыры ГОСТ",
  tvorozhnaya_massa: "Творожная масса",
  syrny_produkt: "Сырный продукт",
  plavleny_syr: "Плавленый сыр",
  yeremyan: "Продукция Yeremyan",
  rassolnye_syry: "Рассольные сыры",
  slivochnoe_maslo: "Сливочное масло и спреды",
  maconi: "Мацони",
  smetanny_produkt: "Сметанный продукт",
  deserty: "Десерты",
  slivki: "Сливки",
};

const knownAliases = {
  "Tvorozhnyy_produkt_9_korobka_5_kg_1.jpg":
    "Tvorozhnyy_produkt_9_korobka_5_kg_1.jpg.jpg",
  "Katyk_Erevan_1.jpg": "Katyk_Yerevan_1.jpg",
  "Katyk_Erevan_2.jpg": "Katyk_Yerevan_2.jpg",
  "Katyk_Erevan_3.jpg": "Katyk_Yerevan_3.jpg",
  "Smetannyy_produkt_MT_20_5_kg_vedro_2.jpg":
    "Smetannyy_produkt_MT_20_5kg_vedro_2.jpg",
  "Smetannyy_produkt_MT_20_5_kg_vedro_3.jpg":
    "Smetannyy_produkt_MT_20_5kg_vedro_3.jpg",
};

function transliterate(value) {
  return value
    .split("")
    .map((character) =>
      ru2en[character] !== undefined ? ru2en[character] : character,
    )
    .join("")
    .replace(/_+/g, "_")
    .replace(/_$/, "");
}

function numericPrice(value) {
  const normalized = String(value).replace(/\s/g, "");
  return /\d/.test(normalized) ? Number(normalized) : null;
}

function badgeFromLegacyStatus(status) {
  if (status === 1) return "price_up";
  if (status === 2) return "price_down";
  if (status === 3) return "promo";
  return "none";
}

const migrationReport = {
  totalProducts: products.length,
  productsWithoutImages: [],
  matchedSourceImages: [],
};

const migratedProducts = products.map((product, index) => {
  const imageBase = transliterate(product.name);
  const images = [];

  for (let position = 1; position <= 3; position += 1) {
    const expectedName = `${imageBase}_${position}.jpg`;
    const sourceName = photoFiles.has(expectedName)
      ? expectedName
      : knownAliases[expectedName] && photoFiles.has(knownAliases[expectedName])
        ? knownAliases[expectedName]
        : null;

    if (sourceName) {
      const outputName = `${String(index + 1).padStart(3, "0")}-${position}.webp`;
      images.push({
        path: `/products/${outputName}`,
        alt: product.name,
        position,
        legacyFile: sourceName,
      });
      migrationReport.matchedSourceImages.push(sourceName);
    }
  }

  if (images.length === 0) migrationReport.productsWithoutImages.push(product.name);

  return {
    id: `legacy-${String(index + 1).padStart(3, "0")}`,
    name: product.name,
    price: numericPrice(product.price),
    oldPrice: product.oldPrice ? numericPrice(product.oldPrice) : null,
    unit: product.unit === "—" ? null : product.unit,
    category: product.category,
    availability: "in_stock",
    badge: badgeFromLegacyStatus(product.status),
    published: true,
    sortOrder: index + 1,
    images,
  };
});

const categories = Object.entries(categoryLabels).map(([id, name], index) => ({
  id,
  name,
  sortOrder: index + 1,
}));

fs.mkdirSync(path.join(root, "data"), { recursive: true });
fs.writeFileSync(
  path.join(root, "data", "products.json"),
  `${JSON.stringify(migratedProducts, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, "data", "categories.json"),
  `${JSON.stringify(categories, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, "data", "migration-report.json"),
  `${JSON.stringify(migrationReport, null, 2)}\n`,
);

console.log(
  `Перенесено ${migratedProducts.length} товаров; без фото: ${migrationReport.productsWithoutImages.length}; найдено фото: ${migrationReport.matchedSourceImages.length}.`,
);
