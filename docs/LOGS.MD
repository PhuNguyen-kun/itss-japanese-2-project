07:46:35.685
Initializing build environment...
07:46:37.190
Success: Finished initializing build environment
07:46:37.847
Cloning repository...
07:46:39.443
Restoring from dependencies cache
07:46:39.446
Restoring from build output cache
07:46:39.450
Detected the following tools from environment: npm@10.9.2, nodejs@22.16.0
07:46:39.558
Installing project dependencies: npm clean-install --progress=false
07:46:35.685
Initializing build environment...
07:46:37.190
Success: Finished initializing build environment
07:46:37.847
Cloning repository...
07:46:39.443
Restoring from dependencies cache
07:46:39.446
Restoring from build output cache
07:46:39.450
Detected the following tools from environment: npm@10.9.2, nodejs@22.16.0
07:46:39.558
Installing project dependencies: npm clean-install --progress=false
07:46:57.846
07:46:57.847
added 383 packages, and audited 384 packages in 17s
07:46:57.847
07:46:57.847
149 packages are looking for funding
07:46:57.847
  run `npm fund` for details
07:46:57.883
07:46:57.883
2 moderate severity vulnerabilities
07:46:57.883
07:46:57.884
To address all issues (including breaking changes), run:
07:46:57.884
  npm audit fix --force
07:46:57.884
07:46:57.884
Run `npm audit` for details.
07:46:58.115
Executing user deploy command: npx wrangler deploy
07:46:59.903
npm warn exec The following package was not found and will be installed: wrangler@4.99.0
07:47:07.507
07:47:07.507
 ⛅️ wrangler 4.99.0
07:47:07.507
───────────────────
07:47:07.536
07:47:07.536
Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
07:47:07.562
07:47:07.654
✘ [ERROR] The entry-point file at ".open-next/worker.js" was not found.
07:47:07.654
07:47:07.654
  
07:47:07.654
  This might mean that your entry-point file needs to be generated (which is the general case when a framework is being used).
07:47:07.654
  If that's the case please run your project's build command and try again.
07:47:07.655
07:47:07.655
07:47:07.789
🪵  Logs were written to "/opt/buildhome/.config/.wrangler/logs/wrangler-2026-06-11_00-47-07_072.log"
07:47:07.957
Failed: error occurred while running deploy command