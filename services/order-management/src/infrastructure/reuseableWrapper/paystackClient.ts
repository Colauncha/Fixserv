import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const BASE_URL = process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";

const headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
};

export const PaystackClient = {
  async initializeTransaction(data: {
    email: string;
    amount: number; // in kobo
    reference: string;
    callback_url: string;
  }) {
    const res = await axios.post(`${BASE_URL}/transaction/initialize`, data, {
      headers,
    });
    return res.data;
  },

  async verifyTransaction(reference: string) {
    const res = await axios.get(`${BASE_URL}/transaction/verify/${reference}`, {
      headers,
    });
    return res.data;
  },
};
