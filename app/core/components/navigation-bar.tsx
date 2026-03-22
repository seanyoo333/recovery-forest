/**
 * Navigation Bar Component
 *
 * A responsive navigation header that adapts to different screen sizes and user authentication states.
 * This component provides the main navigation interface for the application, including:
 *
 * - Responsive design with desktop and mobile layouts
 * - User authentication state awareness (logged in vs. logged out)
 * - User profile menu with avatar and dropdown options
 * - Theme switching functionality
 * - Language switching functionality
 * - Mobile-friendly navigation drawer
 *
 * The component handles different states:
 * - Loading state with skeleton placeholders
 * - Authenticated state with user profile information
 * - Unauthenticated state with sign in/sign up buttons
 */
import {
  BarChart3Icon,
  BellIcon,
  ChevronDownIcon,
  CogIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MessageCircleIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { cn } from "~/lib/utils";

import { FEATURES } from "~/core/config/features";
import { getCheckoutUrl } from "~/core/lib/payment-constants";

import LangSwitcher from "./lang-switcher";
import ThemeSwitcher from "./theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import { Separator } from "./ui/separator";
import {
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet";

const menus = [
  {
    name: "소개",
    to: "/landing",
  },
  {
    name: "서비스",
    to: "/payments",
    items: [
      {
        name: "맞춤 건강 보고서",
        description: "개인 맞춤 건강 리포트를 요청하고 결과를 확인하세요",
        to: "/my/dashboard/health/report",
      },
      {
        name: "포인트 충전",
        description: "건강 보고서와 서비스 이용에 필요한 포인트를 충전하세요",
        to: getCheckoutUrl("point"),
      },
      {
        name: "결제 내역",
        description: "포인트 충전 및 결제 내역을 확인하세요",
        to: "/payments",
      },
    ],
  },
  /* {
    name: "기능의학 병원",
    to: "/clinic",
    items: [
      {
        name: "기능의학 병원 찾기",
        description: "기능의학 병원을 찾으세요",
        to: "/clinic",
      },
    ],
  }, */
  {
    name: "커뮤니티",
    to: "/community",
    items: [
      {
        name: "전체 게시물",
        description: "커뮤니티의 모든 게시물을 보세요",
        to: "/community",
      },
      {
        name: "인기 게시물",
        description: "커뮤니티의 인기 게시물을 보세요",
        to: "/community?sort=top",
      },
      {
        name: "새 게시물",
        description: "커뮤니티의 새로운 게시물을 보세요",
        to: "/community?sort=new",
      },
      {
        name: "게시물 작성",
        description: "새로운 게시물을 작성하세요",
        to: "/community/submit",
      },
    ],
  },
  {
    name: "블로그",
    to: "/blog",
    items: [
      {
        name: "전체 글",
        description: "모든 블로그 글을 보세요",
        to: "/blog",
      },
      {
        name: "최신 글",
        description: "최신 블로그 글을 보세요",
        to: "/blog?sort=new",
      },
    ],
  },
  {
    name: "천연물질",
    to: "/natural-ingredients",
    items: [
      {
        name: "전체 천연물질",
        description: "등록된 모든 천연물질(성분)을 확인하세요",
        to: "/natural-ingredients",
      },
      {
        name: "표적별 모음",
        description: "표적별로 연결된 천연물질(성분) 목록을 확인하세요",
        to: "/natural-ingredients/targets",
      },
      {
        name: "검색",
        description: "천연물질(성분)을 검색하세요",
        to: "/natural-ingredients/search",
      },
    ],
  },
  /* {
    name: "전문가 그룹",
    to: "/teams",
    items: [
      {
        name: "전문가 그룹 찾기",
        description: "전문가 그룹과 함께 건강을 찾으세요",
        to: "/teams",
      },
      {
        name: "전문가 그룹 등록",
        description: "전문가 그룹을 등록하세요",
        to: "/teams/submit",
      },
      {
        name: "건강 프로그램 찾기",
        description: "서울시에서 제공하는 건강 프로그램을 찾으세요",
        to: "/programs",
      },
    ],
  }, */
  /*  {
    name: "EVIDENCE BASE AI 챗봇",
    to: "/chat",
  },
  {
    name: "결제",
    to: "/payments/checkout",
  }, */
  /*   {
    name: "법적 문서",
    to: "/legal/terms",
  }, */
];

/**
 * UserMenu Component
 *
 * Displays the authenticated user's profile menu with avatar and dropdown options.
 * This component is shown in the navigation bar when a user is logged in and provides
 * quick access to user-specific actions and information.
 *
 * Features:
 * - Avatar display with image or fallback initials
 * - User name and email display
 * - Quick navigation to dashboard
 * - Logout functionality
 *
 * @param name - The user's display name
 * @param email - The user's email address (optional)
 * @param avatarUrl - URL to the user's avatar image (optional)
 * @returns A dropdown menu component with user information and actions
 */
function UserMenu({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email?: string;
  avatarUrl?: string | null;
}) {
  return (
    <DropdownMenu>
      {/* Avatar as the dropdown trigger */}
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 cursor-pointer rounded-lg">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      {/* Dropdown content with user info and actions */}
      <DropdownMenuContent className="w-56">
        {/* User information display */}
        <DropdownMenuLabel className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{name}</span>
          <span className="truncate text-xs">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/my/profile">
              <UserIcon className="mr-2 size-4" />
              프로필
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/my/dashboard">
              <BarChart3Icon className="mr-2 size-4" />건강 대시보드
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/my/account">
              <SettingsIcon className="mr-2 size-4" />
              설정
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {/* Logout link */}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/logout">
            <LogOutIcon className="mr-2 size-4" />
            로그아웃
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * AuthButtons Component
 *
 * Displays authentication buttons (Sign in and Sign up) for unauthenticated users.
 * This component is shown in the navigation bar when no user is logged in and provides
 * quick access to authentication screens.
 *
 * Features:
 * - Sign in button with ghost styling (less prominent)
 * - Sign up button with default styling (more prominent)
 * - View transitions for smooth navigation to auth screens
 * - Compatible with mobile navigation drawer (SheetClose integration)
 *
 * @returns Fragment containing sign in and sign up buttons
 */
function AuthButtons() {
  return (
    <>
      {/* Sign in button (less prominent) */}
      <Button variant="ghost" asChild>
        <SheetClose asChild>
          <Link to="/login" viewTransition>
            로그인
          </Link>
        </SheetClose>
      </Button>

      {/* Sign up button (more prominent) */}
      <Button variant="default" asChild>
        <SheetClose asChild>
          <Link to="/join" viewTransition>
            회원가입
          </Link>
        </SheetClose>
      </Button>
    </>
  );
}

/**
 * Actions Component
 *
 * Displays utility actions and settings in the navigation bar, including:
 * - Debug/settings dropdown menu with links to monitoring tools
 * - Theme switcher for toggling between light and dark mode
 * - Language switcher for changing the application language
 *
 * This component is shown in the navigation bar for all users regardless of
 * authentication state and provides access to application-wide settings and tools.
 *
 * @returns Fragment containing settings dropdown, theme switcher, and language switcher
 */
function Actions() {
  return (
    <>
      {/* Settings/debug dropdown menu (MVP: 숨김) */}
      {FEATURES.debugMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="cursor-pointer">
            <Button variant="ghost" size="icon">
              <CogIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <SheetClose asChild>
                <Link to="/debug/sentry" viewTransition>
                  Sentry
                </Link>
              </SheetClose>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <SheetClose asChild>
                <Link to="/debug/analytics" viewTransition>
                  Google Tag
                </Link>
              </SheetClose>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Theme switcher (MVP: 숨김) */}
      {FEATURES.themeSwitcher && <ThemeSwitcher />}

      {/* Language switcher */}
      <LangSwitcher />
    </>
  );
}

/**
 * NavigationBar Component
 *
 * The main navigation header for the application that adapts to different screen sizes
 * and user authentication states. This component serves as the primary navigation
 * interface and combines several sub-components to create a complete navigation experience.
 *
 * Features:
 * - Responsive design with desktop navigation and mobile drawer
 * - Application branding with localized title
 * - Main navigation links (Blog, Contact, Payments)
 * - User authentication state handling (loading, authenticated, unauthenticated)
 * - User profile menu with avatar for authenticated users
 * - Sign in/sign up buttons for unauthenticated users
 * - Theme and language switching options
 *
 * @param name - The authenticated user's name (if available)
 * @param email - The authenticated user's email (if available)
 * @param avatarUrl - The authenticated user's avatar URL (if available)
 * @param loading - Boolean indicating if the auth state is still loading
 * @param hasNotifications - Boolean indicating if the user has notifications
 * @param hasMessages - Boolean indicating if the user has messages
 * @returns The complete navigation bar component
 */
export function NavigationBar({
  isLoggedIn,
  name,
  username,
  email,
  avatarUrl,
  loading,
  hasNotifications,
  hasMessages,
}: {
  isLoggedIn?: boolean; // 추가
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string | null;
  loading: boolean;
  hasNotifications?: boolean;
  hasMessages?: boolean;
}) {
  // Get translation function for internationalization
  const { t } = useTranslation();

  // 모바일 메뉴 상태 관리
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <nav
      className={
        "bg-background/50 fixed top-0 right-0 left-0 z-50 mx-auto flex h-16 w-full items-center justify-between border-b px-5 shadow-xs backdrop-blur-lg transition-opacity md:px-10"
      }
    >
      <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between py-3">
        {/* Application logo/title with link to home */}
        <Link to="/">
          <h1 className="text-lg font-extrabold">{t("home.title")}</h1>
        </Link>

        {/* Desktop navigation menu (hidden on mobile) */}
        <div className="hidden h-full items-center gap-5 md:flex">
          {/* Main navigation links */}
          <NavigationMenu>
            <NavigationMenuList>
              {menus.map((menu) => (
                <NavigationMenuItem key={menu.name}>
                  {menu.items ? (
                    <>
                      <Link to={menu.to}>
                        <NavigationMenuTrigger className="text-base font-medium">
                          {menu.name}
                        </NavigationMenuTrigger>
                      </Link>
                      <NavigationMenuContent>
                        <ul className="grid w-[600px] grid-cols-2 gap-3 p-4 font-medium">
                          {menu.items?.map((item) => (
                            <NavigationMenuItem
                              key={item.name}
                              className={cn([
                                "focus:bg-accent hover:bg-accent rounded-md transition-colors select-none",
                                item.to === "/products/promote" &&
                                  "bg-primary/10 hover:bg-primary/20 focus:bg-primary/50 col-span-2",
                                item.to === "/jobs/submit" &&
                                  "bg-primary/10 hover:bg-primary/20 focus:bg-primary/50 col-span-2",
                              ])}
                            >
                              <NavigationMenuLink asChild>
                                <Link
                                  className="block space-y-1 p-3 leading-none no-underline outline-none"
                                  to={item.to}
                                >
                                  <span className="text-sm leading-none font-medium">
                                    {item.name}
                                  </span>
                                  <p className="text-muted-foreground text-sm leading-snug">
                                    {item.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </NavigationMenuItem>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <Link className={navigationMenuTriggerStyle()} to={menu.to}>
                      {menu.name}
                    </Link>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <Separator orientation="vertical" />

          {/* Settings, theme switcher, and language switcher */}
          <Actions />

          <Separator orientation="vertical" />

          {/* Conditional rendering based on authentication state */}
          {loading ? (
            // Loading state with skeleton placeholder
            <div className="flex items-center">
              <div className="bg-muted-foreground/20 size-8 animate-pulse rounded-lg" />
            </div>
          ) : (
            <>
              {isLoggedIn ? ( // ← 여기서 isLoggedIn으로 분기
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="relative"
                  >
                    <Link to="/my/notifications">
                      <BellIcon className="size-4" />
                      {hasNotifications && (
                        <div className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-500" />
                      )}
                    </Link>
                  </Button>
                  {/* 사용자 메시지 (MVP: 숨김) */}
                  {FEATURES.userMessages && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="relative"
                    >
                      <Link to="/my/messages">
                        <MessageCircleIcon className="size-4" />
                        {hasMessages && (
                          <div className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-500" />
                        )}
                      </Link>
                    </Button>
                  )}
                  <UserMenu
                    name={name || "Anonymous"}
                    email={email}
                    avatarUrl={avatarUrl}
                  />
                </div>
              ) : (
                // Unauthenticated state with auth buttons
                <AuthButtons />
              )}
            </>
          )}
        </div>

        {/* Mobile menu trigger (hidden on desktop) */}
        <SheetTrigger className="size-6 md:hidden">
          <MenuIcon />
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            {/* 홈 링크 */}
            <SheetClose asChild>
              <Link to="/" className="block py-2 font-medium">
                홈
              </Link>
            </SheetClose>

            {/* 메인 메뉴들 */}
            {menus.map((menu) => (
              <div key={menu.name} className="w-full">
                {menu.items ? (
                  // 하위 항목이 있는 경우 아코디언 형태
                  <Collapsible
                    open={openMenu === menu.name}
                    onOpenChange={(open) =>
                      setOpenMenu(open ? menu.name : null)
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-auto w-full justify-between p-2"
                      >
                        <span>{menu.name}</span>
                        <ChevronDownIcon
                          className={cn(
                            "size-4 transition-transform",
                            openMenu === menu.name && "rotate-180",
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 px-4">
                      {menu.items.map((item) => (
                        <div
                          key={item.name}
                          className={cn([
                            "focus:bg-accent hover:bg-accent rounded-md transition-colors select-none",
                            item.to === "/products/promote" &&
                              "bg-primary/10 hover:bg-primary/20 focus:bg-primary/50",
                            item.to === "/jobs/submit" &&
                              "bg-primary/10 hover:bg-primary/20 focus:bg-primary/50",
                          ])}
                        >
                          <SheetClose asChild>
                            <Link
                              className="block space-y-1 p-3 leading-none no-underline outline-none"
                              to={item.to}
                            >
                              <span className="text-sm leading-none font-medium">
                                {item.name}
                              </span>
                              <p className="text-muted-foreground text-sm leading-snug">
                                {item.description}
                              </p>
                            </Link>
                          </SheetClose>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  // 하위 항목이 없는 경우 단순 링크
                  <SheetClose asChild>
                    <Link to={menu.to} className="block py-2">
                      {menu.name}
                    </Link>
                  </SheetClose>
                )}
              </div>
            ))}
          </SheetHeader>
          {loading ? (
            <div className="flex items-center">
              <div className="bg-muted-foreground h-4 w-24 animate-pulse rounded-full" />
            </div>
          ) : (
            <SheetFooter>
              {isLoggedIn ? ( // ← 여기서 isLoggedIn으로 분기
                <div className="grid grid-cols-3">
                  <div className="col-span-2 flex w-full justify-between">
                    <Actions />
                  </div>
                  <div className="flex justify-end">
                    <UserMenu
                      name={name || "Anonymous"}
                      email={email}
                      avatarUrl={avatarUrl}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex justify-between">
                    <Actions />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <AuthButtons />
                  </div>
                </div>
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </div>
    </nav>
  );
}
