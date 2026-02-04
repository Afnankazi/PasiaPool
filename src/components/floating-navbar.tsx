"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import SignupForm from "@/components/signup-form";
import { GalleryVerticalEnd } from "lucide-react";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
export default function FloatingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Toggle mobile menu
  const toggleMenu = () => {
    if (isMenuOpen) {
      // Close menu animation
      if (mobileMenuRef.current) {
        gsap.to(mobileMenuRef.current, {
          duration: 0.4,
          y: -20,
          opacity: 0,
          ease: "power3.out",
          onComplete: () => setIsMenuOpen(false)
        });
      }
    } else {
      setIsMenuOpen(true);
      // Open menu animation (happens after state update and render)
      setTimeout(() => {
        if (mobileMenuRef.current) {
          gsap.fromTo(mobileMenuRef.current,
            { y: -20, opacity: 0 },
            { duration: 0.4, y: 0, opacity: 1, ease: "power3.out" }
          );
        }
      }, 10);
    }
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 max-w-7xl mx-auto"
    >
      <div
        className="w-full max-w-7xl mx-auto rounded-sm relative px-4 sm:px-8 py-4 border border-border shadow-lg"
        style={{
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(62, 207, 142, 0.1)`,
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5 rounded-sm"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #3ecf8e 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        ></div>

        <div className="relative flex items-center justify-between">
          {/* Logo */}
          <div ref={logoRef}>
            <LogoComponent />
          </div>

          {/* Desktop Navigation Links - Hidden on mobile */}
          <div ref={linksRef} className="hidden md:flex items-center space-x-6">
            <NavLink href="#home">Home</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How it works</NavLink>
          </div>

          {/* Action Buttons - Show Sign In button on mobile, hide Get Started button */}
          <div ref={buttonsRef} className="hidden md:flex items-center space-x-4">
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <ActionButton variant="outline">
                  Sign In
                </ActionButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                      <GalleryVerticalEnd className="size-4" />
                    </div>
                    <DialogTitle>PaisaPool</DialogTitle>
                  </div>
                </DialogHeader>
                <LoginForm />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
              <DialogTrigger asChild>
                <ActionButton variant="primary">
                  Get Started
                </ActionButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                      <GalleryVerticalEnd className="size-4" />
                    </div>
                    <DialogTitle>PaisaPool</DialogTitle>
                  </div>
                </DialogHeader>
                <SignupForm />
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile Sign In Button - Show only on mobile */}
          <div className="flex md:hidden items-center">
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <ActionButton variant="outline">
                  Sign In
                </ActionButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                      <GalleryVerticalEnd className="size-4" />
                    </div>
                    <DialogTitle>PaisaPool</DialogTitle>
                  </div>
                </DialogHeader>
                <LoginForm />
              </DialogContent>
            </Dialog>
          </div>

          {/* Hamburger Menu Button - Show only on mobile */}
          <button
            ref={hamburgerRef}
            className="flex md:hidden flex-col items-center justify-center ml-4 w-8 h-8 rounded-sm border border-border p-1"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="hamburger-top w-full h-0.5 bg-foreground mb-1.5 transform transition-all"></span>
            <span className="hamburger-middle w-full h-0.5 bg-foreground mb-1.5"></span>
            <span className="hamburger-bottom w-full h-0.5 bg-foreground transform transition-all"></span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="absolute left-0 right-0 top-full mt-2 border border-border rounded-sm shadow-lg bg-card backdrop-blur-md p-4 opacity-0"
            style={{ boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(62, 207, 142, 0.05)` }}
          >
            <div className="flex flex-col space-y-4">
              <MobileNavLink href="#home" onClick={toggleMenu}>Home</MobileNavLink>
              <MobileNavLink href="#features" onClick={toggleMenu}>Features</MobileNavLink>
              <MobileNavLink href="#how-it-works" onClick={toggleMenu}>How it works</MobileNavLink>
              <div className="pt-2 border-t border-border">
                <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
                  <DialogTrigger asChild>
                    <ActionButton variant="primary">
                      Get Started
                    </ActionButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <div className="flex items-center gap-2 justify-center mb-4">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                          <GalleryVerticalEnd className="size-4" />
                        </div>
                        <DialogTitle>PaisaPool</DialogTitle>
                      </div>
                    </DialogHeader>
                    <SignupForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}

