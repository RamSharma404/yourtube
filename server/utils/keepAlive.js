import https from "https";

const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds

const startKeepAlive = () => {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.warn("⚠️ BACKEND_URL not set. Keep-alive ping disabled.");
    return;
  }

  console.log(`🚀 Starting Keep-Alive Cron. Pinging ${backendUrl} every 14 minutes.`);

  setInterval(() => {
    https.get(backendUrl, (res) => {
      console.log(`✅ [Keep-Alive] Pinged successfully. Status Code: ${res.statusCode} - Prevents Render from sleeping and deleting files.`);
    }).on("error", (err) => {
      console.error(`❌ [Keep-Alive] Ping failed: ${err.message}`);
    });
  }, KEEP_ALIVE_INTERVAL);
};

export default startKeepAlive;
