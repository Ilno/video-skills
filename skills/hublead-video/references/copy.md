# On-screen copy

Every word on screen is read in under two seconds by someone who does not know Hublead.

- Say the outcome, not the mechanism: "See where they moved", not "Hublead polls LinkedIn every 30 days".
- Step pills: 3 to 6 words, an imperative or a plain fact ("Track any contact from LinkedIn").
- Title: the viewer's problem in one line ("Your best contacts change jobs."). Brand line: what Hublead does about it.
- Lockup tagline: the promise, 3 to 6 words ("Never lose a champion again.").
- Plain English, sentence case, no exclamation marks, no emoji, no "seamlessly", "effortlessly", "powerful",
  "revolutionary", "unlock", "leverage", "AI-powered" unless the feature really is AI.
- Never a version number, an internal name (nexus, admin-ui, Signals backend), a plan name or a price unless the
  brief asks for it.
- CRM words as the CRM says them: HubSpot "segment", "contact", "task"; Salesforce "lead", "contact", "task",
  "install the package".
- Names on screen are sample people (Michael Johnson, Emily Carter...) or colleagues who agreed. Never a customer.
- Never promise a detection speed or a delay ("the day they move", "instantly", "in real time", "within 24 hours"):
  job change data lags weeks to about two months. Say what happens, not when.
- Every product claim on screen (an alert channel, a CRM, a plan, a number of credits) must be true today: check the
  feature's Slack channel and its Notion page, not an old deck. If you cannot check it, leave it out.
- `node scripts/check-film.mjs` checks the words of film.json against these rules (pill and tagline length, banned
  words, speed promises, dashes, emoji, internal names); the sheet and the render run it first.
