import * as colors from "std/fmt/colors.ts";
import { format } from "std/datetime/mod.ts";
import { type Context, type Next } from "oak";

export async function logger(ctx: Context, next: Next): Promise<void> {
  await next();
  const c = ctx.response.status >= 500
    ? colors.red
    : ctx.response.status >= 400
    ? colors.yellow
    : colors.green;
  console.log(
    `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] ${c(ctx.request.method)} ${
      c(`(${ctx.response.status})`)
    } - ${colors.cyan(`${ctx.request.url.pathname}${ctx.request.url.search}`)}`,
  );
}
