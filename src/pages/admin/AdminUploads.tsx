import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Activity, Database, Lock, AlertTriangle } from "lucide-react";

export default function AdminUploads() {
  // Placeholder data - in production this would come from a hook
  const uploadStats = {
    total: 0,
    byType: {
      lab: 0,
      document: 0,
      wearable: 0,
    },
    byStatus: {
      raw: 0,
      anonymized: 0,
      processed: 0,
    },
  };

  const hasData = uploadStats.total > 0;

  return (
    <AdminLayout title="Feltöltések">
      {/* Security warning */}
      <Alert className="mb-6 border-red-500/50 bg-red-500/10">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>Fontos:</strong> Az adminisztrátorok NEM férhetnek hozzá a feltöltött fájlok tartalmához. 
          Ez az oldal kizárólag összesített statisztikákat jelenít meg. 
          A fájlok megnyitása, letöltése, előnézete és exportálása nem engedélyezett.
        </AlertDescription>
      </Alert>

      {/* Info box */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg flex items-start gap-3">
        <Lock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-foreground">Adatvédelmi korlátozások</p>
          <p className="text-sm text-muted-foreground mt-1">
            A platform adminisztrátorai nem rendelkeznek hozzáféréssel a felhasználók által feltöltött 
            egészségügyi dokumentumokhoz, labor eredményekhez vagy wearable adatokhoz. 
            Ez az oldal kizárólag aggregált, anonimizált összesítéseket jelenít meg.
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Upload className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Még nincs feltöltés a rendszerben.</p>
          <p className="text-sm text-muted-foreground mt-1">
            A feltöltési statisztikák itt fognak megjelenni, ha elérhetővé válnak.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4" />
                Összes feltöltés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uploadStats.total}</div>
            </CardContent>
          </Card>

          {/* By type */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Típus szerint</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Labor eredmények
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadStats.byType.lab}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dokumentumok
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadStats.byType.document}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Wearable adatok
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadStats.byType.wearable}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* By status */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Feldolgozási státusz szerint</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Nyers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadStats.byStatus.raw}</div>
                  <p className="text-xs text-muted-foreground">Feldolgozásra vár</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Anonimizált
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadStats.byStatus.anonymized}</div>
                  <p className="text-xs text-muted-foreground">Személyes adatok eltávolítva</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Feldolgozott
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadStats.byStatus.processed}</div>
                  <p className="text-xs text-muted-foreground">Készen áll elemzésre</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
