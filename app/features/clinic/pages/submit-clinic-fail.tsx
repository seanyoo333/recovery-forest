import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Button } from "~/core/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export default function SubmitClinicFailPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Failed to Post Position</h1>
          <p className="text-muted-foreground">
            We encountered an error while posting your clinical research position. Please try again.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-left">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">What went wrong?</h3>
                <p className="text-sm text-red-700">
                  There was a temporary issue with our servers. Your position data has been saved as a draft.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Common causes:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Temporary server maintenance</li>
                  <li>• Network connectivity issues</li>
                  <li>• High server load</li>
                  <li>• Database connection timeout</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Button variant="outline" asChild className="w-full">
            <Link to="/clinics/submit">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Link>
          </Button>
          <Button className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Check your internet connection</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensure you have a stable internet connection and try again.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Wait a few minutes</h3>
                  <p className="text-sm text-muted-foreground">
                    Sometimes the issue resolves itself. Try again in a few minutes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Contact support</h3>
                  <p className="text-sm text-muted-foreground">
                    If the problem persists, contact our support team for assistance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link to="/clinics">Browse All Positions</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
