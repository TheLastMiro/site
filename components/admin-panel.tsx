"use client";

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  PackagePlus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { removeLightImageBackground } from "@/lib/image-background";
import { getSupabaseBrowserClient, hasSupabaseConfiguration } from "@/lib/supabase-browser";
import type { CatalogCategory, CatalogProduct, ProductImage } from "@/lib/types";

type SessionUser = { id: string; email?: string };

const emptyProduct = (categories: CatalogCategory[]): CatalogProduct => ({
  id: crypto.randomUUID(),
  name: "",
  price: null,
  oldPrice: null,
  unit: "кг",
  category: categories[0]?.id ?? "syry",
  availability: "in_stock",
  badge: "none",
  published: false,
  sortOrder: 9999,
  images: [],
});

function mapDatabaseProduct(product: Record<string, unknown>): CatalogProduct {
  const rawImages = (product.product_images ?? []) as Array<Record<string, unknown>>;
  return {
    id: String(product.id),
    name: String(product.name),
    price: product.price === null ? null : Number(product.price),
    oldPrice: product.old_price === null ? null : Number(product.old_price),
    unit: product.unit ? String(product.unit) : null,
    category: String(product.category_id),
    availability: product.availability as CatalogProduct["availability"],
    badge: product.badge as CatalogProduct["badge"],
    published: Boolean(product.published),
    sortOrder: Number(product.sort_order),
    images: rawImages
      .map((image) => ({
        id: String(image.id),
        path: String(image.url),
        alt: image.alt ? String(image.alt) : String(product.name),
        position: Number(image.position),
        storagePath: image.storage_path ? String(image.storage_path) : null,
      }))
      .sort((first, second) => first.position - second.position),
  };
}

function PendingImagePreview({ file }: { file: File }) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  return (
    <div className="admin-image admin-image--pending">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt="Новое фото" />
      <span>{file.name.includes("-transparent.webp") ? "Фон убран" : "Без обработки"}</span>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: (user: SessionUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabaseBrowserClient();
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError || !data.user) {
      setError("Не удалось войти. Проверьте email и пароль.");
      setLoading(false);
      return;
    }

    onSuccess({ id: data.user.id, email: data.user.email });
  }

  return (
    <div className="admin-login-shell">
      <Link className="admin-back" href="/"><ArrowLeft size={17} /> Вернуться в каталог</Link>
      <form className="admin-login-card" onSubmit={login}>
        <div className="admin-login-icon"><LockKeyhole size={25} /></div>
        <span className="section-kicker">Закрытый раздел</span>
        <h1>Управление каталогом</h1>
        <p>Вход доступен только назначенному администратору.</p>

        <label className="admin-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" />
        </label>

        <label className="admin-field">
          <span>Пароль</span>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Показать или скрыть пароль">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {error && <div className="admin-error">{error}</div>}
        <button className="admin-primary" disabled={loading} type="submit">
          {loading ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />}
          Войти безопасно
        </button>
      </form>
    </div>
  );
}

function SetupRequired() {
  return (
    <div className="admin-login-shell">
      <Link className="admin-back" href="/"><ArrowLeft size={17} /> Вернуться в каталог</Link>
      <section className="admin-login-card admin-setup-card">
        <div className="admin-login-icon"><ShieldCheck size={25} /></div>
        <span className="section-kicker">Подготовлено</span>
        <h1>Осталось подключить базу</h1>
        <p>Интерфейс админки готов. После создания проекта Supabase и добавления двух переменных окружения здесь появится защищённая форма входа.</p>
        <div className="setup-status"><Check size={17} /> Регистрация посетителей отключается</div>
        <div className="setup-status"><Check size={17} /> Изменения разрешены только администратору</div>
        <div className="setup-status"><Check size={17} /> Фотографии защищены отдельными правилами</div>
      </section>
    </div>
  );
}

