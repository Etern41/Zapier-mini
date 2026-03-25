import TelegramBot from "node-telegram-bot-api";
import type { RecordStringUnknown } from "@/lib/executor/types";

type TgCfg = {
  botToken?: string;
  chatId?: string;
  message?: string;
  parseMode?: string;
};

export async function runTelegramStep(
  config: RecordStringUnknown
): Promise<unknown> {
  const c = config as TgCfg;
  if (!c.botToken) throw new Error("Bot token is required");
  if (!c.chatId) throw new Error("Chat ID is required");

  const bot = new TelegramBot(c.botToken, { polling: false });
  const opts: TelegramBot.SendMessageOptions = {};
  if (c.parseMode === "markdown") opts.parse_mode = "Markdown";
  if (c.parseMode === "html") opts.parse_mode = "HTML";

  const msg = await bot.sendMessage(c.chatId, c.message ?? "", opts);
  return { messageId: msg.message_id };
}
