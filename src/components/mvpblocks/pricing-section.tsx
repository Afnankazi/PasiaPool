"use client";

import React from "react";
import { Check, Star, Zap } from "lucide-react";
import { Button } from "../ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

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

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for small groups and casual expense sharing",
    features: [
      "Up to 5 group members",
      "Unlimited expenses",
      "Basic receipt scanning",
      "Simple expense splitting",
      "Mobile app access",
      "Email notifications"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "per month",
    description: "Ideal for larger groups and frequent travelers",
    features: [
      "Unlimited group members",
      "Advanced receipt scanning",
      "Custom splitting rules",
      "Expense categories & tags",
      "Export to CSV/PDF",
      "Priority email support",
      "Group expense analytics",
      "Multiple currency support"
    ],
    buttonText: "Start Pro Trial",
    buttonVariant: "default" as const,
    popular: true
  },
  {
    name: "Team",
    price: "$12.99",
    period: "per month",
    description: "Built for organizations and large groups",
    features: [
      "Everything in Pro",
      "Admin controls & permissions",
      "Advanced analytics dashboard",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "99.9% uptime SLA",
      "Phone & chat support"
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    popular: false
  }
];

const faqs = [
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the next billing cycle. No penalties or hidden fees."
  },
  {
    question: "Is there a free trial for Pro?",
    answer: "Absolutely! Get 14 days free when you start your Pro subscription. No credit card required for the trial. You can cancel anytime during the trial without being charged."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Team plans. All payments are secure and encrypted using industry-standard SSL."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime from your account settings. You'll continue to have access until the end of your billing period. We also offer a 30-day money-back guarantee."
  },
  {
    question: "How does group member limits work?",
    answer: "The Free plan supports up to 5 members per group. Pro and Team plans have unlimited members. If you exceed the Free plan limit, you'll be prompted to upgrade."
  },
  {
    question: "Is my financial data secure?",
    answer: "Absolutely. We use bank-level encryption (AES-256) and never store your payment information. All data is encrypted in transit and at rest. We're also SOC 2 Type II compliant."
  }
];

export default function PricingSection() {
  return (
    <div className="min-h-screen bg-background text-foreground relative w-full py-20 md:py-32 overflow-hidden">
      {/* Grid Background */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pricing-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(62,207,142,0.04)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pricing-grid)" />
        
        {/* Accent lines */}
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="rgba(62,207,142,0.06)" strokeWidth="1" />
        <line x1="0" y1="70%" x2="100%" y2="70%" stroke="rgba(62,207,142,0.06)" strokeWidth="1" />
        
        {/* Detail dots */}
        <circle cx="20%" cy="20%" r="1" fill={colors[200]} opacity="0.3" />
        <circle cx="50%" cy="20%" r="1" fill={colors[200]} opacity="0.3" />
        <circle cx="80%" cy="20%" r="1" fill={colors[200]} opacity="0.3" />
        <circle cx="20%" cy="80%" r="1" fill={colors[200]} opacity="0.3" />
        <circle cx="50%" cy="80%" r="1" fill={colors[200]} opacity="0.3" />
        <circle cx="80%" cy="80%" r="1" fill={colors[200]} opacity="0.3" />
      </svg>

      <div className="relative z-10 px-8 md:px-16 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 text-primary mb-4">
            Simple Pricing
          </h2>
          <div className="w-16 h-px opacity-30 bg-primary mx-auto mb-8"></div>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-foreground max-w-4xl mx-auto">
            Choose the plan that
            <span className="text-primary"> fits your needs</span>
          </h3>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            Start for free and upgrade as your group grows. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {plans.map((plan, index) => (
            <div key={index} className="relative group">
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div 
                    className="px-4 py-2 rounded-full text-sm font-medium text-background flex items-center space-x-1"
                    style={{ background: `linear-gradient(135deg, ${colors[300]}, ${colors[400]})` }}
                  >
                    <Star size={14} />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              {/* Card Background */}
              <div 
                className={`absolute inset-0 backdrop-blur-sm border rounded-xl transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-card/80 border-primary/30 group-hover:border-primary/50' 
                    : 'bg-card/50 border-border/30 group-hover:border-border/50'
                }`}
              ></div>
              
              {/* Card Content */}
              <div className="relative p-8 h-full flex flex-col">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    {plan.name}
                  </h4>
                  <div className="mb-4">
                    <span 
                      className="text-4xl font-bold"
                      style={{ color: plan.popular ? colors[400] : colors[300] }}
                    >
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="flex-1 mb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${colors[200]}20` }}
                        >
                          <Check size={12} className="text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="text-center">
                  <Button 
                    variant={plan.buttonVariant}
                    className={`w-full h-12 text-sm font-medium ${
                      plan.popular ? 'bg-primary hover:bg-primary/90' : ''
                    }`}
                  >
                    {plan.popular && <Zap size={16} className="mr-2" />}
                    {plan.buttonText}
                  </Button>
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
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <div className="w-16 h-px opacity-30 bg-primary mx-auto mb-6"></div>
            <h4 className="text-2xl font-semibold text-foreground mb-4">
              Get all your questions answered here
            </h4>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions about our pricing or features? Find quick answers below or contact our support team.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="relative group border-0"
                >
                  {/* FAQ Card Background */}
                  <div className="absolute inset-0 bg-card/40 backdrop-blur-sm border border-border/30 rounded-lg group-hover:border-border/50 transition-all duration-300"></div>
                  
                  {/* Decorative dot */}
                  <div className="absolute top-6 right-6 z-10">
                    <div
                      className="w-1 h-1 rounded-full opacity-40"
                      style={{ background: colors[200] }}
                    ></div>
                  </div>

                  <AccordionTrigger className="relative z-10 px-6 py-6 text-left font-medium text-foreground hover:text-primary hover:no-underline transition-colors duration-300 [&[data-state=open]>svg]:rotate-180">
                    {faq.question}
                  </AccordionTrigger>
                  
                  <AccordionContent className="relative z-10 px-6 pb-6">
                    <div 
                      className="w-full h-px mb-4 opacity-20"
                      style={{ background: colors[200] }}
                    ></div>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-16">
          <div className="w-16 h-px opacity-30 bg-primary mx-auto mb-8"></div>
          <p className="text-muted-foreground mb-8">
            Questions about pricing? <span className="text-primary cursor-pointer hover:underline">Contact our team</span>
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
