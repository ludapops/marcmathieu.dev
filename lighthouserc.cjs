module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start --port 4173",
      startServerReadyPattern: "Ready",
      url: ["http://127.0.0.1:4173/"],
      numberOfRuns: 3,
      settings: { formFactor: "mobile" },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-results",
    },
  },
};
