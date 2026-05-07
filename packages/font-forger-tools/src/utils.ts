export const camelToDash = (str:string) => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // aB -> a-B
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // XMLHttp -> XML-Http
    .toLowerCase()
}
