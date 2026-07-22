import jwt from "jsonwebtoken";

const ACCESS_TOKEN_COOKIE = "accessToken";

const getCookieOptions = () => {
  // Cross-site (different domains): sameSite=none + secure=true (HTTPS required)
  // Same site / local: sameSite=lax or strict works
  const sameSite = process.env.COOKIE_SAME_SITE || "lax";
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    sameSite === "none" ||
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };
};

export const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const setAccessTokenCookie = (res, token) => {
  res.cookie(ACCESS_TOKEN_COOKIE, token, getCookieOptions());
};

export const clearAccessTokenCookie = (res) => {
  const { maxAge, ...options } = getCookieOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE, options);
};

export const getAccessTokenFromRequest = (req) => {
  // Preferred: httpOnly cookie (not readable by JS)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // Fallback: Authorization header (Postman / non-browser clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
};

export { ACCESS_TOKEN_COOKIE };
