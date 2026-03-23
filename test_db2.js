require("dotenv").config({ path: ".env.local" });
const envPath = require("fs").existsSync(".env") ? ".env" : ".env.local";
require("dotenv").config({ path: envPath });

const mongoose = require("mongoose");
const fs = require("fs");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const res1 = await db.collection("products").find({
    isActive: true,
    stock: { $gt: 0 },
    $text: { $search: "phone" }
  }).toArray();

  const res2 = await db.collection("products").find({
    isActive: true,
    stock: { $gt: 0 },
    $text: { $search: "phone" },
    category: "Electronics"
  }).toArray();

  fs.writeFileSync("out_db_test.json", JSON.stringify({
    textOnly: res1.map(r => r.category),
    textAndCat: res2.map(r => r.category)
  }, null, 2));
  process.exit(0);
}
run();
