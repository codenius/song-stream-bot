import { supabaseAdapter } from "@grammyjs/storage-supabase";
import { createClient } from "supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_KEY");
const TABLE_NAME = "session";

export async function supabaseSessionStore() {
  if (!(SUPABASE_URL && SUPABASE_KEY)) {
    return;
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error } = await supabase
    .from(TABLE_NAME)
    .select()
    .limit(0);
  if (error?.code == "42P01") {
    console.error(
      `\n${error.message}\nMake sure the table '${TABLE_NAME}' is present in Supabase, if not create it according to the docs.\n`,
    );
    return;
  } else if (error) {
    console.error(
      `\n${error.message}\n${error.hint}\nConnection to Supabase failed. Falling back to RAM. NOT PERSISTENT.\n`,
    );
    return;
  }
  const storage = supabaseAdapter({
    supabase,
    table: TABLE_NAME,
  });
  console.log("Using Supabase for session storage.");
  return storage;
}
