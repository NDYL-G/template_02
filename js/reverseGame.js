// js/reverseGame.js

let mediaRecorder;
let recordedChunks = [];
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let selectedSpeed = 0.75;
let currentPhrase = {};
let recordedBuffer = null;

let analyser, dataArray, ctx;

function drawWaveform(canvas) {
  if (!analyser) return;
  requestAnimationFrame(() => drawWaveform(canvas));

  analyser.getByteTimeDomainData(dataArray);
  ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  const sliceWidth = canvas.width / dataArray.length;
  let x = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * canvas.height / 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0066cc';
  ctx.stroke();
}

async function playPhrase(src, canvas) {
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await audioContext.decodeAudioData(arrayBuffer);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    buffer.getChannelData(i).reverse();
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = selectedSpeed;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  source.connect(analyser);
  analyser.connect(audioContext.destination);

  source.start(0);
  drawWaveform(canvas);
}

function toggleRecording(canvas, button) {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    button.textContent = '🎤 Start Recording';
  } else {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
      mediaRecorder.onstop = () => processRecording();
      mediaRecorder.start();

      const micSource = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      micSource.connect(analyser);
      drawWaveform(canvas);

      button.textContent = '⏹ Stop Recording';
    });
  }
}

function processRecording() {
  const blob = new Blob(recordedChunks, { type: 'audio/webm' });
  const reader = new FileReader();

  reader.onloadend = () => {
    audioContext.decodeAudioData(reader.result, buffer => {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        buffer.getChannelData(i).reverse();
      }

      recordedBuffer = buffer;
      document.getElementById('play-recording').disabled = false;
    });
  };
  reader.readAsArrayBuffer(blob);
}

function playUserRecording(canvas) {
  if (!recordedBuffer) return;

  const src = audioContext.createBufferSource();
  src.buffer = recordedBuffer;
  src.playbackRate.value = selectedSpeed;
  src.connect(audioContext.destination);
  src.start();

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  src.connect(analyser);
  drawWaveform(canvas);
}

function checkAnswer(userAnswer, correctAnswer, resultElement) {
  if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
    resultElement.textContent = '✅ Correct!';
    resultElement.style.color = 'green';
  } else {
    resultElement.textContent = '❌ Try again!';
    resultElement.style.color = 'red';
  }
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('waveform');
  const select = document.getElementById('phrase-select');
  const playBtn = document.getElementById('play-phrase');
  const recordBtn = document.getElementById('record-button');
  const playbackBtn = document.getElementById('play-recording');
  const answerBtn = document.getElementById('check-answer');
  const phoneticOut = document.getElementById('phonetic');
  const tipOut = document.getElementById('tip');
  const imageOut = document.getElementById('hint-image');
  const inputBox = document.getElementById('user-answer');
  const resultMsg = document.getElementById('result-msg');
  const sectionTitle = document.getElementById('section-title');
  const speedSlider = document.getElementById('speed-slider');
  const speedDisplay = document.getElementById('speed-value');
  const showPhoneticBtn = document.getElementById('show-phonetic');
  const showTipBtn = document.getElementById('show-tip');
  const showImageBtn = document.getElementById('show-image');

  const category = getQueryParam('category') || 'celebrations';
  const response = await fetch(`../data/${category}.json`);
  const phrases = await response.json();

  sectionTitle.textContent += `: ${category[0].toUpperCase() + category.slice(1)}`;

  phrases.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${index + 1}`;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    currentPhrase = phrases[select.value];
    phoneticOut.textContent = '';
    tipOut.textContent = '';
    imageOut.src = '';
    imageOut.style.display = 'none';
    inputBox.value = '';
    resultMsg.textContent = '';
  });

  select.value = 0;
  select.dispatchEvent(new Event('change'));

  playBtn.addEventListener('click', () => {
    if (currentPhrase.file) {
      playPhrase(`../snd/${currentPhrase.file}`, canvas);
    }
  });

  recordBtn.addEventListener('click', () => toggleRecording(canvas, recordBtn));
  playbackBtn.addEventListener('click', () => playUserRecording(canvas));
  answerBtn.addEventListener('click', () => {
    checkAnswer(inputBox.value, currentPhrase.answer, resultMsg);
  });

  if (speedSlider && speedDisplay) {
    speedSlider.addEventListener('input', () => {
      selectedSpeed = parseFloat(speedSlider.value);
      speedDisplay.textContent = `${selectedSpeed.toFixed(2)}×`;
    });
    speedDisplay.textContent = `${selectedSpeed.toFixed(2)}×`;
  }

  if (showPhoneticBtn) {
    showPhoneticBtn.addEventListener('click', () => {
      phoneticOut.textContent = currentPhrase.phonetic;
    });
  }

  if (showTipBtn) {
    showTipBtn.addEventListener('click', () => {
      tipOut.textContent = currentPhrase.tip;
    });
  }

  if (showImageBtn) {
    showImageBtn.addEventListener('click', () => {
      imageOut.src = currentPhrase.image;
      imageOut.style.display = 'block';
    });
  }
});
