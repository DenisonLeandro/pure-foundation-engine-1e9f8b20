/**
 * Company Social Accounts — manage PFM account isolation per company
 */

import { supabase } from "@/integrations/supabase/client";

export interface CompanySocialAccount {
  id: string;
  company_id: string;
  pfm_account_id: string;
  platform: string;
  username: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * List social accounts for the active company.
 * Filters from company_social_accounts table based on company_id.
 */
export async function listCompanySocialAccounts(
  companyId: string,
  platform?: string
): Promise<CompanySocialAccount[]> {
  let query = supabase
    .from("company_social_accounts")
    .select("*")
    .eq("company_id", companyId);

  if (platform) {
    query = query.eq("platform", platform);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[listCompanySocialAccounts] erro:", error);
    throw error;
  }

  return (data as CompanySocialAccount[]) || [];
}

/**
 * Link a PFM account to a company.
 * Called when user successfully connects an account via OAuth.
 */
export async function linkSocialAccountToCompany(
  companyId: string,
  pfmAccountId: string,
  platform: string,
  username: string,
  fullName?: string
): Promise<CompanySocialAccount> {
  const { data, error } = await supabase
    .from("company_social_accounts")
    .upsert(
      {
        company_id: companyId,
        pfm_account_id: pfmAccountId,
        platform,
        username,
        full_name: fullName || null,
      },
      { onConflict: "company_id,pfm_account_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[linkSocialAccountToCompany] erro:", error);
    throw error;
  }

  return data as CompanySocialAccount;
}

/**
 * Unlink a social account from a company.
 * Called when user disconnects an account.
 */
export async function unlinkSocialAccountFromCompany(
  companyId: string,
  pfmAccountId: string
): Promise<void> {
  const { error } = await supabase
    .from("company_social_accounts")
    .delete()
    .eq("company_id", companyId)
    .eq("pfm_account_id", pfmAccountId);

  if (error) {
    console.error("[unlinkSocialAccountFromCompany] erro:", error);
    throw error;
  }
}

/**
 * Check if a PFM account is already linked to a company.
 */
export async function isSocialAccountLinked(
  companyId: string,
  pfmAccountId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("company_social_accounts")
    .select("id")
    .eq("company_id", companyId)
    .eq("pfm_account_id", pfmAccountId)
    .maybeSingle();

  if (error) {
    console.error("[isSocialAccountLinked] erro:", error);
    return false;
  }

  return !!data;
}
