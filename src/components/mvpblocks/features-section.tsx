"use client";

import React from "react";
import { Users, Receipt, Calculator, Shield, Smartphone, Zap } from "lucide-react";

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

export default function FeaturesSection() {
  return (
    <div
      className="min-h-screen bg-background text-foreground relative w-full py-20 md:py-32 overflow-hidden"
    >
      {/* Grid Background */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="features-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(62,207,142,0.06)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#features-grid)" />
        <line x1="0" y1="25%" x2="100%" y2="25%" className="features-grid-line" stroke="rgba(62,207,142,0.1)" strokeWidth="0.5" />
        <line x1="0" y1="75%" x2="100%" y2="75%" className="features-grid-line" stroke="rgba(62,207,142,0.1)" strokeWidth="0.5" />
        <line x1="20%" y1="0" x2="20%" y2="100%" className="features-grid-line" stroke="rgba(62,207,142,0.1)" strokeWidth="0.5" />
        <line x1="80%" y1="0" x2="80%" y2="100%" className="features-grid-line" stroke="rgba(62,207,142,0.1)" strokeWidth="0.5" />
        
        {/* Detail dots */}
        <circle cx="25%" cy="25%" r="1.5" className="features-detail-dot" fill={colors[200]} />
        <circle cx="75%" cy="25%" r="1.5" className="features-detail-dot" fill={colors[200]} />
        <circle cx="25%" cy="75%" r="1.5" className="features-detail-dot" fill={colors[200]} />
        <circle cx="75%" cy="75%" r="1.5" className="features-detail-dot" fill={colors[200]} />
        <circle cx="50%" cy="50%" r="1" className="features-detail-dot" fill={colors[300]} />
      </svg>

      <div className="relative z-10 px-8 md:px-16 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <h2
            className="features-title text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 text-primary mb-4"
          >
            Core Features
          </h2>
          <div className="w-16 h-px opacity-30 bg-primary mx-auto mb-8"></div>
          <h3
            className="features-subtitle text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-foreground max-w-4xl mx-auto"
          >
            Everything you need to split expenses
            <span className="text-primary"> seamlessly</span>
          </h3>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
          {/* Group Management - Large Card */}
          <div className="group relative col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm rounded-2xl border border-border/40 transition-all duration-500 group-hover:border-primary/60 group-hover:shadow-[0_0_40px_rgba(62,207,142,0.2)]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            <div className="relative p-8 lg:p-12 h-full flex flex-col justify-between min-h-[280px] z-10">
              <div>
                <div className="mb-8">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${colors[200]}25, ${colors[300]}15)` }}
                  >
                    <Users size={32} className="text-primary" />
                  </div>
                </div>
                <h4 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                  Group Management
                </h4>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Create and manage expense groups for friends, roommates, travel companions, or any shared activities.
                </p>
              </div>
              <div className="absolute top-6 right-6">
                <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-300"></div>
              </div>
            </div>
          </div>

          {/* Smart Receipt Scanning */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm rounded-2xl border border-border/40 transition-all duration-500 group-hover:border-primary/60 group-hover:shadow-[0_0_25px_rgba(62,207,142,0.15)]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-800"></div>
            <div className="relative p-6 h-full flex flex-col min-h-[200px] z-10">
              <div className="mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${colors[200]}20, ${colors[300]}10)` }}
                >
                  <Receipt size={24} className="text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  Smart Receipt Scanning
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Upload receipts and let AI extract expense details automatically.
                </p>
              </div>
              <div className="absolute top-4 right-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary/60 transition-colors duration-300"></div>
              </div>
            </div>
          </div>

          {/* Flexible Splitting */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm rounded-2xl border border-border/40 transition-all duration-500 group-hover:border-primary/60 group-hover:shadow-[0_0_25px_rgba(62,207,142,0.15)]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-800"></div>
            <div className="relative p-6 h-full flex flex-col min-h-[200px] z-10">
              <div className="mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${colors[200]}20, ${colors[300]}10)` }}
                >
                  <Calculator size={24} className="text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  Flexible Splitting
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Split expenses equally, by percentage, or custom amounts.
                </p>
              </div>
              <div className="absolute top-4 right-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary/60 transition-colors duration-300"></div>
              </div>
            </div>
          </div>

          {/* Secure & Private - Wide Card */}
          <div className="group relative col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm rounded-2xl border border-border/40 transition-all duration-500 group-hover:border-primary/60 group-hover:shadow-[0_0_30px_rgba(62,207,142,0.18)]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-900"></div>
            <div className="relative p-6 lg:p-8 h-full flex items-center min-h-[180px] z-10">
              <div className="flex items-center space-x-6 w-full">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${colors[200]}25, ${colors[300]}15)` }}
                >
                  <Shield size={28} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl lg:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    Secure & Private
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Your financial data is encrypted and secure. We prioritize your privacy above everything else.
                  </p>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-300"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="mt-16 md:mt-24 flex justify-center">
          <div className="flex space-x-2">
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
      </div>
    </div>
  );
}
