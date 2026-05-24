import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { getFirestore, addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDeqA-ek9IULGzqWSP3lcNhRVdRprKHJYg',
  authDomain: 'quickmaths-84461.firebaseapp.com',
  projectId: 'quickmaths-84461',
  storageBucket: 'quickmaths-84461.firebasestorage.app',
  messagingSenderId: '620869920659',
  appId: '1:620869920659:web:805509d873006044856a66',
  measurementId: 'G-NN37WM99MK'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const versions = [
  { version: '1.0.0', label: '1.0.0 (current)', url: '#' },
  { version: '0.1.0', label: '0.1.0 (README only)', url: 'archives/0.1.0/README.md' }
];

const questionText = document.querySelector('#questionText');
const answerInput = document.querySelector('#answerInput');
const submitButton = document.querySelector('#submitButton');
const feedback = document.querySelector('#feedback');
const versionSelect = document.querySelector('#versionSelect');

let current = null;
let questionStart = 0;

function randomQuestion() {
  const root = Math.floor(Math.random() * 30) + 1;
  const value = root * root;
  return { prompt: `√${value}`, answer: root, value };
}

function nextQuestion() {
  current = randomQuestion();
  questionText.textContent = current.prompt;
  answerInput.value = '';
  feedback.textContent = '';
  feedback.className = 'feedback';
  questionStart = performance.now();
  answerInput.focus();
}

async function logAttempt(payload) {
  try {
    await addDoc(collection(db, 'attempts'), {
      ...payload,
      topic: 'square-roots',
      createdAt: serverTimestamp()
    });
  } catch {
    const local = JSON.parse(localStorage.getItem('attempts') || '[]');
    local.push({ ...payload, topic: 'square-roots', createdAt: new Date().toISOString() });
    localStorage.setItem('attempts', JSON.stringify(local));
  }
}

async function submit() {
  const given = Number(answerInput.value);
  if (!Number.isFinite(given)) return;

  const timeTakenMs = Math.round(performance.now() - questionStart);
  const correct = given === current.answer;

  await logAttempt({
    question: current.value,
    prompt: current.prompt,
    answerGiven: given,
    answerCorrect: current.answer,
    isCorrect: correct,
    timeTakenMs
  });

  feedback.textContent = correct ? 'Correct' : `Incorrect. Answer: ${current.answer}`;
  feedback.className = `feedback ${correct ? 'ok' : 'bad'}`;

  setTimeout(nextQuestion, 900);
}

function initVersionSelect() {
  versions.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.url;
    option.textContent = item.label;
    if (item.version === '1.0.0') option.selected = true;
    versionSelect.append(option);
  });

  versionSelect.addEventListener('change', (event) => {
    const url = event.target.value;
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener');
      versionSelect.value = '#';
    }
  });
}

submitButton.addEventListener('click', submit);
answerInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') submit();
});

initVersionSelect();
nextQuestion();
