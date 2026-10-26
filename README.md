# ProApp Vault Starter

This is a mobile-first starter project for ProApp Vault. It includes Firebase email/password authentication, Firestore-backed video metadata, likes, comments, saved-video records, admin controls, customizable ad copy, per-video ad URLs, and an R2 upload UI.

## Important
This project is **not live until you add your own Firebase configuration, deploy Firestore rules, and configure a secure R2 backend**. The R2 Worker deliberately refuses writes until Firebase ID-token verification is implemented. Do not remove that protection or replace it with decoded-but-unverified tokens.

## 1. Firebase setup
1. Open Firebase Console and select your existing project.
2. In Project settings > General > Your apps, create/select a Web app and copy the Firebase config.
3. Replace the `firebaseConfig` placeholders in `index.html`.
4. Authentication > Sign-in method > enable Email/Password.
5. Firestore Database > create database.
6. Publish `firestore.rules` in Firestore > Rules.

## 2. Bootstrap an admin
1. Sign up once through the app.
2. In Firebase Authentication, copy that user's UID.
3. In Firestore, open `users/{UID}` and change `role` to `admin` manually.
4. Never let users write their own role. The rules prevent self-promotion.
5. For production, use a more rigorous admin role/custom-claims process and audit access.

## 3. Add first video
Use Admin Panel > Video management. Enter a publicly reachable MP4 URL and optional thumbnail URL. The media URL must be accessible by the browser and support video playback/CORS as needed. Each video may have its own ad URL.

## 4. Configure ads and labels
Admin Panel > Ad settings supports:
- Home banner HTML
- Video display limit
- Watch/save instruction text
- Ad / Watch / Save button labels
- Default ad URL

Ad HTML is isolated in a sandboxed iframe. Verify your ad network's terms before using any unlock or timed flow. A timer does not prove that an ad was actually viewed.

## 5. Cloudflare R2
1. Create an R2 bucket and, if needed, attach a custom domain for media delivery.
2. Update `wrangler.toml` with your bucket and media domain.
3. Deploy a Worker only after implementing and testing full Firebase ID-token signature verification in `worker.js`.
4. Configure Worker variables/secrets: `FIREBASE_PROJECT_ID`, `ADMIN_UIDS` (comma-separated admin UIDs), and `MEDIA_PUBLIC_BASE`.
5. Never put R2 secret keys in `index.html`. Prefer short-lived presigned upload URLs or authenticated Worker routes.
6. For large files, use multipart upload or a direct signed-upload flow rather than proxying very large bodies through a Worker.

## 6. Deploy frontend
You can upload `index.html` to Netlify or Cloudflare Pages. Static hosting alone does not create backend security; the Firestore rules and Worker must be configured.

## Data collections
- `users/{uid}`
- `videos/{videoId}`
- `likes/{videoId_uid}`
- `comments/{commentId}`
- `savedVideos/{uid_videoId}`
- `appSettings/public`

## Known starter limitations
- Views in this starter are client-incremented and can be manipulated; use a backend endpoint with rate limiting for trustworthy analytics.
- Dashboard metrics query collections from the client; at scale, use server-maintained aggregate counters.
- Active users currently use `lastSeenAt` on login; real-time active-user counts require a defined time window and backend aggregation.
- Comments use a basic list; add pagination and moderation before a large public launch.
- Ad completion is not verified by ad-network callbacks. The 5-second timer is only a UX gate and must not be represented as verified ad viewing.
- R2 upload stays blocked until token verification is implemented. This is intentional and safer than shipping an insecure upload endpoint.
