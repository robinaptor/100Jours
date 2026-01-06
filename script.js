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

     const prevX = mouse.x;
     const prevY = mouse.y;

     // Smooth mouse movement (Lag effect)
     mouse.x = lerp(mouse.x, targetMouse.x, 0.08);
     mouse.y = lerp(mouse.y, targetMouse.y, 0.08);

     // Calculate Speed based on mouse delta
     const dx = mouse.x - prevX;
     const dy = mouse.y - prevY;
     const dist = Math.sqrt(dx * dx + dy * dy);

     // --- MEMORY PERSISTENCE LOGIC ---

     // Threshold for "Stopped": if moving very slowly, we consider it a pause in exploration.
     if (dist < 0.5) {
          // STOP LOCK: Do NOT update speed. Keep current image.
          // We do nothing to 'speed' variable.
     } else {
          // MOVING:
          if (dist > speed) {
               // ACCELERATION (Attack): React reasonably fast to connect movement = time travel
               speed = lerp(speed, dist, 0.15);
          } else {
               // DECELERATION (Decay/CoolDown): Decay VERY slowly to allow exploration of high-index images
               speed = lerp(speed, dist, 0.02);
          }
     }

     // Map speed to index
     let ratio = Math.min(speed / MAX_SPEED, 1);
     let easedRatio = Math.pow(ratio, 1.1);

     let targetIndex = Math.floor(easedRatio * (TOTAL_IMAGES - 1));

     if (targetIndex < 0) targetIndex = 0;
     if (targetIndex >= TOTAL_IMAGES) targetIndex = TOTAL_IMAGES - 1;

     // No breathing, just stick to the index
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

          // Force Image to Fill Screen (Stretch)
          // This ensures Top-Left of Image = Top-Left of Screen
          const dw = canvas.width;
          const dh = canvas.height;
          const ox = 0;
          const oy = 0;

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
