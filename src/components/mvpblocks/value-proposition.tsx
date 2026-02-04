"use client";

import React from "react";
import { CheckCircle, TrendingUp, Clock, Heart } from "lucide-react";

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

const benefits = [
  {
    icon: Heart,
    title: "No More Awkwardness",
    description: "Eliminate uncomfortable money conversations. Crystal clear tracking means everyone knows exactly what they owe.",
    stat: "100%",
    statLabel: "Transparency"
  },
  {
    icon: Clock,
    title: "Save Time & Effort",
    description: "Stop manually calculating splits and chasing people for money. Automated tracking and smart notifications handle it all.",
    stat: "90%",
    statLabel: "Time Saved"
  },
  {
    icon: TrendingUp,
    title: "Better Relationships",
    description: "Keep friendships strong by removing money stress. Fair, transparent splitting builds trust in your group.",
    stat: "95%",
    statLabel: "User Satisfaction"
  },
  {
    icon: CheckCircle,
    title: "Complete Control",
    description: "Flexible splitting options, detailed expense history, and secure data management. You're always in control.",
    stat: "100%",
    statLabel: "Secure & Private"
  }
];

const testimonials = [
  {
    quote: "Finally, no more spreadsheets! Settle made our group trip so much easier to manage.",
    author: "Sarah Chen",
    role: "Travel Enthusiast"
  },
  {
    quote: "Living with roommates has never been this stress-free. Everyone knows what they owe instantly.",
    author: "Mike Rodriguez",
    role: "College Student"
  },
  {
    quote: "The receipt scanning feature is a game-changer. Saves us hours every month.",
    author: "Jessica Park",
    role: "Event Organizer"
  }
];

export default function ValuePropositionSection() {
  return (
    <div className="min-h-screen bg-background text-foreground relative w-full py-20 md:py-32 overflow-hidden">
      {/* Grid Background */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="value-prop-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(62,207,142,0.05)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#value-prop-grid)" />
        
        {/* Accent lines */}
        <line x1="0" y1="20%" x2="100%" y2="20%" stroke="rgba(62,207,142,0.08)" strokeWidth="1" />
        <line x1="0" y1="80%" x2="100%" y2="80%" stroke="rgba(62,207,142,0.08)" strokeWidth="1" />
        
        {/* Detail dots */}
        <circle cx="15%" cy="25%" r="1.5" fill={colors[200]} opacity="0.4" />
        <circle cx="85%" cy="25%" r="1.5" fill={colors[200]} opacity="0.4" />
        <circle cx="15%" cy="75%" r="1.5" fill={colors[200]} opacity="0.4" />
        <circle cx="85%" cy="75%" r="1.5" fill={colors[200]} opacity="0.4" />
        <circle cx="50%" cy="50%" r="2" fill={colors[300]} opacity="0.6" />
      </svg>

      <div className="relative z-10 px-8 md:px-16 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 text-primary mb-4">
            Why Choose Settle
          </h2>
          <div className="w-16 h-px opacity-30 bg-primary mx-auto mb-8"></div>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-foreground max-w-4xl mx-auto">
            The smart way to
            <span className="text-primary"> handle group expenses</span>
          </h3>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            Join thousands of users who have transformed how they split expenses. No more awkward conversations, no more manual calculations.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="relative group">
                {/* Card Background */}
                <div className="absolute inset-0 bg-card/30 backdrop-blur-sm border border-border/20 rounded-xl"></div>
                
                {/* Card Content */}
                <div className="relative p-8 flex items-start space-x-6">
                  {/* Icon */}
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${colors[200]}20, ${colors[300]}10)` }}
                  >
                    <IconComponent size={28} className="text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {benefit.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {benefit.description}
                    </p>
                    
                    {/* Stat */}
                    <div className="flex items-center space-x-3">
                      <div 
                        className="text-3xl font-bold"
                        style={{ color: colors[400] }}
                      >
                        {benefit.stat}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        {benefit.statLabel}
                      </div>
                    </div>
                  </div>

                  {/* Decorative dot */}
                  <div className="absolute top-4 right-4">
                    <div
                      className="w-1.5 h-1.5 rounded-full opacity-40"
                      style={{ background: colors[200] }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonials Section */}
        <div className="relative">
          {/* Testimonials Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-px opacity-30 bg-primary mx-auto mb-6"></div>
            <h4 className="text-2xl font-semibold text-foreground mb-4">
              Loved by thousands of users
            </h4>
            <p className="text-muted-foreground">
              See what our community says about Settle
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="relative">
                {/* Card Background */}
                <div className="absolute inset-0 bg-card/20 backdrop-blur-sm border border-border/20 rounded-lg"></div>
                
                {/* Card Content */}
                <div className="relative p-6">
                  {/* Quote */}
                  <div className="mb-4">
                    <div 
                      className="text-2xl font-bold mb-2"
                      style={{ color: colors[300] }}
                    >
                      &ldquo;
                    </div>
                    <p className="text-foreground leading-relaxed italic">
                      {testimonial.quote}
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-background"
                      style={{ background: `linear-gradient(135deg, ${colors[300]}, ${colors[400]})` }}
                    >
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {testimonial.author}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>

                  {/* Decorative element */}
                  <div className="absolute top-4 right-4">
                    <div
                      className="w-1 h-1 rounded-full opacity-40"
                      style={{ background: colors[200] }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-16 md:mt-20">
          <div className="w-16 h-px opacity-30 bg-primary mx-auto mb-8"></div>
          <p className="text-lg text-muted-foreground mb-8">
            Ready to transform how you handle group expenses?
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
