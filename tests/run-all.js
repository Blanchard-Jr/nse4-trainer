// Lance toutes les suites de tests et affiche un bilan. Code de sortie ≠ 0 au moindre échec.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => /^test_.*\.js$/.test(f)).sort();
let totalPass = 0, totalFail = 0, crashed = 0;

for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf-8', timeout: 120000 });
  const lines = (r.stdout || '').split('\n');
  const pass = lines.filter(l => l.startsWith('PASS')).length;
  const fail = lines.filter(l => l.startsWith('FAIL'));
  const problem = r.status !== 0 || pass === 0;
  totalPass += pass; totalFail += fail.length;
  if (problem && fail.length === 0) crashed++;
  console.log(`${fail.length || problem ? '✗' : '✓'} ${f.padEnd(22)} ${String(pass).padStart(3)} réussis, ${fail.length} échec(s)`);
  fail.forEach(l => console.log('    ' + l));
  if (problem && fail.length === 0) console.log('    (la suite s\'est arrêtée prématurément)\n' + (r.stdout || '').split('\n').slice(-6).join('\n') + (r.stderr || ''));
}
console.log(`\nTotal : ${totalPass} vérifications réussies, ${totalFail} échec(s).`);
process.exit(totalFail || crashed ? 1 : 0);
