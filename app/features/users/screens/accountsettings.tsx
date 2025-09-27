/**
 * Settings Screen
 *
 * This component displays user account settings and preferences.
 * Users can manage their account settings, notifications, and privacy options.
 */
import type { Route } from "./+types/settings";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Label } from "~/core/components/ui/label";
import { Separator } from "~/core/components/ui/separator";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: "Settings | Dashboard",
    },
  ];
};

export default function Settings({ loaderData }: Route.ComponentProps) {
  // Mock data - 실제로는 loader에서 사용자 설정을 가져와야 함
  const settings = {
    notifications: {
      email: true,
      push: false,
      marketing: true,
      security: true,
    },
    privacy: {
      profileVisibility: "public",
      showEmail: false,
      showLocation: true,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
    },
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground">계정 및 환경설정</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <p className="text-muted-foreground text-sm">
              업데이트 및 활동에 대한 알림 설정
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-muted-foreground text-sm">
                  Receive important updates via email
                </p>
              </div>
              <Checkbox
                id="email-notifications"
                defaultChecked={settings.notifications.email}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-muted-foreground text-sm">
                  Get instant notifications in your browser
                </p>
              </div>
              <Checkbox
                id="push-notifications"
                defaultChecked={settings.notifications.push}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-notifications">
                  Marketing Emails
                </Label>
                <p className="text-muted-foreground text-sm">
                  Receive promotional content and updates
                </p>
              </div>
              <Checkbox
                id="marketing-notifications"
                defaultChecked={settings.notifications.marketing}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security-notifications">Security Alerts</Label>
                <p className="text-muted-foreground text-sm">
                  Important security-related notifications
                </p>
              </div>
              <Checkbox
                id="security-notifications"
                defaultChecked={settings.notifications.security}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>개인정보 설정</CardTitle>
            <p className="text-muted-foreground text-sm">
              개인정보 설정 및 데이터 공개 제어
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <div className="flex gap-2">
                <Badge
                  variant={
                    settings.privacy.profileVisibility === "public"
                      ? "default"
                      : "outline"
                  }
                >
                  Public
                </Badge>
                <Badge
                  variant={
                    settings.privacy.profileVisibility === "private"
                      ? "default"
                      : "outline"
                  }
                >
                  Private
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-email">Show Email Address</Label>
                <p className="text-muted-foreground text-sm">
                  Allow others to see your email address
                </p>
              </div>
              <Checkbox
                id="show-email"
                defaultChecked={settings.privacy.showEmail}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-location">Show Location</Label>
                <p className="text-muted-foreground text-sm">
                  Display your location on your profile
                </p>
              </div>
              <Checkbox
                id="show-location"
                defaultChecked={settings.privacy.showLocation}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>보안 설정</CardTitle>
            <p className="text-muted-foreground text-sm">계정 보안 설정 관리</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-muted-foreground text-sm">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Checkbox
                id="two-factor"
                defaultChecked={settings.security.twoFactorEnabled}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Session Timeout</Label>
              <p className="text-muted-foreground text-sm">
                Automatically log out after {settings.security.sessionTimeout}{" "}
                minutes of inactivity
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Active Sessions</Label>
              <p className="text-muted-foreground text-sm">
                Manage your active login sessions
              </p>
              <Button variant="outline" size="sm">
                View Sessions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>계정 관리</CardTitle>
            <p className="text-muted-foreground text-sm">계정 관리 및 조치</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Change Email Address
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Download My Data
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full justify-start">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button>저장하기</Button>
      </div>
    </div>
  );
}
