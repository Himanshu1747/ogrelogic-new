// const wpCache = new Map();

// export async function queryWordPress(query, variables = {}) {
//   const endpoint = import.meta.env.WP_API_URL || "https://web.ogrelogicsolutions.com/ogrelogic-wp/graphql";
//   const cacheKey = JSON.stringify({ query, variables });

//   if (wpCache.has(cacheKey)) {
//     return wpCache.get(cacheKey);
//   }

//   try {
//     const response = await fetch(endpoint, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "User-Agent": "Mozilla/5.0 (Astro-SSR-Bot)",
//       },
//       body: JSON.stringify({ query, variables }),
//     });

//     if (!response.ok) {
//       console.error(`WordPress Fetch Error: ${response.status}`);
//       return null;
//     }

//     const json = await response.json();

//     if (json.errors) {
//       console.error("GraphQL Errors:", json.errors);
//       return null;
//     }

//     // Return the WHOLE json (which contains the .data property)
//     wpCache.set(cacheKey, json);
//     return json;
//   } catch (error) {
//     console.error("Network Error:", error);
//     return null;
//   }
// }







// NEW CODE 

// const wpCache = new Map();
// const pendingRequests = new Map();

// export async function queryWordPress(query, variables = {}) {
//   const endpoint =
//     import.meta.env.WP_API_URL ||
//     "https://web.ogrelogicsolutions.com/ogrelogic-wp/graphql";

//   const cacheKey = JSON.stringify({ query, variables });

//   // 1. Memory cache (fastest)
//   if (wpCache.has(cacheKey)) {
//     return wpCache.get(cacheKey);
//   }

//   // 2. Deduplicate requests
//   if (pendingRequests.has(cacheKey)) {
//     return pendingRequests.get(cacheKey);
//   }

//   const controller = new AbortController();
//   const timeout = setTimeout(() => controller.abort(), 8000); // prevent hanging

//   const fetchPromise = (async () => {
//     try {
//       const response = await fetch(endpoint, {
//         method: "POST",
//         signal: controller.signal,
//         headers: {
//           "Content-Type": "application/json",
//           // ❌ removed no-cache
//           // Let browser/server cache work
//         },
//         body: JSON.stringify({ query, variables }),

//         // ✅ important for Astro / Node fetch caching
//         cache: "force-cache",
//         keepalive: true,
//       });

//       if (!response.ok) {
//         throw new Error(`Status ${response.status}`);
//       }

//       const json = await response.json();

//       if (json.errors) {
//         console.error("GraphQL Errors:", json.errors);
//         return null;
//       }

//       // ✅ store result
//       wpCache.set(cacheKey, json);

//       return json;
//     } catch (error) {
//       console.error("WordPress Fetch Error:", error.message);
//       return null;
//     } finally {
//       clearTimeout(timeout);
//       pendingRequests.delete(cacheKey);
//     }
//   })();

//   pendingRequests.set(cacheKey, fetchPromise);

//   return fetchPromise;
// }

const pendingRequests = new Map();

export async function queryWordPress(query, variables = {}) {
  const endpoint =
    import.meta.env.WP_API_URL ||
    "https://web.ogrelogicsolutions.com/ogrelogic-wp/graphql";

  const cacheKey = JSON.stringify({ query, variables });

  // 1. Deduplicate identical simultaneous requests
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // prevent hanging

  const fetchPromise = (async () => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),

        // 🔥 Changed to 'no-store' to bypass all caching and force a live backend fetch
        cache: "no-store",
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const json = await response.json();

      if (json.errors) {
        console.error("GraphQL Errors:", json.errors);
        return null;
      }

      return json;
    } catch (error) {
      console.error("WordPress Fetch Error:", error.message);
      return null;
    } finally {
      clearTimeout(timeout);
      pendingRequests.delete(cacheKey); // Clean up request track
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);

  return fetchPromise;
}