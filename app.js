const jsonData = {
  desayunos: [
    { nombre: "Chicharrón con camote", ingredientes: ["pan", "camote", "chicharrón", "salsa criolla"] },
    { nombre: "Tamales verdes", ingredientes: ["masa de maíz", "hoja de plátano", "ají verde", "pollo"] }
  ],
  almuerzos: [
    { nombre: "Sopa seca con carapulcra", ingredientes: ["fideos", "maní", "ají panca", "carne de cerdo", "papa seca"] },
    { nombre: "Arroz con pato", ingredientes: ["arroz", "cilantro", "pato", "chicha de jora", "cebolla"] }
  ],
  cenas: [
    { nombre: "Pollo a la brasa", ingredientes: ["pollo", "papas", "ají amarillo", "lechuga"] },
    { nombre: "Causa rellena", ingredientes: ["papa amarilla", "atún", "mayonesa", "limón", "ají amarillo"] }
  ]
};

const video = document.getElementById('video');
const iniciarCamara = document.getElementById('iniciarCamara');
const cambiarCamara = document.getElementById('cambiarCamara');
const platosSelect = document.getElementById('platos');
const ingredientesList = document.getElementById('ingredientes');
const detectadosList = document.getElementById('ingredientesDetectados');
const faltantesList = document.getElementById('ingredientesFaltantes');
let modelo;
let stream;
let facingMode = 'environment'; // 'environment' para cámara trasera, 'user' para cámara frontal

// Cargar los platos en el selector
Object.keys(jsonData).forEach(categoria => {
  jsonData[categoria].forEach(plato => {
    const option = document.createElement('option');
    option.value = plato.nombre;
    option.textContent = plato.nombre;
    option.dataset.ingredientes = JSON.stringify(plato.ingredientes);
    platosSelect.appendChild(option);
  });
});

// Mostrar ingredientes del plato seleccionado
platosSelect.addEventListener('change', () => {
  ingredientesList.innerHTML = '';
  const ingredientes = JSON.parse(platosSelect.selectedOptions[0].dataset.ingredientes);
  ingredientes.forEach(ing => {
    const li = document.createElement('li');
    li.textContent = ing;
    ingredientesList.appendChild(li);
  });
});

// Activar la cámara y cargar el modelo
iniciarCamara.addEventListener('click', async () => {
  // Detener la cámara si ya está activa
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  // Iniciar la cámara
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
  video.srcObject = stream;

  // Cargar el modelo de COCO-SSD
  modelo = await cocoSsd.load();

  // Iniciar la detección en tiempo real
  detectarObjetos();
});

// Cambiar la cámara
cambiarCamara.addEventListener('click', async () => {
  // Cambiar el modo de la cámara
  facingMode = facingMode === 'user' ? 'environment' : 'user';

  // Detener la cámara actual
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  // Iniciar la cámara con el nuevo modo
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
  video.srcObject = stream;
});

// Detectar objetos en tiempo real
async function detectarObjetos() {
  const ingredientes = JSON.parse(platosSelect.selectedOptions[0].dataset.ingredientes);
  const detectados = new Set();

  const detectLoop = async () => {
    const predictions = await modelo.detect(video);
    detectadosList.innerHTML = '';

    predictions.forEach(prediction => {
      const item = prediction.class;
      if (ingredientes.includes(item) && !detectados.has(item)) {
        detectados.add(item);
      }
    });

    detectados.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      detectadosList.appendChild(li);
    });

    const faltantes = ingredientes.filter(ing => !detectados.has(ing));
    faltantesList.innerHTML = '';
    faltantes.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      faltantesList.appendChild(li);
    });

    requestAnimationFrame(detectLoop);
  };

  detectLoop();
}
