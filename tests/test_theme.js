const { loadHtml, newDom } = require('./helpers');
const html = loadHtml();
let fails = 0;
const ok = (label, cond, extra)=>{ if(!cond) fails++; console.log((cond?"PASS":"FAIL")+"  "+label+(extra!==undefined?"   ["+extra+"]":"")); };
function boot(seed){ return newDom(html, { seed }); }
const wait = ms => new Promise(r=>setTimeout(r,ms));

(async()=>{
  // ---------- 1. premier lancement ----------
  let dom = boot(); await wait(500);
  let w = dom.window, doc = w.document, ev = c=>w.eval(c), root = doc.documentElement;
  w.onerror = (m,s,l,c,e)=>console.log("JS ERROR:", m, l, e&&e.stack);
  w.confirm = ()=>true;
  console.log("== 1. Défaut ==");
  ok("thème clair par défaut", root.getAttribute('data-theme')==='light');
  ok("aucune couleur d'accent forcée", root.style.getPropertyValue('--accent')==='');
  ok("barre du haut : 5 icônes, plus de bouton reset", doc.querySelectorAll('.topbar-right .icon-btn').length===5 && !doc.querySelector('.topbar-right #resetBtn'));
  ok("bouton reset présent dans la fenêtre Sauvegarde", !!doc.querySelector('#backupModal #resetBtn'));
  ok("tuiles d'icônes sur l'accueil (4 + compte à rebours)", doc.querySelectorAll('#statRow .tile').length===5, doc.querySelectorAll('#statRow .tile').length);
  ok("logo suit le thème (plus de couleur en dur)", !/#FF5A2B/i.test(doc.querySelector('.brand-mark').innerHTML));

  console.log("== 2. Fenêtre Apparence ==");
  doc.getElementById('themeBtn').click();
  ok("fenêtre ouverte", doc.getElementById('themeModal').classList.contains('active'));
  ok("2 thèmes, 6 couleurs", doc.querySelectorAll('#themeCards .theme-card').length===2 && doc.querySelectorAll('.swatch').length===6);
  ok("« Clair » marqué actif, bleu = couleur effective", doc.querySelector('.theme-card[data-theme="light"]').classList.contains('active') && doc.querySelector('.swatch.active').dataset.hex==='#2563EB');
  ok("lien « revenir au thème » masqué tant qu'aucune couleur choisie", doc.getElementById('accentResetBtn').style.display==='none');

  doc.querySelector('.theme-card[data-theme="dark"]').click();
  ok("passage au thème sombre", root.getAttribute('data-theme')==='dark' && ev('store.settings.theme')==='dark');
  ok("sombre : orange devient la couleur effective", doc.querySelector('.swatch.active').dataset.hex==='#FF5A2B');
  ok("choix persisté en localStorage", JSON.parse(w.localStorage.getItem('nse4fgt_progress_v1')).settings.theme==='dark');

  doc.querySelector('.swatch[data-hex="#7C3AED"]').click();
  ok("accent violet appliqué", root.style.getPropertyValue('--accent')==='#7C3AED' && root.style.getPropertyValue('--accent-rgb')==='124,58,237');
  const lum = h => { const n=parseInt(h.slice(1),16); return ((n>>16)&255)*.3+((n>>8)&255)*.59+(n&255)*.11; };
  ok("sombre : variante 'dim' plus foncée, 'hover' plus claire", lum(root.style.getPropertyValue('--accent-dim'))<lum('#7C3AED') && lum(root.style.getPropertyValue('--accent-hover'))>lum('#7C3AED'));
  ok("pastille violette active + lien de retour visible", doc.querySelector('.swatch.active').dataset.hex==='#7C3AED' && doc.getElementById('accentResetBtn').style.display==='');
  doc.querySelector('.theme-card[data-theme="light"]').click();
  ok("clair : 'dim' plus claire, 'hover' plus foncée", lum(root.style.getPropertyValue('--accent-dim'))>lum('#7C3AED') && lum(root.style.getPropertyValue('--accent-hover'))<lum('#7C3AED'));
  ok("l'accent choisi survit au changement de thème", root.style.getPropertyValue('--accent')==='#7C3AED');
  doc.getElementById('accentResetBtn').click();
  ok("retour à la couleur du thème", root.style.getPropertyValue('--accent')==='' && ev('store.settings.accent')===undefined);
  w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));
  ok("Échap ferme la fenêtre", !doc.getElementById('themeModal').classList.contains('active'));

  console.log("== 3. Rechargement (persistance) ==");
  doc.querySelector('.theme-card[data-theme="dark"]').click();
  doc.querySelector('.swatch[data-hex="#0D9488"]').click();
  const saved = w.localStorage.getItem('nse4fgt_progress_v1');
  dom = boot(saved); await wait(500);
  w = dom.window; doc = w.document; ev = c=>w.eval(c); root = doc.documentElement; w.confirm = ()=>true;
  ok("thème sombre restauré dès le chargement", root.getAttribute('data-theme')==='dark');
  ok("accent turquoise restauré", root.style.getPropertyValue('--accent')==='#0D9488');

  console.log("== 4. Sauvegarde / restauration / réinitialisation ==");
  const dump = ev('JSON.stringify(store)');
  ok("l'apparence est dans l'export", JSON.parse(dump).settings.theme==='dark' && JSON.parse(dump).settings.accent==='#0D9488');
  ev(`recordAnswer(1,true,false); saveStore();`);
  doc.getElementById('resetBtn').click();
  ok("réinitialisation : progression effacée", ev('Object.keys(store.stats).length')===0);
  ok("réinitialisation : thème et couleur conservés", ev('store.settings.theme')==='dark' && ev('store.settings.accent')==='#0D9488' && root.getAttribute('data-theme')==='dark');

  // import d'une sauvegarde claire
  const lightBackup = JSON.parse(dump); lightBackup.settings.theme='light'; delete lightBackup.settings.accent; lightBackup.stats = {1:{attempts:1,correct:1,lastCorrect:true}};
  w.importStoreFromFile(new w.File([JSON.stringify(lightBackup)],'b.json',{type:'application/json'})); await wait(200);
  ok("import : thème clair appliqué", root.getAttribute('data-theme')==='light' && root.style.getPropertyValue('--accent')==='');

  console.log("== 5. Fichier importé piégé ==");
  const evil = JSON.parse(dump); evil.settings.accent = 'red;background:url(//evil.example/x)'; evil.settings.theme='<script>';
  evil.stats = {1:{attempts:1,correct:1,lastCorrect:true}};
  w.importStoreFromFile(new w.File([JSON.stringify(evil)],'evil.json',{type:'application/json'})); await wait(200);
  ok("accent invalide supprimé", ev('store.settings.accent')===undefined && root.style.getPropertyValue('--accent')==='');
  ok("thème invalide supprimé → clair", ev('store.settings.theme')===undefined && root.getAttribute('data-theme')==='light');

  console.log("== 6. Tout le reste fonctionne dans les deux thèmes ==");
  for (const th of ['light','dark']){
    ev(`setAppearance({theme:'${th}'})`);
    doc.getElementById('statsBtn').click();
    ok(`[${th}] écran Statistiques`, doc.querySelectorAll('#statsRoot .st-card').length>=6);
    ev(`startQuiz(QUESTIONS.slice(0,3),'t','study',null)`);
    ok(`[${th}] quiz`, doc.querySelector('.view.active').id==='view-quiz' && doc.querySelectorAll('.choice').length>=2);
    doc.getElementById('quitBtn').click();
    doc.getElementById('brandHome').click();
  }
  console.log(fails ? "\n"+fails+" ÉCHEC(S)" : "\nTOUT PASSE");
  process.exit(fails?1:0);
})();
