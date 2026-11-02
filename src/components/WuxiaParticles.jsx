import React, { useEffect, useRef } from "react";

export function WuxiaParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animId = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const count = width < 768 ? 22 : 42;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      isPetal: Math.random() < 0.45,
      size: Math.random() * 4.2 + 2.2,
      speedY: Math.random() * 0.45 + 0.16,
      speedX: (Math.random() - 0.5) * 0.45,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.018,
      alpha: Math.random() * 0.48 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Interactive click-burst sparks for Wuxia feel
    const sparks = [];
    const handlePointerDown = (e) => {
      const target = e.target;
      if (!target || !target.closest("button, a, [role='tab'], summary")) return;
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.4;
        const speed = Math.random() * 2.8 + 1.2;
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.4,
          size: Math.random() * 2.8 + 1.4,
          alpha: 0.95,
          isJade: i % 2 === 0,
        });
      }
    };
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.pulse += 0.022;
        if (p.isPetal) {
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(p.pulse) * 0.28;
          p.angle += p.spin;
          if (p.y > height + 20) {
            p.y = -18;
            p.x = Math.random() * width;
          }
          if (p.x > width + 20) p.x = -18;
          if (p.x < -20) p.x = width + 18;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.globalAlpha = p.alpha;
          const grad = ctx.createRadialGradient(0, 0, 0.5, 0, 0, p.size * 1.6);
          grad.addColorStop(0, "#ffd9e8");
          grad.addColorStop(0.65, "#ff94b8");
          grad.addColorStop(1, "rgba(255, 148, 184, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.45, p.size * 0.78, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          p.y -= p.speedY * 0.65;
          p.x += Math.cos(p.pulse) * 0.24;
          if (p.y < -20) {
            p.y = height + 18;
            p.x = Math.random() * width;
          }
          const glowAlpha = p.alpha * (0.55 + 0.45 * Math.sin(p.pulse * 1.5));
          ctx.save();
          ctx.globalAlpha = glowAlpha;
          const r = p.size * 2.2;
          const grad = ctx.createRadialGradient(p.x, p.y, 0.2, p.x, p.y, r);
          grad.addColorStop(0, "#fff6d6");
          grad.addColorStop(0.45, "#f5d48f");
          grad.addColorStop(1, "rgba(92, 225, 214, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.04;
        s.alpha -= 0.032;
        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.isJade ? "#5ce1d6" : "#f5d48f";
        ctx.shadowColor = s.isJade ? "#5ce1d6" : "#f5d48f";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
