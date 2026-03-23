const fs = require('fs');

async function test() {
  const host = "http://localhost:3000";
  try {
    const res1 = await fetch(`${host}/api/search/products?search=phone`);
    const data1 = await res1.json();
    
    // search with category
    const res2 = await fetch(`${host}/api/search/products?search=phone&category=Electronics`);
    const data2 = await res2.json();

    // search with minPrice
    const res3 = await fetch(`${host}/api/search/products?search=phone&minPrice=1000`);
    const data3 = await res3.json();

    const out = {
      phoneSearchData: data1,
      phoneElectronicsData: data2,
      phoneMinPriceData: data3
    };
    fs.writeFileSync("out_search_filter.json", JSON.stringify(out, null, 2));
  } catch (e) {
    fs.writeFileSync("out_search_filter.json", JSON.stringify({ error: e.message }));
  }
}
test();
