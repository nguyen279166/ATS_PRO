type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <img
      src='/ats-pro-logo.svg'
      alt=''
      aria-hidden='true'
      width={48}
      height={48}
      draggable={false}
      className={`block select-none ${className}`}
    />
  );
}
