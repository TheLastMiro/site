"use client";

import Image from "next/image";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CatalogCategory, CatalogProduct } from "@/lib/types";

const currency = new Intl.NumberFormat("ru-RU");
const PAGE_SIZE = 24;

const availabilityLabels: Record<
  CatalogProduct["availability"],
  { label: string; className: string }
> = {
  in_stock: { label: "В наличии", className: "availability--in" },
  out_of_stock: { label: "Нет в наличии", className: "availability--out" },
  coming_soon: { label: "Скоро", className: "availability--soon" },
};

const badgeLabels: Record<CatalogProduct["badge"], string | null> = {
  none: null,
  promo: "Акция",
  price_down: "Цена снижена",
  price_up: "Новая цена",
  new: "Новинка",
};

function ProductPicture({ product }: { product: CatalogProduct }) {
  const image = product.images[0];

  if (!image) {
    return (
      <div className="image-placeholder">
        <span>МТ</span>
        <small>Фото скоро</small>
      </div>
    );
  }

  return (
    <Image
      src={image.path}
      alt={image.alt}
      fill
      sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 240px"
    />
  );
}

function ProductDialog({
  product,
  onClose,
}: {
  product: CatalogProduct;
  onClose: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const availability = availabilityLabels[product.availability];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const activeImage = product.images[imageIndex];

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="product-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog-close" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>

        <div className="dialog-gallery">
          {activeImage ? (
            <Image
              src={activeImage.path}
              alt={activeImage.alt}
              fill
              sizes="(max-width: 700px) 100vw, 520px"
              priority
            />
          ) : (
            <div className="image-placeholder image-placeholder--large">
              <span>МТ</span>
              <small>Фотография появится позже</small>
            </div>
          )}

          {product.images.length > 1 && (
            <>
              <button
                className="gallery-arrow gallery-arrow--left"
                aria-label="Предыдущее фото"
                onClick={() =>
                  setImageIndex((imageIndex - 1 + product.images.length) % product.images.length)
                }
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="gallery-arrow gallery-arrow--right"
                aria-label="Следующее фото"
                onClick={() => setImageIndex((imageIndex + 1) % product.images.length)}
              >
                <ChevronRight size={20} />
              </button>
              <div className="gallery-counter">
                {imageIndex + 1} / {product.images.length}
              </div>
            </>
          )}
        </div>

        <div className="dialog-body">
          <div className="dialog-meta">
            <span className={`availability ${availability.className}`}><i /> {availability.label}</span>
            {badgeLabels[product.badge] && (
              <span className={`detail-badge detail-badge--${product.badge}`}>
                {badgeLabels[product.badge]}
              </span>
            )}
          </div>
          <h2>{product.name}</h2>
          <div className="dialog-price">
            {product.oldPrice && <del>{currency.format(product.oldPrice)} ₽</del>}
            <strong>{product.price ? `${currency.format(product.price)} ₽` : "Цена по запросу"}</strong>
            {product.unit && <span>за {product.unit}</span>}
          </div>
          <a className="primary-button primary-button--wide" href="tel:+79774875383">
            <Phone size={18} /> Уточнить наличие
          </a>
          <p className="dialog-footnote">Цены указаны без НДС. Итоговую стоимость и доступный объём партии уточнит менеджер.</p>
        </div>
      </section>
    </div>
  );
}

