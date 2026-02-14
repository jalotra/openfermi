export function flattenActions<T>(instances: object[]): T {
  const result: Record<string, unknown> = {};

  for (const instance of instances) {
    const proto = Object.getPrototypeOf(instance);
    const protoKeys = Object.getOwnPropertyNames(proto).filter(
      (k) => k !== "constructor",
    );
    const ownKeys = Object.getOwnPropertyNames(instance);

    for (const key of [...protoKeys, ...ownKeys]) {
      const value = (instance as Record<string, unknown>)[key];
      if (typeof value === "function") {
        result[key] = value.bind(instance);
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}
