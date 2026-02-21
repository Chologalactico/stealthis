import { useEffect, useRef, useState } from "react";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  delay?: number;
}

function FadeIn({ children, className = "", threshold = 0.15, delay = 0 }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Demo usage
export default function ScrollFadeDemo() {
  const cards = [
    { title: "Card One", body: "This card fades in when it enters the viewport." },
    { title: "Card Two", body: "Each card fades in independently as you scroll." },
    { title: "Card Three", body: "Powered by the native Intersection Observer API." },
    { title: "Card Four", body: "No libraries required — just React + CSS." },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Hero */}
      <section className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Scroll Fade In
        </h1>
        <p className="text-slate-400 text-lg">Scroll down to see elements fade in.</p>
      </section>

      {/* Cards */}
      <div className="max-w-2xl mx-auto p-8 flex flex-col gap-8">
        {cards.map((card, i) => (
          <FadeIn key={card.title} delay={i * 100}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
              <h2 className="text-sky-400 font-semibold text-xl mb-2">{card.title}</h2>
              <p className="text-slate-300">{card.body}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
