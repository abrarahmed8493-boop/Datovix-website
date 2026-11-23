# DATOVIX website (HTML, CSS, JavaScript)

## Files
- `index.html` — public company website and enquiry form
- `styles.css` — responsive styling
- `app.js` — service cards and Supabase enquiry submission
- `admin.html` / `admin.js` — protected admin login, enquiry list, status updates and CSV export
- `supabase-schema.sql` — database tables, RLS policies and private upload bucket

## 1. Create Supabase project
1. Create a project at https://supabase.com.
2. Open Project Settings → API (or API Keys).
3. Copy the Project URL and the publishable key (or legacy anon key).
4. In both `app.js` and `admin.js`, replace:
   - `YOUR_SUPABASE_PROJECT_URL`
   - `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
5. Never use a service_role or secret key in browser code.

## 2. Create database
1. In Supabase, open SQL Editor → New query.
2. Paste all of `supabase-schema.sql` and run it.
3. Review the RLS policies before going live. Add CAPTCHA / rate limiting or route public submissions through an Edge Function for stronger anti-spam controls.

## 3. Create administrator
1. In Supabase Authentication → Users, create an admin user with a strong password.
2. Copy that user's UUID.
3. In SQL Editor run (replace UUID):
   `insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');`
4. Open `admin.html` and sign in.

## 4. Test locally
Run a local static server from this folder, for example:
`python -m http.server 8000`
Then open `http://localhost:8000`.

Opening the HTML directly using `file://` may cause browser module/network restrictions.

## 5. Publish with GitHub + Netlify
1. Create a GitHub repository and upload all project files.
2. In Netlify choose Add new site → Import an existing project → GitHub.
3. Select the repository. For a plain HTML site, leave build command empty and publish directory as `/` (repository root).
4. Deploy. Add your custom domain later if desired.

## Important production notes
- This is a functional starter, not a complete audited production system.
- The public browser key is designed to be public; database safety relies on correct RLS policies.
- Current admin page supports login, viewing, searching, status updates and CSV export. Internal notes editing and richer enquiry detail pages can be added next.
- Email acknowledgement and administrator notifications are NOT sent by the browser code. Configure a Supabase Edge Function with an email provider (such as Resend) and call it after successful insertion. Keep the email provider API key in Edge Function secrets, never in frontend code.
- Public file upload policy here is a starter policy. For production, add stronger file validation, CAPTCHA/rate limiting, and consider a signed-upload Edge Function.
- Add a full privacy policy, terms, data retention policy, and consent wording reviewed for your business before collecting real customer information.
