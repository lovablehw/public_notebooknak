import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Cookie, Shield, BarChart3, Megaphone } from "lucide-react";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Vissza a főoldalra
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cookie Szabályzat</h1>
              <p className="text-muted-foreground">Utoljára frissítve: 2026. január 16.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                Mi az a cookie?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p>
                A cookie-k (sütik) kis szöveges fájlok, amelyeket a böngésző tárol az Ön eszközén, 
                amikor meglátogat egy weboldalt. Ezek a fájlok segítenek a weboldal működésében, 
                a felhasználói élmény javításában és a látogatottsági statisztikák gyűjtésében.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Szükséges cookie-k
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Ezek a cookie-k elengedhetetlenek a weboldal alapvető funkcióinak működéséhez. 
                Nélkülük a weboldal nem tudna megfelelően működni.
              </p>
              <div className="rounded-lg border bg-muted/30 p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Cookie neve</th>
                      <th className="text-left py-2 font-medium">Cél</th>
                      <th className="text-left py-2 font-medium">Lejárat</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="py-2">cookie_consent</td>
                      <td className="py-2">Cookie beállítások tárolása</td>
                      <td className="py-2">1 év</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">sidebar:state</td>
                      <td className="py-2">Oldalsáv állapotának megjegyzése</td>
                      <td className="py-2">7 nap</td>
                    </tr>
                    <tr>
                      <td className="py-2">sb-*-auth-token</td>
                      <td className="py-2">Felhasználói munkamenet kezelése</td>
                      <td className="py-2">Munkamenet</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analitikai cookie-k
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Ezek a cookie-k segítenek megérteni, hogyan használják a látogatók a weboldalunkat. 
                Az összegyűjtött adatok anonimizáltak és csak statisztikai célokra használjuk fel.
              </p>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Jelenleg nem használunk külső analitikai szolgáltatásokat. 
                  Ha a jövőben bevezetünk ilyet, frissítjük ezt a szabályzatot.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Marketing cookie-k
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Ezeket a cookie-kat arra használjuk, hogy személyre szabott tartalmakat és 
                hirdetéseket jelenítsünk meg az Ön érdeklődésének megfelelően.
              </p>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Jelenleg nem használunk marketing cookie-kat. 
                  Ha a jövőben bevezetünk ilyet, frissítjük ezt a szabályzatot.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookie beállítások kezelése</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Bármikor módosíthatja a cookie beállításait az alábbi módokon:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>
                  <strong>Böngésző beállítások:</strong> A legtöbb böngészőben letilthatja vagy 
                  törölheti a cookie-kat a beállítások menüben.
                </li>
                <li>
                  <strong>Cookie banner:</strong> A weboldalon megjelenő cookie bannerben 
                  bármikor módosíthatja preferenciáit.
                </li>
                <li>
                  <strong>Helyi tárhely törlése:</strong> A böngésző fejlesztői eszközeiben 
                  törölheti a localStorage adatokat.
                </li>
              </ul>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("cookie_consent");
                  window.location.reload();
                }}
              >
                Cookie beállítások visszaállítása
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kapcsolat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ha kérdése van a cookie szabályzatunkkal kapcsolatban, kérjük, vegye fel velünk 
                a kapcsolatot az alábbi elérhetőségeken keresztül.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
