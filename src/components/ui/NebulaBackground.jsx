// src/components/ui/NebulaBackground.jsx
// Background animato "Nebula 2.0" - 5 Effetti COMPLETAMENTE DIVERSI
// Ogni preset è unico e innovativo

import React, { useEffect, useRef } from 'react';

// ============================================
// PRESET 1: LIQUID METAL - Metallo liquido che scorre
// ============================================
const LiquidMetal = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    const metaballs = Array.from({ length: 8 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 100 + Math.random() * 150,
    }));
    
    const animate = () => {
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      metaballs.forEach(ball => {
        ball.x += ball.vx;
        ball.y += ball.vy;
        if (ball.x < 0 || ball.x > canvas.width) ball.vx *= -1;
        if (ball.y < 0 || ball.y > canvas.height) ball.vy *= -1;
      });
      
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let x = 0; x < canvas.width; x += 3) {
        for (let y = 0; y < canvas.height; y += 3) {
          let sum = 0;
          metaballs.forEach(ball => {
            const dx = x - ball.x;
            const dy = y - ball.y;
            sum += (ball.radius * ball.radius) / (dx * dx + dy * dy + 1);
          });
          
          if (sum > 1) {
            const intensity = Math.min(sum - 1, 1);
            const idx = (y * canvas.width + x) * 4;
            data[idx] = 20 + intensity * 40;
            data[idx + 1] = 60 + intensity * 140;
            data[idx + 2] = 180 + intensity * 75;
            data[idx + 3] = intensity * 200;
            
            // Fill 3x3 block for performance
            for (let dx = 0; dx < 3 && x + dx < canvas.width; dx++) {
              for (let dy = 0; dy < 3 && y + dy < canvas.height; dy++) {
                const idx2 = ((y + dy) * canvas.width + (x + dx)) * 4;
                data[idx2] = data[idx];
                data[idx2 + 1] = data[idx + 1];
                data[idx2 + 2] = data[idx + 2];
                data[idx2 + 3] = data[idx + 3];
              }
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      animId = requestAnimationFrame(animate);
    };
    
    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="absolute inset-0" />;
};

// ============================================
// PRESET 2: GEOMETRIC PULSE - Geometrie pulsanti
// ============================================
const GeometricPulse = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let time = 0;
    
    const drawHexagon = (cx, cy, size, rotation) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + rotation;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };
    
    const animate = () => {
      time += 0.008;
      
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#0a0f1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const hexSize = Math.max(canvas.width, canvas.height) / 8;
      
      for (let i = -2; i < 14; i++) {
        for (let j = -2; j < 10; j++) {
          const offsetX = (j % 2) * hexSize * 0.866;
          const cx = i * hexSize * 1.732 + offsetX;
          const cy = j * hexSize * 1.5;
          
          const dist = Math.sqrt(
            Math.pow(cx - canvas.width / 2, 2) + 
            Math.pow(cy - canvas.height / 2, 2)
          );
          
          const wave = Math.sin(dist * 0.003 - time * 4) * 0.5 + 0.5;
          const pulse = Math.sin(time * 2.5 + i * 0.4 + j * 0.4) * 0.3 + 0.7;
          const size = hexSize * 0.35 * pulse;
          
          ctx.strokeStyle = `hsla(${210 + wave * 80}, 85%, 55%, ${wave * 0.4})`;
          ctx.lineWidth = 1.5 + wave * 2.5;
          
          drawHexagon(cx, cy, size, time * 0.5 + dist * 0.0005);
          ctx.stroke();
          
          if (wave > 0.65) {
            ctx.fillStyle = `hsla(${210 + wave * 80}, 85%, 55%, ${(wave - 0.65) * 0.2})`;
            drawHexagon(cx, cy, size * 0.7, time * 0.5 + dist * 0.0005);
            ctx.fill();
          }
        }
      }
      
      animId = requestAnimationFrame(animate);
    };
    
    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="absolute inset-0" />;
};

