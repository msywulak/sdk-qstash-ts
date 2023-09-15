import { NextApiHandler } from 'next';
import { NextRequest, NextFetchEvent, NextResponse } from 'next/server';

type VerifySignaturConfig = {
    currentSigningKey?: string;
    nextSigningKey?: string;
    /**
     * The url of this api route, including the protocol.
     *
     * If you omit this, the url will be automatically determined by checking the `VERCEL_URL` env variable and assuming `https`
     */
    url?: string;
    /**
     * Number of seconds to tolerate when checking `nbf` and `exp` claims, to deal with small clock differences among different servers
     *
     * @default 0
     */
    clockTolerance?: number;
};
declare function verifySignature(handler: NextApiHandler, config?: VerifySignaturConfig): NextApiHandler;
declare function verifySignatureEdge(handler: (req: NextRequest, nfe: NextFetchEvent) => NextResponse | Promise<NextResponse>, config?: VerifySignaturConfig): (req: NextRequest, nfe: NextFetchEvent) => Promise<NextResponse<unknown>>;

export { VerifySignaturConfig, verifySignature, verifySignatureEdge };
