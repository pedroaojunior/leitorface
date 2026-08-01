// Biometria Facial JS - Integrated with face-api.js & n8n

// State Variables
let isModelsLoaded = false;
let useTinyModel = false;
let currentFacingMode = 'user'; // 'user' ou 'environment'
let currentStream = null;
let currentTab = 'register'; // 'register' ou 'search'
let webhookUrl = localStorage.getItem('n8n_webhook_url') || 'http://localhost:5678/webhook/face-biometrics';
let currentDetection = null;

// DOM Elements
const videoFeed = document.getElementById('videoFeed');
const overlayCanvas = document.getElementById('overlayCanvas');
const aiStatusBadge = document.getElementById('aiStatusBadge');
const btnFlipCamera = document.getElementById('btnFlipCamera');
const btnRegisterFace = document.getElementById('btnRegisterFace');
const btnSearchFace = document.getElementById('btnSearchFace');
const personNameInput = document.getElementById('personName');
const faceDetectLabel = document.getElementById('faceDetectLabel');

// Result Elements
const resultCard = document.getElementById('resultCard');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultMeta = document.getElementById('resultMeta');
const metaSimilarity = document.getElementById('metaSimilarity');
const metaDistance = document.getElementById('metaDistance');
const resultPhotoContainer = document.getElementById('resultPhotoContainer');
const resultPhotoImg = document.getElementById('resultPhotoImg');

// Modal Settings
const modalSettings = document.getElementById('modalSettings');
const btnSettings = document.getElementById('btnSettings');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const webhookUrlInput = document.getElementById('webhookUrl');

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    webhookUrlInput.value = webhookUrl;
    setupEventListeners();
    await loadFaceApiModels();
    await startCamera();
});

// Wait for faceapi script to be ready
async function ensureFaceApiLoaded() {
    let retries = 0;
    while (typeof faceapi === 'undefined' && retries < 25) {
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
    }
    if (typeof faceapi === 'undefined') {
        throw new Error('Biblioteca face-api.js não foi carregada no navegador.');
    }
}

// Load Face API Models with Multi-source Fallback
async function loadFaceApiModels() {
    updateAiStatus('loading', 'Carregando Modelos AI...');
    console.log('Iniciando carregamento dos modelos biométricos...');
    
    try {
        await ensureFaceApiLoaded();
    } catch (err) {
        console.error(err);
        updateAiStatus('loading', 'Erro no Script de IA');
        return;
    }

    const modelUrls = [
        'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/',
        'https://raw.githubusercontent.com/vladmandic/face-api/main/model/',
        './models'
    ];

    let isSuccess = false;

    for (const url of modelUrls) {
        try {
            console.log(`Tentando carregar modelos SSD de: ${url}`);
            await faceapi.nets.ssdMobilenetv1.loadFromUri(url);
            await faceapi.nets.faceLandmark68Net.loadFromUri(url);
            await faceapi.nets.faceRecognitionNet.loadFromUri(url);
            
            useTinyModel = false;
            isSuccess = true;
            console.log(`Sucesso ao carregar modelos SSD de: ${url}`);
            break;
        } catch (ssdErr) {
            console.warn(`SSD falhou em ${url}, tentando Tiny...`, ssdErr);
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri(url);
                await faceapi.nets.faceLandmark68TinyNet.loadFromUri(url);
                await faceapi.nets.faceRecognitionNet.loadFromUri(url);
                
                useTinyModel = true;
                isSuccess = true;
                console.log(`Sucesso ao carregar modelos Tiny de: ${url}`);
                break;
            } catch (tinyErr) {
                console.warn(`Tiny falhou em ${url}:`, tinyErr);
            }
        }
    }

    if (isSuccess) {
        isModelsLoaded = true;
        updateAiStatus('ready', 'AI Pronta para Biometria');
    } else {
        console.error('Falha crítica: Nenhuma fonte de modelos respondeu.');
        updateAiStatus('loading', 'Erro ao carregar IA');
    }
}

// Update Status Badge UI
function updateAiStatus(statusClass, message) {
    aiStatusBadge.className = `status-badge ${statusClass}`;
    aiStatusBadge.innerHTML = statusClass === 'ready' 
        ? `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`
        : `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>${message}</span>`;
}

// Start Camera Stream
async function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoFeed.srcObject = currentStream;

        videoFeed.onloadedmetadata = () => {
            overlayCanvas.width = videoFeed.videoWidth;
            overlayCanvas.height = videoFeed.videoHeight;
            startDetectionLoop();
        };
    } catch (err) {
        console.error('Erro ao acessar a câmera:', err);
        faceDetectLabel.innerText = 'Câmera Não Encontrada';
    }
}

