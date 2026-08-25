import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const [output = ".impeccable/review/capture.png", selector = "#top", widthArg = "1440", heightArg = "1000"] = process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
const debugPort = 9300 + (process.pid % 300);
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = `/private/tmp/fifi-cdp-${process.pid}`;
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--log-level=3",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,
  "about:blank"
], { stdio: "ignore" });

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let endpoint;

for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const tabs = await fetch(`http://127.0.0.1:${debugPort}/json`);
    const pages = await tabs.json();
    endpoint = pages.find((page) => page.type === "page")?.webSocketDebuggerUrl;
    if (endpoint) break;
  } catch {
    await sleep(100);
  }
}

if (!endpoint) {
  chrome.kill();
  throw new Error("Could not connect to headless Chrome");
}

const socket = new WebSocket(endpoint);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let requestId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++requestId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 760 });
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await sleep(1400);
await send("Runtime.evaluate", {
  expression: `document.documentElement.style.scrollBehavior="auto"; document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:"start"})`
});
await sleep(900);
const metrics = await send("Runtime.evaluate", {
  expression: `JSON.stringify({scrollY, scrollHeight: document.documentElement.scrollHeight, targetTop: document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect().top, bodyWidth: document.body.scrollWidth})`,
  returnByValue: true
});
const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(output, Buffer.from(screenshot.data, "base64"));
console.log(`${output} ${metrics.result.value}`);

socket.close();
chrome.kill();
