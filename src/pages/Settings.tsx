import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Heart, ArrowLeft, Shield, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { userConsent, withdrawConsent, loading } = useConsent();
  const [withdrawing, setWithdrawing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleWithdrawConsent = async () => {
    setWithdrawing(true);
    const { error } = await withdrawConsent();
    setWithdrawing(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to withdraw consent. Please try again.",
      });
    } else {
      toast({
        title: "Consent withdrawn",
        description: "Your consent has been withdrawn. You will be signed out.",
      });
      await signOut();
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">Community Wellbeing</span>
        </div>
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-light text-foreground mb-8 animate-fade-in">Settings</h1>

        {/* Account Info */}
        <Card className="shadow-card border-0 mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="text-foreground">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent Management */}
        <Card className="shadow-card border-0 mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Consent Management</CardTitle>
            </div>
            <CardDescription>
              Manage your research participation consent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userConsent ? (
              <div className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Consent given</span>
                    <span className="text-foreground">
                      {new Date(userConsent.consented_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Research participation</span>
                    <span className="text-foreground">
                      {userConsent.research_participation ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Health data processing</span>
                    <span className="text-foreground">
                      {userConsent.health_data_processing ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Communications</span>
                    <span className="text-foreground">
                      {userConsent.communication_preferences ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Withdraw Consent
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Withdraw your consent?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will withdraw your research participation consent. 
                          Your account will be signed out and you won't be able to 
                          participate in questionnaires until you provide consent again.
                          <br /><br />
                          Your existing data will be handled according to our data 
                          retention policy. You can request data deletion separately.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleWithdrawConsent}
                          disabled={withdrawing}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {withdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Yes, Withdraw Consent
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active consent record found.
              </p>
            )}
          </CardContent>
        </Card>

        {/* GDPR Rights */}
        <Card className="shadow-card border-0 animate-fade-in bg-accent/30">
          <CardHeader>
            <CardTitle className="text-lg">Your Data Rights</CardTitle>
            <CardDescription>Under GDPR, you have the following rights</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong className="text-foreground">Access:</strong> Request a copy of your personal data</li>
              <li>• <strong className="text-foreground">Rectification:</strong> Correct inaccurate data</li>
              <li>• <strong className="text-foreground">Erasure:</strong> Request deletion of your data</li>
              <li>• <strong className="text-foreground">Portability:</strong> Receive your data in a portable format</li>
              <li>• <strong className="text-foreground">Objection:</strong> Object to certain processing activities</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              To exercise these rights, please contact our data protection team.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
