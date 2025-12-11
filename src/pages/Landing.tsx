import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Heart, Users, ChevronRight } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">Community Wellbeing</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-16 pb-24">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6 text-balance">
            Your wellbeing journey, <br />
            <span className="font-medium text-primary">contributing to research</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
            Join our community-driven research initiative. Share your experiences through 
            simple questionnaires, track your progress, and help advance wellbeing research 
            while earning rewards along the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Join the Community
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                Learn More
              </Button>
            </a>
          </div>
        </div>

        {/* Abstract illustration placeholder */}
        <div className="max-w-md mx-auto mt-16 opacity-60">
          <svg viewBox="0 0 400 120" className="w-full text-primary">
            <path
              d="M0 60 Q100 20 200 60 Q300 100 400 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy="40" r="4" fill="currentColor" opacity="0.6" />
            <circle cx="200" cy="60" r="6" fill="currentColor" opacity="0.8" />
            <circle cx="300" cy="80" r="4" fill="currentColor" opacity="0.6" />
          </svg>
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="mt-32">
          <h2 className="text-2xl font-medium text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Register",
                description: "Create your account with basic profile information to get started.",
              },
              {
                step: "2",
                title: "Consent",
                description: "Review and provide informed consent for research participation.",
              },
              {
                step: "3",
                title: "Participate",
                description: "Complete questionnaires at your own pace and earn points.",
              },
            ].map((item) => (
              <Card key={item.step} className="shadow-card border-0 bg-card">
                <CardContent className="pt-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 font-medium">
                    {item.step}
                  </div>
                  <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="mt-32">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Shield,
                title: "GDPR Compliant",
                description: "Your data is protected under EU regulations with full transparency.",
              },
              {
                icon: Heart,
                title: "Wellbeing Focused",
                description: "Non-medical, motivational approach to support your journey.",
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Your contributions help advance research for everyone.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <item.icon className="h-8 w-8 text-primary mx-auto mb-4 opacity-80" />
                <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Important Notice */}
        <section className="mt-32 max-w-2xl mx-auto">
          <Card className="shadow-card border border-border/50 bg-accent/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">Important:</strong> This portal is designed for 
                research and wellbeing purposes only. It is not a medical device and does not provide 
                diagnosis, treatment recommendations, or health risk assessments. Always consult 
                healthcare professionals for medical advice.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 Community Wellbeing Research Initiative</p>
          <div className="flex gap-6">
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
