let modoAtual = 'cadastro';
const WEBHOOK_URL = 'https://coldbloodedopossum-n8n.cloudfy.live/webhook/face';

async function modo(m) {
  modoAtual = m;
  document.getElementById('resultado').innerText = `Modo: ${m}`;
}

// Carrega modelos de IA e liga câmera
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
  .then(stream => video.srcObject = stream)
}

document.getElementById('acao').onclick = async () => {
  const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
  
  if(!detections) return alert("Rosto não encontrado");
  
  const embedding = Array.from(detections.descriptor); // vira array
  const canvas = document.getElementById('canvas');
  canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
  const fotoBase64 = canvas.toDataURL('image/jpeg');

  if(modoAtual === 'cadastro') {
    const nome = document.getElementById('nome').value;
    await fetch(WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ acao: 'cadastro', nome, foto: fotoBase64, embedding }) });
    alert("Cadastrado!");
  } 
  if(modoAtual === 'reconhecer') {
    const res = await fetch(WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ acao: 'reconhecer', embedding }) });
    const data = await res.json();
    document.getElementById('resultado').innerText = `Reconhecido: ${data.nome} - Confiança: ${data.distancia}`;
  }
}
function modo(m) {
  modoAtual = m;
  document.getElementById('titulo-modo').innerText = `Modo ${m === 'cadastro' ? 'Cadastro' : 'Reconhecer'}`;
  document.getElementById('nome').style.display = m === 'cadastro' ? 'block' : 'none';
  
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('ativo'));
  document.getElementById(`btn-${m}`).classList.add('ativo');
}

function mostrarResultado(texto, tipo) {
  const el = document.getElementById('resultado');
  el.innerText = texto;
  el.className = `resultado ${tipo}`;
}