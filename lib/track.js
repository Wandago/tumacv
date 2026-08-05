import { supabaseBrowser } from "./supabaseClient";

// Fire-and-forget: failures are silent since this is analytics, not a
// critical path. Never blocks or slows down the page it's called from.
export function trackPageView(path) {
  try {
    supabaseBrowser().auth.getUser().then(({ data }) => {
      supabaseBrowser()
        .from("page_views")
        .insert({ path, user_id: data?.user?.id || null })
        .then(() => {}, () => {});
    });
  } catch {
    // never let analytics break the page
  }
}
