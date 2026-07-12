export default function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="stepper-row">
      <span className="label">{label}</span>
      <div className="stepper">
        <button aria-label={`${label} -`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <span className="value">{value}</span>
        <button aria-label={`${label} +`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          ＋
        </button>
      </div>
    </div>
  )
}
