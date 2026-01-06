// Temporal Flashlight Logic

const TOTAL_IMAGES = 96;
const FLASHLIGHT_RADIUS_BASE = 200; // Base size
const MAX_SPEED = 50; // Reduced to make it easier to reach the end

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let images = [];
let imagesLoaded = 0;

// Mouse State
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let targetMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let speed = 0;
let currentImageIndex = 0;
let frameCount = 0; // For breathing animation

// Resize
function resize() {
     canvas.width = window.innerWidth;
     canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Preload
function preloadImages() {
     for (let i = 0; i < TOTAL_IMAGES; i++) {
          const img = new Image();
          img.src = `assets/img_${i}.jpg`;
          img.onload = () => {
               imagesLoaded++;
               if (imagesLoaded === TOTAL_IMAGES) startApp();
          };
          img.onerror = () => console.error(`Error loading img_${i}.jpg`);
          images.push(img);
     }
}

document.addEventListener('mousemove', (e) => {
     targetMouse.x = e.clientX;
     targetMouse.y = e.clientY;
});

// Linear Interpolation
function lerp(start, end, factor) {
     return start + (end - start) * factor;
}

function updatePhysics() {
     frameCount++;

     // Smooth mouse movement (Lag effect)
     const prevX = mouse.x;
     const prevY = mouse.y;

     // Lower factor = more lag/weight
     mouse.x = lerp(mouse.x, targetMouse.x, 0.08);
     mouse.y = lerp(mouse.y, targetMouse.y, 0.08);

     // Calculate speed based on the LAG movement (smoother)
     const dx = mouse.x - prevX;
     const dy = mouse.y - prevY;
     const dist = Math.sqrt(dx * dx + dy * dy);

     speed = lerp(speed, dist, 0.15); // Increased reactivity (was 0.1)

     // Map speed to index
     // 0 to MAX_SPEED -> 0 to 95
     // Use a power curve to make it easier to stay in the past or reach the future
     let ratio = Math.min(speed / MAX_SPEED, 1);
     // easing: ratio = ratio * ratio; // optional non-linear

     // Easing for index: lowered exponent for more linear spread
     let easedRatio = Math.pow(ratio, 1.1);

     let targetIndex = Math.floor(easedRatio * (TOTAL_IMAGES - 1));

     // --- BREATHING EFFECT ---
     // When still, drift through the first few images
     // Use Sine wave: varies between 0 and 1
     // Map to offset 0-10
     const breathingOffset = Math.abs(Math.sin(frameCount * 0.02)) * 12;

     // Combine: If speed is high, breathing matters less?
     // Actually, adding it always feels organic.
     targetIndex += breathingOffset;

     if (targetIndex < 0) targetIndex = 0;
     if (targetIndex >= TOTAL_IMAGES) targetIndex = TOTAL_IMAGES - 1;

     currentImageIndex = Math.floor(targetIndex);
}

function draw() {
     // Clear
     ctx.globalCompositeOperation = 'source-over';
     ctx.fillStyle = 'black';
     ctx.fillRect(0, 0, canvas.width, canvas.height);

     if (imagesLoaded === TOTAL_IMAGES) {
          const img = images[currentImageIndex];

          ctx.save();

          // --- RGB SPLIT CALCULATION ---
          // Amount of split depends on speed
          const splitAmount = speed * 1.5; // Multiplier

          // Calculate Image Dimensions (Cover)
          const imgRatio = img.width / img.height;
          const canvasRatio = canvas.width / canvas.height;
          let dw, dh, ox, oy;

          if (canvasRatio > imgRatio) {
               dw = canvas.width;
               dh = canvas.width / imgRatio;
               ox = 0;
               oy = (canvas.height - dh) / 2;
          } else {
               dh = canvas.height;
               dw = canvas.height * imgRatio;
               ox = (canvas.width - dw) / 2;
               oy = 0;
          }

          // We will draw the image 3 times (R, G, B) with offsets
          // Composite mode 'screen' or 'lighter' allows adding colors up to white
          // But since we want to mask it all later, we need to be careful.
          // Strategy: Draw RGB split to canvas, THEN apply mask using 'destination-in'.

          // RED Channel
          ctx.globalCompositeOperation = 'source-over'; // Base layer (or use screen if black bg)
          // Actually, normal blending of full images on top of each other just overwrites.
          // We need to simulate channels.
          // A simple fake RGB split:
          // Draw normal image, then draw tinted versions? No.

          // Better Canvas approach for performance without pixel manipulation:
          // Just draw the standard image. The "RGB Split" is hard to do cheaply without WebGL.
          // WAIT: We can use 'multiply' or 'screen' with pure red/green/blue rectangles? No.

          // Simplified "Shake" effect + "Chromatic Edge":
          // Actually, let's just draw the image 3 times with low opacity 'screen' mode?
          // No, that makes it too bright.

          // fallback: Just Jitter/Shake position based on speed
          const jitterX = (Math.random() - 0.5) * speed * 0.5;
          const jitterY = (Math.random() - 0.5) * speed * 0.5;

          // Draw MAIN Image
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(img, ox + jitterX, oy + jitterY, dw, dh);

          // Draw "Red Ghost" if moving fast
          if (speed > 5) {
               ctx.globalCompositeOperation = 'screen';
               ctx.globalAlpha = 0.5; // Ghost opacity
               // Offset based on direction of movement vs speed?
               // Simple approach: Shift Left
               ctx.drawImage(img, ox + jitterX - splitAmount, oy + jitterY, dw, dh);
               // shift Right (Blue/Cyan ghost?)
               ctx.drawImage(img, ox + jitterX + splitAmount, oy + jitterY, dw, dh);
               ctx.globalAlpha = 1.0;
          }

          // --- MASKING "THE LIGHT" ---
          ctx.globalCompositeOperation = 'destination-in';

          // Dynamic Radius
          // Expands with speed, but also flickers randomly at high speed
          let dynamicRadius = FLASHLIGHT_RADIUS_BASE + (speed * 0.8);
          if (speed > 40) {
               dynamicRadius += (Math.random() * 20 - 10); // Flicker
          }

          const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, dynamicRadius);
          gradient.addColorStop(0, 'rgba(0,0,0,1)');
          gradient.addColorStop(0.4, 'rgba(0,0,0,0.9)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, dynamicRadius * 1.5, 0, Math.PI * 2); // Draw slightly larger to accommodate gradient
          ctx.fill();

          ctx.restore();

     } else {
          ctx.fillStyle = '#444';
          ctx.textAlign = 'center';
          ctx.font = '20px monospace';
          ctx.fillText(`OPTIMIZING MEMORIES... ${Math.round((imagesLoaded / TOTAL_IMAGES) * 100)}%`, canvas.width / 2, canvas.height / 2);
     }

     updatePhysics();
     requestAnimationFrame(draw);
}

function startApp() {
     requestAnimationFrame(draw);
}

preloadImages();
