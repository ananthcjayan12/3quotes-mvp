import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Home,
  Laptop,
  Calendar,
  Car,
  Flower2,
  Briefcase,
  Settings,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Clock
} from "lucide-react";

const categories = [
  { name: "Home Renovation", icon: Home, href: "/onboarding?category=residential", color: "from-orange-500 to-amber-500" },
  { name: "Tech Services", icon: Laptop, href: "/onboarding?category=tech", color: "from-blue-500 to-cyan-500" },
  { name: "Events", icon: Calendar, href: "/onboarding?category=events", color: "from-pink-500 to-rose-500" },
  { name: "Automotive", icon: Car, href: "/onboarding?category=automotive", color: "from-slate-600 to-slate-800" },
  { name: "Wellness", icon: Flower2, href: "/onboarding?category=wellness", color: "from-green-500 to-emerald-500" },
  { name: "Business", icon: Briefcase, href: "/onboarding?category=business", color: "from-violet-500 to-purple-500" },
];

const features = [
  { icon: Zap, title: "Instant Quotes", description: "Get accurate estimates in seconds" },
  { icon: Sparkles, title: "AI-Powered", description: "Smart analysis of your requirements" },
  { icon: Shield, title: "Reliable", description: "Trusted by thousands of users" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-hero text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="flex items-center justify-between px-6 md:px-8 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">3Q</span>
            </div>
            <span className="text-xl font-bold text-slate-900">3Quotes</span>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 md:px-8">
        <section className="flex flex-col items-center justify-center pt-16 md:pt-24 pb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Quotations</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 tracking-tight leading-tight">
            Get Instant Service
            <br />
            <span className="gradient-text">Quotes using AI</span>
          </h1>

          <p className="text-slate-500 text-lg md:text-xl text-center max-w-2xl mb-8">
            Answer a few questions and receive accurate, professional quotes
            for any service in seconds. No waiting, no hassle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/onboarding">
              <Button className="btn-shine h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3 text-slate-600">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{feature.title}</div>
                  <div className="text-sm">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="pb-24 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Choose Your Service Category
            </h2>
            <p className="text-slate-500">
              Select a category to begin your personalized quote journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto stagger-children">
            {categories.map((cat) => (
              <Link key={cat.name} href={cat.href} className="block">
                <Card className="card-hover relative overflow-hidden p-6 h-44 border border-slate-200/80 bg-white/80 backdrop-blur-sm cursor-pointer group">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cat.color} opacity-10 rounded-full -translate-y-16 translate-x-16 group-hover:opacity-20 transition-opacity`} />

                  <div className="relative z-10 h-full flex flex-col">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>

                    <h3 className="font-semibold text-lg text-slate-900 mb-1">{cat.name}</h3>
                    <p className="text-sm text-slate-500 mb-3">Get instant quotes</p>

                    <div className="mt-auto flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Start Quote</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Trust Section */}
        <section className="pb-20 text-center">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Average quote time: 2 minutes</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-xs">3Q</span>
            </div>
            <span>© 2025 3Quotes. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/settings" className="hover:text-slate-900 transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
