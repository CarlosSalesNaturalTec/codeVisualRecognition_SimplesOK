// Imagem de ENTRADA = Foto caputurada no momento da iteração
// Imagem de REFERÊNCIA = Fotos salvas e rotuladas de cada pessoa a ser reconhecida

const imageUpload = document.getElementById('imageUpload')

// 1 - carrega modelos treinados de AI para : Detecção de rostos, marcos faciais e Reconhecimento facial
console.log("1 - carregando modelos...");
Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {

  console.log("modelos carregados.");
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)

  // 2 - Aguarda criação de objeto contendo Descritores de todas as imagens de REFERÊNCIA
  console.log("2 - Buscando Descritores das imagens de REFERÊNCIA...");
  const labeledFaceDescriptors = await loadLabeledImages()
  console.log("Descritores das imagens de REFERÊNCIA Carregados: ", labeledFaceDescriptors);

  // 3 - Cria objeto FaceMatcher contendo todos os descritores das imagens de REFERÊNCIA
  console.log("3 - Criando FaceMatcher contendo Descritores das imagens de REFERÊNCIA...");
  const maxDescriptorDistance = 0.6;
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance);
  console.log("FaceMatcher criado: ", faceMatcher);

  let image
  let canvas
  document.body.append('Loaded')

  // Componente para carregamento de imagem no Browser
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()

    // 4 - Cria objeto Image a partir da imagem disponibilizada pelo usuário - Imagem de ENTRADA
    console.log("4 - Criando objeto Imagem a partir da Imagens de ENTRADA...");
    image = await faceapi.bufferToImage(imageUpload.files[0])
    container.append(image)

    // Cria elemento Canvas a partir da imagem disponibilizada pelo usuário - Imagem de ENTRADA
    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)
    
    // Dimensões da Imagem de ENTRADA (Width, Heigth)
    const displaySize = { width: image.width, height: image.height }  
    // Dimensiona Canvas conforme tamanho da Imagem de ENTRADA
    faceapi.matchDimensions(canvas, displaySize)  
    
    // 5 - Cria objeto Detections contendo região do Rosto, Marcas Faciais e Descritores da Imagem de ENTRADA
    console.log("5 - Criando objeto Detections a partir da Imagem de ENTRADA...");
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()

    // 6 - Redimensiona objeto Detections conforme tamanho da Imagem de ENTRADA
    console.log("6 - Redimensionando objeto Detections conforme tamanho da Imagem de ENTRADA...");
    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    // 7 - Encontra Melhor correspondência entre a Imagem de ENTRADA e as Imagens de REFERÊNCIA
    // Verifica distância Euclidiana entre ambas. Se distância for maior que o limite estabelecido no FaceMatcher, considera como "Desconhecido"
    console.log("7 - Encontrando correspondÊncias entre a imagem de ENTRADA e as Imagens de REFERÊNCIA");
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    console.log(results);

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })

  })
}

function loadLabeledImages() {

  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
  
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      // Cria um Descritor para cada imagem de REFERÊNCIA salva (No caso, 2 imagens para cada pessoa)
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/master/labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
