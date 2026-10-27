import {createClient} from '@supabase/supabase-js';
import Stripe from 'stripe';
export async function GET(request:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, stripeKey=process.env.STRIPE_SECRET_KEY;
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 const sessionId=new URL(request.url).searchParams.get('session_id');
 if(!url||!key||!stripeKey?.startsWith('sk_test_'))return Response.json({error:'Order details are unavailable.'},{status:503});
 if(!token)return Response.json({error:'Please sign in to view this order.'},{status:401});
 if(!sessionId||!/^cs_test_[A-Za-z0-9_]+$/.test(sessionId))return Response.json({error:'Invalid order reference.'},{status:400});
 const db=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user)return Response.json({error:'Please sign in to view this order.'},{status:401});
 const {data:order,error}=await db.from('orders').select('id,status,currency,subtotal_cents,items,created_at,paid_at,stripe_session_id').eq('user_id',user.id).eq('stripe_session_id',sessionId).maybeSingle();
 if(error)return Response.json({error:'Could not load this order.'},{status:500});
 if(!order)return Response.json({error:'Order not found.'},{status:404});
 if(order.status!=='paid')return Response.json({order});
 try{
  const session=await new Stripe(stripeKey).checkout.sessions.retrieve(sessionId);
  if(session.livemode||session.payment_status!=='paid'||session.metadata?.order_id!==order.id||session.amount_subtotal!==order.subtotal_cents||session.currency!==order.currency)return Response.json({error:'Order details could not be verified.'},{status:502});
  return Response.json({order,customer:session.customer_details,shipping:session.collected_information?.shipping_details??null,totals:{subtotal:session.amount_subtotal,total:session.amount_total,tax:session.total_details?.amount_tax??0,shipping:session.total_details?.amount_shipping??0,discount:session.total_details?.amount_discount??0}});
 }catch{return Response.json({error:'Order details are temporarily unavailable.'},{status:502})}
}
