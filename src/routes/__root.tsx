import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";



import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AppLockGate } from "@/components/AppLockGate";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "ChatWave — Simple, secure messaging" },
      { name: "description", content: "ChatWave: a clean, modern bilingual (English / हिंदी) chat experience." },
      { name: "theme-color", content: "#075E54" },
      { property: "og:title", content: "ChatWave — Simple, secure messaging" },
      { name: "twitter:title", content: "ChatWave — Simple, secure messaging" },
      { property: "og:description", content: "ChatWave: a clean, modern bilingual (English / हिंदी) chat experience." },
      { name: "twitter:description", content: "ChatWave: a clean, modern bilingual (English / हिंदी) chat experience." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/SJMPPscP6tckFRXdbCETe6yzLyu1/social-images/social-1780119513589-7372.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/SJMPPscP6tckFRXdbCETe6yzLyu1/social-images/social-1780119513589-7372.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <div className="app-shell">
            <div key={pathname} className="anim-page">
              <Outlet />
            </div>
            <AppLockGate />
          </div>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

