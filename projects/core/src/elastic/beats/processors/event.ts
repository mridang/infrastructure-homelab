/**
 * @file Declares the global Beats event interface that the processor scripts are written against.
 */

export {};

declare global {
  interface BeatsEvent {
    Get<T>(key: string): T | undefined;
    Put(key: string, value: string): string;
    Rename(sourceKey: string, targetKey: string): boolean;
    Delete(key: string): boolean;
    Cancel(): void;
    Tag(tag: string): void;
    AppendTo(key: string, value: string): void;
  }
}
