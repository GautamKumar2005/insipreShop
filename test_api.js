require("dotenv").config({ path: ".env.local" });
const envPath = require("fs").existsSync(".env") ? ".env" : ".env.local";
require("dotenv").config({ path: envPath });
const fs = require("fs");

async function run() {
  const host = "http://localhost:3000";
  try {
    const res = await fetch(`${host}/api/search/products?search=laptop`);
    const status = res.status;
    const text = await res.text();
    fs.writeFileSync("out_api.json", JSON.stringify({ status, text }));
  } catch (e) {
    fs.writeFileSync("out_api.json", JSON.stringify({ error: e.message }));
  }
}
run();
