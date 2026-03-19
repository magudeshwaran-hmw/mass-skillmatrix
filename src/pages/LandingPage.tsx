import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, BarChart3, Users, TrendingUp, Shield } from 'lucide-react';

const steps = [
  { icon: Upload, title: 'Upload Resume', desc: 'AI analyzes your resume to detect skills automatically' },
  { icon: BarChart3, title: 'Rate Skills', desc: 'Review and self-rate across 32 skills in 7 categories' },
  { icon: Shield, title: 'Manager Validates', desc: 'Your manager reviews and validates your ratings' },
  { icon: TrendingUp, title: 'Track Growth', desc: 'Get personalized growth plans with progress tracking' },
];

const stats = [
  { value: '32', label: 'Skills Tracked' },
  { value: '7', label: 'Categories' },
  { value: '3', label: 'Proficiency Levels' },
  { value: '100%', label: 'Visibility' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sidebar-accent/50 text-secondary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-slow" />
              Zensar Quality Engineering
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-sidebar-foreground leading-tight mb-6">
              Skill Matrix &<br />
              <span className="text-secondary">Capability Assessment</span>
            </h1>
            <p className="text-lg text-sidebar-foreground/70 mb-10 max-w-xl">
              Map your testing expertise, identify gaps, and accelerate your growth with AI-powered skill analysis across the entire QE team.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" onClick={() => navigate('/login')} className="gradient-secondary text-secondary-foreground shadow-elevated">
                Get Started <ArrowRight size={18} />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/login')} className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(s => (
              <div key={s.label} className="text-center animate-slide-up">
                <div className="text-3xl font-display font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="text-3xl font-display font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-md mx-auto">Four simple steps to complete capability mapping</p>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative bg-card rounded-xl p-6 shadow-card border border-border animate-slide-up group hover:shadow-elevated transition-shadow" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <step.icon size={20} className="text-primary-foreground" />
                </div>
                <div className="absolute top-4 right-4 text-5xl font-display font-bold text-muted/50">{i + 1}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-display font-bold text-sidebar-foreground mb-4">Ready to Map Your Skills?</h2>
          <p className="text-sidebar-foreground/70 mb-8 max-w-md mx-auto">Join the Zensar QE team in building a comprehensive skill inventory</p>
          <Button variant="hero" size="lg" onClick={() => navigate('/login')} className="gradient-secondary text-secondary-foreground">
            Start Assessment <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2025 Zensar Technologies. Quality Engineering Division. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
