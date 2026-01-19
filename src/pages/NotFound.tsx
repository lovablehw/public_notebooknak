import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Check if this is a button configuration pending state
  const isButtonConfigPending = location.state?.buttonConfigPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold">404</CardTitle>
          <CardDescription className="text-lg">
            {isButtonConfigPending ? (
              <>Az oldal nem található. A gomb konfigurációja még folyamatban van.</>
            ) : (
              <>Hoppá! Az oldal nem található</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isButtonConfigPending ? (
            <p className="text-center text-muted-foreground text-sm">
              A kérdőív gombjának URL-je még nincs beállítva. Kérjük, forduljon a rendszergazdához a beállításhoz.
            </p>
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              A keresett oldal nem létezik, vagy nem rendelkezik hozzáférési jogosultsággal.
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild variant="default" className="gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                Főoldal
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/healthbook">
                <Settings className="h-4 w-4" />
                Egészségkönyv
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;