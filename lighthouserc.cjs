module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready",
      url: ["http://127.0.0.1:3000/"],
      numberOfRuns: 1,
      settings: { preset: "desktop" },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-results",
    },
  },
};
