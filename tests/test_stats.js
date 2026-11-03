const { loadHtml, newDom } = require('./helpers');
const html = loadHtml();
const dom = newDom(html);
const { window } = dom;
window.onerror = (m,s,l,c,e)=>console.log("JS ERROR:", m, "line", l, e && e.stack);
const doc = window.document, ev = c=>window.eval(c);
let fails = 0;
const ok = (label, cond, extra)=>{ if(!cond) fails++; console.log((cond?"PASS":"FAIL")+"  "+label+(extra?"   ["+extra+"]":"")); };
const at = (y,m,d,h=10)=> new Date(y,m-1,d,h,0).getTime();

function answerCurrent(correct){
  const {c, all} = JSON.parse(ev(`(function(){const q=session.questions[session.index];return JSON.stringify({c:q.correct,all:Object.keys(q.choices)})})()`));
  const letters = correct ? c : all.filter(l=>!c.includes(l)).slice(0,c.length);
  letters.forEach(l=>[...doc.querySelectorAll('.choice')].find(e=>e.dataset.letter===l).click());
}
function runAll(correct){
  let g=0;
  while(doc.querySelector('.view.active').id==='view-quiz' && g++<120){
    answerCurrent(correct);
    const sb = doc.getElementById('submitBtn'); if(sb) sb.click();
    doc.getElementById('nextBtn').click();
  }
}