// Detection Loop
function startDetectionLoop() {
    setInterval(async () => {
        if (!isModelsLoaded || videoFeed.paused || videoFeed.ended) return;

        const displaySize = { width: videoFeed.videoWidth, height: videoFeed.videoHeight };
        faceapi.matchDimensions(overlayCanvas, displaySize);

        let detection = null;

        try {
            if (useTinyModel) {
                detection = await faceapi.detectSingleFace(videoFeed, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
                    .withFaceLandmarks(true)
                    .withFaceDescriptor();
            } else {
                detection = await faceapi.detectSingleFace(videoFeed)
                    .withFaceLandmarks()
                    .withFaceDescriptor();
            }
        } catch (e) {
            // Ignorar erros pontuais de renderização de frame
        }

        const ctx = overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        if (detection) {
            currentDetection = detection;
            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            
            const box = resizedDetection.detection.box;
            const drawOptions = {
                label: 'Rosto Detectado',
                boxColor: '#10b981',
                lineWidth: 2
            };
            const drawBox = new faceapi.draw.DrawBox(box, drawOptions);
            drawBox.draw(overlayCanvas);

            faceDetectLabel.innerText = 'Rosto Detectado!';
            faceDetectLabel.style.color = '#10b981';

            btnRegisterFace.disabled = false;
            btnSearchFace.disabled = false;
        } else {
            currentDetection = null;
            faceDetectLabel.innerText = 'Centralize o Rosto';
            faceDetectLabel.style.color = '#fff';

            btnRegisterFace.disabled = true;
            btnSearchFace.disabled = true;
        }
    }, 250);
}

// Convert Canvas Photo to Base64
function capturePhotoBase64() {
    const canvas = document.createElement('canvas');
    canvas.width = videoFeed.videoWidth;
    canvas.height = videoFeed.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (currentFacingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
}

// Action: Register Face (Cadastro)
async function registerFace() {
    const name = personNameInput.value.trim();
    if (!name) {
        alert('Por favor, informe o nome para o cadastro.');
        personNameInput.focus();
        return;
    }

    if (!currentDetection) {
        alert('Nenhum rosto foi detectado na câmera.');
        return;
    }

    const embeddingArray = Array.from(currentDetection.descriptor);
    const photoBase64 = capturePhotoBase64();

    showResult('info', 'Processando...', 'Enviando biometria para o n8n e salvando no Supabase...');
    btnRegisterFace.disabled = true;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'cadastro',
                nome: name,
                face_embedding: embeddingArray,
                foto_base64: photoBase64
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showResult('success', 'Cadastro Concluído!', data.message || `Rosto de ${name} salvo com sucesso no banco.`, photoBase64);
            personNameInput.value = '';
        } else {
            showResult('danger', 'Erro no Cadastro', data.message || 'Falha ao registrar rosto no Supabase.');
        }
    } catch (err) {
        console.error('Erro na requisição n8n:', err);
        showResult('danger', 'Erro de Conexão', 'Não foi possível conectar ao Webhook do n8n. Verifique se a URL está correta.');
    } finally {
        btnRegisterFace.disabled = false;
    }
}

// Action: Search / Reconhecer Face
async function searchFace() {
    if (!currentDetection) {
        alert('Nenhum rosto foi detectado na câmera.');
        return;
    }

    const embeddingArray = Array.from(currentDetection.descriptor);

    showResult('info', 'Analisando Rosto...', 'Consultando banco de dados via n8n...');
    btnSearchFace.disabled = true;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'reconhecer',
                face_embedding: embeddingArray
            })
        });

        const data = await response.json();

        if (response.ok && data.matchFound) {
            showResult(
                'success',
                'Rosto Reconhecido!',
                `Pessoa: ${data.nome}`,
                data.foto_url,
                { similarity: data.similarity, distance: data.distance }
            );
        } else {
            showResult(
                'danger',
                'Não Cadastrado',
                data.message || 'Nenhuma correspondência encontrada no Supabase.',
                null,
                { distance: data.distance || 'N/A' }
            );
        }
    } catch (err) {
        console.error('Erro na requisição n8n:', err);
        showResult('danger', 'Erro de Conexão', 'Não foi possível conectar ao Webhook do n8n.');
    } finally {
        btnSearchFace.disabled = false;
    }
}

// Show Result Panel
function showResult(type, title, message, photoUrl = null, meta = null) {
    resultCard.className = `result-card ${type}`;
    resultTitle.innerText = title;
    resultMessage.innerText = message;

    if (type === 'success') {
        resultIcon.className = 'result-icon fa-solid fa-circle-check';
    } else if (type === 'danger') {
        resultIcon.className = 'result-icon fa-solid fa-triangle-exclamation';
    } else {
        resultIcon.className = 'result-icon fa-solid fa-circle-info fa-spin';
    }

    if (photoUrl) {
        resultPhotoImg.src = photoUrl;
        resultPhotoContainer.classList.remove('hidden');
    } else {
        resultPhotoContainer.classList.add('hidden');
    }

    if (meta) {
        resultMeta.classList.remove('hidden');
        metaSimilarity.innerText = meta.similarity || 'N/A';
        metaDistance.innerText = meta.distance || '0.000';
    } else {
        resultMeta.classList.add('hidden');
    }

    resultCard.classList.remove('hidden');
}

// Tab Switching
window.switchTab = function(tab) {
    currentTab = tab;
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
    document.getElementById('tabSearch').classList.toggle('active', tab === 'search');
    
    document.getElementById('panelRegister').classList.toggle('active', tab === 'register');
    document.getElementById('panelSearch').classList.toggle('active', tab === 'search');

    resultCard.classList.add('hidden');
};

// Event Listeners
function setupEventListeners() {
    btnFlipCamera.addEventListener('click', () => {
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        startCamera();
    });

    btnRegisterFace.addEventListener('click', registerFace);
    btnSearchFace.addEventListener('click', searchFace);

    btnSettings.addEventListener('click', () => modalSettings.classList.remove('hidden'));
    btnCloseModal.addEventListener('click', () => modalSettings.classList.add('hidden'));
    btnSaveSettings.addEventListener('click', () => {
        webhookUrl = webhookUrlInput.value.trim();
        localStorage.setItem('n8n_webhook_url', webhookUrl);
        modalSettings.classList.add('hidden');
        alert('Configurações do Webhook salvas com sucesso!');
    });
}
