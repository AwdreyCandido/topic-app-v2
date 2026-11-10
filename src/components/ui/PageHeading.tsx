
import Link from "next/link";
import type { ReactNode } from "react";
import { HiChevronRight } from "react-icons/hi2";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeadingProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumb?: BreadcrumbItem[];
  children?: ReactNode;
};

export function PageHeading({
  title,
  description,
  eyebrow,
  breadcrumb,
  children,
}: PageHeadingProps) {
  return (
    <header className="mb-[3.2rem] w-full min-w-0">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          aria-label="Caminho de navegação"
          className="mb-[2.4rem]"
        >
          <ol className="flex flex-wrap items-center gap-x-[0.8rem] gap-y-[0.6rem]">
            {breadcrumb.map((item, index) => (
              <li
                key={`${item.href ?? item.label}-${index}`}
                className="inline-flex min-w-0 items-center gap-[0.8rem] text-[1.3rem]"
              >
                {index > 0 && (
                  <HiChevronRight
                    aria-hidden="true"
                    className="size-[1.3rem] shrink-0 text-muted/50"
                  />
                )}

                {item.href ? (
                  <Link
                    href={item.href}
                    className="font-medium text-muted transition-colors hover:text-primary-ink"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current="page"
                    className="font-medium text-foreground"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="grid min-w-0 grid-cols-1 items-end gap-x-[3.2rem] gap-y-[2.4rem] md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-[1rem] text-[1.2rem] font-semibold uppercase tracking-[0.12rem] text-muted">
              {eyebrow}
            </p>
          )}

          <h1 className="max-w-[90rem] font-heading text-[clamp(2.6rem,2.5vw,3.4rem)] font-semibold leading-[1.25] tracking-[-0.1rem] wrap-break-word text-foreground">
            {title}
          </h1>

          {description && (
            <p className="mt-[0.9rem] max-w-[66rem] text-[1.4rem] leading-[1.65] text-muted">
              {description}
            </p>
          )}
        </div>

        {children && (
          <div className="flex min-w-0 flex-wrap items-center gap-[1rem] md:justify-end md:pb-[0.2rem]">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
