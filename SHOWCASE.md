# AlgoLadder showcase

## Demo walkthrough (60–90 seconds)

1. Open `/demo`. Explain the 474-problem roadmap and 19 topic groups.
2. Search for Fizz Buzz, set its status to Solved and bookmark it.
3. Open the problem, reveal a hint, write a note, and add it to the revision queue.
4. Refresh to show that guest progress survives in browser storage.
5. Show Bookmarks, Notes and Revision. Export the guest progress as JSON.
6. Show the source repository and the automated checks. For a configured full deployment, also show the authenticated editor and dashboard.

Guest mode is separate from accounts. It does not run code, sync to the database or automatically schedule revision. It keeps a manual revision queue. Clearing browser storage removes guest progress; the Export button provides a backup.

## LinkedIn draft

I've been building AlgoLadder, a DSA preparation app designed to turn a long list of problems into a consistent learning routine.

The project brings together a 474-problem roadmap across 19 topics, progress tracking, bookmarks, notes, and an interactive guest workspace. The full account-based app also includes a multi-language code editor, revision scheduling, analytics, and administration tools.

Built with Next.js, TypeScript, React, Tailwind CSS, and PostgreSQL. Working on this project helped me connect frontend interaction, database design, authentication, and automated testing in one application.

Source: https://github.com/yagnadeepreddy081-reddy/algoladder

I'd appreciate feedback from developers and students preparing for coding interviews.

#WebDevelopment #NextJS #TypeScript #DSA #LearningInPublic

Before posting, add a working deployed `/demo` URL and a short screen recording. Only describe the account-based features as demonstrated after verifying them on the configured deployment. Real payments are disabled and are not an implemented feature.

## Release checks

- `npm ci`, then `npm run typecheck`
- Start Postgres, run `npm run db:migrate` and `npm run db:seed`
- `npm test`, `npm run build`, and `npm run test:e2e`
- Verify the external problem links, especially title-derived URLs
- Public deployment: configure database, a random auth secret, and email sender; set `ALLOW_DEV_RESET_LINKS=false`
- Check compiler-service availability before demonstrating code execution

The guest page uses the bundled dataset and requires no database. The remaining full-app deployment dependencies are listed in DEPLOYMENT.md.
