export default {
  async fetch(request, environment) {
    if (environment?.ASSETS?.fetch) {
      return environment.ASSETS.fetch(request);
    }

    return new Response("Static assets binding is unavailable.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
