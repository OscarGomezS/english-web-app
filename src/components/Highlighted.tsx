export function Highlighted({
  text,
  range,
}: {
  text: string
  range: [number, number] | null
}) {
  if (!range) return <>{text}</>
  const [start, end] = range
  if (start < 0 || end > text.length || start >= end) return <>{text}</>
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-violet-200 px-0.5 text-slate-900">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  )
}
