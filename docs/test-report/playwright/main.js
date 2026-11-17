const H=require('./harness'); const fs=require('fs');
(async()=>{ const browser=await H.chromium.launch(); H.resetStock();
  const tests=[...require('./tests1'),...require('./tests2')]; const only=process.argv[2]?process.argv[2].split(','):null;
  const res=await H.run(browser,tests,only); fs.writeFileSync(process.argv[3]||'results.json',JSON.stringify(res,null,1)); await browser.close();
  const c={PASS:0,FAIL:0,ERROR:0}; res.forEach(r=>c[r.status]++); console.log('TOTAL',res.length,JSON.stringify(c)); })();