// ============================================
// PRESET 3: FLOWING RIBBONS - Nastri fluidi
// ============================================
const FlowingRibbons = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let time = 0;
    
    // Nastri con proprietà randomiche
    const ribbons = Array.from({ length: 8 }, (_, i) => ({
      yOffset: Math.random() * canvas.height,
      amplitude: 50 + Math.random() * 100,
      frequency: 0.001 + Math.random() * 0.002,
      speed: 0.3 + Math.random() * 0.5,
      thickness: 60 + Math.random() * 80,
      hue: 200 + Math.random() * 60, // Blue to purple range
      phase: Math.random() * Math.PI * 2,
    }));
    
    const animate = () => {
      time += 0.008;
      
      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#050810');
      bgGrad.addColorStop(0.5, '#0a1020');
      bgGrad.addColorStop(1, '#0a0f1a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw ribbons
      ribbons.forEach((ribbon, ri) => {
        ctx.beginPath();
        
        const points = [];
        for (let x = -50; x <= canvas.width + 50; x += 8) {
          const wave1 = Math.sin(x * ribbon.frequency + time * ribbon.speed + ribbon.phase) * ribbon.amplitude;
          const wave2 = Math.sin(x * ribbon.frequency * 2.3 + time * ribbon.speed * 0.7) * ribbon.amplitude * 0.4;
          const wave3 = Math.sin(x * ribbon.frequency * 0.5 + time * ribbon.speed * 1.2) * ribbon.amplitude * 0.3;
          const y = ribbon.yOffset + wave1 + wave2 + wave3;
          points.push({ x, y });
        }
        
        // Draw ribbon as gradient path
        for (let i = 0; i < points.length - 1; i++) {
          const gradient = ctx.createLinearGradient(
            points[i].x, points[i].y - ribbon.thickness,
            points[i].x, points[i].y + ribbon.thickness
          );
          
          const alpha = 0.06 + Math.sin(time * 2 + i * 0.02) * 0.02;
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.3, `hsla(${ribbon.hue}, 70%, 50%, ${alpha})`);
          gradient.addColorStop(0.5, `hsla(${ribbon.hue + 20}, 60%, 45%, ${alpha * 1.3})`);
          gradient.addColorStop(0.7, `hsla(${ribbon.hue}, 70%, 50%, ${alpha})`);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y - ribbon.thickness);
          ctx.lineTo(points[i + 1].x, points[i + 1].y - ribbon.thickness);
          ctx.lineTo(points[i + 1].x, points[i + 1].y + ribbon.thickness);
          ctx.lineTo(points[i].x, points[i].y + ribbon.thickness);
          ctx.fill();
        }
      });
      
      animId = requestAnimationFrame(animate);
    };
    
    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="absolute inset-0" />;
};

