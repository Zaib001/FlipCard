import { gsap } from "gsap";

export function mountNeonParticles(container) {
  const dots = Array.from(container.querySelectorAll(".bg-dot"));
  const tl = gsap.timeline({ repeat: -1, yoyo: true });
  dots.forEach((el, i) => {
    tl.to(el, {
      x: `random(-40,40)`,
      y: `random(-20,20)`,
      opacity: () => Math.random() * 0.6 + 0.2,
      duration: () => Math.random() * 4 + 3,
    }, i * 0.05);
  });
  return () => tl.kill();
}
