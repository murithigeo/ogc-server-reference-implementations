import type { oas3 } from "exegesis-express";
type ScalarSource = {
  url: string;
  title?: string;
  slug?: string;
  default?: boolean;
};
type ScalarOptions = {
  theme?:
    | "default"
    | "mars"
    | "deepSpace"
    | "alternate"
    | "moon"
    | "purple"
    | "solarized"
    | "bluePlanet"
    | "saturn"
    | "kepler"
    | "mars"
    | "laserwave"
    | "none";
  layout?: "modern" | "classic";
  hiddenClients?: string[] | boolean;
  favicon?: string;
  metadata?: object;
  servers?: oas3.ServerObject[];
  baseServerURL?: string;
  showSideBar?: boolean;
  hideClientButton?: boolean;
};
export const scalar = (
  sources: ScalarSource[],
  options: ScalarOptions = {
    theme: "none",
    layout: "modern",
    showSideBar: true,
    hideClientButton: true,
  }
) => {
  return `<!docytpe html>
    <html>
      <head>
        <title>${`Api Reference`}</title>
        <meta charset="utf-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scaled=1" />
      </head>
      <body>
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        <script>
          Scalar.createApiReference('#app',{
          sources:${JSON.stringify(sources)},
          ...${JSON.stringify(options)}
          })
        </script>
      </body>
    </html>
    `;
};
