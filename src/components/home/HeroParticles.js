'use client';
import { useEffect, useRef } from 'react';

export default function HeroParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    const particleCount = 40;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height + canvas.height; // start off-screen bottom
        this.size = Math.random() * 2 + 1;
        this.speedY = -(Math.random() * 0.7 + 0.3); // ascend slowly
        this.speedX = Math.random() * 0.4 - 0.2;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.fade = Math.random() * 0.005 + 0.002;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        
        // slowly fade out as it goes up
        if (this.y < canvas.height * 0.2) {
          this.opacity -= this.fade;
        }

        if (this.y < 0 || this.opacity <= 0) {
          this.reset();
          this.y = canvas.height + Math.random() * 20;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(214, 175, 55, ${this.opacity})`; // gold color
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFE494';
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
      // distribute them across screen height on start
      particles[i].y = Math.random() * canvas.height;
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 0; // reset shadow for clearRect
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
