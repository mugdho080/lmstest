const registrationLink = "https://docs.google.com/forms/d/e/1FAIpQLSeJvh3EDbSGaI5uTzQkXIaUNqAN46JVl-U6zPSPBcaNFggBBg/viewform?usp=publish-editor";

const chapters = {
  "ai-digital-skills": {
    title: "AI & Digital Skills",
    icon: "🤖",
    color: "linear-gradient(120deg,#c3f3f2,#e0f5f3)",
    blurb: "Learn the basics of artificial intelligence, digital safety, and online communication.",
    formLink: registrationLink,
    levels: [
      {
        id: "1",
        title: "Level 1: Friendly Tech Start",
        summary: "Meet AI, explore safe passwords, and learn calm online chats.",
        free: true,
        topics: ["What is AI?", "Keeping your devices safe", "Kind words online", "Asking for help"],
        content: {
          intro: "Welcome to your first AI & Digital Skills adventure. Everything here is calm and easy to follow.",
          steps: [
            "Discover simple examples of AI you see every day like voice assistants.",
            "Practice making strong passwords and keeping them in a safe place.",
            "Learn the 'pause and breathe' rule before posting messages.",
            "Try asking for help from a trusted adult when something feels confusing online."
          ]
        }
      },
      {
        id: "2",
        title: "Level 2: Smart Searching & Safety",
        summary: "Search the web kindly and spot tricky links.",
        free: false,
        topics: ["Finding good sources", "Spotting scams", "Staying balanced with screen time"],
        content: {
          intro: "Let's build calm habits for browsing the web.",
          steps: [
            "Use short keywords and filters to find friendly sources.",
            "Check website addresses and icons before clicking links.",
            "Create a simple screen-time plan with breaks and movement.",
            "Practice reporting harmful messages with a support person."
          ]
        }
      },
      {
        id: "3",
        title: "Level 3: Creating with AI",
        summary: "Make creative prompts and share safely.",
        free: false,
        topics: ["Prompt basics", "Respectful sharing", "Saving your projects"],
        content: {
          intro: "Turn ideas into calm creative projects with AI.",
          steps: [
            "Write short prompts with feelings, colors, or sounds you enjoy.",
            "Save your projects in organized folders with simple names.",
            "Ask a support person to review anything before sharing.",
            "Celebrate small wins and stretch breaks between tasks."
          ]
        }
      }
    ]
  },
  "math-numbers": {
    title: "Math & Numbers",
    icon: "🔢",
    color: "linear-gradient(120deg,#e8f0ff,#f3f6ff)",
    blurb: "Improve counting, handling money, telling time, and solving gentle puzzles.",
    formLink: registrationLink,
    levels: [
      {
        id: "1",
        title: "Level 1: Everyday Numbers",
        summary: "Counting, matching coins, and reading clocks.",
        free: true,
        topics: ["Counting groups", "Coins and notes", "Morning, afternoon, night"],
        content: {
          intro: "Numbers are friendly and patient here.",
          steps: [
            "Count objects you enjoy (toys, snacks) and say the number out loud.",
            "Match coins and notes to prices in a pretend shop.",
            "Use a daily planner to notice morning, afternoon, and evening times.",
            "Practice slow breathing if a math problem feels tricky."
          ]
        }
      },
      {
        id: "2",
        title: "Level 2: Confident Money Moves",
        summary: "Budgeting and safe spending steps.",
        free: false,
        topics: ["Making a budget", "Need vs want", "Change and receipts"],
        content: {
          intro: "Build calm money habits with simple tools.",
          steps: [
            "Plan a weekly budget with three jars: spend, save, share.",
            "Practice saying no to sudden buys and taking a pause.",
            "Check receipts for mistakes together with a support person.",
            "Use a small calculator for quick totals and confidence."
          ]
        }
      }
    ]
  },
  "self-choice-control": {
    title: "Self Choice & Control",
    icon: "🧭",
    color: "linear-gradient(120deg,#fff4e6,#ffe9d7)",
    blurb: "Understand your rights, make choices, and plan your own path.",
    formLink: registrationLink,
    levels: [
      {
        id: "1",
        title: "Level 1: Your Voice Matters",
        summary: "Rights, safe choices, and everyday decisions.",
        free: true,
        topics: ["My rights", "Trusted people", "Simple decisions"],
        content: {
          intro: "You deserve calm spaces to choose what works for you.",
          steps: [
            "List trusted people who can help with big choices.",
            "Practice saying yes, no, or 'I need time' clearly.",
            "Use a feelings scale (1-5) to notice comfort levels.",
            "Celebrate each time you speak up for your needs."
          ]
        }
      },
      {
        id: "2",
        title: "Level 2: Planning Your Week",
        summary: "Create routines and safe boundaries.",
        free: false,
        topics: ["Daily planner", "Setting boundaries", "Asking for changes"],
        content: {
          intro: "Plans give calm structure and freedom.",
          steps: [
            "Build a weekly schedule with rest times and fun time.",
            "Practice boundary phrases like 'I need a quiet break.'",
            "Role-play asking for a change when plans shift.",
            "Pick a support person to review your plan with you."
          ]
        }
      }
    ]
  },
  "life-skills-independence": {
    title: "Life Skills & Independence",
    icon: "🏡",
    color: "linear-gradient(120deg,#e8fff2,#f1fff7)",
    blurb: "Cooking basics, cleaning routines, money safety, and everyday independence.",
    formLink: registrationLink,
    levels: [
      {
        id: "1",
        title: "Level 1: Calm Home Basics",
        summary: "Kitchen safety, tidy routines, and calm checklists.",
        free: true,
        topics: ["Safe kitchen steps", "Laundry basics", "Room reset checklist"],
        content: {
          intro: "Small steps make home life feel safe and kind.",
          steps: [
            "Learn kitchen rules: clean hands, clear bench, slow movements.",
            "Sort clothes by color with a simple chart.",
            "Create a 'room reset' checklist for morning and evening.",
            "Use timers with soft sounds to remind you of tasks."
          ]
        }
      },
      {
        id: "2",
        title: "Level 2: Planning Meals & Safety",
        summary: "Meal prep and emergency basics.",
        free: false,
        topics: ["Meal planning", "Simple recipes", "Emergency contacts"],
        content: {
          intro: "Prepare food safely and know what to do if something goes wrong.",
          steps: [
            "Plan three calm meals for the week with a grocery list.",
            "Practice knife safety with soft foods first.",
            "Save emergency numbers in your phone and on the fridge.",
            "Role-play what to do if you smell smoke or need help."
          ]
        }
      }
    ]
  },
  "psychology-behaviour": {
    title: "Psychology & Behaviour",
    icon: "💛",
    color: "linear-gradient(120deg,#f6ecff,#f9f2ff)",
    blurb: "Learn about emotions, relationships, and understanding yourself and others.",
    formLink: registrationLink,
    levels: [
      {
        id: "1",
        title: "Level 1: Feelings Map",
        summary: "Naming emotions and calm body signals.",
        free: true,
        topics: ["Emotion words", "Body clues", "Calming toolkit"],
        content: {
          intro: "Feelings are welcome here. We notice them gently.",
          steps: [
            "Match feelings words to colors or icons that feel right to you.",
            "Notice where feelings show up in your body (warm face, tight hands).",
            "Create a calm-down kit with music, toys, and breathing cards.",
            "Share your feelings map with a trusted person."
          ]
        }
      },
      {
        id: "2",
        title: "Level 2: Relationships & Signals",
        summary: "Reading social cues and setting boundaries.",
        free: false,
        topics: ["Body language", "Kind scripts", "Support circles"],
        content: {
          intro: "Relationships can be clear and kind when we practice.",
          steps: [
            "Practice eye contact alternatives like looking at eyebrows or nose.",
            "Use short scripts for greetings, goodbyes, and needing space.",
            "Draw your support circle: who to call for each feeling.",
            "Set a calm boundary when you feel overwhelmed and need a break."
          ]
        }
      }
    ]
  }
};

window.chapters = chapters;
