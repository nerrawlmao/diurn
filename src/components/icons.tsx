interface IconProps {
  size?: number
}

function chevron(points: string, size: number) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={points} />
    </svg>
  )
}

export function ChevronDownIcon({ size = 14 }: IconProps) {
  return chevron('6 9.5 12 15.5 18 9.5', size)
}

function arrow(line: [number, number, number, number], head: string, size: number) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} />
      <polyline points={head} />
    </svg>
  )
}

export function ArrowLeftIcon({ size = 18 }: IconProps) {
  return arrow([19, 12, 5, 12], '11 6 5 12 11 18', size)
}

export function ArrowRightIcon({ size = 18 }: IconProps) {
  return arrow([5, 12, 19, 12], '13 6 19 12 13 18', size)
}
