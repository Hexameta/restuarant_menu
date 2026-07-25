const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["server.js"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "lambda.js",
  external: [
    "mock-aws-s3",
    "aws-sdk",
    "nock",
    "bcrypt",
    "sharp"
  ],
  logLevel: "info",
}).catch(() => process.exit(1));
