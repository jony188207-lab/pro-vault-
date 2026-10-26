// Cloudflare Worker for private, admin-only R2 uploads/deletes.
// Configure: R2 binding MEDIA; vars FIREBASE_PROJECT_ID, ADMIN_UIDS (comma-separated UID list),
// MEDIA_PUBLIC_BASE. For production, verify Firebase ID tokens with a maintained JWT/JWKS library
// or put this endpoint behind a trusted backend. This minimal Worker verifies token issuer/audience
// and signature using Google's securetoken public certificates endpoint is intentionally not included;
// do not deploy as-is for production until verifyFirebaseToken() is completed and tested.
const json = (obj, status=200) => new Response(JSON.stringify(obj), {
  status, headers: {"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*",
  "access-control-allow-methods":"GET,POST,DELETE,OPTIONS","access-control-allow-headers":"authorization,content-type"}
});
async function verifyFirebaseToken(token, env) {
  // SECURITY PLACEHOLDER: implement full RS256 signature verification against Google's current
  // securetoken public keys before enabling writes. Never trust decoded JWT payload alone.
  throw new Error("Firebase token verification is not configured. Add a tested JWT/JWKS verifier before deployment.");
}
export default {
 async fetch(request, env) {
  if (request.method === "OPTIONS") return new Response(null,{status:204,headers:{
   "access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,DELETE,OPTIONS",
   "access-control-allow-headers":"authorization,content-type"}});
  const url=new URL(request.url);
  if (!["/upload","/delete"].includes(url.pathname)) return json({error:"Not found"},404);
  if (!["POST","DELETE"].includes(request.method)) return json({error:"Method not allowed"},405);
  const auth=request.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer ")) return json({error:"Missing Firebase ID token"},401);
  let claims;
  try { claims=await verifyFirebaseToken(auth.slice(7),env); }
  catch(e) { return json({error:e.message||"Unauthorized"},401); }
  const admins=(env.ADMIN_UIDS||"").split(",").map(x=>x.trim()).filter(Boolean);
  if(!admins.includes(claims.uid)) return json({error:"Admin only"},403);
  const key=url.searchParams.get("key");
  if(!key || key.includes("..") || key.startsWith("/")) return json({error:"Invalid key"},400);
  if(url.pathname==="/upload" && request.method==="POST") {
    const type=request.headers.get("content-type")||"application/octet-stream";
    if(!type.startsWith("video/") && !type.startsWith("image/")) return json({error:"Only video/image files allowed"},415);
    await env.MEDIA.put(key,request.body,{httpMetadata:{contentType:type}});
    const base=(env.MEDIA_PUBLIC_BASE||"").replace(/\/$/,"");
    return json({key,url:base?base+"/"+key:null,message:"Upload stored. Configure a public media domain or signed delivery."});
  }
  if(url.pathname==="/delete" && request.method==="DELETE") {
    await env.MEDIA.delete(key); return json({ok:true});
  }
  return json({error:"Not found"},404);
 }
};