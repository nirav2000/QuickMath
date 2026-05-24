import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { getFirestore, addDoc, collection, serverTimestamp, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';

const firebaseConfig = { apiKey:'AIzaSyDeqA-ek9IULGzqWSP3lcNhRVdRprKHJYg', authDomain:'quickmaths-84461.firebaseapp.com', projectId:'quickmaths-84461', storageBucket:'quickmaths-84461.firebasestorage.app', messagingSenderId:'620869920659', appId:'1:620869920659:web:805509d873006044856a66', measurementId:'G-NN37WM99MK' };
const app = initializeApp(firebaseConfig); const db = getFirestore(app); const auth = getAuth(app); const provider = new GoogleAuthProvider();
const versions = ['4.0.0','3.0.0','2.0.0','1.0.0','0.1.0'];
const els = {
  menuButton: q('#menuButton'), menuPanel: q('#menuPanel'), pages:{practice:q('#practicePage'),stats:q('#statsPage'),tips:q('#tipsPage'),history:q('#historyPage')},
  tabs:[...document.querySelectorAll('.tab-btn')], versionSelect:q('#versionSelect'), periodFilter:q('#periodFilter'),
  questionText:q('#questionText'), answerInput:q('#answerInput'), submitButton:q('#submitButton'), feedback:q('#feedback'),
  authButton:q('#authButton'), logoutButton:q('#logoutButton'), totalQuestions:q('#totalQuestions'), correctCount:q('#correctCount'), wrongCount:q('#wrongCount'), avgTime:q('#avgTime'), accuracyRate:q('#accuracyRate'),
  activityCalendar:q('#activityCalendar'), recentAttempts:q('#recentAttempts'), difficultyChart:q('#difficultyChart'), trendChart:q('#trendChart'),
  openHistoryModal:q('#openHistoryModal'), closeHistoryModal:q('#closeHistoryModal'), historyModal:q('#historyModal'), historyContent:q('#historyContent')
};
function q(s){return document.querySelector(s);} const attemptsKey='attempts'; const cardsKey='sr_cards'; let userId='anonymous'; let current=null; let start=0;
const L18={algo:'SM-18-inspired',priorityBoostWrong:1.7,speedWeight:0.2};
function attempts(){ return JSON.parse(localStorage.getItem(attemptsKey)||'[]'); }
function levelFromStats(){ const r=attempts().slice(-30); const acc=r.length?r.filter(a=>a.isCorrect).length/r.length:1; if(acc>0.9&&r.length>14)return 4; if(acc>0.78)return 3; if(acc>0.6)return 2; return 1; }
function pool(l){ return l===1?[1,20]:l===2?[10,60]:l===3?[40,140]:[80,250]; }
function cards(){ return JSON.parse(localStorage.getItem(cardsKey)||'{}'); }
function saveCards(v){ localStorage.setItem(cardsKey,JSON.stringify(v)); }
function pickQuestion(){ const l=levelFromStats(); const [min,max]=pool(l); const c=cards(); const now=Date.now();
  const due=Object.entries(c).filter(([,v])=>v.nextReview<=now).map(([k,v])=>({root:+k,p:v.priority||1})).filter(x=>x.root>=min&&x.root<=max);
  const root = due.length ? due.sort((a,b)=>b.p-a.p)[0].root : Math.floor(Math.random()*(max-min+1))+min;
  return {root,value:root*root,prompt:`√${root*root}`,level:l}; }
function nextQuestion(){ current=pickQuestion(); els.questionText.textContent=`${current.prompt} (L${current.level})`; els.answerInput.value=''; els.feedback.textContent=''; els.feedback.className='feedback'; start=performance.now(); els.answerInput.focus(); }
function updateSM18(card,rec){ const grade=rec.isCorrect?(rec.timeTakenMs<1300?5:rec.timeTakenMs<2200?4:3):2; const q=Math.max(0,Math.min(5,grade));
  if(q<3){ card.repetition=0; card.interval=1; card.priority=(card.priority||1)*L18.priorityBoostWrong; } else { card.repetition=(card.repetition||0)+1; card.interval=card.repetition===1?1:card.repetition===2?6:Math.round((card.interval||1)*(card.efactor||2.5)); card.priority=Math.max(1,(card.priority||1)*0.92); }
  card.efactor=Math.max(1.3,(card.efactor||2.5)+(0.1-(5-q)*(0.08+(5-q)*0.02))-((rec.timeTakenMs/10000)*L18.speedWeight)); card.nextReview=Date.now()+card.interval*86400000; }
function saveLocal(rec){ const a=attempts(); a.push(rec); localStorage.setItem(attemptsKey,JSON.stringify(a)); const c=cards(); c[current.root]=c[current.root]||{efactor:2.5,interval:0,repetition:0,nextReview:0,priority:1}; updateSM18(c[current.root],rec); saveCards(c); }
async function saveFirestore(rec){ try{ await addDoc(collection(db,'attempts'),{...rec,userId,topic:'square-roots',createdAt:serverTimestamp()}); return true;}catch{return false;} }
async function syncFromFirestore(){ try{ const qr=query(collection(db,'attempts'),where('userId','==',userId),where('topic','==','square-roots'),orderBy('createdAt','desc'),limit(500)); const s=await getDocs(qr); const remote=[]; s.forEach(d=>remote.push(d.data())); if(remote.length)localStorage.setItem(attemptsKey,JSON.stringify(remote.reverse())); draw(); els.feedback.textContent=`Synced ${remote.length} attempts from Firestore`; }catch{ els.feedback.textContent='Firestore sync unavailable. Local mode active.';} }
async function submit(){ const given=Number(els.answerInput.value); if(!Number.isFinite(given))return; const timeTakenMs=Math.round(performance.now()-start); const isCorrect=Math.abs(given-current.root)<0.0001;
  const rec={question:current.value,prompt:current.prompt,answerGiven:given,answerCorrect:current.root,isCorrect,timeTakenMs,level:current.level,createdAt:new Date().toISOString()}; saveLocal(rec); const ok=await saveFirestore(rec);
  els.feedback.textContent=isCorrect?`Correct ${ok?'• local+cloud':'• local only'}`:`Incorrect. Answer: ${current.root}`; els.feedback.className=`feedback ${isCorrect?'ok':'bad'}`; draw(); setTimeout(nextQuestion,850); }
function filteredAttempts(){ const a=attempts(); const p=els.periodFilter.value; if(p==='all')return a; const days=Number(p); const cut=Date.now()-days*86400000; return a.filter(x=>new Date(x.createdAt).getTime()>=cut); }
function renderCalendar(list){ const days=31; const map={}; list.forEach(a=>{ const d=new Date(a.createdAt).toISOString().slice(0,10); map[d]=(map[d]||0)+1;}); els.activityCalendar.innerHTML='';
  for(let i=days-1;i>=0;i--){ const dt=new Date(Date.now()-i*86400000).toISOString().slice(0,10); const c=map[dt]||0; const div=document.createElement('div'); const lvl=c>20?4:c>10?3:c>4?2:c>0?1:0; div.className=`day-cell ${lvl?`level-${lvl}`:''}`; div.title=`${dt}: ${c} attempts`; els.activityCalendar.append(div);} }
function renderAttemptsGrouped(list){ const groups={}; list.slice().reverse().forEach(a=>{ const d=new Date(a.createdAt).toLocaleDateString(); (groups[d]=groups[d]||[]).push(a);}); els.recentAttempts.innerHTML='';
  Object.entries(groups).slice(0,8).forEach(([d,arr])=>{ const g=document.createElement('div'); g.className='attempt-group'; g.innerHTML=`<h4>${d} • ${arr.length} attempts</h4>`; arr.slice(0,20).forEach(a=>{ const r=document.createElement('div'); r.className='attempt-row'; r.innerHTML=`<span>${a.prompt}</span><span>${a.isCorrect?'✓':'✗'}</span><span>${a.timeTakenMs}ms</span><span>L${a.level||1}</span>`; g.append(r);}); els.recentAttempts.append(g);}); }
function draw(){ const list=filteredAttempts(); const total=list.length, correct=list.filter(a=>a.isCorrect).length, wrong=total-correct; const avg=total?Math.round(list.reduce((s,a)=>s+a.timeTakenMs,0)/total):0;
  els.totalQuestions.textContent=String(total); els.correctCount.textContent=String(correct); els.wrongCount.textContent=String(wrong); els.avgTime.textContent=String(avg); els.accuracyRate.textContent=`${total?Math.round(correct*100/total):0}%`;
  renderCalendar(list); renderAttemptsGrouped(list); bar(els.difficultyChart,[1,2,3,4].map(l=>list.filter(a=>(a.level||1)===l&&!a.isCorrect).length),['L1','L2','L3','L4']); line(els.trendChart,list.slice(-20).map(a=>a.isCorrect?1:0)); }
function bar(cv,data,labs){const c=cv.getContext('2d'),w=cv.width,h=cv.height,p=30;c.clearRect(0,0,w,h);c.fillStyle='#111';c.fillRect(0,0,w,h);const m=Math.max(1,...data),step=(w-p*2)/data.length;data.forEach((v,i)=>{const bh=(h-p*2)*(v/m);const x=p+i*step+8;c.fillStyle='#ff8f8f';c.fillRect(x,h-p-bh,step*.6,bh);c.fillStyle='#ddd';c.fillText(labs[i],x,h-10);});}
function line(cv,pts){const c=cv.getContext('2d'),w=cv.width,h=cv.height,p=28;c.clearRect(0,0,w,h);c.fillStyle='#111';c.fillRect(0,0,w,h);c.strokeStyle='#6ee7ff';c.lineWidth=2;c.beginPath();(pts.length?pts:[0]).forEach((v,i,a)=>{const x=p+i*((w-p*2)/((a.length-1)||1));const y=h-p-(v*(h-p*2));if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();}
function showPage(page){ Object.entries(els.pages).forEach(([k,v])=>v.classList.toggle('active',k===page)); document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page)); if(page==='stats')draw(); if(page==='history')openHistory(); }
function initVersions(){ versions.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v+(v==='4.0.0'?' current':'');if(v==='4.0.0')o.selected=true;els.versionSelect.append(o);}); els.versionSelect.addEventListener('change',e=>{window.open(`archives/${e.target.value}/index.html`,'_blank','noopener'); e.target.value='4.0.0';}); }
async function openHistory(){ const t=await fetch('VERSION_HISTORY.md').then(r=>r.text()).catch(()=> 'Unable to load version history'); const blocks=t.split('\n## ').filter(Boolean);
 els.historyContent.innerHTML=blocks.map((b,i)=>{ const x=(i?`## ${b}`:b).split('\n').filter(Boolean); const head=x[0].replace('# Version History','Version History'); const items=x.slice(1).map(i=>`<li>${i.replace(/^-\s*/,'')}</li>`).join(''); return `<article class='history-card'><h4>${head}</h4><ul>${items}</ul></article>`; }).join(''); if(!els.historyModal.open) els.historyModal.showModal(); }
els.menuButton.addEventListener('click',()=>els.menuPanel.classList.toggle('hidden')); document.querySelectorAll('#menuPanel [data-page], .bottom-tabs [data-page]').forEach(b=>b.addEventListener('click',()=>{showPage(b.dataset.page);els.menuPanel.classList.add('hidden');}));
els.submitButton.addEventListener('click',submit); els.answerInput.addEventListener('keydown',e=>{if(e.key==='Enter')submit();}); els.periodFilter.addEventListener('change',draw);
els.authButton.addEventListener('click',()=>signInWithPopup(auth,provider)); els.logoutButton.addEventListener('click',()=>signOut(auth)); onAuthStateChanged(auth,u=>{ userId=u?.uid||'anonymous'; els.authButton.textContent=u?`Logged in: ${u.displayName}`:'Login / Signup with Google'; els.logoutButton.classList.toggle('hidden',!u); if(u) syncFromFirestore();});
els.openHistoryModal.addEventListener('click',openHistory); els.closeHistoryModal.addEventListener('click',()=>els.historyModal.close());
initVersions(); showPage('practice'); draw(); nextQuestion();
