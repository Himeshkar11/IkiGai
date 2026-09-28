#!/usr/bin/env node

/**
 * Uptime Keeper & Production Health Ping Job
 *
 * Runs an HTTP GET against the lightweight /health endpoint every 5 minutes
 * (or as a single run when invoked via external scheduler like GitHub Actions/cron).
 *
 * Environment Variables:
 *   HEALTH_CHECK_URL - Explicit health URL (e.g. https://api.yourdomain.com/health)
 *   APP_URL          - Base app URL (e.g. https://yourdomain.com) -> defaults to ${APP_URL}/health
 *   PORT             - Fallback port if local (default: 5000)
 *   PING_ONCE        - If 'true', sends one ping and exits with status 0 or 1 (for cron/GitHub Actions)
 *   PING_INTERVAL_MS - Ping interval in milliseconds (default: 300,000 = 5 minutes)
 */

const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const https = require('https');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resolveHealthUrl = () => {
  if (process.env.HEALTH_CHECK_URL) {
    return process.env.HEALTH_CHECK_URL.trim();
  }
  if (process.env.APP_URL) {
    const base = process.env.APP_URL.replace(/\/+$/, '');
    return `${base}/health`;
  }
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}/health`;
};

const sendHealthPing = (url) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(
      url,
      {
        timeout: 5000,
        headers: {
          'User-Agent': 'IkiGai-Uptime-Monitor/1.0',
          Accept: 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body });
          } else {
            reject(new Error(`HTTP status ${res.statusCode}: ${body.slice(0, 100)}`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out after 5000ms'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
};

const execute = async () => {
  const url = resolveHealthUrl();
  const timestamp = new Date().toISOString();

  try {
    const result = await sendHealthPing(url);
    // Success log is concise and lightweight
    console.log(`[${timestamp}] Health ping OK: ${url} (status ${result.statusCode})`);
    return true;
  } catch (err) {
    console.error(`[${timestamp}] HEALTH PING FAILED: ${url} -> ${err.message}`);
    return false;
  }
};

const main = async () => {
  const pingOnce = process.env.PING_ONCE === 'true' || process.argv.includes('--once');
  const intervalMs = Number(process.env.PING_INTERVAL_MS) || 5 * 60 * 1000; // 5 minutes

  const healthUrl = resolveHealthUrl();
  console.log(`[KeepAlive] Configured target health endpoint: ${healthUrl}`);

  if (pingOnce) {
    console.log(`[KeepAlive] Running in single-ping mode...`);
    const success = await execute();
    process.exit(success ? 0 : 1);
  } else {
    console.log(`[KeepAlive] Starting recurring 5-minute health check daemon (Interval: ${intervalMs / 1000}s)...`);
    // Run immediately once
    await execute();
    // Then run every 5 minutes
    setInterval(async () => {
      await execute();
    }, intervalMs);
  }
};

if (require.main === module) {
  main();
}

module.exports = {
  resolveHealthUrl,
  sendHealthPing,
};