function MobileNavLink({ href, children, onClick }: MobileNavLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  const handleMouseEnter = () => {
    if (linkRef.current) {
      gsap.to(linkRef.current, {
        duration: 0.2,
        color: "#3ecf8e",
        x: 3,
        ease: "power2.out"
      });
    }
  };

  const handleMouseLeave = () => {
    if (linkRef.current) {
      gsap.to(linkRef.current, {
        duration: 0.2,
        color: "#94a3b8",
        x: 0,
        ease: "power2.out"
      });
    }
  };

  return (
    <Link
      ref={linkRef}
      href={href}
      className="text-base font-medium text-muted-foreground py-2 px-1 rounded-sm hover:bg-muted/20 transition-colors"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function LogoComponent() {
  const logoIconRef = useRef<HTMLDivElement>(null);
  const logoTextRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (logoIconRef.current && logoTextRef.current) {
      gsap.to(logoIconRef.current, {
        duration: 0.3,
        scale: 1.1,
        rotation: 5,
        ease: "back.out(1.7)"
      });
      gsap.to(logoTextRef.current, {
        duration: 0.3,
        x: 2,
        color: "#3ecf8e",
        ease: "power2.out"
      });
    }
  };

  const handleMouseLeave = () => {
    if (logoIconRef.current && logoTextRef.current) {
      gsap.to(logoIconRef.current, {
        duration: 0.3,
        scale: 1,
        rotation: 0,
        ease: "power2.out"
      });
      gsap.to(logoTextRef.current, {
        duration: 0.3,
        x: 0,
        color: "inherit",
        ease: "power2.out"
      });
    }
  };

  return (
    <Link
      href="/"
      className="flex items-center space-x-2 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={logoIconRef}
        className="h-10 flex items-center justify-center border border-primary bg-primary rounded px-3"
      >
        <span className="text-primary-foreground font-bold text-lg">PaisaPool</span>
      </div>
    </Link>
  );
}

interface ActionButtonProps {
  href?: string;
  variant: "outline" | "primary";
  children: React.ReactNode;
  onClick?: () => void;
}

function ActionButton({ href, variant, children, onClick, ...props }: ActionButtonProps) {
  const buttonRef = useRef<HTMLElement>(null);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        duration: 0.2,
        scale: 1.05,
        y: -1,
        ease: "power2.out"
      });

      if (variant === "primary") {
        gsap.to(buttonRef.current, {
          duration: 0.2,
          boxShadow: "0 8px 25px rgba(62, 207, 142, 0.3)",
          ease: "power2.out"
        });
      }
    }
  };

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        duration: 0.2,
        scale: 1,
        y: 0,
        boxShadow: "none",
        ease: "power2.out"
      });
    }
  };

  const baseClasses = "px-4 py-2 text-sm font-medium rounded-sm cursor-pointer";
  const variantClasses = variant === "outline"
    ? "text-muted-foreground border border-border"
    : "bg-primary text-primary-foreground px-6";

  const commonProps = {
    className: `${baseClasses} ${variantClasses} ${variant === 'primary' && 'w-full text-center md:w-auto'}`,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: onClick,
    ...props
  };

  if (href) {
    return (
      <Link
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        {...commonProps}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      {...commonProps}
    >
      {children}
    </button>
  );
}

function NavLink({ href, children }: NavLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const underlineRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (linkRef.current && underlineRef.current) {
      gsap.to(linkRef.current, {
        duration: 0.2,
        color: "#3ecf8e",
        ease: "power2.out"
      });

      gsap.to(underlineRef.current, {
        duration: 0.3,
        width: "100%",
        ease: "power2.out"
      });
    }
  };

  const handleMouseLeave = () => {
    if (linkRef.current && underlineRef.current) {
      gsap.to(linkRef.current, {
        duration: 0.2,
        color: "#94a3b8",
        ease: "power2.out"
      });

      gsap.to(underlineRef.current, {
        duration: 0.3,
        width: "0%",
        ease: "power2.out"
      });
    }
  };

  return (
    <Link
      ref={linkRef}
      href={href}
      className="relative text-sm font-medium tracking-wide text-muted-foreground rounded-sm"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="relative z-10">{children}</span>
      <div
        ref={underlineRef}
        className="absolute bottom-0 left-0 h-px bg-primary w-0"
      ></div>
    </Link>
  );
}