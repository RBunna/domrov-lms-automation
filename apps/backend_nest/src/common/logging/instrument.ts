// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from "@sentry/nestjs"

Sentry.init({
    dsn: "https://93cfc7938deed7c0c01022e8151eeb7c@o4510998874095616.ingest.us.sentry.io/4510998874947584",
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});