import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Button } from "~/core/components/ui/button";
import { CheckCircle, Eye, Share2, Copy } from "lucide-react";
import { Link } from "react-router";

export default function SubmitClinicSuccessPage() {
  const positionId = "12345";
  const positionUrl = `/clinics/${positionId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(positionUrl);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Position Posted Successfully!</h1>
          <p className="text-muted-foreground">
            Your clinical research position has been published and is now visible to candidates.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Position Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-sm text-muted-foreground">Position ID</span>
                <p className="font-medium">{positionId}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <p className="font-medium text-green-600">Active</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Posted</span>
                <p className="font-medium">Just now</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Views</span>
                <p className="font-medium">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Button asChild className="w-full">
            <Link to={positionUrl}>
              <Eye className="w-4 h-4 mr-2" />
              View Position
            </Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Candidates will find your position</h3>
                  <p className="text-sm text-muted-foreground">
                    Your position will appear in search results and be recommended to relevant candidates.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Review applications</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll receive notifications when candidates apply for your position.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Contact qualified candidates</h3>
                  <p className="text-sm text-muted-foreground">
                    Reach out to promising candidates and schedule interviews.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link to="/clinics">Browse All Positions</Link>
          </Button>
          <Button asChild>
            <Link to="/clinics/submit">Post Another Position</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
