import { supabase } from "../../lib/supabase";

export async function logPaymentActivity(
    adminUserId: string,
    registrationId: number,
    paymentId: number | null,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCELLED',
    details: string    
) {
    const { error } = await supabase
        .from('payment_logs')
        .insert([{
            admin_user_id: adminUserId,
            registration_id: registrationId,
            payment_id: paymentId,
            action: action,
            details: details,
        }]);

        if (error) {
            console.error("Falha ao registrar log de auditoria:", error);
        }
}