# Typography

DM Sans is the site's text family. Heading styles are defined once in the
`src/components/Title.tsx` component using Tailwind classes, not global CSS. Keep default letter spacing
(except the page and hero titles, which are `tracking-tight`), upright text, and the
foreground colors. Titles do not use the brand color.

## Scale

Sizes below assume a 16px root size. Fluid sizes use rem-based bounds so they
respect the reader's font settings.

| Role                 | `Title` variant | Size    | Weight | Line height |
| -------------------- | --------------- | ------- | ------ | ----------- |
| Page title           | `page`          | 36–48px | 300    | 1.11–1      |
| Section title        | `section`       | 32–56px | 400    | 1.15        |
| Card / compact title | `card`          | 24–32px | 400    | 1.2         |
| Subsection title     | `subsection`    | 20–24px | 400    | 1.3         |
| Detail title         | `detail`        | 18px    | 400    | 1.4         |

The page title is `text-4xl` (36px), and `text-5xl` (48px) from the `lg`
breakpoint, with the line heights of those Tailwind sizes. It wraps with
`text-pretty`. Do not put line breaks in it.

The homepage's `hero` variant has the size, weight and letter spacing of the
page title. It keeps its three set lines, with the changing word in the middle.

## Usage

- Use `PageHeading` for a page's `h1` and `SectionHeading` for its main `h2`s.
- Use `size="compact"` for bounded workflows such as password reset, admin
  sign-in, and the comments section. This selects the card-title scale without
  changing the semantic heading level.
- Project names, note titles, capability names, and experience entries use
  `<Title variant="card">`. Use its `as` prop to keep the `h2`, `h3`, or `span`
  appropriate to the document hierarchy.
- The closing call to action above the footer is an `h2` with the `page`
  variant, so the page ends in the voice of its title.
- Portable Text and Markdown heading renderers use `Title` components as well.
  Prose spacing stays with the typography plugin; there are no global heading
  size or weight overrides.
- Use `className` on heading components for layout and alignment, not alternate
  font sizes, weights, line heights, or colors. A title has one color: do
  not give some of its words or its section number another shade. The one
  exception is the changing word in the homepage hero, which uses
  `text-brand`.
- Body copy, metadata, controls, and game HUD metrics keep their existing styles.

Change a variant in `Title.tsx` rather than tuning individual pages.
