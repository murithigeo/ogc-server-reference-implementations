import React, { type ReactNode } from "react";
export function Main(props: { title: string; snippet?: ReactNode }) {
  return (
    <html>
      <head>
        <title>{props.title}</title>
        <script
          type="module"
          src="https://js.arcgis.com/calcite-components/3.3.0/calcite.esm.js"
        ></script>
        <link
          rel="stylesheet"
          href="https://js.arcgis.com/calcite-components/3.2.1/calcite.css"
        />
      </head>
      <body>
        <calcite-shell>{props?.snippet}</calcite-shell>
      </body>
    </html>
  );
}
