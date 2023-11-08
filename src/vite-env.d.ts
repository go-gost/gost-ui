/// <reference types="vite/client" />

declare module 'uuid';
declare module 'events';

interface Window {
  __GOST_SERVER__: any;
  __USE_SERVER__: any;
}