export default function CatalogPreview({
  products,
  categories,
}: {
  products: CatalogProduct[];
  categories: CatalogCategory[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  const categoryNames = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");
    const result = products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const searchable = `${product.name} ${categoryNames.get(product.category) ?? ""}`.toLocaleLowerCase("ru");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });

    return [...result].sort((first, second) => {
      if (sort === "price-asc") return (first.price ?? Infinity) - (second.price ?? Infinity);
      if (sort === "price-desc") return (second.price ?? -1) - (first.price ?? -1);
      if (sort === "name") return first.name.localeCompare(second.name, "ru");
      return first.sortOrder - second.sortOrder;
    });
  }, [category, categoryNames, products, query, sort]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [category, query, sort]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <main>
      <section className="hero">
        <div className="hero__topline">
          <span className="eyebrow"><Sparkles size={14} /> Оптовый каталог</span>
          <a className="location" href="#contacts"><MapPin size={15} /> Москва</a>
        </div>
        <h1>Молочные<br /><em>Традиции</em></h1>
        <p className="hero__copy">
          Сыры и молочная продукция для магазинов, ресторанов и вашего бизнеса.
        </p>
        <div className="hero__actions">
          <a className="primary-button" href="tel:+79774875383">
            <Phone size={18} /> Позвонить
          </a>
          <span className="hero__note">Цены без НДС<br />Наличие уточняется</span>
        </div>
      </section>

      <section className="catalog-section">
        <div className="catalog-heading">
          <div>
            <span className="section-kicker">Каталог</span>
            <h2>Выберите продукт</h2>
          </div>
          <span className="product-count">{products.length} позиций</span>
        </div>

        <div className="catalog-tools">
          <label className="search-box">
            <Search size={19} />
            <input
              aria-label="Поиск товаров"
              placeholder="Название товара"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button aria-label="Очистить поиск" onClick={() => setQuery("")}><X size={17} /></button>
            ) : (
              <span>Найти</span>
            )}
          </label>

          <nav className="category-row" aria-label="Категории товаров">
            <button
              className={`category-chip ${category === "all" ? "category-chip--active" : ""}`}
              onClick={() => setCategory("all")}
            >
              Все
            </button>
            {categories.map((item) => (
              <button
                className={`category-chip ${category === item.id ? "category-chip--active" : ""}`}
                key={item.id}
                onClick={() => setCategory(item.id)}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="results-bar">
          <span>
            Найдено: <strong>{filteredProducts.length}</strong>
          </span>
          <label className="sort-control">
            <SlidersHorizontal size={15} />
            <select aria-label="Сортировка товаров" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="default">По каталогу</option>
              <option value="name">По названию</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
            </select>
          </label>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="product-grid">
            {visibleProducts.map((product) => {
              const availability = availabilityLabels[product.availability];
              const badge = badgeLabels[product.badge];

              return (
                <article className="product-card" key={product.id}>
                  <button className="product-card__open" onClick={() => setSelectedProduct(product)}>
                    <div className="product-card__image">
                      <ProductPicture product={product} />
                      {badge && (
                        <span className={`product-badge product-badge--${product.badge}`}>{badge}</span>
                      )}
                      {product.images.length > 1 && (
                        <span className="photo-count">{product.images.length} фото</span>
                      )}
                    </div>
                    <div className="product-card__body">
                      <span className="product-category">{categoryNames.get(product.category)}</span>
                      <h3>{product.name}</h3>
                      <div className="product-card__price-row">
                        <div>
                          {product.oldPrice && <del>{currency.format(product.oldPrice)} ₽</del>}
                          <strong>{product.price ? `${currency.format(product.price)} ₽` : "По запросу"}</strong>
                          {product.unit && <span> / {product.unit}</span>}
                        </div>
                        <span className="product-arrow"><ArrowUpRight size={18} /></span>
                      </div>
                      <span className={`availability ${availability.className}`}><i /> {availability.label}</span>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={26} />
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить запрос или выбрать другую категорию.</p>
            <button onClick={() => { setQuery(""); setCategory("all"); }}>Показать все товары</button>
          </div>
        )}

        {visibleCount < filteredProducts.length && (
          <button className="load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            Показать ещё {Math.min(PAGE_SIZE, filteredProducts.length - visibleCount)}
          </button>
        )}
      </section>

      <footer id="contacts">
        <span>Молочные Традиции</span>
        <div>
          <small>Заказ и наличие</small>
          <a href="tel:+79774875383">+7 977 487 53 83</a>
        </div>
      </footer>

      {selectedProduct && <ProductDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </main>
  );
}
