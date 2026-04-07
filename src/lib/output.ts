export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

export function printError(message: string): void {
  console.error(`Error: ${message}`)
}

export function printSuccess(message: string): void {
  console.log(message)
}
