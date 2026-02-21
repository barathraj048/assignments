import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

type Payload = {
   email:string,
   userId:string
}


export const signinAccessToken = (payload:Payload):string=> {
   return jwt.sign(payload,ACCESS_SECRET,{expiresIn:ACCESS_EXPIRES} as jwt.SignOptions)
}
export const signinRefreshToken = (payload:Payload):string=> {
   return jwt.sign(payload,REFRESH_SECRET,{expiresIn:REFRESH_EXPIRES} as jwt.SignOptions)
}
export function verifyAccessToken(token: string): Payload {
  return jwt.verify(token, ACCESS_SECRET) as Payload;
}

export function verifyRefreshToken(token: string): Payload {
  return jwt.verify(token, REFRESH_SECRET) as Payload;
}