function MfaChallenge({
  factorId,
  onVerified,
}: {
  factorId: string;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: verifyError } = await getSupabaseBrowserClient().auth.mfa.challengeAndVerify({
      factorId,
      code: code.replace(/\s/g, ""),
    });
    if (verifyError) {
      setError("Неверный или просроченный код.");
      setLoading(false);
      return;
    }
    onVerified();
  }

  return (
    <div className="admin-login-shell">
      <form className="admin-login-card" onSubmit={verify}>
        <div className="admin-login-icon"><ShieldCheck size={25} /></div>
        <span className="section-kicker">Второй фактор</span>
        <h1>Подтвердите вход</h1>
        <p>Введите шестизначный код из приложения-аутентификатора.</p>
        <label className="admin-field">
          <span>Одноразовый код</span>
          <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" pattern="[0-9 ]{6,8}" autoComplete="one-time-code" required autoFocus />
        </label>
        {error && <div className="admin-error">{error}</div>}
        <button className="admin-primary" disabled={loading} type="submit">
          {loading ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />}
          Подтвердить
        </button>
      </form>
    </div>
  );
}

export default function AdminPanel() {
  const configured = hasSupabaseConfiguration();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [processingImages, setProcessingImages] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");

  const loadData = useCallback(async (activeUser: SessionUser) => {
    const supabase = getSupabaseBrowserClient();
    setAuthorized(null);

    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", activeUser.id)
      .maybeSingle();

    if (!admin) {
      setAuthorized(false);
      return;
    }

    setAuthorized(true);
    const [productResult, categoryResult] = await Promise.all([
      supabase
        .from("products")
        .select("*,product_images(id,url,alt,position,storage_path)")
        .order("sort_order"),
      supabase.from("categories").select("id,name,sort_order").order("sort_order"),
    ]);

    if (productResult.error || categoryResult.error) {
      setNotice("Не удалось загрузить каталог. Проверьте подключение к базе.");
      return;
    }

    const loadedCategories = (categoryResult.data ?? []).map((category: { id: string; name: string; sort_order: number }) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sort_order,
    }));
    setCategories(loadedCategories);
    setProducts((productResult.data ?? []).map(mapDatabaseProduct));
  }, []);

  const continueAuthenticatedSession = useCallback(async (activeUser: SessionUser) => {
    const supabase = getSupabaseBrowserClient();
    const [{ data: assurance }, { data: factors }] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);

    if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2" && factors?.totp?.[0]) {
      setMfaFactorId(factors.totp[0].id);
      return;
    }

    setMfaFactorId("");
    await loadData(activeUser);
  }, [loadData]);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const activeUser = { id: data.user.id, email: data.user.email };
        setUser(activeUser);
        void continueAuthenticatedSession(activeUser);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setAuthorized(null);
        setProducts([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [configured, continueAuthenticatedSession]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru");
    return products.filter((product) => product.name.toLocaleLowerCase("ru").includes(normalized));
  }, [products, query]);

  async function prepareSelectedImages(files: File[]) {
    if (!files.length) return;
    setProcessingImages(true);
    setNotice("");

    const prepared: File[] = [];
    for (const file of files) {
      if (!removeBackground) {
        prepared.push(file);
        continue;
      }

      try {
        const result = await removeLightImageBackground(file);
        prepared.push(result.file);
      } catch {
        prepared.push(file);
      }
    }

    setPendingFiles((current) => [...current, ...prepared]);
    setProcessingImages(false);
  }

  if (!configured) return <SetupRequired />;
  if (!user) return <LoginForm onSuccess={(activeUser) => { setUser(activeUser); void continueAuthenticatedSession(activeUser); }} />;
  if (mfaFactorId) return <MfaChallenge factorId={mfaFactorId} onVerified={() => { setMfaFactorId(""); void loadData(user); }} />;

  if (authorized === null) {
    return <div className="admin-loading"><LoaderCircle className="spin" /> Проверяем доступ…</div>;
  }

  if (!authorized) {
    return (
      <div className="admin-login-shell">
        <section className="admin-login-card">
          <h1>Доступ не назначен</h1>
          <p>Пользователь вошёл, но его ID отсутствует в списке администраторов.</p>
          <button className="admin-primary" onClick={() => getSupabaseBrowserClient().auth.signOut()}><LogOut size={18} /> Выйти</button>
        </section>
      </div>
    );
  }

  async function saveProduct() {
    if (!selected || !selected.name.trim()) {
      setNotice("Укажите название товара.");
      return;
    }

    setBusy(true);
    setNotice("");
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.from("products").upsert({
      id: selected.id,
      name: selected.name.trim(),
      price: selected.price,
      old_price: selected.oldPrice,
      unit: selected.unit,
      category_id: selected.category,
      availability: selected.availability,
      badge: selected.badge,
      published: selected.published,
      sort_order: selected.sortOrder,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setNotice(`Не удалось сохранить: ${error.message}`);
      setBusy(false);
      return;
    }

    const uploadedImages: ProductImage[] = [];
    for (const [index, file] of pendingFiles.entries()) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `${selected.id}/${crypto.randomUUID()}.${extension}`;
      const upload = await supabase.storage.from("product-images").upload(storagePath, file, {
        cacheControl: "31536000",
        upsert: false,
      });

      if (upload.error) continue;
      const publicUrl = supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl;
      const position = selected.images.length + index + 1;
      const imageResult = await supabase
        .from("product_images")
        .insert({ product_id: selected.id, url: publicUrl, storage_path: storagePath, alt: selected.name, position })
        .select("id")
        .single();

      if (!imageResult.error) {
        uploadedImages.push({ id: imageResult.data.id, path: publicUrl, storagePath, alt: selected.name, position });
      }
    }

    const saved = { ...selected, images: [...selected.images, ...uploadedImages] };
    setProducts((items) => {
      const exists = items.some((item) => item.id === saved.id);
      return exists ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved];
    });
    setSelected(saved);
    setPendingFiles([]);
    setNotice("Изменения сохранены.");
    setBusy(false);
  }

  async function removeImage(image: ProductImage) {
    if (!selected || !image.id || !window.confirm("Удалить эту фотографию товара?")) return;
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    if (image.storagePath) await supabase.storage.from("product-images").remove([image.storagePath]);
    const { error } = await supabase.from("product_images").delete().eq("id", image.id);
    if (!error) {
      const updated = { ...selected, images: selected.images.filter((item) => item.id !== image.id) };
      setSelected(updated);
      setProducts((items) => items.map((item) => item.id === updated.id ? updated : item));
    }
    setBusy(false);
  }

  async function deleteProduct() {
    if (!selected || !products.some((product) => product.id === selected.id)) return;
    const confirmed = window.confirm(
      `Удалить товар «${selected.name}»? Товар исчезнет из каталога, а загруженные для него фотографии будут удалены.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setNotice("");
    const supabase = getSupabaseBrowserClient();
    const storagePaths = selected.images
      .map((image) => image.storagePath)
      .filter((path): path is string => Boolean(path));
    const { error } = await supabase.from("products").delete().eq("id", selected.id);

    if (error) {
      setNotice(`Не удалось удалить товар: ${error.message}`);
      setBusy(false);
      return;
    }

    if (storagePaths.length) {
      await supabase.storage.from("product-images").remove(storagePaths);
    }
    setProducts((items) => items.filter((item) => item.id !== selected.id));
    setSelected(null);
    setPendingFiles([]);
    setBusy(false);
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <span className="section-kicker">Молочные Традиции</span>
          <h1>Управление каталогом</h1>
        </div>
        <div className="admin-header__actions">
          <Link href="/"><Eye size={17} /> Каталог</Link>
          <button onClick={() => getSupabaseBrowserClient().auth.signOut()}><LogOut size={17} /> Выйти</button>
        </div>
      </header>

      <div className="admin-workspace">
        <aside className="admin-products">
          <div className="admin-products__top">
            <label><Search size={17} /><input placeholder="Поиск товара" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <button aria-label="Добавить товар" onClick={() => { setSelected(emptyProduct(categories)); setPendingFiles([]); setNotice(""); }}><PackagePlus size={20} /></button>
          </div>
          <span className="admin-list-count">{filteredProducts.length} товаров</span>
          <div className="admin-product-list">
            {filteredProducts.map((product) => (
              <button
                className={selected?.id === product.id ? "active" : ""}
                key={product.id}
                onClick={() => { setSelected(product); setPendingFiles([]); setNotice(""); }}
              >
                <span>{product.name}</span>
                <small>{product.price ? `${product.price} ₽ / ${product.unit ?? "шт"}` : "Цена по запросу"}</small>
                {!product.published && <i><EyeOff size={11} /> Скрыт</i>}
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-editor">
          {!selected ? (
            <div className="admin-empty-editor">
              <PackagePlus size={30} />
              <h2>Выберите товар</h2>
              <p>Или создайте новый с помощью кнопки «+» слева.</p>
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); void saveProduct(); }}>
              <div className="admin-editor__heading">
                <div>
                  <span className="section-kicker">Карточка товара</span>
                  <h2>{selected.name || "Новый товар"}</h2>
                </div>
                <label className="publish-toggle">
                  <input type="checkbox" checked={selected.published} onChange={(event) => setSelected({ ...selected, published: event.target.checked })} />
                  <span>{selected.published ? "Опубликован" : "Скрыт"}</span>
                </label>
              </div>

              <div className="admin-form-grid">
                <label className="admin-field admin-field--wide">
                  <span>Название</span>
                  <input value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} required />
                </label>
                <label className="admin-field">
                  <span>Цена, ₽</span>
                  <input type="number" min="0" step="0.01" value={selected.price ?? ""} onChange={(event) => setSelected({ ...selected, price: event.target.value ? Number(event.target.value) : null })} />
                </label>
                <label className="admin-field">
                  <span>Старая цена</span>
                  <input type="number" min="0" step="0.01" value={selected.oldPrice ?? ""} onChange={(event) => setSelected({ ...selected, oldPrice: event.target.value ? Number(event.target.value) : null })} />
                </label>
                <label className="admin-field">
                  <span>Единица</span>
                  <select value={selected.unit ?? ""} onChange={(event) => setSelected({ ...selected, unit: event.target.value || null })}>
                    <option value="кг">кг</option><option value="шт">шт</option><option value="уп">уп</option><option value="">не указывать</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span>Категория</span>
                  <select value={selected.category} onChange={(event) => setSelected({ ...selected, category: event.target.value })}>
                    {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Наличие</span>
                  <select value={selected.availability} onChange={(event) => setSelected({ ...selected, availability: event.target.value as CatalogProduct["availability"] })}>
                    <option value="in_stock">В наличии</option><option value="out_of_stock">Нет в наличии</option><option value="coming_soon">Скоро поступит</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span>Отметка</span>
                  <select value={selected.badge} onChange={(event) => setSelected({ ...selected, badge: event.target.value as CatalogProduct["badge"] })}>
                    <option value="none">Без отметки</option><option value="promo">Акция</option><option value="price_down">Цена снижена</option><option value="price_up">Новая цена</option><option value="new">Новинка</option>
                  </select>
                </label>
              </div>

              <div className="admin-images-section">
                <div><h3>Фотографии</h3></div>
                <label className="background-removal-toggle">
                  <input type="checkbox" checked={removeBackground} onChange={(event) => setRemoveBackground(event.target.checked)} />
                  <Sparkles size={17} />
                  <span><strong>Убирать светлый фон автоматически</strong><small>Обрабатывается только фон, связанный с краями снимка</small></span>
                </label>
                <div className="admin-image-grid">
                  {selected.images.map((image) => (
                    <div className="admin-image" key={image.id ?? image.path}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.path} alt={image.alt} />
                      <button type="button" onClick={() => void removeImage(image)} aria-label="Удалить фотографию"><Trash2 size={15} /></button>
                    </div>
                  ))}
                  {pendingFiles.map((file) => <PendingImagePreview file={file} key={`${file.name}-${file.lastModified}`} />)}
                  <label className={`admin-image-upload${processingImages ? " admin-image-upload--busy" : ""}`}>
                    {processingImages ? <LoaderCircle className="spin" size={22} /> : <ImagePlus size={22} />}
                    <span>{processingImages ? "Обработка…" : "Добавить"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={processingImages}
                      onChange={(event) => {
                        void prepareSelectedImages(Array.from(event.target.files ?? []));
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              {notice && <div className={notice.includes("сохранены") ? "admin-success" : "admin-error"}>{notice}</div>}
              <div className="admin-savebar">
                {products.some((product) => product.id === selected.id) && (
                  <button className="admin-danger" disabled={busy} type="button" onClick={() => void deleteProduct()}>
                    <Trash2 size={17} />
                    Удалить товар
                  </button>
                )}
                <button className="admin-primary" disabled={busy} type="submit">
                  {busy ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
                  Сохранить
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
