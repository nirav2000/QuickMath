import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { getFirestore, addDoc, collection, serverTimestamp, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';

const firebaseConfig = { apiKey:'AIzaSyDeqA-ek9IULGzqWSP3lcNhRVdRprKHJYg', authDomain:'quickmaths-84461.firebaseapp.com', projectId:'quickmaths-84461', storageBucket:'quickmaths-84461.firebasestorage.app', messagingSenderId:'620869920659', appId:'1:620869920659:web:805509d873006044856a66', measurementId:'G-NN37WM99MK' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let versions = [
  { version: '3.0.0', label: '3.0.0 current', archive: 'archives/3.0.0' },
  { version: '2.0.0', label: '2.0.0', archive: 'archives/2.0.0' },
  { version: '1.0.0', label: '1.0.0', archive: 'archives/1.0.0' },
  { version: '0.1.0', label: '0.1.0', archive: 'archives/0.1.0' }
];
//*** Start: Inserting backward compatibility versioing ***//
const VERSION_FALLBACK_PATHS = ['../../version.json','version.json'];
const HISTORY_FALLBACK_PATHS = ['../../VERSION_HISTORY.md','VERSION_HISTORY.md'];

async function fetchWithFallback(paths, parser='json'){
  for(const p of paths){
    try{ 
      const r=await fetch(p); 
      if(!r.ok) continue; 
      return parser==='json'?await r.json():await r.text(); 
    }catch{} 
  } return null; 
}

versions=JSON.parse(fetchWithFallback(VERSION_FALLBACK_PATHS)).availableVersions;
//*** END: Inserting backward compatibility versioing ***//

const els = {
  menuButton: document.querySelector('#menuButton'), menuPanel: document.querySelector('#menuPanel'),
  pages: { practice:document.querySelector('#practicePage'), stats:document.querySelector('#statsPage'), tips:document.querySelector('#tipsPage'), history:document.querySelector('#historyPage') },
  versionSelect: document.querySelector('#versionSelect'), historyContent: document.querySelector('#historyContent'),
  questionText:document.querySelector('#questionText'), answerInput:document.querySelector('#answerInput'), submitButton:document.querySelector('#submitButton'), feedback:document.querySelector('#feedback'),
  authButton:document.querySelector('#authButton'), logoutButton:document.querySelector('#logoutButton'),
  totalQuestions:document.querySelector('#totalQuestions'), correctCount:document.querySelector('#correctCount'), wrongCount:document.querySelector('#wrongCount'), avgTime:document.querySelector('#avgTime'), accuracyRate:document.querySelector('#accuracyRate'), recentAttempts:document.querySelector('#recentAttempts'),
  difficultyChart:document.querySelector('#difficultyChart'), trendChart:document.querySelector('#trendChart')
};

const provider = new GoogleAuthProvider();
const attemptsKey='attempts'; const cardsKey='sr_cards';
let userId='anonymous';
let current=null; let start=0;

function levelFromStats(){ const attempts=JSON.parse(localStorage.getItem(attemptsKey)||'[]'); const recent=attempts.slice(-25); const acc = recent.length ? recent.filter(a=>a.isCorrect).length/recent.length : 1; if(acc>0.9&&recent.length>10) return 3; if(acc>0.75) return 2; return 1; }
function numberPool(level){ if(level===1) return [1,20]; if(level===2) return [10,60]; return [30,120]; }

function getCards(){ return JSON.parse(localStorage.getItem(cardsKey)||'{}'); }
function saveCards(cards){ localStorage.setItem(cardsKey, JSON.stringify(cards)); }
function pickQuestion(){
  const level=levelFromStats(); const [min,max]=numberPool(level); const cards=getCards(); const now=Date.now();
  const due = Object.entries(cards).filter(([,v])=>v.nextReview<=now).map(([k])=>Number(k)).filter(n=>n>=min&&n<=max);
  const root = due.length ? due[Math.floor(Math.random()*due.length)] : Math.floor(Math.random()*(max-min+1))+min;
  return { root, value:root*root, prompt:`√${root*root}`, level };
}
function nextQuestion(){ current=pickQuestion(); els.questionText.textContent=`${current.prompt} (L${current.level})`; els.answerInput.value=''; els.feedback.textContent=''; els.feedback.className='feedback'; start=performance.now(); els.answerInput.focus(); }

function updateSM2(card, grade){
  const q=Math.max(0,Math.min(5,grade));
  if(q<3){ card.repetition=0; card.interval=1; }
  else { card.repetition +=1; if(card.repetition===1) card.interval=1; else if(card.repetition===2) card.interval=6; else card.interval=Math.round(card.interval*card.efactor); }
  card.efactor = Math.max(1.3, card.efactor + (0.1-(5-q)*(0.08+(5-q)*0.02)));
  card.nextReview = Date.now()+card.interval*24*60*60*1000;
}

function saveLocal(record){ const attempts=JSON.parse(localStorage.getItem(attemptsKey)||'[]'); attempts.push(record); localStorage.setItem(attemptsKey, JSON.stringify(attempts));
  const cards=getCards(); const r=current.root; cards[r]=cards[r]||{ efactor:2.5, interval:0, repetition:0, nextReview:0};
  const speedGrade = record.timeTakenMs<1200?5:record.timeTakenMs<2000?4:3; const grade = record.isCorrect ? speedGrade : 2;
  updateSM2(cards[r], grade); saveCards(cards);
}

async function saveFirestore(record){ try { await addDoc(collection(db,'attempts'),{...record,userId,topic:'square-roots',createdAt:serverTimestamp()}); return true; } catch { return false; } }
async function syncFromFirestore(){
  try {
    const qy=query(collection(db,'attempts'), where('userId','==',userId), where('topic','==','square-roots'), orderBy('createdAt','desc'), limit(200));
    const snap=await getDocs(qy); const remote=[]; snap.forEach(d=>remote.push(d.data()));
    if(remote.length){ localStorage.setItem(attemptsKey, JSON.stringify(remote.reverse())); renderStats(); }
    els.feedback.textContent = `Synced ${remote.length} records from Firestore`;
  } catch {
    els.feedback.textContent = 'Firestore sync unavailable (index/rules/network issue). Using local data.';
  }
}

async function submit(){ const given=Number(els.answerInput.value); if(!Number.isFinite(given)) return;
  const timeTakenMs=Math.round(performance.now()-start); const isCorrect=Math.abs(given-current.root)<0.0001;
  const record={question:current.value,prompt:current.prompt,answerGiven:given,answerCorrect:current.root,isCorrect,timeTakenMs,level:current.level,createdAt:new Date().toISOString()};
  saveLocal(record); const remoteOK=await saveFirestore(record);
  els.feedback.textContent = isCorrect ? `Correct ${remoteOK?'• saved local+cloud':'• saved local only'}` : `Incorrect. Answer: ${current.root}`;
  els.feedback.className=`feedback ${isCorrect?'ok':'bad'}`; renderStats(); setTimeout(nextQuestion,900);
}

function drawBar(canvas, data, labels, color){ const c=canvas.getContext('2d'); const w=canvas.width,h=canvas.height; c.clearRect(0,0,w,h); c.fillStyle='#111'; c.fillRect(0,0,w,h);
  const max=Math.max(1,...data); const pad=36; const bw=(w-pad*2)/data.length*0.7; data.forEach((v,i)=>{ const x=pad+i*((w-pad*2)/data.length)+10; const bh=(h-pad*2)*(v/max); c.fillStyle=color; c.fillRect(x,h-pad-bh,bw,bh); c.fillStyle='#ddd'; c.fillText(labels[i],x,h-10); }); }
function drawLine(canvas, points){ const c=canvas.getContext('2d'); const w=canvas.width,h=canvas.height; c.clearRect(0,0,w,h); c.fillStyle='#111'; c.fillRect(0,0,w,h);
  const max=Math.max(1,...points.map(p=>p.v)); const min=0; const pad=28; c.strokeStyle='#6ee7ff'; c.lineWidth=2; c.beginPath(); points.forEach((p,i)=>{ const x=pad+(i*(w-2*pad)/(points.length-1||1)); const y=h-pad-((p.v-min)/(max-min||1))*(h-2*pad); if(i===0)c.moveTo(x,y); else c.lineTo(x,y); }); c.stroke(); }

function renderStats(){ const attempts=JSON.parse(localStorage.getItem(attemptsKey)||'[]'); const total=attempts.length; const correct=attempts.filter(a=>a.isCorrect).length; const wrong=total-correct; const avg=total?Math.round(attempts.reduce((s,a)=>s+a.timeTakenMs,0)/total):0;
  els.totalQuestions.textContent=String(total); els.correctCount.textContent=String(correct); els.wrongCount.textContent=String(wrong); els.avgTime.textContent=String(avg); els.accuracyRate.textContent=`${total?Math.round(correct*100/total):0}%`;
  els.recentAttempts.innerHTML=''; attempts.slice(-12).reverse().forEach(a=>{ const li=document.createElement('li'); li.textContent=`${a.prompt} | Ans:${a.answerGiven} | ${a.isCorrect?'✓':'✗'} | ${a.timeTakenMs}ms | L${a.level||1}`; els.recentAttempts.append(li); });
  const byLvl=[1,2,3].map(l=>attempts.filter(a=>(a.level||1)===l && !a.isCorrect).length); drawBar(els.difficultyChart, byLvl,['L1','L2','L3'],'#ff7f7f');
  const trend=attempts.slice(-20).map((a,i)=>({x:i,v:a.isCorrect?1:0})); drawLine(els.trendChart, trend.length?trend:[{x:0,v:0}]);
}

function showPage(page){ Object.entries(els.pages).forEach(([k,v])=>v.classList.toggle('active',k===page)); if(page==='stats') renderStats(); if(page==='history') showVersionHistory(); }
function initMenu(){ els.menuButton.addEventListener('click',()=>els.menuPanel.classList.toggle('hidden')); document.querySelectorAll('#menuPanel [data-page]').forEach(b=>b.addEventListener('click',()=>{ showPage(b.dataset.page); els.menuPanel.classList.add('hidden'); })); }
function initVersionSwitcher(){ versions.forEach(v=>{ const o=document.createElement('option'); o.value=v.archive; o.textContent=v.label; if(v.version==='3.0.0') o.selected=true; els.versionSelect.append(o); });
  els.versionSelect.addEventListener('change',(e)=>{ const p=e.target.value; window.open(`${p}/index.html`,'_blank','noopener'); e.target.value='archives/3.0.0'; }); }
async function showVersionHistory(){ const t=await fetch('VERSION_HISTORY.md').then(r=>r.text()).catch(()=> 'Unable to load version history file'); els.historyContent.textContent=t; }

els.submitButton.addEventListener('click',submit); els.answerInput.addEventListener('keydown',(e)=>{ if(e.key==='Enter') submit(); });
els.authButton.addEventListener('click',()=>signInWithPopup(auth,provider)); els.logoutButton.addEventListener('click',()=>signOut(auth));
onAuthStateChanged(auth,(u)=>{ userId=u?.uid||'anonymous'; els.authButton.textContent=u?`Logged in: ${u.displayName}`:'Login / Signup with Google'; els.logoutButton.classList.toggle('hidden',!u); if(u) syncFromFirestore(); });

initMenu(); initVersionSwitcher(); showPage('practice'); renderStats(); nextQuestion();
