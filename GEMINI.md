# IPL Auction 2025 - Project Rules

## Design Rules (CRITICAL - never break these)

- Do NOT change the color scheme: dark navy `#0f1629`, dark blue `#18184a`, orange `#fe6804`, accent cyan `#00bcd4`
- Do NOT change the font family: `Work Sans` is used for all headings and UI text
- Do NOT remove or break any existing animations (Framer Motion, confetti, UNSOLD stamp)
- Do NOT change the layout structure of any existing page
- Do NOT change the Tailwind class patterns already used - extend, never replace
- All new components must use the existing dark theme color palette
- All new UI must feel like it belongs to the same IPL-branded design
- If a new image or design asset is needed, ASK THE USER before generating or placing a placeholder

## Code Rules

- No emojis anywhere in code, UI text, labels, buttons, comments, or responses
- TypeScript strict mode - no `any` types without justification
- Follow the existing file structure exactly
- All new pages go in `client/src/pages/`
- All new components go in `client/src/components/`
- Configuration values go in `shared/config.ts` - never hardcode them
- Use existing shadcn/ui components from `client/src/components/ui/` before creating new ones
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Use `formatIndianNumber()` from `lib/utils.ts` for all currency display

## Communication Rules

- No emojis in any response text
- Keep responses concise and technical
- When making changes, state exactly what file was changed and what was done
- Ask before making any change that could break existing functionality
