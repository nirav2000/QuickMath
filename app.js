import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { getFirestore, addDoc, collection, serverTimestamp, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';
import { topics, topicsById } from './topics/index.js';
import { drawStats } from './lib/stats.js';
import { renderTips } from './lib/tips.js';

const firebaseConfig={apiKey:'AIzaSyDeqA-ek9IULGzqWSP3lcNhRVdRprKHJYg',authDomain:'quickmaths-84461.firebaseapp.com',projectId:'quickmaths-84461',storageBucket:'quickmaths-84461.firebasestorage.app',messagingSenderId:'620869920659',appId:'1:620869920659:web:805509d873006044856a66',measurementId:'G-NN37WM99MK'};
const app=initializeApp(firebaseConfig),db=getFirestore(app),auth=getAuth(app),provider=new GoogleAuthProvider();
const q=s=>document.querySelector(s);
const els={menuButton:q('#menuButton'),menuPanel:q('#menuPanel'),pages:{practice:q('#practicePage'),stats:q('#statsPage'),tips:q('#tipsPage'),history:q('#historyPage'),settings:q('#settingsPage')},versionSelect:q('#versionSelect'),topicSelect:q('#topicSelect'),srAlgorithmSelect:q('#srAlgorithmSelect'),topicCaption:q('#topicCaption'),tipsContainer:q('#tipsContainer'),periodFilter:q('#periodFilter'),questionText:q('#questionText'),answerInput:q('#answerInput'),submitButton:q('#submitButton'),feedback:q('#feedback'),authButton:q('#authButton'),logoutButton:q('#logoutButton'),totalQuestions:q('#totalQuestions'),correctCount:q('#correctCount'),wrongCount:q('#wrongCount'),avgTime:q('#avgTime'),accuracyRate:q('#accuracyRate'),activityCalendar:q('#activityCalendar'),recentAttempts:q('#recentAttempts'),openHistoryModal:q('#openHistoryModal'),closeHistoryModal:q('#closeHistoryModal'),historyModal:q('#historyModal'),historyContent:q('#historyContent')};
let topic='square-roots',current,userId='anonymous',start=0; const attemptsKey='attempts',cardsKey='sr_cards',srKey='sr_algorithm';
const attempts=()=>JSON.parse(localStorage.getItem(attemptsKey)||'[]'); const cards=()=>JSON.parse(localStorage.getItem(cardsKey)||'{}'); const saveCards=v=>localStorage.setItem(cardsKey,JSON.stringify(v));
const getAlgo=()=>localStorage.getItem(srKey)||'sm2_strict'; const setAlgo=v=>localStorage.setItem(srKey,v);
const level=()=>{const r=attempts().slice(-30).filter(a=>a.topic===topic);const acc=r.length?r.filter(a=>a.isCorrect).length/r.length:1;return acc>0.9&&r.length>14?4:acc>0.78?3:acc>0.6?2:1};
const filtered=()=>{const p=els.periodFilter.value,a=attempts().filter(x=>x.topic===topic);if(p==='all')return a;const cut=Date.now()-Number(p)*86400000;return a.filter(x=>new Date(x.createdAt).getTime()>=cut);};
function draw(){ drawStats(els, filtered()); }
function makeQ(){ return topicsById[topic].generateQuestion(level(), cards()); }
function nextQ(){current=makeQ();els.questionText.textContent = current.prompt;els.answerInput.value='';els.feedback.textContent='';els.feedback.className='feedback';start=performance.now();els.answerInput.focus();}
function applySM2Strict(card, grade){const q=Math.max(0,Math.min(5,grade)); if(q<3){card.repetition=0; card.interval=1;} else {card.repetition=(card.repetition||0)+1; if(card.repetition===1) card.interval=1; else if(card.repetition===2) card.interval=6; else card.interval=Math.round((card.interval||1)*(card.efactor||2.5));} card.efactor=Math.max(1.3,(card.efactor||2.5)+(0.1-(5-q)*(0.08+(5-q)*0.02))); card.nextReview=Date.now()+card.interval*86400000; card.priority=1;}
function applySuperMemoHeuristic(card, grade){const q=Math.max(0,Math.min(5,grade)); if(q<3){card.repetition=0; card.interval=1; card.priority=(card.priority||1)*1.7;} else {card.repetition=(card.repetition||0)+1; card.interval=card.repetition===1?1:card.repetition===2?6:Math.round((card.interval||1)*(card.efactor||2.5)); card.priority=Math.max(1,(card.priority||1)*0.92);} card.efactor=Math.max(1.3,(card.efactor||2.5)+(0.1-(5-q)*(0.08+(5-q)*0.02))); card.nextReview=Date.now()+card.interval*86400000;}
function saveLocal(r){const a=attempts();a.push(r);localStorage.setItem(attemptsKey,JSON.stringify(a));const c=cards();c[current.id]=c[current.id]||{efactor:2.5,interval:1,repetition:0,nextReview:0,priority:1,topic};const card=c[current.id];const grade=r.isCorrect?(r.timeTakenMs<1300?5:r.timeTakenMs<2200?4:3):2; (getAlgo()==='sm2_strict'?applySM2Strict:applySuperMemoHeuristic)(card,grade);card.topic=topic;saveCards(c);}
async function saveFS(r){try{await addDoc(collection(db,'attempts'),{...r,userId,topic,createdAt:serverTimestamp()});return true;}catch{return false;}}
async function syncFS(){try{const qr=query(collection(db,'attempts'),where('userId','==',userId),orderBy('createdAt','desc'),limit(500));const s=await getDocs(qr);const remote=[];s.forEach(d=>remote.push(d.data()));if(remote.length)localStorage.setItem(attemptsKey,JSON.stringify(remote.reverse()));draw();}catch{}}
async function submit(){const given=Number(els.answerInput.value);if(!Number.isFinite(given))return;const rec={question:current.prompt,answerGiven:given,answerCorrect:current.answer,isCorrect:Math.abs(given-current.answer)<0.01,timeTakenMs:Math.round(performance.now()-start),level:current.level,topic,createdAt:new Date().toISOString()};saveLocal(rec);const ok=await saveFS(rec);els.feedback.textContent=rec.isCorrect?`Correct ${ok?'• local+cloud':'• local only'}`:`Incorrect. Answer: ${current.answer}`;els.feedback.className=`feedback ${rec.isCorrect?'ok':'bad'}`;els.questionText.classList.remove('ok','bad');els.questionText.classList.add(rec.isCorrect?'ok':'bad');draw();setTimeout(()=>{els.questionText.classList.remove('ok','bad');nextQ();},850);}
function showTips(){ renderTips(els.tipsContainer, topicsById[topic], els.topicCaption); }
async function fetchWithFallback(paths, parser='json'){ for(const p of paths){ try{ const r=await fetch(p); if(!r.ok) continue; return parser==='json'?await r.json():await r.text(); }catch{} } return null; }
let versionMeta = null;
let versionById = {};
function getViewedVersion(){ const m=window.location.pathname.match(/\/archives\/([^/]+)\//); return m?m[1]:versionMeta?.currentVersion; }
async function loadVersions(){
  const meta=await fetchWithFallback(['../../version.json','version.json'],'json');
  versionMeta=meta||{currentVersion:'7.3.1',availableVersions:[{version:'7.3.1',archivePath:'archives/7.3.1'}]};
  versionById = Object.fromEntries((versionMeta.availableVersions||[]).map(v=>[v.version,v]));
  els.versionSelect.innerHTML='';
  versionMeta.availableVersions.forEach(v=>{
    const o=document.createElement('option');
    o.value=v.version;
    o.textContent=`${v.version}${v.label?` • ${v.label}`:''}${v.version===versionMeta.currentVersion?' (current)':''}`;
    if(v.version===getViewedVersion()) o.selected=true;
    els.versionSelect.append(o);
  });
}
async function openHistory(){const t=await fetchWithFallback(['../../VERSION_HISTORY.md','VERSION_HISTORY.md'],'text'); const lines=(t||'').split('\n'); const sections=[]; let cur=null; for(const line of lines){ if(line.startsWith('## ')){ if(cur) sections.push(cur); cur={title:line.replace('## ','').trim(), items:[]}; } else if(cur && line.trim().startsWith('- ')){ cur.items.push(line.trim().slice(2)); }} if(cur) sections.push(cur); const map=Object.fromEntries(sections.map(s=>[s.title.split(' - ')[0],s])); const cards=(versionMeta?.availableVersions||[]).map(v=>{ const sec=map[v.version]; const items=sec?.items?.map(i=>`<li>${i}</li>`).join('')||'<li>No notes recorded.</li>'; return `<article class='history-card'><h4>${v.version} <small>${v.label||''}</small></h4><ul>${items}</ul></article>`;}).join(''); els.historyContent.innerHTML=cards||'Unable to load version history'; if(!els.historyModal.open)els.historyModal.showModal();}
function showPage(p){Object.entries(els.pages).forEach(([k,v])=>v.classList.toggle('active',k===p));document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===p));if(p==='stats')draw();if(p==='history')openHistory();}
function initTopicSelect(){els.topicSelect.innerHTML='';topics.forEach(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=t.label;if(t.id===topic)o.selected=true;els.topicSelect.append(o);});}
els.submitButton.addEventListener('click',submit);els.answerInput.addEventListener('keydown',e=>e.key==='Enter'&&submit());els.periodFilter.addEventListener('change',draw);els.topicSelect.addEventListener('change',e=>{topic=e.target.value;showTips();draw();nextQ();});
els.srAlgorithmSelect.value=getAlgo();els.srAlgorithmSelect.addEventListener('change',e=>setAlgo(e.target.value));
els.versionSelect.addEventListener('change',e=>{ const v=e.target.value; const base=window.location.pathname.includes('/archives/') ? window.location.pathname.split('/archives/')[0] : window.location.pathname.replace(/\/[^/]*$/,''); const root=`${window.location.origin}${base}`; const current=versionMeta?.currentVersion||'7.3.1'; const target=versionById[v]; if(!target)return; window.location.href = v===current ? `${root}/index.html` : `${root}/${target.archivePath}/index.html`; });
els.menuButton.addEventListener('click',()=>els.menuPanel.classList.toggle('hidden'));document.querySelectorAll('#menuPanel [data-page], .bottom-tabs [data-page]').forEach(b=>b.addEventListener('click',()=>{showPage(b.dataset.page);els.menuPanel.classList.add('hidden');}));
els.authButton.addEventListener('click',()=>signInWithPopup(auth,provider));els.logoutButton.addEventListener('click',()=>signOut(auth));onAuthStateChanged(auth,u=>{userId=u?.uid||'anonymous';els.authButton.textContent=u?`Logged in: ${u.displayName}`:'Login / Signup with Google';els.logoutButton.classList.toggle('hidden',!u);if(u)syncFS();});
els.openHistoryModal.addEventListener('click',openHistory);els.closeHistoryModal.addEventListener('click',()=>els.historyModal.close());
await loadVersions(); initTopicSelect(); showTips(); showPage('practice'); draw(); nextQ();
