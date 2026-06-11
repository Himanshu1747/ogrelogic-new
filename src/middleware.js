import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  const isFile = pathname.split("/").pop()?.includes(".");
  const needsSlash = pathname !== "/" && !pathname.endsWith("/");

  if (context.request.method === "GET" && needsSlash && !isFile) {
    return context.redirect(pathname + "/", 301);
  }

  return next();
});

