import { supabase } from './supabase';

export const defaultSettings = {
  storeName: "Gupta Mart & Stationery",
  shippingFee: 0,
  currency: "INR"
};

export const settingsApi = {
  getSettings: async () => {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (error || !data) return defaultSettings;
    return data;
  }
};