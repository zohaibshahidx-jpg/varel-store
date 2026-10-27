import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getProduct, colorOptions } from '../../../lib/catalog';
const sizes = ['XS','S','M','L','XL'];
type InputItem={id:string,size:string,quantity:number,color?:string};
export async function POST(request:Request){
 try{
  const authUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,authKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,adminKey=process.env.SUPABASE_SECRET_KEY;
  if(!authUrl||!authKey||!adminKey)return Response.json({error:'Checkout is not configured yet.'},{status:503});
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return Response.json({error:'Please sign in to continue.'},{status:401});
  const auth=createClient(authUrl,authKey,{auth:{persistSession:false,autoRefreshToken:false}});const {data:{user},error}=await auth.auth.getUser(token);
  if(error||!user||!user.app_metadata.providers?.includes('google'))return Response.json({error:'Please sign in with Google to continue.'},{status:401});
  const key=process.env.STRIPE_SECRET_KEY;if(!key?.startsWith('sk_test_'))return Response.json({error:'Test checkout is not configured yet.'},{status:503});
  const origin=process.env.NEXT_PUBLIC_SITE_URL;if(!origin)return Response.json({error:'Checkout is not configured yet.'},{status:503});
  const body=await request.json() as {items:InputItem[]};if(!Array.isArray(body.items)||body.items.length<1||body.items.length>50)return Response.json({error:'Your bag is empty or invalid.'},{status:400});
  const items=[];for(const item of body.items){const p=getProduct(item?.id);if(!p||!sizes.includes(item.size)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10||(item.color&&!colorOptions.some(c=>c.name===item.color)))return Response.json({error:'Invalid bag item.'},{status:400});items.push({id:p.id,name:p.name,color:item.color||p.color,size:item.size,quantity:item.quantity,unit_amount:p.price*100});}
  const subtotal=items.reduce((n,x)=>n+x.unit_amount*x.quantity,0);
  const admin=createClient(authUrl,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:order,error:orderError}=await admin.from('orders').insert({user_id:user.id,currency:'usd',subtotal_cents:subtotal,items}).select('id').single();if(orderError||!order)return Response.json({error:'Unable to prepare order.'},{status:500});
  const stripe=new Stripe(key);let session:Stripe.Checkout.Session;
  try{session=await stripe.checkout.sessions.create({mode:'payment',customer_email:user.email,client_reference_id:order.id,metadata:{order_id:order.id},billing_address_collection:'required',shipping_address_collection:{allowed_countries:['US','CA','GB','PK']},success_url:`${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/checkout?cancelled=1`,line_items:items.map(i=>({price_data:{currency:'usd',unit_amount:i.unit_amount,product_data:{name:`${i.name} · ${i.color} / ${i.size}`}},quantity:i.quantity}))},{idempotencyKey:`order-${order.id}`});}catch{await admin.from('orders').update({status:'failed',updated_at:new Date().toISOString()}).eq('id',order.id).eq('status','pending');return Response.json({error:'Could not start test checkout.'},{status:502})}
  const {error:linkError}=await admin.from('orders').update({stripe_session_id:session.id,updated_at:new Date().toISOString()}).eq('id',order.id).eq('status','pending');if(linkError||!session.url)return Response.json({error:'Could not start test checkout.'},{status:502});return Response.json({url:session.url});
 }catch{return Response.json({error:'Could not start test checkout.'},{status:400})}
}
