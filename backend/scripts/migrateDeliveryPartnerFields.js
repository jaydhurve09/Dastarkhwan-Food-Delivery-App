import { db } from '../config/firebase.js';

/*
 * Migration: Align order assignment fields.
 * - Ensure each order has deliveryPartnerId (DocumentReference) if legacy delivery_partner_uid present.
 * - Optionally ensure legacy delivery_partner_uid string exists if only reference present.
 */
async function run() {
  console.log('🚚 Starting delivery partner field migration...');
  const batchSize = 300;
  let processed = 0;
  let fixedRef = 0;
  let fixedLegacy = 0;

  // Query orders that have legacy string but missing reference
  const legacySnap = await db.collection('orders')
    .where('delivery_partner_uid', '!=', null)
    .get();

  for (const doc of legacySnap.docs) {
    const data = doc.data();
    if (!data.deliveryPartnerId && data.delivery_partner_uid) {
      const ref = db.collection('deliveryPartners').doc(data.delivery_partner_uid);
      try {
        await doc.ref.update({ deliveryPartnerId: ref });
        fixedRef++;
      } catch (e) {
        console.error('Failed to set deliveryPartnerId for', doc.id, e.message);
      }
    }
    processed++;
  }

  // Backfill legacy string if only reference exists (for temporary backward compatibility)
  const refOnlySnap = await db.collection('orders')
    .where('deliveryPartnerId', '!=', null)
    .get();

  for (const doc of refOnlySnap.docs) {
    const data = doc.data();
    if (!data.delivery_partner_uid && data.deliveryPartnerId && data.deliveryPartnerId.id) {
      try {
        await doc.ref.update({ delivery_partner_uid: data.deliveryPartnerId.id });
        fixedLegacy++;
      } catch (e) {
        console.error('Failed to set legacy uid for', doc.id, e.message);
      }
    }
  }

  console.log(`✅ Migration complete. Processed: ${processed + refOnlySnap.size}`);
  console.log(`   ➕ Added deliveryPartnerId ref: ${fixedRef}`);
  console.log(`   ➕ Added legacy delivery_partner_uid: ${fixedLegacy}`);
  console.log('ℹ️ You can safely remove legacy field after all apps updated.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
