# Third-party notices

Kivo's MIT license does not relicense dependencies, fonts, historical photographs, linked content or user uploads. Preserve upstream copyright, license and applicable NOTICE files when distributing source or compiled artifacts. This inventory records direct dependencies checked on 2026-10-15; `package-lock.json` is the resolved dependency record, not a license grant.

## Direct dependency inventory

| Package(s) | Resolved version(s) at review | Declared license |
| --- | --- | --- |
| `@supabase/ssr`, `@supabase/supabase-js` | 0.12.7 / 2.117.3 | MIT |
| `class-variance-authority` | 0.7.1 | Apache-2.0 |
| `cn` | 0.4.0 | MIT |
| `geist` | 1.7.2 | SIL Open Font License 1.1 |
| `iconsax-reactjs` | 0.0.8 | MIT |
| `next` | 16.4.0 | MIT |
| `react`, `react-dom` | 19.3.0 | MIT |
| `radix-ui` | 1.8.0 | MIT |
| `server-only` | 0.0.1 | MIT |
| `sonner` | 2.0.8 | MIT |
| `tw-animate-css` | 1.4.0 | MIT |
| `@biomejs/biome` | 2.5.15 | MIT OR Apache-2.0 |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | MIT |
| `typescript` | 7.0.2 | Apache-2.0 |
| `sharp` | 0.35.5 | Apache-2.0 |
| `playwright`, `playwright-core` (development browser tests) | 1.62.1 | Apache-2.0 |
| `@types/node` | 26.6.5 | MIT |
| `@types/react`, `@types/react-dom` | 19.3.0 | MIT |

This table is not a complete transitive/bundled license manifest. Next.js and sharp ship additional compiled dependencies; sharp's libvips and its codec libraries retain their own terms. For each actual release platform, inspect the installed package license/NOTICE files and bundled dependencies before distributing its binaries. Do not assume everything inside a MIT-licensed wrapper is MIT. Updates require a fresh inventory and notice review.

## Geist fonts

Copyright (c) 2023 Vercel, in collaboration with basement.studio.

Geist is distributed under SIL Open Font License 1.1, not Kivo's MIT license. The complete font license is preserved in [docs/licenses/geist-OFL.txt](docs/licenses/geist-OFL.txt), copied from the installed package's `LICENSE.txt`. Include this notice and license when distributing the font files. Font modification/naming and standalone-sale conditions remain applicable.

## Adapted shadcn/ui components

The generated/adapted primitives in `src/components/ui/` use shadcn/ui's component approach and Radix UI. Upstream [shadcn/ui license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md):

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Iconsax React

The package metadata identifies `iconsax-reactjs` as MIT and links to [rendinjast/iconsax-react](https://github.com/rendinjast/iconsax-react). Its upstream [license](https://github.com/rendinjast/iconsax-react/blob/master/LICENSE) notice is preserved below (the installed package did not include a standalone license file):

```text
Copyright (c) ERFAN KHADIVAR

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## Background and external content

The current generated scenic image and removed historical Unsplash asset have separate provenance in [docs/ASSETS.md](docs/ASSETS.md). The old image is not relicensed by MIT. Provider names/logos/trademarks, remote previews and user-saved material are not Kivo contributions and carry their own rights. No provider endorsement is implied.
