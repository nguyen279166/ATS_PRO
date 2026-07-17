const splitDescriptionSections = (description: string) =>
  description
    .replace(/\s+([A-ZÀ-ỸĐ][A-ZÀ-ỸĐ\s/+-]{2,}:)/gu, "\n$1")
    .split("\n")
    .map((section) => section.trim())
    .filter(Boolean);

type JobDescriptionProps = {
  description: string;
};

export function JobDescription({ description }: JobDescriptionProps) {
  return (
    <div className='space-y-4'>
      {splitDescriptionSections(description).map((section, index) => {
        const match = section.match(/^([^:]{2,48}):\s*(.*)$/s);
        const title = match?.[1]?.trim();
        const body = (match?.[2] || section).trim();
        const bulletItems = body
          .split("•")
          .map((item) => item.trim())
          .filter(Boolean);
        const hasBullets = body.includes("•") && bulletItems.length > 0;

        return (
          <div key={`${title || "section"}-${index}`} className='space-y-2'>
            {title && (
              <h4 className='text-sm font-bold uppercase text-[var(--color-primary)]'>
                {title}
              </h4>
            )}
            {hasBullets ? (
              <ul className='grid gap-2 pl-1'>
                {bulletItems.map((item) => (
                  <li
                    key={item}
                    className='flex gap-2 text-sm leading-6 text-[var(--color-text-muted)]'
                  >
                    <span
                      className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]'
                      aria-hidden='true'
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-sm leading-7 text-[var(--color-text-muted)]'>
                {body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
