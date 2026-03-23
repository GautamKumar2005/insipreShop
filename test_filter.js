const fs = require('fs');

async function test() {
  const host = "http://localhost:3000";
  try {
    const res1 = await fetch(`${host}/api/products?category=Electronics`);
    const data1 = await res1.json();
    
    const res2 = await fetch(`${host}/api/products?minPrice=100&maxPrice=1000`);
    const data2 = await res2.json();
    
    const res3 = await fetch(`${host}/api/products`);
    const data3 = await res3.json();

    const out = {
      electronics: data1?.data?.length,
      price: data2?.data?.length,
      all: data3?.data?.length
    };
    fs.writeFileSync("out_filter.json", JSON.stringify(out, null, 2));
  } catch (e) {
    fs.writeFileSync("out_filter.json", JSON.stringify({ error: e.message }));
  }
}
test();