setTimeout(()=>{
  window.confirm = ()=>true;

  console.log("== 1. Démarrage à vide ==");
  const s0 = ev('JSON.stringify(store.settings)');
  ok("date d'examen par défaut = 08/12/2026 15h", JSON.parse(s0).examDate==='2026-12-08T15:00');
  ok("planStart figé et persisté", !!JSON.parse(window.localStorage.getItem('nse4fgt_progress_v1')).settings.planStart);
  ok("chip J-xx sur l'accueil", !!doc.getElementById('homeCountdownChip') && /J-\d+/.test(doc.getElementById('homeCountdownChip').textContent));
  doc.getElementById('statsBtn').click();
  ok("l'icône ouvre l'écran Statistiques (plus de bulle)", doc.querySelector('.view.active').id==='view-stats');
  ok("5 cartes principales rendues", doc.querySelectorAll('#statsRoot .st-card').length>=6, doc.querySelectorAll('#statsRoot .st-card').length+' cartes');
  ok("radar : 5 libellés", doc.querySelectorAll('.rd-label').length===5);
  ok("indice à vide = 0", /\b0\b/.test(doc.querySelector('.score-ring-text .pct').textContent));
  ok("courbe : message d'attente (<2 sessions)", doc.getElementById('statsRoot').textContent.includes('au moins 2 sessions'));
  ok("têtues : état vide propre", doc.getElementById('statsRoot').textContent.includes('Rien à signaler'));

  console.log("== 2. Phases du plan selon la date ==");
  const P = n => JSON.parse(ev(`(function(){const p=computePlan(${n});return JSON.stringify({d:p.daysLeft,ph:p.phase,g:p.goal,sims:p.simsPlanned,tasks:(p.tasks||[]).length})})()`));
  let p = P(at(2026,10,30));
  ok("30/10 : J-39, phase 1", p.d===39 && p.ph==='p1', JSON.stringify(p));
  ok("objectif quotidien multiple de 5, entre 15 et 60", p.g%5===0 && p.g>=15 && p.g<=60);
  ok("≈ 9 simulations recommandées d'ici J", p.sims>=7 && p.sims<=10, p.sims);
  ok("17/11 : J-21 → phase 2", P(at(2026,11,17)).ph==='p2');
  ok("30/11 : J-8 → phase 2", P(at(2026,11,30)).ph==='p2');
  ok("01/12 : J-7 → phase 3", P(at(2026,12,1)).ph==='p3');
  ok("06/12 : J-2 → phase 3", P(at(2026,12,6)).ph==='p3');
  ok("07/12 : veille", P(at(2026,12,7)).ph==='eve');
  ok("08/12 10h : jour J", P(at(2026,12,8,10)).ph==='dayJ');
  ok("08/12 16h : passé", P(at(2026,12,8,16)).ph==='past');
  ok("passage heure d'hiver (25/10) sans décalage de jour", JSON.parse(ev(`computePlan(${at(2026,10,26)}).daysLeft`))===43);

  const stText = n => ev(`computePlan(${n}).status.text`);
  ok("veille : message rassurant (jamais « en retard »)", !/retard/i.test(stText(at(2026,12,7))) && /Veille/.test(stText(at(2026,12,7))));
  ok("jour J : message rassurant", !/retard/i.test(stText(at(2026,12,8,10))) && /Jour J/.test(stText(at(2026,12,8,10))));
  ok("phase 3 sans activité : message de rattrapage conservé", /retard/i.test(stText(at(2026,12,3))));
  console.log("== 3. Journal d'activité ==");
  ev(`startQuiz(QUESTIONS.slice(0,6),'Test étude','study',null)`);
  runAll(true);
  let act = JSON.parse(ev('JSON.stringify(store.activity)'));
  const today = ev('dayKey(Date.now())');
  ok("6 réponses comptées aujourd'hui", act[today] && act[today].q===6 && act[today].c===6, JSON.stringify(act[today]));
  ok("temps de réflexion enregistré (ansN)", ev('Object.values(store.stats).filter(s=>s.ansN>0).length')===6);

  // examen réel : 10 questions, on en laisse 4 vides
  ev(`startQuiz(QUESTIONS.slice(10,20),'Test réel','real',600000)`);
  for(let i=0;i<10;i++){ if(i<6) answerCurrent(true); doc.getElementById('nextBtn').click(); }
  act = JSON.parse(ev('JSON.stringify(store.activity)'));
  ok("examen réel : les 4 questions vides ne comptent pas comme travaillées", act[today].q===12, 'q='+act[today].q);
  ok("mais restent des tentatives dans les stats", ev('store.stats[11] && store.stats[11].attempts')===1 && ev('Object.keys(store.stats).length')>=16);

  console.log("== 4. Série de jours ==");
  const NOW = ev('Date.now()'), dk = n => ev(`dayKey(addDays(${NOW}, ${n}))`);
  ev(`store.activity['${dk(-1)}']={q:20,c:10,ms:1}; store.activity['${dk(-2)}']={q:5,c:1,ms:1}; store.activity['${dk(-5)}']={q:30,c:1,ms:1};`);
  const st = JSON.parse(ev(`JSON.stringify(computeStreak(getDayMap(), ${NOW}))`));
  ok("série : aujourd'hui + 2 jours d'affilée = 3 ; le trou (J-3, J-4) casse la série", st.current===3 && st.best===3, JSON.stringify(st));
  ev(`delete store.activity['${dk(0)}']; store.history=[];`);
  const st3 = JSON.parse(ev(`JSON.stringify(computeStreak(getDayMap(), ${NOW}))`));
  ok("si rien aujourd'hui, la série d'hier reste vivante (2)", st3.current===2, JSON.stringify(st3));
  const st2 = JSON.parse(ev(`JSON.stringify(computeStreak({}, ${NOW}))`));
  ok("série vide = 0", st2.current===0 && st2.best===0);

  console.log("== 5. Indice de préparation ==");
  ev(`store.stats={}; store.history=[]; saveStore();`);
  const R = ()=>JSON.parse(ev('(function(){const r=computeReadiness();return JSON.stringify({i:r.index,m:r.masteryPct,s:r.simAvg})})()'));
  ok("rien = 0", R().i===0);
  ev(`QUESTIONS.forEach(q=>recordAnswer(q.id,true,false));`);
  ok("tout maîtrisé sans simulation = 70 (plafond)", R().i===70, JSON.stringify(R()));
  ev(`store.history=[{date:Date.now(),label:'s',mode:'real',total:50,correct:50,pct:100},{date:Date.now(),label:'s',mode:'real',total:50,correct:45,pct:90}]`);
  ok("100 % maîtrise + simulations (95 %) = 99", R().i===99, JSON.stringify(R()));
  ev(`store.history=[{date:Date.now(),label:'s',mode:'real',total:20,correct:20,pct:100}]`);
  ok("une simulation de 20 q ne compte pas (min. 40)", R().s===null);
  ev(`store.history=[]; store.stats={}; QUESTIONS.filter(q=>themeToDomain(q.theme).id==='d3').forEach(q=>recordAnswer(q.id,true,false));`);
  const rr = JSON.parse(ev('(function(){const r=computeReadiness();return JSON.stringify({lever:r.lever.id,i:r.index})})()'));
  ok("seul le domaine 3 maîtrisé → indice = 0,7×27,5/97,5×100 ≈ 20", rr.i>=19 && rr.i<=21, JSON.stringify(rr));
  ok("plus gros levier = un domaine encore à 0 % le plus lourd (d1)", rr.lever==='d1', rr.lever);

  console.log("== 6. Têtues + rejouer + retour ==");
  ev(`store.stats={}; recordAnswer(5,false,false); recordAnswer(5,false,false); recordAnswer(7,false,false); recordAnswer(9,true,false); recordAnswer(9,false,false); recordAnswer(9,true,false);`);
  const sub = JSON.parse(ev('JSON.stringify(computeStubborn().map(o=>o.q.id))'));
  ok("têtues : Q5 (2 échecs) puis Q7 (dernier raté) ; Q9 (réussie en dernier, 1 échec) exclue", JSON.stringify(sub)==='[5,7]', JSON.stringify(sub));
  doc.getElementById('brandHome').click(); doc.getElementById('statsBtn').click();
  ok("liste affichée", doc.querySelectorAll('.st-q-row').length>=2);
  doc.querySelector('.st-replay').click();
  ok("rejouer ouvre la question", doc.querySelector('.view.active').id==='view-quiz' && doc.getElementById('quizProgressLabel').textContent==='Question 1 / 1');
  doc.getElementById('quitBtn').click();
  ok("quitter ramène sur Statistiques", doc.querySelector('.view.active').id==='view-stats');
  doc.querySelector('.st-coach').click();
  ok("« Fiche Coach » ouvre le Coach", doc.querySelector('.view.active').id==='view-coach');
  doc.getElementById('statsBtn').click();
  doc.getElementById('stReplayAllBtn').click();
  ok("rejouer toutes = 2 questions", doc.getElementById('quizProgressLabel').textContent==='Question 1 / 2');
  doc.getElementById('quitBtn').click();

  console.log("== 7. Boutons du plan ==");
  doc.getElementById('stDailyBtn').click();
  const lbl = doc.getElementById('quizModeLabel').textContent, prog = doc.getElementById('quizProgressLabel').textContent;
  ok("session du jour lancée", lbl.includes('Session du jour') && /Question 1 \/ (15|20|25|30)/.test(prog), lbl+' / '+prog);
  doc.getElementById('quitBtn').click();
  doc.getElementById('stSimBtn').click();
  ok("simulation : 50 q, mode réel, retour = stats", doc.getElementById('quizProgressLabel').textContent==='Question 1 / 50' && doc.getElementById('timerLbl').textContent==='Temps restant');
  doc.getElementById('quitBtn').click();

  console.log("== 8. Modifier la date ==");
  doc.getElementById('stEditDateBtn').click();
  ok("formulaire affiché avec la date actuelle", doc.getElementById('stExamInput').value==='2026-12-08T15:00');
  doc.getElementById('stExamInput').value = '2027-01-15T09:30';
  doc.getElementById('stSaveDateBtn').click();
  ok("date enregistrée", ev('store.settings.examDate')==='2027-01-15T09:30');
  ok("compte à rebours recalculé", /J-\d+/.test(doc.querySelector('.st-cd-num').textContent) && parseInt(doc.querySelector('.st-cd-num').textContent.slice(2))>39);
  doc.getElementById('stEditDateBtn').click();
  doc.getElementById('stExamInput').value = '';
  doc.getElementById('stSaveDateBtn').click();
  ok("date vide refusée", ev('store.settings.examDate')==='2027-01-15T09:30' && doc.getElementById('toast').textContent.includes('invalide'));
  ev(`store.settings.examDate='2026-12-08T15:00'; saveStore();`);

  console.log("== 9. Calendrier ==");
  doc.getElementById('brandHome').click(); doc.getElementById('statsBtn').click();
  const cells = doc.querySelectorAll('.st-cal .st-cell');
  ok("grille = multiple de 7 jours", cells.length%7===0 && cells.length>=42, cells.length+' cases');
  ok("une case 'aujourd'hui' et une case 'Jour J'", doc.querySelectorAll('.st-cal .today').length===1 && doc.querySelectorAll('.st-cal .exam').length===1);
  ok("jours futurs atténués", doc.querySelectorAll('.st-cal .future').length>20);

  console.log("== 10. Progression + sauvegarde ==");
  ev(`store.history=[
    {date:${at(2026,10,20)},label:'A',mode:'study',total:10,correct:5,pct:50},
    {date:${at(2026,10,24)},label:'B',mode:'real',total:50,correct:30,pct:60},
    {date:${at(2026,10,28)},label:'C',mode:'study',total:10,correct:8,pct:80},
    {date:${at(2026,10,30)},label:'D',mode:'real',total:50,correct:40,pct:80}]; saveStore();`);
  doc.getElementById('brandHome').click(); doc.getElementById('statsBtn').click();
  ok("courbe : 4 points, 2 séries", doc.querySelectorAll('.pg-dot').length===4 && doc.querySelectorAll('path.pg-line').length===2);
  ok("plan : 2 simulations réelles comptées", doc.getElementById('statsRoot').textContent.includes('2simulations réelles') || /2\s*simulations réelles/.test(doc.getElementById('statsRoot').textContent));
  const dump = ev('JSON.stringify(store)');
  ev(`localStorage.removeItem(STORE_KEY); store=loadStore();`);
  window.importStoreFromFile(new window.File([dump],'b.json',{type:'application/json'}));
  setTimeout(()=>{
    ok("restauration : date, jour de départ et activité conservés", ev('store.settings.examDate')==='2026-12-08T15:00' && Object.keys(JSON.parse(ev('JSON.stringify(store.activity)'))).length>=1);
    // ancienne sauvegarde sans settings/activity
    window.importStoreFromFile(new window.File([JSON.stringify({stats:{1:{attempts:1,correct:1,lastCorrect:true}},flagged:{},history:[]})],'old.json',{type:'application/json'}));
    setTimeout(()=>{
      ok("ancienne sauvegarde importée : réglages recréés", ev('store.settings.examDate')==='2026-12-08T15:00' && !!ev('store.settings.planStart'));
      doc.getElementById('statsBtn').click();
      ok("écran Statistiques OK après import ancien format", doc.querySelectorAll('#statsRoot .st-card').length>=6);
      console.log(fails ? "\n"+fails+" ÉCHEC(S)" : "\nTOUT PASSE");
      process.exit(fails?1:0);
    }, 200);
  }, 200);
}, 500);
