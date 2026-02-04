# 🐛 Payment Creation Failure - Debug Guide

## 🔍 **How to Debug the Issue**

### **Step 1: Use the Debug Page**
1. Go to `http://localhost:3000/debug-payment`
2. Click **"Check API Status"** first
3. Then click **"Test Payment Creation"**
4. Check the results and console logs

### **Step 2: Check Browser Console**
1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Try creating the payment again
4. Look for error messages

### **Step 3: Check Network Tab**
1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Try creating the payment again
4. Look for failed API calls (red entries)
5. Click on failed requests to see error details

## 🚨 **Common Issues & Solutions**

### **1. API Key Issues**
**Symptoms:** 401 Unauthorized or "API key not configured"
**Solution:** 
- Check your `.env` file has: `FINTERNET_API_KEY="sk_hackathon_b583d804ace81543fecf47eee783e167"`
- Restart your development server

### **2. Network/CORS Issues**
**Symptoms:** Network error, CORS error, or timeout
**Solution:**
- Check internet connection
- Try the test page: `/test-finternet`
- Verify Finternet API is accessible

### **3. Invalid Settlement Destination**
**Symptoms:** 400 Bad Request with settlement destination error
**Solution:**
- Try using: `bank_account_123`
- Or try: `test_destination`
- Avoid special characters

### **4. Amount Format Issues**
**Symptoms:** 400 Bad Request with amount validation error
**Solution:**
- Use decimal format: `100.00`
- Avoid currency symbols: `$100` ❌, `100.00` ✅
- Check for valid numbers only

### **5. Database Connection Issues**
**Symptoms:** 500 Internal Server Error
**Solution:**
- Check database connection
- Verify Prisma is working: `npx prisma db push`

### **6. Missing Environment Variables**
**Symptoms:** "Configuration not found" errors
**Solution:**
- Restart development server: `npm run dev`
- Check all required env vars are set

## 🔧 **Debug Steps**

### **Step A: Test Finternet API Directly**
```bash
curl -X POST https://api.fmm.finternetlab.io/api/v1/payment-intents \
  -H "X-API-Key: sk_hackathon_b583d804ace81543fecf47eee783e167" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.00",
    "currency": "USDC",
    "type": "CONDITIONAL",
    "settlementMethod": "OFF_RAMP_MOCK",
    "settlementDestination": "bank_account_123"
  }'
```

### **Step B: Check Server Logs**
1. Look at your terminal where `npm run dev` is running
2. Check for error messages when payment creation fails

### **Step C: Test Individual Components**
1. Test basic Finternet API: `/test-finternet`
2. Test payment creation: `/debug-payment`
3. Test event creation without payment first

## 📋 **Information to Collect**

When reporting the issue, please provide:

1. **Error message** from browser console
2. **Network request details** (status code, response)
3. **Server logs** from terminal
4. **Steps to reproduce** the issue
5. **Browser and OS** information

## 🎯 **Quick Fixes to Try**

1. **Restart development server**
2. **Clear browser cache**
3. **Try different settlement destination**
4. **Use the debug page** to isolate the issue
5. **Check if `/test-finternet` works**

## 📞 **Next Steps**

1. **Use the debug page** first: `/debug-payment`
2. **Check browser console** for specific errors
3. **Try the basic test**: `/test-finternet`
4. **Report specific error messages** you find

The debug tools will help identify exactly what's failing! 🔍