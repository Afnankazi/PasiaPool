"use client";

import React from "react";
import { UserPlus, Receipt, DollarSign } from "lucide-react";

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

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Group",
    description: "Start by creating a group and inviting friends, roommates, or travel companions. Everyone gets access to the shared expense tracker.",
    highlight: "Invite unlimited members"
  },
  {
    number: "02",
    icon: Receipt,
    title: "Add Expenses",
    description: "Upload receipts or manually add expenses. Our AI automatically extracts details, or you can split costs however you want.",
    highlight: "Smart receipt scanning"
  },
  {
    number: "03",
    icon: DollarSign,
    title: "Settle Debts",
    description: "View clear breakdowns of who owes what. Send payment requests or mark debts as settled with a simple tap.",
    highlight: "Crystal clear settlements"
  }
];

export default function HowItWorksSection() {
  return (
    <div className="min-h-screen bg-background text-foreground relative w-full py-20 md:py-32 overflow-hidden">
      {/* Grid Background */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="how-it-works-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(62,207,142,0.04)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#how-it-works-grid)" />
        
        {/* Connecting lines between steps */}
        <line x1="20%" y1="50%" x2="50%" y2="50%" stroke="rgba(62,207,142,0.2)" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="50%" y1="50%" x2="80%" y2="50%" stroke="rgba(62,207,142,0.2)" strokeWidth="1" strokeDasharray="5,5" />
        
        {/* Detail dots */}
        <circle cx="20%" cy="30%" r="1" fill={colors[200]} opacity="0.6" />
        <circle cx="50%" cy="30%" r="1" fill={colors[200]} opacity="0.6" />
        <circle cx="80%" cy="30%" r="1" fill={colors[200]} opacity="0.6" />
        <circle cx="20%" cy="70%" r="1" fill={colors[200]} opacity="0.6" />
        <circle cx="50%" cy="70%" r="1" fill={colors[200]} opacity="0.6" />
        <circle cx="80%" cy="70%" r="1" fill={colors[200]} opacity="0.6" />
      </svg>

      <div className="relative z-10 px-8 md:px-16 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 text-primary mb-4">
            How It Works
          </h2>
          <div className="w-16 h-px opacity-30 bg-primary mx-auto mb-8"></div>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-foreground max-w-4xl mx-auto">
            Split expenses in
            <span className="text-primary"> three simple steps</span>
          </h3>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            From creating groups to settling debts, Settle makes expense splitting effortless and transparent for everyone involved.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative">
                {/* Step Card */}
                <div className="relative">
                  {/* Step Number */}
                  <div className="flex items-center mb-8">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-background mr-4"
                      style={{ background: `linear-gradient(135deg, ${colors[300]}, ${colors[400]})` }}
                    >
                      {step.number}
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent"></div>
                  </div>

                  {/* Icon */}
                  <div className="mb-6">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${colors[200]}15, ${colors[300]}08)` }}
                    >
                      <IconComponent size={32} className="text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h4 className="text-2xl font-semibold text-foreground">
                      {step.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {step.description}
                    </p>
                    
                    {/* Highlight badge */}
                    <div className="inline-flex items-center">
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ 
                          background: `${colors[200]}20`, 
                          color: colors[600] 
                        }}
                      >
                        {step.highlight}
                      </div>
                    </div>
                  </div>

                  {/* Decorative dot */}
                  <div className="absolute -top-4 -right-4">
                    <div
                      className="w-2 h-2 rounded-full opacity-40"
                      style={{ background: colors[200] }}
                    ></div>
                  </div>
                </div>

                {/* Connection arrow for larger screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-24 -right-8 w-16 items-center justify-center">
                    <div className="w-8 h-px bg-gradient-to-r from-primary/40 to-primary/20"></div>
                    <div 
                      className="w-0 h-0 border-l-4 border-r-0 border-t-2 border-b-2 border-transparent ml-1"
                      style={{ borderLeftColor: `${colors[300]}60` }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 md:mt-24">
          <div className="w-16 h-px opacity-30 bg-primary mx-auto mb-8"></div>
          <p className="text-lg text-muted-foreground mb-8">
            Ready to simplify your group expenses?
          </p>
          <div className="flex justify-center space-x-4">
            <div className="w-1 h-1 rounded-full opacity-40" style={{ background: colors[200] }}></div>
            <div className="w-1 h-1 rounded-full opacity-60" style={{ background: colors[200] }}></div>
            <div className="w-1 h-1 rounded-full opacity-40" style={{ background: colors[200] }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
