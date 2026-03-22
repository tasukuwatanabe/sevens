export default defineEventHandler((event) => {
  if (!import.meta.dev) return;
  const path = getRequestURL(event).pathname;
  const prefix = "/_nuxt/";
  if (!path.startsWith(prefix)) return;
  const rest = path.slice(prefix.length);
  if (
    !rest.startsWith("@") &&
    !rest.startsWith("node_modules/") &&
    rest.includes("/node_modules/")
  ) {
    return sendRedirect(event, `${prefix}@fs/${rest}`, 302);
  }
});
