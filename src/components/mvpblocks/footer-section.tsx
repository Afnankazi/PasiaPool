"use client";

import React from "react";
import { Mail, Phone, MapPin, Github, Twitter, Linkedin, Instagram } from "lucide-react";
import { Button } from "../ui/button";

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

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "API Documentation", href: "#" },
    { name: "Integrations", href: "#" }
  ],
  company: [
    { name: "About Us", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press Kit", href: "#" },
    { name: "Contact", href: "#" }
  ],
  support: [
    { name: "Help Center", href: "#" },
    { name: "Community", href: "#" },
    { name: "System Status", href: "#" },
    { name: "Report a Bug", href: "#" },
    { name: "Feature Requests", href: "#" }
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
    { name: "GDPR", href: "#" },
    { name: "Security", href: "#" }
  ]
};

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
  { name: "GitHub", icon: Github, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" }
];

export default function FooterSection() {
  return (
    <footer className="bg-background text-foreground relative w-full border-t border-border/30">
      {/* Grid Background */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="footer-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(62,207,142,0.03)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#footer-grid)" />
        
        {/* Subtle accent line */}
        <line x1="0" y1="40%" x2="100%" y2="40%" stroke="rgba(62,207,142,0.05)" strokeWidth="1" />
        
        {/* Detail dots */}
        <circle cx="10%" cy="20%" r="0.5" fill={colors[200]} opacity="0.2" />
        <circle cx="90%" cy="20%" r="0.5" fill={colors[200]} opacity="0.2" />
        <circle cx="10%" cy="80%" r="0.5" fill={colors[200]} opacity="0.2" />
        <circle cx="90%" cy="80%" r="0.5" fill={colors[200]} opacity="0.2" />
      </svg>

      <div className="relative z-10 px-8 md:px-16 max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="py-16 md:py-20">
          {/* Newsletter Section */}
          <div className="text-center mb-16">
            <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Stay updated with <span className="text-primary">Settle</span>
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get the latest updates, tips, and exclusive features delivered to your inbox.
            </p>
            
            {/* Newsletter Signup */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-card/50 border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <Button className="h-12 px-6 bg-primary hover:bg-primary/90">
                Subscribe
              </Button>
            </div>
          </div>

          {/* Footer Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-foreground mb-2">
                  Settle
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The smart way to split expenses with friends, roommates, and travel groups. No more awkward money conversations.
                </p>
              </div>
              
              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <Mail size={16} className="text-primary" />
                  <span>hello@settle.app</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <Phone size={16} className="text-primary" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <MapPin size={16} className="text-primary" />
                  <span>San Francisco, CA</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className="w-8 h-8 rounded-full bg-card/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors duration-300"
                      aria-label={social.name}
                    >
                      <IconComponent size={16} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h5 className="font-semibold text-foreground mb-4">Product</h5>
              <ul className="space-y-3">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h5 className="font-semibold text-foreground mb-4">Company</h5>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h5 className="font-semibold text-foreground mb-4">Support</h5>
              <ul className="space-y-3">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h5 className="font-semibold text-foreground mb-4">Legal</h5>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/30 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <p className="text-sm text-muted-foreground">
                © 2025 Settle. All rights reserved.
              </p>
              <div className="flex space-x-1">
                <div
                  className="w-1 h-1 rounded-full opacity-40"
                  style={{ background: colors[200] }}
                ></div>
                <div
                  className="w-1 h-1 rounded-full opacity-60"
                  style={{ background: colors[200] }}
                ></div>
                <div
                  className="w-1 h-1 rounded-full opacity-40"
                  style={{ background: colors[200] }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Made with ❤️ for better group experiences</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
