export function niceTicks(max: number): Array<number> {
  if (max <= 0) return [0]

  const rough = max / 4
  const pow = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10].map((size) => size * pow).find((size) => size >= rough) ?? pow * 10
  const tickCount = Math.ceil(max / step)

  return Array.from({ length: tickCount + 1 }, (_, index) => index * step)
}
