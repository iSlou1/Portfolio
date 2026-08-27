/**
 * Собирает 2 готовых PDF (светлая палитра через @media print в styles.css):
 *   ru / en
 * Запуск: npm run export-pdfs
 * Нужен интернет (шрифты, внешние картинки в опыте).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "exports");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
};

function startStaticServer() {
  const server = http.createServer((req, res) => {
    try {
      const u = new URL(req.url || "/", "http://127.0.0.1");
      let rel = decodeURIComponent(u.pathname);
      if (rel === "/") rel = "/index.html";
      const safe = path.normalize(rel.replace(/^\//, "")).replace(/^(\.\.(\/|\\|$))+/, "");
      const filePath = path.join(ROOT, safe);
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const ctype = MIME[ext] || "application/octet-stream";
      const buf = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": ctype, "Cache-Control": "no-store" });
      res.end(buf);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e && e.message));
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
    server.on("error", reject);
  });
}

const JOBS = [
  { lang: "ru", file: "Skriganiuk-Vitalii-CV-ru.pdf" },
  { lang: "en", file: "Skriganiuk-Vitalii-CV-en.pdf" },
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const { server, port } = await startStaticServer();
  const base = `http://127.0.0.1:${port}`;

  const systemChrome =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const launchOpts = {
    headless: true,
    args: ["--font-render-hinting=none", "--disable-dev-shm-usage"],
  };
  if (fs.existsSync(systemChrome)) {
    launchOpts.executablePath = systemChrome;
  }

  const browser = await puppeteer.launch(launchOpts);

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1240,
      height: 900,
      deviceScaleFactor: 2,
    });

    for (const job of JOBS) {
      const qs = new URLSearchParams();
      qs.set("lang", job.lang);
      const url = `${base}/index.html?${qs}`;
      const outPath = path.join(OUT_DIR, job.file);

      await page.emulateMediaType("print");
      await page.goto(url, { waitUntil: "networkidle0", timeout: 180000 });
      await page.evaluate(() => document.fonts.ready);

      await page.pdf({
        path: outPath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
        scale: 1,
        tagged: true,
      });

      console.log("Wrote", outPath);
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
