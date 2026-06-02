const fs = require('fs');
const lines = fs.readFileSync('scripts/tr_bonds_raw.txt','utf8').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
const today = new Date('2026-06-02');
const MS_Y = 365.25*24*3600*1000;
const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const seen = new Set();
const items = [];
for (const isin of lines) {
  if (seen.has(isin)) continue; seen.add(isin);
  if (isin.length < 9) continue;
  const dd = isin.substr(3,2), mm = isin.substr(5,2), yy = isin.substr(7,2);
  const d = parseInt(dd,10), m = parseInt(mm,10), y = 2000+parseInt(yy,10);
  if (!(m>=1&&m<=12&&d>=1&&d<=31)) continue;
  const mat = new Date(Date.UTC(y, m-1, d));
  const years = (mat - today)/MS_Y;
  if (years < 0) continue; // matured
  let bucket;
  if (years < 1) bucket='SHORT';
  else if (years < 2) bucket='Y1';
  else if (years < 3) bucket='Y2';
  else if (years < 4) bucket='Y3';
  else if (years < 5) bucket='Y4';
  else if (years < 10) bucket='Y5';
  else bucket='Y10';
  const maturity = `${y}-${mm}-${dd}`;
  items.push({ symbol: 'TP.'+isin, isin, maturity, bucket, name: `DİBS ${dd}.${mm}.${y}` });
}
const order = ['SHORT','Y1','Y2','Y3','Y4','Y5','Y10'];
const MAX = 28;
const out = [];
for (const b of order) {
  let arr = items.filter(i=>i.bucket===b).sort((a,c)=>a.maturity<c.maturity?-1:1);
  if (arr.length > MAX) { // evenly sample
    const step = arr.length/MAX; const s=[];
    for (let k=0;k<MAX;k++) s.push(arr[Math.floor(k*step)]);
    arr = s;
  }
  out.push(...arr);
  console.error(`${b}: ${arr.length} (havuz ${items.filter(i=>i.bucket===b).length})`);
}
fs.writeFileSync('finance_portal/src/main/resources/tr-bonds-catalog.json', JSON.stringify(out, null, 2));
console.error('TOPLAM secilen:', out.length);
