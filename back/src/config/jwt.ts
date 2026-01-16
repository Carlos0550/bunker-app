import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { env } from "@/config/env";
export interface TokenPayload {
  userId: string;
  email: string;
  role: number;
  tenantId?: string;
  businessId?: string;
}
export interface RecoverPswTokenPayload {
  email: string;
  password: string;
}
export interface DecodedToken extends TokenPayload, JwtPayload {}
export function generateToken(
  payload: TokenPayload,
  options?: Partial<SignOptions>
): string {
  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: "HS256",
    ...options,
  };
  return jwt.sign(payload, env.JWT_SECRET, signOptions);
}
export function verifyToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expirado");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Token inválido");
    }
    throw error;
  }
}
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken | null;
  } catch {
    return null;
  }
}
export function generateRefreshToken(payload: TokenPayload): string {
  return generateToken(payload, { expiresIn: "30d" });
}
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
export function generateRecoverPswToken(
  payload: RecoverPswTokenPayload,
  options?: Partial<SignOptions>
): string {
  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: "HS256",
    ...options,
  };
  return jwt.sign(payload, env.JWT_SECRET, signOptions);
}
