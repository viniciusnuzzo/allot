type BuyMeCoffeeProps = {
  href: string;
  actionLabel?: string;
};

export function BuyMeCoffee({
  href,
  actionLabel = "Ways to support",
}: BuyMeCoffeeProps) {
  return (
    <a className="buy-me-coffee" href={href}>
      <span className="buy-me-coffee-poster" aria-hidden="true">
        a little<br />
        goes a<br />
        long way.
      </span>
      <span className="buy-me-coffee-art" aria-hidden="true">
        <svg viewBox="0 0 180 170" fill="none">
          <path
            className="buy-me-coffee-steam"
            d="M66 42C47 26 83 25 65 8M94 42C75 26 111 25 93 8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M122 65H139C158 65 158 96 140 98H121" stroke="currentColor" strokeWidth="5" />
          <path d="M38 58H128L121 127Q118 148 83 148Q48 148 45 127Z" fill="var(--lime)" stroke="currentColor" strokeWidth="3" />
          <ellipse cx="83" cy="59" rx="44" ry="8" fill="var(--white)" stroke="currentColor" strokeWidth="3" />
          <path d="M66 103C58 84 82 81 84 96C87 81 112 85 99 104L83 119Z" fill="var(--ink)" />
          <path d="M27 153H143" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </span>
      <span className="buy-me-coffee-copy">
        <strong>Keep good ideas growing.</strong>
        <span>A little support makes room for the next useful improvement.</span>
      </span>
      <span className="buy-me-coffee-action">
        {actionLabel}<span aria-hidden="true">↗</span>
      </span>
    </a>
  );
}
