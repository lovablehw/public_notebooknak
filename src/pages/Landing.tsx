import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Heart, 
  ClipboardList, 
  BookOpen, 
  MessageCircle, 
  Lock, 
  UserCheck, 
  FileCheck, 
  TrendingUp,
  Lightbulb,
  Gift,
  Users,
  ChevronRight
} from "lucide-react";

// ============================================
// HUNGARIAN COPY - Edit text here
// ============================================
const COPY = {
  header: {
    brandName: "Jólléti Portál",
    signIn: "Bejelentkezés",
  },
  hero: {
    headline: "Egy egészségesebb jövő a saját történeteddel kezdődik.",
    subheadline: "Töltsd ki az életmód- és jólléti felméréseket, ismerd meg saját mintáidat, és járulj hozzá a prevenciós kutatásokhoz – biztonságos, átlátható környezetben.",
    primaryCta: "Fiók létrehozása",
    secondaryCta: "Bejelentkezés",
  },
  howItWorks: {
    title: "Hogyan működik?",
    tiles: [
      {
        icon: ClipboardList,
        title: "Felmérések kitöltése",
        subtitle: "SurveyStore",
        description: "Rövid, validált kérdőívek kitöltése – akár hangalapú bevitellel mobiltelefonon.",
      },
      {
        icon: Lightbulb,
        title: "Eredmények és ajánlások",
        subtitle: "HealthGuide",
        description: "Biztonságos, motivációs fókuszú visszajelzések – diagnózis és kezelés nélkül.",
      },
      {
        icon: BookOpen,
        title: "Saját egészségkönyv",
        subtitle: "HealthBook",
        description: "Kérdőív-előzmények és személyes jólléti adatok tárolása egy helyen.",
      },
      {
        icon: MessageCircle,
        title: "Folyamatos támogatás",
        subtitle: "HealthPass",
        description: "Opcionális asszisztens, emlékeztetők és heti reflexiók a fejlődésedhez.",
      },
    ],
  },
  dataTrust: {
    title: "Adatkezelés és bizalom",
    points: [
      {
        icon: Lock,
        text: "Adataid biztonságban vannak, minden használat hozzájáruláson alapul.",
      },
      {
        icon: UserCheck,
        text: "Nincs diagnózis vagy kezelés – kizárólag jólléti támogatás.",
      },
      {
        icon: FileCheck,
        text: "GDPR- és EU-AI-Act-megfelelőség.",
      },
      {
        icon: Shield,
        text: "Anonimizált adatok hozzájárulnak a prevenciós kutatásokhoz.",
      },
    ],
  },
  whyJoin: {
    title: "Miért érdemes csatlakozni?",
    benefits: [
      {
        icon: TrendingUp,
        text: "Életmódod jobb megértése.",
      },
      {
        icon: Heart,
        text: "Személyre szabható jólléti támogatás idővel.",
      },
      {
        icon: Gift,
        text: "Pontok gyűjtése felmérések kitöltéséért.",
      },
      {
        icon: Users,
        text: "Hozzájárulás a prevenciós kutatásokhoz.",
      },
    ],
    cta: "Csatlakozom",
  },
  disclaimer: {
    text: "Fontos: Ez a portál kizárólag kutatási és jólléti célokat szolgál. Nem minősül orvostechnikai eszköznek, és nem nyújt diagnózist, kezelési javaslatot vagy egészségügyi kockázatértékelést. Orvosi tanácsért mindig fordulj szakemberhez.",
  },
  footer: {
    copyright: "© 2025 Dohányzásmentes Jövő Kutatási Kezdeményezés",
    links: {
      privacy: "Adatkezelés",
      terms: "Felhasználási feltételek",
      contact: "Kapcsolat",
    },
  },
};

const Landing = () => {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">{COPY.header.brandName}</span>
        </div>
        <Link to="/login">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            {COPY.header.signIn}
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-16 pb-24">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6 text-balance leading-tight">
            {COPY.hero.headline}
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
            {COPY.hero.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto px-8">
                {COPY.hero.primaryCta}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                {COPY.hero.secondaryCta}
              </Button>
            </Link>
          </div>
        </div>

        {/* Abstract illustration */}
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
            {COPY.howItWorks.title}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {COPY.howItWorks.tiles.map((tile) => (
              <Card key={tile.title} className="shadow-card border-0 bg-card hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <tile.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{tile.title}</h3>
                  <p className="text-xs text-primary/70 mb-3">{tile.subtitle}</p>
                  <p className="text-sm text-muted-foreground">{tile.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Data & Trust */}
        <section className="mt-32">
          <h2 className="text-2xl font-medium text-center text-foreground mb-12">
            {COPY.dataTrust.title}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {COPY.dataTrust.points.map((point) => (
              <div key={point.text} className="flex items-start gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <point.icon className="h-5 w-5" />
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed pt-2">
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Join */}
        <section className="mt-32">
          <h2 className="text-2xl font-medium text-center text-foreground mb-12">
            {COPY.whyJoin.title}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            {COPY.whyJoin.benefits.map((benefit) => (
              <div key={benefit.text} className="text-center">
                <benefit.icon className="h-8 w-8 text-primary mx-auto mb-4 opacity-80" />
                <p className="text-sm text-muted-foreground">{benefit.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/register">
              <Button size="lg" className="px-10">
                {COPY.whyJoin.cta}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Important Notice */}
        <section className="mt-32 max-w-2xl mx-auto">
          <Card className="shadow-card border border-border/50 bg-accent/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">Fontos:</strong> {COPY.disclaimer.text.replace("Fontos: ", "")}
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>{COPY.footer.copyright}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {COPY.footer.links.privacy}
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              {COPY.footer.links.terms}
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              {COPY.footer.links.contact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
