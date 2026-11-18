declare module "virtual:grok-og-identity" {
  export const grokOgIdentity: Record<string, unknown>;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "vite/client" {}

interface ImportMetaEnv {
  readonly BASE_URL?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "livekit-client" {
  export class Room {
    constructor(...args: any[]);
    localParticipant: any;
    connect(...args: any[]): Promise<void>;
    disconnect(): void;
    on(event: string, cb: (...args: any[]) => void): void;
    off(event: string, cb: (...args: any[]) => void): void;
    startAudio(): Promise<void>;
  }
  export class RemoteTrack {
    attach(...args: any[]): any;
    kind: string;
  }
  export enum RoomEvent {
    DataReceived = "dataReceived",
    TrackSubscribed = "trackSubscribed",
  }
  export const Track: any;
  const _default: any;
  export default _default;
}

declare module "@stripe/stripe-js" {
  export type Stripe = any;
  export function loadStripe(key: string): Promise<any>;
}

declare module "@stripe/react-stripe-js" {
  export const Elements: any;
  export const PaymentElement: any;
  export const EmbeddedCheckout: any;
  export const EmbeddedCheckoutProvider: any;
  export function useStripe(): any;
  export function useElements(): any;
}

declare module "gsap" {
  const gsap: any;
  export default gsap;
}

declare namespace gsap {
  type core = any;
}

declare module "sonner" {
  export const toast: any;
  export const Toaster: any;
}

declare module "vaul" {
  export const Drawer: any;
}
