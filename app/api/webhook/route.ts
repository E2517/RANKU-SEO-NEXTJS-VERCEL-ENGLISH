import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import User from '@/models/User';
import { connectDB } from '@/lib/mongoose';
import { Stripe } from 'stripe';
import { getKeywordLimit, getScanMapBaseLimit } from '@/lib/utils';

const relevantEvents = new Set([
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

function toDateFromUnixSeconds(value: unknown): Date | null {
  if (typeof value === 'number' && !isNaN(value)) {
    const d = new Date(value * 1000);
    if (!isNaN(d.valueOf())) return d;
  }
  return null;
}

export async function POST(req: NextRequest) {
  await connectDB();

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new Response('Webhook secret missing', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return new Response(null, { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (!userId) break;

        if (session.mode === 'subscription') {
          const plan = session.metadata?.plan || 'Basico';
          const customerId = typeof session.customer === 'string' ? session.customer : undefined;
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined;
          if (!subscriptionId) break;

          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          
          const startDate = toDateFromUnixSeconds(sub.items.data[0].current_period_start);
          const endDate = toDateFromUnixSeconds(sub.items.data[0].current_period_end);
          const keywordLimit = getKeywordLimit(plan);
          const scanMapBase = getScanMapBaseLimit(plan);

          const update: any = {
            stripeCustomerId: customerId,
            subscriptionId: sub.id,
            subscriptionPlan: plan,
            isSubscriptionCanceled: false,
            limitKeywords: keywordLimit,
            limitScanMap: scanMapBase,
          };

          if (startDate) update.subscriptionStartDate = startDate;
          if (endDate) update.subscriptionEndDate = endDate;

          await User.findByIdAndUpdate(userId, update);
        } else if (
          session.mode === 'payment' &&
          session.metadata?.type === 'scanmap_credits'
        ) {
          const credits = parseInt(session.metadata.credits || '0', 10);
          if (!isNaN(credits) && credits > 0) {
            await User.findByIdAndUpdate(session.client_reference_id, { $inc: { limitScanMap: credits } });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : null;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const endDate = toDateFromUnixSeconds(sub.ended_at);
        if (endDate) {
          await User.findOneAndUpdate({ subscriptionId }, { subscriptionEndDate: endDate });
        } else {
          await User.findOneAndUpdate({ subscriptionId }, {});
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        const cancelAtPeriodEnd = !!sub.cancel_at_period_end;
        const startDate = toDateFromUnixSeconds(sub.items.data[0].current_period_start);
        const endDate = toDateFromUnixSeconds(sub.items.data[0].current_period_end);

        let newPlan: string | null = null;
        if (sub.items && sub.items.data && sub.items.data.length > 0) {
          const priceId = sub.items.data[0].price?.id;
          if (priceId === process.env.STRIPE_BASICO_PRICE_ID) newPlan = 'Basico';
          else if (priceId === process.env.STRIPE_PRO_PRICE_ID) newPlan = 'Pro';
          else if (priceId === process.env.STRIPE_ULTRA_PRICE_ID) newPlan = 'Ultra';
        }

        const update: any = { isSubscriptionCanceled: cancelAtPeriodEnd };
        if (newPlan) {
          update.subscriptionPlan = newPlan;
          update.limitKeywords = getKeywordLimit(newPlan);
          update.limitScanMap = getScanMapBaseLimit(newPlan);
        }
        if (startDate) update.subscriptionStartDate = startDate;
        if (endDate) update.subscriptionEndDate = endDate;

        await User.findOneAndUpdate({ subscriptionId }, update);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        await User.findOneAndUpdate(
          { subscriptionId },
          {
            subscriptionId: null,
            subscriptionPlan: 'Gratuito',
            subscriptionStartDate: null,
            subscriptionEndDate: null,
            isSubscriptionCanceled: false,
            limitKeywords: 0,
            limitScanMap: 0,
          }
        );
        break;
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}

export const runtime = 'nodejs';
