# OpenFermi 

This is a quick prototype to enable all the major features that kids in K12 need to succeed in Jee, Neet and other major papers that are there 

# Features : 

1. Canvas to implement past questions and use AI to see if the answers are good and learn from mistakes 
2. Save progress and choose from a random subset of questions to work on 


## Compute Layer

This is an initial commit for the repo and an open version of the project [fermi.ai](https://fermi.ai). Everything is vibe-coded.

**Models:** DeepSeek v3.2 Terminus with OpenCode.

**Tech stack:**
- **Frontend:** Tailwind, shadcn, Next.js
- **Backend:** Next.js server components (planned migration to a Java backend)
- **DB:** Postgres on AWS, Prisma for migrations
- **Auth:** Better Auth with JWT
- **Other:** TLDraw for the canvas, Vercel AI for the agent SDK

## Data Layer

- JEE past papers plus a large LLM to assess whether the student’s work is correct or not
- Random samples from JEE past papers for quick practice and tests
- Text-to-voice over WebSockets (courtesy Cartesia—Karan G has cooked here; best product ever)
