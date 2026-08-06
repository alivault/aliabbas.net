declare module 'jsfxr' {
  export type SfxrDefinition = Record<string, boolean | number>

  export const sfxr: {
    toWebAudio: (
      definition: SfxrDefinition | string,
      context?: AudioContext,
    ) => AudioBufferSourceNode | undefined
  }
}
