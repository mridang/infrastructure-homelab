interface Event {
  Get<T>(key: string): T | undefined;
  Put(key: string, value: string): string;
  Rename(sourceKey: string, targetKey: string): boolean;
  Delete(key: string): boolean;
  Cancel(): void;
  Tag(tag: string): void;
  AppendTo(key: string, value: string): void;
}
