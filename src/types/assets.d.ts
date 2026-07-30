declare module "*.ttf?url" {
  const source: string;
  export default source;
}

declare module "mammoth/mammoth.browser.js" {
  export type MammothMessage = {
    type: string;
    message: string;
  };

  export function extractRawText(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<{
    value: string;
    messages: MammothMessage[];
  }>;
}
