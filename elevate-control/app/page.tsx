/**
 * The root path `/` always redirects:
 *   - Authenticated → /projects (dashboard)
 *   - Unauthed → /sign-in (handled by middleware before this route runs)
 *
 * If both routes are protected by middleware, this file just redirects
 * to the dashboard for any authed user that lands at `/`.
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/projects');
}
