// 1. Variáveis Globais
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const WEBHOOK_URL = 'https://coldbloodedopossum-n8n.cloudfy.live/webhook/face';
let modoAtual = 'cadastro';

// 2. Controle da Interface
function modo(m) {
  modoAtual = m;
  document.getElementById('titulo-modo').innerText = `Modo ${m === 'cadastro' ? 'Cadastro' : 'Reconhecimento'}`;
  document.getElementById('nome').style.display = m === 'cadastro' ? 'block' : 'none';
  
  // Atualiza os botões visuais
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('ativo'));
  document.getElementById(`btn-${m}`).classList.add('ativo');
  
  // Limpa os resultados e inputs da tela
  document.getElementById('resultado').innerText = '';
  document.getElementById('nome').value = '';
}

// 3. Função de Feedback Visual
function mostrarResultado(texto, tipo = 'info') {
  const el = document.getElementById('resultado');
  el.innerText = texto;
  // O tipo pode ser usado no CSS para mudar a cor: class="resultado erro" ou "resultado sucesso"
  el.className = `resultado ${tipo}`; 
}

// 4. Carregar IA e Iniciar Câmera
mostrarResultado('Carregando IA...', 'info');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/leitorface/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/leitorface/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/leitorface/models')
])
.then(() => {
  mostrarResultado('Pronto!', 'sucesso');
  startVideo();
})
.catch(err => {
  mostrarResultado('Erro ao carregar os modelos da IA.', 'erro');
  console.error(err);
});

function startVideo() {
  // 'user' força a câmera frontal no celular
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      mostrarResultado('Permissão de câmera negada.', 'erro');
    });
}

// 5. Lógica de Captura e Envio para o Webhook
document.getElementById('acao').onclick = async () => {
  mostrarResultado('Processando o rosto...', 'info');

  // Detecta o rosto
  const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                  .withFaceLandmarks()
                                  .withFaceDescriptor();
  
  if(!detections) {
      return mostrarResultado("Rosto não encontrado. Olhe para a câmera.", "erro");
  }
  
  // Extrai os dados
  const embedding = Array.from(detections.descriptor);
  
  // Desenha o frame atual no canvas com as dimensões reais do vídeo
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Converte para Base64 (0.8 reduz levemente a qualidade para o payload não ficar gigante)
  const fotoBase64 = canvas.toDataURL('image/jpeg', 0.8);

  try {
    if(modoAtual === 'cadastro') {
      const nome = document.getElementById('nome').value.trim();
      if(!nome) return mostrarResultado("Digite o nome antes de capturar!", "erro");

      mostrarResultado('Enviando para o servidor...', 'info');
      
      await fetch(WEBHOOK_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, // Obrigatório para o n8n entender os dados
        body: JSON.stringify({ acao: 'cadastro', nome: nome, foto: fotoBase64, embedding: embedding }) 
      });
      
      mostrarResultado("Rosto cadastrado com sucesso!", "sucesso");
      document.getElementById('nome').value = '';
    } 
    
    if(modoAtual === 'reconhecer') {
      mostrarResultado('Buscando no servidor...', 'info');

      const res = await fetch(WEBHOOK_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'reconhecer', embedding: embedding }) 
      });
      
      const data = await res.json();
      
      if(data.nome) {
          mostrarResultado(`✅ Reconhecido: ${data.nome}`, "sucesso");
      } else {
          // Caso o n8n devolva algo diferente indicando falha
          mostrarResultado("❌ Rosto não reconhecido.", "erro");
      }
    }
  } catch (erro) {
    mostrarResultado("Erro ao conectar com o servidor n8n.", "erro");
    console.error(erro);
  }
}
