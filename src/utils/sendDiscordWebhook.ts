export const sendDiscordWebhook = async (
  content: string
): Promise<Response | null> => {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    // eslint-disable-next-line no-console
    console.log(`"DISCORD_WEBHOOK_URL" is undefined`);
    return null;
  }
  try {
    const res = await fetch(webhook, {
      method: `POST`,
      body: JSON.stringify({ content }),
      headers: {
        "Content-Type": `application/json`
      }
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(`Webhook failed to send! ${err.message}`);
    }
    return null;
  }
};
