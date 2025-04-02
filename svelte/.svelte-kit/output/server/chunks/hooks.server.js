import { R as RefillingTokenBucket } from "./rate-limit.js";
import { r as refreshAccessToken } from "./index4.js";
import { i as i18n } from "./i18n.js";
import { b as getUser } from "./user.js";
function sequence(...handlers) {
  const length = handlers.length;
  if (!length) return ({ event, resolve }) => resolve(event);
  return ({ event, resolve }) => {
    return apply_handle(0, event, {});
    function apply_handle(i, event2, parent_options) {
      const handle2 = handlers[i];
      return handle2({
        event: event2,
        resolve: (event3, options) => {
          const transformPageChunk = async ({ html, done }) => {
            if (options?.transformPageChunk) {
              html = await options.transformPageChunk({ html, done }) ?? "";
            }
            if (parent_options?.transformPageChunk) {
              html = await parent_options.transformPageChunk({ html, done }) ?? "";
            }
            return html;
          };
          const filterSerializedResponseHeaders = parent_options?.filterSerializedResponseHeaders ?? options?.filterSerializedResponseHeaders;
          const preload = parent_options?.preload ?? options?.preload;
          return i < length - 1 ? apply_handle(i + 1, event3, {
            transformPageChunk,
            filterSerializedResponseHeaders,
            preload
          }) : resolve(event3, { transformPageChunk, filterSerializedResponseHeaders, preload });
        }
      });
    }
  };
}
const handleParaglide = i18n.handle();
const bucket = new RefillingTokenBucket(100, 1);
const rateLimitHandle = async ({ event, resolve }) => {
  const clientIP = event.request.headers.get("X-Forwarded-For");
  if (clientIP === null) {
    return resolve(event);
  }
  let cost;
  if (event.request.method === "GET" || event.request.method === "OPTIONS") {
    cost = 1;
  } else {
    cost = 3;
  }
  if (!bucket.consume(clientIP, cost)) {
    return new Response("Too many requests", {
      status: 429
    });
  }
  return resolve(event);
};
const authHandle = async ({ event, resolve }) => {
  const accessToken = event.cookies.get("access_token") ?? null;
  try {
    if (accessToken === null) {
      throw new Error("Access token required");
    }
    const user = await getUser(accessToken);
    event.locals.user = user;
  } catch (error) {
    if (error instanceof Error && error.message === "Access token required") {
      const refreshToken = event.cookies.get("refresh_token") ?? null;
      if (refreshToken === null) {
        event.locals.user = null;
        const response = await resolve(event);
        response.headers.append(
          "Set-Cookie",
          "access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax"
        );
        return response;
      }
      try {
        const { access, refresh } = await refreshAccessToken(refreshToken);
        event.locals.user = await getUser(access.secret);
        const response = await resolve(event);
        response.headers.append(
          "Set-Cookie",
          `access_token=${access.secret}; Path=/; Expires=${access.ttl.toDate().toUTCString()}; HttpOnly; Secure; SameSite=lax`
        );
        response.headers.append(
          "Set-Cookie",
          `refresh_token=${refresh.secret}; Path=/; Expires=${refresh.ttl.toDate().toUTCString()}; HttpOnly; Secure; SameSite=lax`
        );
        return response;
      } catch (refreshError) {
        const response = await resolve(event);
        response.headers.append(
          "Set-Cookie",
          "refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax"
        );
        response.headers.append(
          "Set-Cookie",
          "access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax"
        );
        response.headers.set("Location", "/sign-in");
        return new Response(null, {
          status: 302,
          headers: response.headers
        });
      }
    } else {
      throw error;
    }
  }
  return resolve(event);
};
const handle = sequence(rateLimitHandle, authHandle, handleParaglide);
export {
  handle
};
