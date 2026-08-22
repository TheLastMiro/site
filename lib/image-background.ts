const MAX_PROCESSING_SIDE = 1600;
const BACKGROUND_DISTANCE = 86;
const TRANSPARENT_DISTANCE = 18;
const OPAQUE_DISTANCE = 72;

type BackgroundRemovalResult = {
  file: File;
  changed: boolean;
};

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function estimateBackground(data: Uint8ClampedArray, width: number, height: number) {
  const patch = Math.max(5, Math.min(28, Math.round(Math.min(width, height) * 0.045)));
  const red: number[] = [];
  const green: number[] = [];
  const blue: number[] = [];
  const starts = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ];

  for (const [startX, startY] of starts) {
    for (let y = startY; y < startY + patch; y += 2) {
      for (let x = startX; x < startX + patch; x += 2) {
        const offset = (y * width + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        if (Math.min(r, g, b) >= 165 && Math.max(r, g, b) - Math.min(r, g, b) <= 58) {
          red.push(r);
          green.push(g);
          blue.push(b);
        }
      }
    }
  }

  if (red.length < 12) return null;
  const median = (values: number[]) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const background = [median(red), median(green), median(blue)] as const;
  const brightness = (background[0] + background[1] + background[2]) / 3;
  const spread = Math.max(...background) - Math.min(...background);
  return brightness >= 200 && spread <= 45 ? background : null;
}

export async function removeLightImageBackground(file: File): Promise<BackgroundRemovalResult> {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(1, MAX_PROCESSING_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return { file, changed: false };

    context.drawImage(bitmap, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    const background = estimateBackground(data, width, height);
    if (!background) return { file, changed: false };

    const total = width * height;
    const candidate = new Uint8Array(total);
    const visited = new Uint8Array(total);
    const distance = new Float32Array(total);
    const queue = new Int32Array(total);
    const maxDistanceSquared = BACKGROUND_DISTANCE * BACKGROUND_DISTANCE;

    for (let index = 0; index < total; index += 1) {
      const offset = index * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const dr = r - background[0];
      const dg = g - background[1];
      const db = b - background[2];
      const squared = dr * dr + dg * dg + db * db;
      distance[index] = Math.sqrt(squared);
      if (squared <= maxDistanceSquared && (r + g + b) / 3 >= 150) candidate[index] = 1;
    }

    let head = 0;
    let tail = 0;
    const enqueue = (index: number) => {
      if (candidate[index] && !visited[index]) {
        visited[index] = 1;
        queue[tail] = index;
        tail += 1;
      }
    };

    for (let x = 0; x < width; x += 1) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 1; y < height - 1; y += 1) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }

    while (head < tail) {
      const index = queue[head];
      head += 1;
      const x = index % width;
      if (x > 0) enqueue(index - 1);
      if (x < width - 1) enqueue(index + 1);
      if (index >= width) enqueue(index - width);
      if (index < total - width) enqueue(index + width);
    }

    let transparentPixels = 0;
    for (let index = 0; index < total; index += 1) {
      if (!visited[index]) continue;
      const feather = Math.max(0, Math.min(1, (distance[index] - TRANSPARENT_DISTANCE) / (OPAQUE_DISTANCE - TRANSPARENT_DISTANCE)));
      const offset = index * 4 + 3;
      data[offset] = Math.min(data[offset], Math.round(255 * feather));
      if (data[offset] < 250) transparentPixels += 1;
    }

    if (transparentPixels / total < 0.01) return { file, changed: false };
    context.putImageData(imageData, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
    if (!blob) return { file, changed: false };

    const stem = file.name.replace(/\.[^.]+$/, "").replace(/-transparent$/, "");
    return {
      file: new File([blob], `${stem}-transparent.webp`, { type: "image/webp", lastModified: Date.now() }),
      changed: true,
    };
  } finally {
    bitmap.close();
  }
}
