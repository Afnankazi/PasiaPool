"use client";

import React, { useEffect, useRef } from "react";
import FloatingNavbar from "../floating-navbar";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "../ui/button";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const colors = {
  50: "#f0fdf4",
  100: "#dcfce7",
  200: "#3ecf8e",
  300: "#10b981",
  400: "#059669",
  500: "#047857",
  600: "#065f46",
  700: "#064e3b",
  800: "#1e293b",
  900: "#0f172a",
};

export default function MinimalHero() {
  const gradientRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const words = document.querySelectorAll<HTMLElement>(".word");
    const gridLines = document.querySelectorAll<SVGLineElement>(".grid-line");
    const detailDots = document.querySelectorAll<SVGCircleElement>(".detail-dot");
    const cornerElements = document.querySelectorAll<HTMLDivElement>(".corner-element");
    const floatingElements = document.querySelectorAll<HTMLDivElement>(".floating-element");

    // Set initial states
    gsap.set(words, { opacity: 0, y: 30, rotationX: -90 });
    gsap.set(gridLines, { strokeDasharray: "1000", strokeDashoffset: "1000" });
    gsap.set(detailDots, { scale: 0, opacity: 0 });
    gsap.set(cornerElements, { opacity: 0, scale: 0.8 });
    gsap.set(floatingElements, { opacity: 0, scale: 0 });

    // Main timeline for sequential animations
    const mainTl = gsap.timeline({ delay: 1 });

    // Animate words with stagger effect
    words.forEach((word) => {
      const delay = parseInt(word.getAttribute("data-delay") || "0", 10) / 1000;
      mainTl.to(word, {
        duration: 0.8,
        opacity: 1,
        y: 0,
        rotationX: 0,
        ease: "back.out(1.7)",
        onComplete: () => {
          // Add subtle hover animation
          word.addEventListener("mouseenter", () => {
            gsap.to(word, {
              duration: 0.3,
              scale: 1.05,
              color: "#3ecf8e",
              textShadow: "0 0 20px rgba(62, 207, 142, 0.5)",
              ease: "power2.out"
            });
          });

          word.addEventListener("mouseleave", () => {
            gsap.to(word, {
              duration: 0.3,
              scale: 1,
              color: "inherit",
              textShadow: "none",
              ease: "power2.out"
            });
          });
        }
      }, delay);
    });

    // Animate grid lines
    gridLines.forEach((line, index) => {
      mainTl.fromTo(line, {
        strokeDasharray: "1000",
        strokeDashoffset: "1000"
      }, {
        duration: 1.5,
        strokeDashoffset: "0",
        ease: "power2.inOut"
      }, index * 0.2 + 2);
    });

    // Animate detail dots
    detailDots.forEach((dot, index) => {
      mainTl.to(dot, {
        duration: 0.6,
        scale: 1,
        opacity: 1,
        ease: "back.out(2.5)"
      }, index * 0.1 + 3);
    });

    // Animate corner elements
    cornerElements.forEach((element, index) => {
      mainTl.to(element, {
        duration: 0.8,
        opacity: 1,
        scale: 1,
        ease: "back.out(1.7)"
      }, index * 0.1 + 4);
    });

    // Animate floating elements
    floatingElements.forEach((element, index) => {
      mainTl.to(element, {
        duration: 0.6,
        opacity: 1,
        scale: 1,
        ease: "power2.out"
      }, index * 0.2 + 5);

      // Add continuous floating animation
      gsap.to(element, {
        duration: 4 + index * 0.5,
        y: "random(-15, 15)",
        x: "random(-8, 8)",
        rotation: "random(-10, 10)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 6 + index * 0.3
      });
    });

    // Mouse gradient effect with GSAP
    const gradient = gradientRef.current;
    let mouseX = 0;
    let mouseY = 0;

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (gradient) {
        gsap.to(gradient, {
          duration: 0.3,
          left: mouseX - 192,
          top: mouseY - 192,
          opacity: 1,
          ease: "power2.out"
        });
      }
    }

    function onMouseLeave() {
      if (gradient) {
        gsap.to(gradient, {
          duration: 0.5,
          opacity: 0,
          ease: "power2.out"
        });
      }
    }

    // Enhanced click ripple effect
    function onClick(e: MouseEvent) {
      const ripple = document.createElement("div");
      ripple.style.position = "fixed";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      ripple.style.width = "4px";
      ripple.style.height = "4px";
      ripple.style.background = "rgba(62, 207, 142, 0.6)";
      ripple.style.borderRadius = "50%";
      ripple.style.transform = "translate(-50%, -50%)";
      ripple.style.pointerEvents = "none";
      ripple.style.zIndex = "9999";
      document.body.appendChild(ripple);

      gsap.fromTo(ripple,
        { scale: 0, opacity: 1 },
        {
          duration: 1,
          scale: 20,
          opacity: 0,
          ease: "power2.out",
          onComplete: () => ripple.remove()
        }
      );
    }

    // Scroll-triggered animations
    ScrollTrigger.create({
      trigger: heroRef.current,
      start: "top 80%",
      end: "bottom 20%",
      onEnter: () => {
        floatingElements.forEach((element, index) => {
          gsap.to(element, {
            duration: 0.5,
            opacity: 1,
            scale: 1,
            delay: index * 0.1,
            ease: "back.out(1.7)"
          });
        });
      }
    });

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("click", onClick);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div
      ref={heroRef}
      className="min-h-screen bg-background text-foreground font-primary overflow-hidden relative w-full"
    >
      <FloatingNavbar />

      <svg ref={gridRef} className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(62,207,142,0.08)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="0" y1="20%" x2="100%" y2="20%" className="grid-line" style={{ animationDelay: "0.5s" }} />
        <line x1="0" y1="80%" x2="100%" y2="80%" className="grid-line" style={{ animationDelay: "1s" }} />
        <line x1="20%" y1="0" x2="20%" y2="100%" className="grid-line" style={{ animationDelay: "1.5s" }} />
        <line x1="80%" y1="0" x2="80%" y2="100%" className="grid-line" style={{ animationDelay: "2s" }} />
        {/* Dots at line intersections */}
        <circle cx="20%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: "3s" }} fill={colors[200]} />
        <circle cx="80%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: "3.2s" }} fill={colors[200]} />
        <circle cx="20%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: "3.4s" }} fill={colors[200]} />
        <circle cx="80%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: "3.6s" }} fill={colors[200]} />
      </svg>

      {/* Corner elements */}
      <div className="corner-element top-8 left-8" style={{ animationDelay: "4s" }}>
        <div
          className="absolute top-0 left-0 w-2 h-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
      <div className="corner-element top-8 right-8" style={{ animationDelay: "4.2s" }}>
        <div
          className="absolute top-0 right-0 w-2 h-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
      <div className="corner-element bottom-8 left-8" style={{ animationDelay: "4.4s" }}>
        <div
          className="absolute bottom-0 left-0 w-2 h-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
      <div className="corner-element bottom-8 right-8" style={{ animationDelay: "4.6s" }}>
        <div
          className="absolute bottom-0 right-0 w-2 h-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>

      {/* Floating elements */}
      <div className="floating-element" style={{ top: "25%", left: "15%", animationDelay: "5s" }}></div>
      <div className="floating-element" style={{ top: "60%", left: "85%", animationDelay: "5.5s" }}></div>
      <div className="floating-element" style={{ top: "40%", left: "10%", animationDelay: "6s" }}></div>
      <div className="floating-element" style={{ top: "75%", left: "90%", animationDelay: "6.5s" }}></div>

      <div className="relative z-10 flex flex-col justify-between items-center px-8 py-12 md:px-16 md:py-28">
        {/* Top tagline */}
        <div className="text-center mt-22">
          <h2
            className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 text-primary"
          >
            <span className="word" data-delay="0">
              Welcome
            </span>
            <span className="word" data-delay="200">
              to
            </span>
            <span className="word" data-delay="400">
              <b>PaisaPool</b>
            </span>
            <span className="word" data-delay="600">
              —
            </span>
            <span className="word" data-delay="800">
              Splitting
            </span>
            <span className="word" data-delay="1000">
              expenses
            </span>
            <span className="word" data-delay="1200">
              made
            </span>
            <span className="word" data-delay="1400">
              simple.
            </span>
          </h2>
          <div
            className="mt-4 w-16 h-px opacity-30 bg-primary mx-auto"
          ></div>
        </div>

        {/* Main headline */}
        <div className="text-center max-w-5xl mx-auto">
          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-decoration text-foreground"
          >
            <div className="mb-4 md:mb-6">
              <span className="word" data-delay="1600">
                Track
              </span>
              <span className="word" data-delay="1750">
                shared
              </span>
              <span className="word" data-delay="1900">
                expenses
              </span>
              <span className="word" data-delay="2050">
                and
              </span>
              <span className="word" data-delay="2200">
                pool
              </span>
              <span className="word" data-delay="2350">
                debts
              </span>
              <span className="word" data-delay="2500">
                effortlessly.
              </span>
            </div>
            <div
              className="text-2xl md:text-3xl lg:text-4xl font-thin leading-relaxed text-primary"
            >
              <span className="word" data-delay="2600">
                Friends,
              </span>
              <span className="word" data-delay="2750">
                roommates,
              </span>
              <span className="word" data-delay="2900">
                travel
              </span>
              <span className="word" data-delay="3050">
                groups
              </span>
              <span className="word" data-delay="3200">
                —
              </span>
              <span className="word" data-delay="3350">
                share
              </span>
              <span className="word" data-delay="3500">
                expenses
              </span>
              <span className="word" data-delay="3650">
                without
              </span>
              <span className="word" data-delay="3800">
                the
              </span>
              <span className="word" data-delay="3950">
                awkwardness.
              </span>
            </div>
          </h1>
          <div
            className="absolute -left-8 top-1/2 w-4 h-px opacity-20 bg-primary"
            style={{
              animation: "word-appear 1s ease-out forwards",
              animationDelay: "3.5s",
            }}
          ></div>
          <div
            className="absolute -right-8 top-1/2 w-4 h-px opacity-20 bg-primary"
            style={{
              animation: "word-appear 1s ease-out forwards",
              animationDelay: "3.7s",
            }}
          ></div>
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-2">
          {/* <div
            className="mb-4 w-16 h-px opacity-30 bg-primary mx-auto"
          ></div> */}
          <h2
            className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 text-primary"
          >
            <span className="word" data-delay="4400">
              Group
            </span>
            <span className="word" data-delay="4550">
              management,
            </span>
            <span className="word" data-delay="4700">
              flexible
            </span>
            <span className="word" data-delay="4850">
              splitting,
            </span>
            <span className="word" data-delay="5000">
              clear
            </span>
            <span className="word" data-delay="5150">
              dashboard.
            </span>
          </h2>
          <div
            className="mt-6 flex justify-center space-x-4 opacity-0"
            style={{
              animation: "word-appear 1s ease-out forwards",
              animationDelay: "4.5s",
            }}
          >
            <div
              className="w-1 h-1 rounded-full opacity-40 bg-primary"
            ></div>
            <div
              className="w-1 h-1 rounded-full opacity-60 bg-primary"
            ></div>
            <div
              className="w-1 h-1 rounded-full opacity-40 bg-primary"
            ></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button className="h-12 mt-12 w-40 text-md" variant="default">Sign Up Now!</Button>
          <Button 
            className="h-12 mt-12 w-40 text-md" 
            variant="outline"
            onClick={() => window.location.href = '/test-finternet'}
          >
            Test Finternet
          </Button>
        </div>
      </div>
    </div>
  );
}