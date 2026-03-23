require("dotenv").config({ path: ".env.local" });
const envPath = require("fs").existsSync(".env") ? ".env" : ".env.local";
require("dotenv").config({ path: envPath });

const mongoose = require("mongoose");
const fs = require("fs");

async function run() {
  if (!process.env.MONGODB_URI) {
    fs.writeFileSync("out.json", JSON.stringify({ error: "No URI" }));
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);

  const db = mongoose.connection.db;
  const products = await db.collection("products").find({}).toArray();
  const search = "laptop";
  const regexQuery = {
    $and: [
      {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ]
      }
    ]
  };

  const regexResults = await db.collection("products").find(regexQuery).toArray();
  const testProducts = await db.collection("products").find({ name: { $regex: "laptop", $options: "i" } }).toArray();
  const textIndexResults = await db.collection("products").find({ $text: { $search: search } }).toArray();
  
  const textQueryOnlyNameAndDescRegex = await db.collection("products").find({
    $or: [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ]
  }).toArray();

  const out = {
    total: products.length,
    activeWithStock: products.filter(p => p.isActive && p.stock > 0).length,
    regex: regexResults.length,
    test: testProducts.length,
    textQueryOnlyNameAndDescRegex: textQueryOnlyNameAndDescRegex.length,
    textIndexResults: textIndexResults.length,
    firstItem: products.length > 0 ? { name: products[0].name, isAct: products[0].isActive, stock: products[0].stock } : null
  };
  fs.writeFileSync("out.json", JSON.stringify(out, null, 2));
  process.exit(0);
}
run().catch(e => {
  fs.writeFileSync("out.json", JSON.stringify({ error: e.message }));
  process.exit(1);
});
