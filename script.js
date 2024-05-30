<!DOCTYPE html>
<html>
  <body>
    <script>
 
// Canvas
const canvas = document.querySelector('canvas.webgl')

const folderPath = './static/starwars/';
const textureNames = [
'1.png', 
'2.png', 
'3.png'

]; 

let scene, camera, renderer, planeMaterial, mesh, controls;
const textures = [];

// Load textures and store in an array
const loadTextures = async () => {
    const textureLoader = new THREE.TextureLoader();

    try {
        // Load all textures
        const loadedTextures = await Promise.all(textureNames.map(textureName => textureLoader.loadAsync(folderPath + textureName)));

        // Store loaded textures
        loadedTextures.forEach(texture => textures.push(texture));

        const imageWidth = textures[0].image.width;
        const imageHeight = textures[0].image.height;
        const imageAspect = imageWidth / imageHeight;

        // Initialize shader material with the first texture
        planeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                texture1: { value: textures[0] },
                texture2: { value: textures[1] },                
                mixFactor: { value: 0 },
                step1: { value: 0 },
                step2: { value: 0 }
            },
            vertexShader: `  
            varying vec2 vUv;
        
            void main()
            {
                vUv = uv;
        
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectedPosition = projectionMatrix * viewPosition;
                gl_Position = projectedPosition;
        
            }`,
            fragmentShader: `
            
            uniform sampler2D texture1;  
            uniform sampler2D texture2;    
            uniform float mixFactor;
            uniform float step1;
            uniform float step2;
        
            varying vec2 vUv;
        
            void main()
            {
              vec3 texture1 = texture2D(texture1, vUv).rgb;
              vec3 texture2 = texture2D(texture2, vUv).rgb;

              vec3 mixedColor = mix(texture1, texture2, smoothstep(step1, step2, mixFactor));
              gl_FragColor = vec4(vec3(mixedColor), 1.0);
            }`
        });

        // Create a plane geometry and mesh for card
        const width = 3;
        const height = 3 / imageAspect;
        const card = new THREE.Mesh(
          new THREE.PlaneGeometry(width, height, 1, 1),
          planeMaterial
        )
        
        const frameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x6C767C,
            metalness: 0.4, 
            roughness: 0.2
        }); 
        const frameThickness = 0.1;
        const frameGeometry = new THREE.BoxGeometry(width, height, frameThickness);
        const cardFrame = new THREE.Mesh(frameGeometry, frameMaterial);
        cardFrame.position.z = -frameThickness/2.0 - frameThickness/2.0/10.0;
        cardFrame.rotation.y = Math.PI;

        scene.add(card);
        scene.add(cardFrame);

    } catch (error) {
        console.error('Error loading textures:', error);
    }
};

// Initialize Three.js
const init = () => {
  // Create scene
  scene = new THREE.Scene();

  // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1); 
    directionalLight1.position.set(5, 10, 7.5);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1); 
    directionalLight2.position.set(-5, 0, 7.5);    
    
    scene.add(directionalLight1);
    scene.add(directionalLight2);

  const sizes = {
    width: canvas.clientWidth,
    height: canvas.clientHeight
  }
  
  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
  camera.position.x = 0
  camera.position.y = 0
  camera.position.z = 5
  scene.add(camera)


  renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true
  })
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(window.devicePixelRatio)

  controls = new THREE.OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.enableZoom = false

  // Load textures and create atlas
  loadTextures().then(() => {
      // Only start animation loop after textures are loaded
      tick();
  });

  // Resize handling
  window.addEventListener('resize', () =>
  {
      // Update sizes
      sizes.width = canvas.clientWidth
      sizes.height = canvas.clientHeight

      // Update camera
      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()

      // Update renderer
      renderer.setSize(sizes.width, sizes.height)
      renderer.setPixelRatio(window.devicePixelRatio)
  })


};

//const clock = new THREE.Clock()
const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

const tick = () =>
{
   //const elapsedTime = clock.getElapsedTime()

   // Update material
   if(planeMaterial) {
       let angle = controls.getAzimuthalAngle() / (Math.PI / 2);
       let mixfactor = (angle * 0.5 + 0.5) * textures.length;
       let index = Math.floor(mixfactor);
       planeMaterial.uniforms.texture1.value = textures[clamp(index, 0, textures.length - 1)];
       planeMaterial.uniforms.texture2.value = textures[clamp(index + 1, 0, textures.length - 1)];
       planeMaterial.uniforms.mixFactor.value = mixfactor;

       let step = index + 0.5;
       planeMaterial.uniforms.step1.value = step;
       planeMaterial.uniforms.step2.value = step + 1.0;
   }

   // Update controls
   controls.update()

   // Render
   renderer.render(scene, camera)

   // Call tick again on the next frame
   window.requestAnimationFrame(tick)
}

init();
    </script>
  </body>
</html>
