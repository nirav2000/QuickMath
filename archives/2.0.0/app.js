import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { getFirestore, addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';

const firebaseConfig = { apiKey:'AIzaSyDeqA-ek9IULGzqWSP3lcNhRVdRprKHJYg', authDomain:'quickmaths-84461.firebaseapp.com', projectId:'quickmaths-84461', storageBucket:'quickmaths-84461.firebasestorage.app', messagingSenderId:'620869920659', appId:'1:620869920659:web:805509d873006044856a66', measurementId:'G-NN37WM99MK' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const els = {
  menuButton: document.querySelector('#menuButton'), menuPanel: document.querySelector('#menuPanel'),
  pages: { practice: document.querySelector('#practicePage'), stats: document.querySelector('#statsPage'), tips: document.querySelector('#tipsPage') },
  questionText: document.querySelector('#questionText'), answerInput: document.querySelector('#answerInput'), submitButton: document.querySelector('#submitButton'), feedback: document.querySelector('#feedback'),
  authButton: document.querySelector('#authButton'), logoutButton: document.querySelector('#logoutButton'),
  totalQuestions: document.querySelector('#totalQuestions'), correctCount: document.querySelector('#correctCount'), wrongCount: document.querySelector('#wrongCount'), avgTime: document.querySelector('#avgTime'), recentAttempts: document.querySelector('#recentAttempts')
};

let current = null; let questionStart = 0;
const attemptsKey = 'attempts';
const statsKey = 'statsSummary';

function randomQuestion(){ const root=Math.floor(Math.random()*30)+1; return { value:root*root, answer:root, prompt:`√${root*root}`}; }
function nextQuestion(){ current=randomQuestion(); els.questionText.textContent=current.prompt; els.answerInput.value=''; els.feedback.textContent=''; els.feedback.className='feedback'; questionStart=performance.now(); }

function saveLocalAttempt(record){ const attempts=JSON.parse(localStorage.getItem(attemptsKey)||'[]'); attempts.push(record); localStorage.setItem(attemptsKey, JSON.stringify(attempts));
  const summary = JSON.parse(localStorage.getItem(statsKey) || '{"total":0,"correct":0,"wrong":0,"time":0}');
  summary.total += 1; summary.correct += record.isCorrect ? 1 : 0; summary.wrong += record.isCorrect ? 0 : 1; summary.time += record.timeTakenMs;
  localStorage.setItem(statsKey, JSON.stringify(summary));
}

async function saveFirestore(record){ try { await addDoc(collection(db,'attempts'), { ...record, topic:'square-roots', createdAt:serverTimestamp() }); } catch { /* local already saved */ } }

async function submit(){ const given=Number(els.answerInput.value); if(!Number.isFinite(given)) return; const timeTakenMs=Math.round(performance.now()-questionStart); const correct=given===current.answer;
  const record={ question:current.value, prompt:current.prompt, answerGiven:given, answerCorrect:current.answer, isCorrect:correct, timeTakenMs, createdAt:new Date().toISOString() };
  saveLocalAttempt(record); await saveFirestore(record);
  els.feedback.textContent=correct?'Correct':`Incorrect. Answer: ${current.answer}`; els.feedback.className=`feedback ${correct?'ok':'bad'}`;
  renderStats(); setTimeout(nextQuestion,900);
}

function renderStats(){ const attempts=JSON.parse(localStorage.getItem(attemptsKey)||'[]'); const summary=JSON.parse(localStorage.getItem(statsKey)||'{"total":0,"correct":0,"wrong":0,"time":0}');
  els.totalQuestions.textContent=String(summary.total); els.correctCount.textContent=String(summary.correct); els.wrongCount.textContent=String(summary.wrong); els.avgTime.textContent=summary.total?String(Math.round(summary.time/summary.total)):'0';
  els.recentAttempts.innerHTML=''; attempts.slice(-10).reverse().forEach(a=>{ const li=document.createElement('li'); li.textContent=`${a.prompt} | You:${a.answerGiven} | ${a.isCorrect?'✓':'✗'} | ${a.timeTakenMs}ms`; els.recentAttempts.append(li); });
}

function showPage(page){ Object.entries(els.pages).forEach(([k,v])=>v.classList.toggle('active',k===page)); if(page==='stats') renderStats(); }

els.menuButton.addEventListener('click',()=>els.menuPanel.classList.toggle('hidden'));
document.querySelectorAll('#menuPanel [data-page]').forEach(btn=>btn.addEventListener('click',()=>{ showPage(btn.dataset.page); els.menuPanel.classList.add('hidden'); }));
els.submitButton.addEventListener('click',submit); els.answerInput.addEventListener('keydown',(e)=>{ if(e.key==='Enter') submit(); });
els.authButton.addEventListener('click',()=>signInWithPopup(auth,provider)); els.logoutButton.addEventListener('click',()=>signOut(auth));
onAuthStateChanged(auth,(user)=>{ els.authButton.textContent=user?`Logged in: ${user.displayName}`:'Login with Google'; els.logoutButton.classList.toggle('hidden',!user); });

showPage('practice'); nextQuestion();
