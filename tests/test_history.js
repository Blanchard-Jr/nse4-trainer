const { loadHtml, newDom } = require('./helpers');
const html = loadHtml();
const dom = newDom(html);
const { window } = dom;
window.onerror = (m,s,l,c,e)=>console.log("JS ERROR:", m, "line", l, e && e.stack);
const ok = (label, cond)=>console.log((cond?"PASS":"FAIL")+"  "+label);

setTimeout(()=>{
  const doc = window.document;
  window.confirm = ()=>true;

  // --- empty state
  ok("home history card present", !!doc.getElementById('homeHistoryCard'));
  ok("empty state shown when no history", doc.getElementById('homeHistoryList').textContent.includes('Aucune session'));
  ok("'voir tous' hidden when empty", doc.getElementById('historyAllBtn').style.display==='none');

  // --- play a 5-question study session, answering correctly on some, wrongly on others
  window.eval(`startQuiz(QUESTIONS.slice(0,5), 'Test session', 'study', null)`);
  let steps=0;
  (function step(){
    steps++;
    if(doc.querySelector('.view.active').id!=='view-quiz' || steps>20) return after();
    const wantCorrect = steps%2===1;
    const picks = window.eval(`(function(){const q=session.questions[session.index];return JSON.stringify({c:q.correct,all:Object.keys(q.choices)})})()`);
    const {c, all} = JSON.parse(picks);
    const choices = [...doc.querySelectorAll('.choice')];
    const pickLetters = wantCorrect ? c : all.filter(l=>!c.includes(l)).slice(0,c.length);
    pickLetters.forEach(l=>choices.find(e=>e.dataset.letter===l).click());
    doc.getElementById('submitBtn').click();
    doc.getElementById('nextBtn').click();
    setTimeout(step, 5);
  })();

  function after(){
    const h = JSON.parse(window.localStorage.getItem('nse4fgt_progress_v1')).history;
    ok("session saved in history", h.length===1);
    ok("entry has qids/picks/correctMap", h[0].qids.length===5 && Object.keys(h[0].picks).length===5 && Object.keys(h[0].correctMap).length===5);
    console.log("     score stored:", h[0].pct+"%", " correctMap:", JSON.stringify(h[0].correctMap));

    // --- single-question coach session must NOT be recorded
    window.eval(`startQuiz([QUESTIONS[10]], 'Coach — Question 11', 'study', null, 'coach')`);
    doc.querySelectorAll('.choice')[0].click(); 
    doc.getElementById('nextBtn').click();
    const h2 = JSON.parse(window.localStorage.getItem('nse4fgt_progress_v1')).history;
    ok("single-question session NOT recorded", h2.length===1);

    // --- an old-format entry (no qids) coexists
    window.eval(`store.history.unshift({date:Date.now()-86400000,label:'Ancienne session',mode:'real',total:20,correct:8,pct:40,totalTimeMs:1200000,avgTimeMs:60000}); saveStore();`);

    // --- home card
    doc.getElementById('brandHome').click();
    const rows = doc.querySelectorAll('#homeHistoryList .hist-row');
    ok("home shows 2 rows", rows.length===2);
    ok("newest first (new session on top)", rows[0].textContent.includes('Test session'));
    ok("old entry shows disabled review (—)", rows[1].querySelector('.hist-review-off') && !rows[1].querySelector('.hist-review-btn'));
    ok("score colored", rows[1].querySelector('.hist-score').getAttribute('style').includes('--bad'));
    ok("'voir tous' visible", doc.getElementById('historyAllBtn').style.display!=='none');

    // --- full history view
    doc.getElementById('historyAllBtn').click();
    ok("history view active", doc.querySelector('.view.active').id==='view-history');
    ok("stats chips (3)", doc.querySelectorAll('#historyStatsRow .stat-chip').length===3);

    // --- REVIEW: stats must not change, no timer, answers shown with correction
    const statsBefore = window.eval(`JSON.stringify(store.stats)`);
    doc.querySelector('#fullHistoryList .hist-review-btn').click();
    ok("review opens quiz view", doc.querySelector('.view.active').id==='view-quiz');
    ok("timer hidden in review", doc.getElementById('timerBlock').style.display==='none');
    ok("explanation shown immediately", !!doc.querySelector('.explain-box'));
    ok("choices locked (no re-answer)", doc.querySelectorAll('.choice.locked').length>0);
    ok("no submit button in review", !doc.getElementById('submitBtn'));
    ok("review progress label", doc.getElementById('quizProgressLabel').textContent==='Question 1 / 5');
    ok("Q1 was answered correctly -> green", doc.querySelector('.explain-head').classList.contains('ok'));
    doc.getElementById('nextBtn').click();
    ok("Q2 was answered wrongly -> red", doc.querySelector('.explain-head').classList.contains('ko'));
    doc.getElementById('prevBtn').click();
    ok("prev works in review", doc.getElementById('quizProgressLabel').textContent==='Question 1 / 5');
    for(let i=0;i<4;i++) doc.getElementById('nextBtn').click();
    ok("last question label", doc.getElementById('nextBtn').textContent.includes('Terminer la revue'));
    doc.getElementById('nextBtn').click();
    ok("finishing review returns to history view", doc.querySelector('.view.active').id==='view-history');
    ok("history NOT duplicated by review", JSON.parse(window.localStorage.getItem('nse4fgt_progress_v1')).history.length===2);
    ok("stats untouched by review", window.eval(`JSON.stringify(store.stats)`)===statsBefore);

    // quit in review -> back to history, no confirm needed
    doc.querySelector('#fullHistoryList .hist-review-btn').click();
    doc.getElementById('quitBtn').click();
    ok("quit review returns to history", doc.querySelector('.view.active').id==='view-history');

    // a normal session afterwards still shows the timer block again
    window.eval(`startQuiz(QUESTIONS.slice(0,3), 'Après revue', 'study', null)`);
    ok("timer visible again in normal session", doc.getElementById('timerBlock').style.display==='');

    // export contains the review data
    const exported = window.eval(`JSON.stringify(store)`);
    ok("export carries qids", exported.includes('"qids"'));

    // XSS-safety: hostile label from an imported file is escaped
    window.eval(`store.history.push({date:Date.now(),label:'<img src=x onerror=alert(1)>',mode:'study',total:3,correct:1,pct:33}); saveStore();`);
    doc.getElementById('brandHome').click();
    ok("hostile label escaped", !doc.querySelector('#homeHistoryList img') && doc.getElementById('homeHistoryList').innerHTML.includes('&lt;img'));
    process.exit(0);
  }
}, 500);