// ============================================
// PRESET 4: PARTICLE CONSTELLATION - Costellazioni
// ============================================
const ParticleConstellation = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let time = 0;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 1 + Math.random() * 2,
      hue: 200 + Math.random() * 60,
      pulse: Math.random() * Math.PI * 2,
    }));
    
    const animate = () => {
      time += 0.01;
      
      // Clear completo invece di fade (evita il grigio)
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        
        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        // Draw particle with glow
        const glow = Math.sin(p.pulse) * 0.3 + 0.7;
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${glow * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * glow, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer glow
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${glow * 0.2})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * glow * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw connections
      ctx.lineWidth = 0.5;
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15;
            ctx.strokeStyle = `hsla(220, 60%, 50%, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });
      
      animId = requestAnimationFrame(animate);
    };
    
    // Initial fill
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="absolute inset-0" />;
};

// ============================================
// PRESET 5: AURORA BOREALIS - Aurora con stelle fluenti
// Interattiva con scroll, stelle che seguono l'aurora
// ============================================
const AuroraBorealis = () => {
  const canvasRef = useRef(null);
  const scrollRef = useRef(0);
  const targetScrollRef = useRef(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Rigenera stelle quando cambia dimensione
      initStars();
    };
    
    // Stelle che fluiscono con l'aurora (verso SINISTRA)
    let stars = [];
    const initStars = () => {
      stars = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.5 + Math.random() * 1.5,
        speed: 0.15 + Math.random() * 0.35, // Velocità verso sinistra
        drift: (Math.random() - 0.5) * 0.2, // Deriva verticale leggera
        pulse: Math.random() * Math.PI * 2,
        hue: 180 + Math.random() * 60,
        brightness: 0.4 + Math.random() * 0.6,
      }));
    };
    initStars();
    
    resize();
    window.addEventListener('resize', resize);
    
    // Scroll interaction - cattura scroll da window E da qualsiasi container scrollabile
    const handleScroll = (e) => {
      // Prova prima window.scrollY
      let scrollValue = window.scrollY || window.pageYOffset || 0;
      
      // Se l'evento viene da un elemento specifico, usa quello
      if (e && e.target && e.target !== document) {
        scrollValue = e.target.scrollTop || scrollValue;
      }
      
      // Fallback: cerca il main container scrollabile
      if (scrollValue === 0) {
        const mainContent = document.querySelector('main, [class*="overflow-y"], [class*="overflow-auto"]');
        if (mainContent) {
          scrollValue = mainContent.scrollTop || 0;
        }
      }
      
      targetScrollRef.current = scrollValue;
    };
    
    // Listener su window
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Listener su document per catturare scroll di elementi interni
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    let time = 0;
    
    // Onde aurora
    const waves = Array.from({ length: 12 }, (_, i) => ({
      amplitude: 30 + Math.random() * 80,
      frequency: 0.0008 + Math.random() * 0.002,
      speed: 0.4 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      yPercent: 0.05 + (i / 11) * 0.9 + (Math.random() - 0.5) * 0.08,
      hue: 140 + Math.random() * 100,
      thickness: 80 + Math.random() * 120,
      xOffset: Math.random() * 500,
      speedVariation: 0.5 + Math.random() * 1,
    }));
    
    const animate = () => {
      time += 0.008;
      
      // SMOOTH scroll interpolation (lerp) - molto più fluido
      scrollRef.current += (targetScrollRef.current - scrollRef.current) * 0.08;
      const scrollInfluence = scrollRef.current * 0.002; // Più visibile
      
      // Dark sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGradient.addColorStop(0, '#030508');
      skyGradient.addColorStop(0.3, '#050a12');
      skyGradient.addColorStop(0.6, '#08101a');
      skyGradient.addColorStop(1, '#0a0f1a');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // ========== STELLE FLUENTI (verso SINISTRA come l'aurora) ==========
      stars.forEach(star => {
        // Movimento verso SINISTRA
        star.x -= star.speed;
        
        // Deriva verticale sinusoidale dolce
        star.y += star.drift + Math.sin(time * 1.5 + star.pulse) * 0.1;
        
        // Wrap around - riappare a destra quando esce a sinistra
        if (star.x < -10) {
          star.x = canvas.width + 10;
          star.y = Math.random() * canvas.height;
        }
        if (star.y < -10) star.y = canvas.height + 10;
        if (star.y > canvas.height + 10) star.y = -10;
        
        // Pulsazione luminosità
        star.pulse += 0.015;
        const glow = Math.sin(star.pulse) * 0.3 + 0.7;
        const alpha = star.brightness * glow;
        
        // Disegna stella
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * glow, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${star.hue}, 60%, 70%, ${alpha})`;
        ctx.fill();
        
        // Alone esterno
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * glow * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${star.hue}, 50%, 60%, ${alpha * 0.15})`;
        ctx.fill();
      });
      
      // ========== AURORA WAVES ==========
      waves.forEach((wave, waveIndex) => {
        const points = [];
        const baseY = canvas.height * wave.yPercent;
        
        // Scroll fluido - offset Y più evidente
        const scrollY = Math.sin(scrollInfluence * 2 + waveIndex * 0.4) * 20;
        
        for (let x = -50; x <= canvas.width + 50; x += 6) {
          const wave1 = Math.sin((x + wave.xOffset) * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude;
          const wave2 = Math.sin((x + wave.xOffset) * wave.frequency * 2.7 + time * wave.speed * 1.3 + wave.phase * 0.7) * wave.amplitude * 0.35;
          const wave3 = Math.sin((x + wave.xOffset) * wave.frequency * 0.4 + time * wave.speed * 0.6) * wave.amplitude * 0.5;
          const wave4 = Math.sin((x + wave.xOffset) * wave.frequency * 4.2 + time * wave.speed * 1.8) * wave.amplitude * 0.15;
          
          const y = baseY + wave1 + wave2 + wave3 + wave4 + scrollY;
          points.push({ x, y });
        }
        
        const curtainHeight = wave.thickness * (1 + Math.sin(time * wave.speedVariation + waveIndex) * 0.3);
        
        // Draw curtain with shimmer effect
        for (let i = 0; i < points.length - 1; i++) {
          const gradient = ctx.createLinearGradient(
            points[i].x, points[i].y - curtainHeight,
            points[i].x, points[i].y + curtainHeight * 0.5
          );
          
          const shimmer = Math.sin(time * 2.5 + i * 0.03 + waveIndex * 0.8) * 0.5 + 0.5;
          const baseAlpha = 0.04 + shimmer * 0.04;
          
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.15, `hsla(${wave.hue}, 65%, 55%, ${baseAlpha * 0.3})`);
          gradient.addColorStop(0.4, `hsla(${wave.hue + 15}, 60%, 50%, ${baseAlpha})`);
          gradient.addColorStop(0.6, `hsla(${wave.hue + 10}, 55%, 45%, ${baseAlpha * 0.9})`);
          gradient.addColorStop(0.85, `hsla(${wave.hue}, 65%, 55%, ${baseAlpha * 0.3})`);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y - curtainHeight);
          ctx.lineTo(points[i + 1].x, points[i + 1].y - curtainHeight);
          ctx.lineTo(points[i + 1].x, points[i + 1].y + curtainHeight * 0.5);
          ctx.lineTo(points[i].x, points[i].y + curtainHeight * 0.5);
          ctx.closePath();
          ctx.fill();
        }
        
        // Bright edge con glow
        if (waveIndex % 2 === 0) {
          ctx.strokeStyle = `hsla(${wave.hue}, 80%, 65%, 0.2)`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = `hsla(${wave.hue}, 80%, 65%, 0.3)`;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
      
      animId = requestAnimationFrame(animate);
    };
    
    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);
  
  return <canvas ref={canvasRef} className="absolute inset-0" />;
};

// ============================================
// PRESET MAPPING
// ============================================
const PRESET_COMPONENTS = {
  liquid: { Component: LiquidMetal, label: '💧 Liquid', description: 'Metallo liquido' },
  geometric: { Component: GeometricPulse, label: '⬡ Geometric', description: 'Esagoni pulsanti' },
  ribbons: { Component: FlowingRibbons, label: '🎀 Ribbons', description: 'Nastri fluidi' },
  constellation: { Component: ParticleConstellation, label: '✨ Stars', description: 'Costellazioni' },
  aurora: { Component: AuroraBorealis, label: '🌌 Aurora', description: 'Aurora boreale' },
};

// ============================================
// COMPONENTE PRINCIPALE
// ============================================
const NebulaBackground = ({ preset = 'liquid', className = '' }) => {
  const config = PRESET_COMPONENTS[preset] || PRESET_COMPONENTS.liquid;
  const { Component } = config;

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden -z-10 ${className}`}>
      <Component />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 15, 26, 0.4) 100%)'
        }}
      />
    </div>
  );
};

export const NEBULA_PRESETS = Object.keys(PRESET_COMPONENTS);
export const PRESET_INFO = PRESET_COMPONENTS;
export default NebulaBackground;
