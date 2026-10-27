import { createClient } from '@supabase/supabase-js';
import { getProduct, colorOptions } from '../../../lib/catalog';
const sizes = ['XS','S','M','L','XL'];
export async function POST(request: Request) {
 try {
  const authUrl=process.env.NEXT_PUBLIC_SUPABASE_URL, authKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!authUrl||!authKey)return Response.json({error:'Sign-in is not configured yet.'},{status:503});
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return Response.json({error:'Please sign in to continue.'},{status:401});
  const auth=createClient(authUrl,authKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(token);
  if(authError||!user||!user.app_metadata.providers?.includes('google'))return Response.json({error:'Please sign in with Google to continue.'},{status:401});
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key || !key.startsWith('sk_test_')) return Response.json({error:'Test checkout is not configured yet.'},{status:503});
  const {items}=await request.json() as {items: Array<{id:string,size:string,quantity:number,color?:string}>};
  if(!Array.isArray(items)||items.length<1||items.length>50) return Response.json({error:'Your bag is empty or invalid.'},{status:400});
  const params=new URLSearchParams(); params.set('mode','payment');params.set('billing_address_collection','required');['US','CA','GB','PK'].forEach((country,i)=>params.set(`shipping_address_collection[allowed_countries][${i}]`,country));
  const origin=process.env.NEXT_PUBLIC_SITE_URL;
  if(!origin) return Response.json({error:'Checkout is not configured yet.'},{status:503});
  params.set('success_url',`${origin}/?checkout=success`);params.set('cancel_url',`${origin}/?checkout=cancelled`);
  for(let i=0;i<items.length;i++) {const item=items[i], product=getProduct(item.id);if(!product||(item.color && !colorOptions.some(c=>c.name===item.color))||!sizes.includes(item.size)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10)return Response.json({error:'Invalid bag item.'},{status:400});params.set(`line_items[${i}][price_data][currency]`,'usd');params.set(`line_items[${i}][price_data][unit_amount]`,String(product.price*100));params.set(`line_items[${i}][price_data][product_data][name]`,`${product.name} · ${item.color || product.color} / ${item.size}`);params.set(`line_items[${i}][quantity]`,String(item.quantity));}
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/x-www-form-urlencoded'},body:params});const data=await response.json() as {url?:string};if(!response.ok||!data.url)return Response.json({error:'Could not start test checkout.'},{status:502});return Response.json({url:data.url});
 } catch {return Response.json({error:'Could not start test checkout.'},{status:400})}
}
