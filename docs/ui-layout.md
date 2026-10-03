# UI layout system

VibeLine uses one page-level responsive grid across product surfaces.

## Layout contract

Every top-level page follows the same hierarchy:

```text
viewport
└── page shell
    └── PageContainer
        └── ResponsiveGrid
            ├── page regions
            ├── primary content
            └── supporting panels
```

`PageContainer` owns the page boundary. It centers the usable page area, caps it at 1440px, and applies responsive outer padding. `ResponsiveGrid` begins immediately inside that boundary and spans the complete available content width.

| Breakpoint | Columns | Column gutter | Outer page padding |
| --- | ---: | ---: | ---: |
| Mobile | 4 | 16px | 16px |
| Small | 4 | 16px | 24px |
| Tablet | 8 | 24px | 24px |
| Desktop | 12 | 24px | 32px |
| Large desktop | 12 | 24px | 40px |

The grid is the source of truth for primary horizontal placement. Grid gaps belong between columns. Page padding belongs between the viewport and grid. Do not use column gaps as page padding.

## Shared primitives

```tsx
<PageContainer>
  <ResponsiveGrid>
    {pageLevelRegions}
  </ResponsiveGrid>
</PageContainer>
```

`PageContainer`:

```text
mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10
```

`ResponsiveGrid`:

```text
grid w-full grid-cols-4 gap-x-4 md:grid-cols-8 md:gap-x-6 lg:grid-cols-12 lg:gap-x-6
```

## Composition rules

The page grid controls major regions only. Component internals may use flexbox, local grids, or stacks where appropriate.

Column placement belongs to the page or feature composition layer. Feature components should not hardcode page-specific left margins, arbitrary widths, or viewport-relative positioning.

Avoid primary alignment through values such as `px-[120px]`, arbitrary `ml-*`, `mr-*`, percentage widths, or route-specific max-width containers when the page grid can express the relationship.

Auth uses one page-level grid. On desktop, the authentication content spans 5 columns and the visual panel spans 7 columns. On tablet, the form occupies a centered 6-of-8 region and the visual panel is hidden. On mobile, the form occupies all 4 columns.

The public home header, hero, and supporting regions are all direct children of the same page grid. Chat uses a 3/9 desktop split and a 3/5 tablet split.

The page shell owns background and vertical page behavior. `PageContainer` owns outer horizontal spacing. `ResponsiveGrid` owns columns and gutters. Feature components own their internal layout.
