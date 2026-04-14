export async function checkPaymentExceeds(
  supabase: any,
  registrationId: number,
  newValue: number,
  ignorePaymentId?: number
) {
  const { data: payments } = await supabase
    .from('payments')
    .select('id, payed_value')
    .eq('registration_id', registrationId);

  const { data: registration } = await supabase
    .from('registrations')
    .select('final_price')
    .eq('id', registrationId)
    .single();

  if (!registration) return { exceeds: false };

  let total = 0;

  for (const p of payments || []) {
    if (ignorePaymentId && p.id === ignorePaymentId) continue;
    total += p.payed_value;
  }

  total += newValue;

  return {
    exceeds: total > registration.final_price,
    total,
    expected: registration.final_price
  };
}