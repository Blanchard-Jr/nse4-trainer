const { loadHtml, newDom } = require('./helpers');
const html = loadHtml();
const dom = newDom(html);
const { window } = dom;
window.onerror = (m,s,l,c,e)=>console.log("JS ERROR:", m, "line", l, e && e.stack);
const ok = (label, cond)=>console.log((cond?"PASS":"FAIL")+"  "+label);
const doc = window.document;
const ev = (c)=>window.eval(c);

function answerCurrent(correct){
  const {c, all} = JSON.parse(ev(`(function(){const q=session.questions[session.index];return JSON.stringify({c:q.correct,all:Object.keys(q.choices)})})()`));
  const letters = correct ? c : all.filter(l=>!c.includes(l)).slice(0,c.length);
  letters.forEach(l=>[...doc.querySelectorAll('.choice')].find(e=>e.dataset.letter===l).click());
}
function runAll(mode, correct){
  let guard=0;
  while(doc.querySelector('.view.active').id==='view-quiz' && guard++<120){
    answerCurrent(correct);
    const sb = doc.getElementById('submitBtn'); if(sb) sb.click();
    doc.getElementById('nextBtn').click();
  }
}

setTimeout(()=>{
  window.confirm = ()=>true;
  ok("82 questions / 6 exams / 16 themes", ev('QUESTIONS.length')===82 && doc.getElementById('examGrid').children.length===6 && doc.getElementById('themeGrid').children.length===16);
  ok("home domain rows", doc.getElementById('homeDomainRows').children.length===5);

  // study, 100% correct, full 82 via exam "complet"
  [...doc.querySelectorAll('.mode-tab')].find(t=>t.dataset.mode==='exam').click();
  [...doc.querySelectorAll('#examGrid .pick-card')][5].click();
  doc.getElementById('startBtn').click();
  runAll('study', true);
  ok("study full exam -> results 100%", doc.getElementById('scorePct').textContent==='100%');
  ok("readiness report: 5 domain rows + stats", doc.getElementById('resultDomainRows').children.length===5 && doc.getElementById('resultStatsRow').children.length===5);
  let h = JSON.parse(window.localStorage.getItem('nse4fgt_progress_v1')).history;
  ok("history entry saved with 82 qids", h.length===1 && h[0].qids.length===82);

  // real mode via quick sim, all wrong
  doc.getElementById('backHomeBtn').click();
  doc.getElementById('quickSimBtn').click();
  ok("quick sim = 50 q real mode", doc.getElementById('quizProgressLabel').textContent==='Question 1 / 50' && doc.getElementById('timerLbl').textContent==='Temps restant');
  answerCurrent(false);
  ok("real mode: no submit btn / no explanation", !doc.getElementById('submitBtn') && !doc.querySelector('.explain-box'));
  runAll('real', false);
  ok("real mode finished -> 0%", doc.getElementById('scorePct').textContent==='0%');
  h = JSON.parse(window.localStorage.getItem('nse4fgt_progress_v1')).history;
  ok("real session stored with mode=real", h.length===2 && h[1].mode==='real');
  ok("progression sparkline visible", doc.getElementById('historyBlock').style.display==='block');

  // review a REAL-mode session: unanswered handled + shows correction
  doc.getElementById('backHomeBtn').click();
  const rows = doc.querySelectorAll('#homeHistoryList .hist-row');
  ok("home lists both sessions, newest first", rows.length===2 && rows[0].textContent.includes('Simulation'));
  rows[0].querySelector('.hist-review-btn').click();
  ok("review of real session reveals correction", !!doc.querySelector('.explain-box') && doc.querySelector('.explain-head').classList.contains('ko'));
  doc.getElementById('quitBtn').click();

  // multi-select cap + submit validation still enforced
  ev(`startQuiz([QUESTIONS.find(q=>q.id===6)], 'cap', 'study', null)`);
  const cs = [...doc.querySelectorAll('.choice')]; cs[0].click(); cs[1].click(); cs[2].click(); cs[3].click();
  ok("cap: 4th pick blocked", doc.querySelectorAll('.choice.picked').length===3 && doc.getElementById('toast').textContent.includes('Tu ne peux sélectionner que 3'));

  // coach
  doc.getElementById('coachNavBtn').click();
  ok("coach opens with 5 domain tabs", doc.querySelector('.view.active').id==='view-coach' && doc.getElementById('coachDomainTabs').children.length===5);

  // backup roundtrip incl. history detail
  const dump = ev('JSON.stringify(store)');
  ev(`localStorage.removeItem(STORE_KEY); store = loadStore(); renderHome();`);
  ok("wiped -> history empty again", doc.getElementById('homeHistoryList').textContent.includes('Aucune session'));
  window.importStoreFromFile(new window.File([dump], 'b.json', {type:'application/json'}));
  setTimeout(()=>{
    ok("restore brings history + review ability back", doc.querySelectorAll('#homeHistoryList .hist-review-btn').length===2);

    // weighted sampling still biased
    ev(`for(let i=1;i<=40;i++) recordAnswer(i,true); store.stats={}; for(let i=1;i<=40;i++) recordAnswer(i,true);`);
    const t = JSON.parse(ev(`(function(){const t={};for(let r=0;r<200;r++)weightedSample(QUESTIONS,20).forEach(q=>t[q.id]=(t[q.id]||0)+1);return JSON.stringify(t)})()`));
    let m=0,f=0; for(let i=1;i<=40;i++)m+=(t[i]||0); for(let i=41;i<=82;i++)f+=(t[i]||0);
    ok("weighted sampling favours unseen (ratio "+((f/42)/(m/40)).toFixed(1)+"x)", (f/42)/(m/40) > 3);

    // timer auto-finish
    ev(`startQuiz(QUESTIONS.slice(0,5),'t','real',1200)`);
    setTimeout(()=>{ ok("countdown auto-finishes to results", doc.querySelector('.view.active').id==='view-results'); process.exit(0); }, 2300);
  }, 200);
}, 500);
