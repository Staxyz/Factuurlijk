/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_MOLLIE_AMOUNT_VALUE?: string;
  readonly VITE_MOLLIE_CURRENCY?: string;
  readonly VITE_MOLLIE_PAYMENT_DESCRIPTION?: string;
  readonly VITE_MOLLIE_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

