import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

const SIGN_OPTIONS: jwt.SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  algorithm: "HS256",
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

const VERIFY_OPTIONS: jwt.VerifyOptions = {
  algorithms: ["HS256"],
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, SIGN_OPTIONS);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, VERIFY_OPTIONS);
  return decoded as JwtPayload;
}
