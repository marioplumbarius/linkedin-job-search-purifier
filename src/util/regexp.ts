export function stringToRegExp(asString: string): RegExp {
  const [_, pattern, flags] = asString.split("/");
  return new RegExp(pattern, flags);
}
