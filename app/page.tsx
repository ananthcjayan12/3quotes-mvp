import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Home,
  Laptop,
  Calendar,
  Car,
  Flower2,
  Briefcase
} from "lucide-react";

const categories = [
  { name: "Home Reno", icon: Home, href: "/onboarding?category=residential" },
  { name: "Tech Services", icon: Laptop, href: "/onboarding?category=tech" },
  { name: "Events", icon: Calendar, href: "/onboarding?category=events" },
  { name: "Automotive", icon: Car, href: "/onboarding?category=automotive" },
  { name: "Wellness", icon: Flower2, href: "/onboarding?category=wellness" },
  { name: "Business", icon: Briefcase, href: "/onboarding?category=business" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold text-slate-900">3Quotes</div>
        <Button variant="outline" className="rounded-md text-slate-600 border-slate-300">
          Sign In
        </Button>
      </header>

      <main className="flex flex-col items-center justify-center pt-20 pb-20 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 tracking-tight">
          Get Instant Service Quotes <br /> using AI.
        </h1>
        <p className="text-slate-500 text-lg mb-16">
          Select a category to get started.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full px-4">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href} className="w-full">
              <Card className="flex flex-col items-center justify-center p-8 hover:shadow-lg transition-shadow cursor-pointer border-slate-100 h-48 group">
                <cat.icon className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                <span className="font-medium text-slate-900">{cat.name}</span>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
