type Payload = {
    email: string;
    userId: string;
};
export declare const signinAccessToken: (payload: Payload) => string;
export declare const signinRefreshToken: (payload: Payload) => string;
export declare function verifyAccessToken(token: string): Payload;
export declare function verifyRefreshToken(token: string): Payload;
export {};
//# sourceMappingURL=jwt.d.ts.map