type ViewRenderer = (params?: Record<string, string>) => Promise<string> | string;

export type Route = {
  path: RegExp;
  render: ViewRenderer;
  title?: string;
  cleanup?: () => void;
};

export class Router {
  private routes: Route[] = [];
  private outlet: HTMLElement;

  constructor(outlet: HTMLElement) {
    this.outlet = outlet;
    window.addEventListener('hashchange', () => this.navigate());
    window.addEventListener('load', () => this.navigate());
  }

  register(route: Route) {
    this.routes.push(route);
  }

  private match(pathname: string) {
    for (const route of this.routes) {
      const match = pathname.match(route.path);
      if (match) {
        const groups = match.groups || {};
        return { route, params: groups };
      }
    }
    return null;
  }

  private currentRoute: Route | null = null;

  async navigate() {
    // Cleanup previous route if it has cleanup
    if (this.currentRoute?.cleanup) {
      this.currentRoute.cleanup();
    }

    const hash = location.hash || '#/';
    const path = hash.slice(1);
    const matched = this.match(path);
    if (!matched) {
      this.outlet.innerHTML = `<div class="container py-10">Not Found</div>`;
      this.currentRoute = null;
      return;
    }
    const html = await matched.route.render(matched.params);
    if (matched.route.title) document.title = matched.route.title;
    this.outlet.innerHTML = html;
    window.scrollTo(0, 0);
    this.currentRoute = matched.route;
  }
}
